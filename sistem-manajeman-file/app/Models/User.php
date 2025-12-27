<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes; // Tambahkan ini
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes; // Tambahkan ini

    protected $fillable = [
        'nipp', // Tambah
        'name',
        'username', // Tambah
        'email',
        'password',
        'role_id',
        'division_id',
        'last_activity_at', // Track concurrent users
    ];

    protected $hidden = [ // Nama variabel $hidden ditambahkan
        'password',
        'remember_token',
    ];

    protected $casts = [ // Nama variabel $casts ditambahkan
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'last_activity_at' => 'datetime', // Cast to Carbon instance
    ];

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class); // $this ditambahkan
    }

    public function files(): HasMany
    {
        return $this->hasMany(File::class, 'uploader_id'); // $this ditambahkan
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class); // $this ditambahkan
    }

    /**
     * Get count of concurrent active users
     * Users yang aktif dalam X menit terakhir
     *
     * @param int $minutes Number of minutes to consider as "active"
     * @return int
     */
    public static function getConcurrentUsers(int $minutes = 15): int
    {
        return static::where('last_activity_at', '>', now()->subMinutes($minutes))
                    ->whereNull('deleted_at') // Exclude soft-deleted users
                    ->distinct('id')
                    ->count('id');
    }
}