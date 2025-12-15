<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

// Livewire Server Monitor Route (opsional - untuk standalone view)
// Akses: http://localhost:8000/server-monitor
// Route::get('/server-monitor', App\Livewire\ServerMonitor::class)->name('server-monitor');
