<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class UpdateUserActivity
{
    /**
     * Handle an incoming request.
     * Update last_activity_at untuk logged-in user setiap request
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Update last_activity_at jika user sudah login
        if (Auth::check()) {
            // Update hanya setiap 5 menit untuk kurangi database writes
            $user = Auth::user();
            $lastActivity = $user->last_activity_at;
            
            // Update jika belum pernah update atau sudah lewat 5 menit
            if (!$lastActivity || $lastActivity->diffInMinutes(now()) >= 5) {
                $user->last_activity_at = now();
                $user->save(['timestamps' => false]); // Don't touch updated_at
            }
        }

        return $next($request);
    }
}
