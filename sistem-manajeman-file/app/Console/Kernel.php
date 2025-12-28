<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    // --- 1. TAMBAHKAN BAGIAN INI UNTUK MENDAFTARKAN COMMAND BARU ---
    protected $commands = [
        Commands\RecordAutoLogout::class,
    ];

    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule)
    {
        // Check backup schedule from database and execute accordingly
        $backupSchedule = \App\Models\BackupSchedule::first();
        
        if ($backupSchedule && $backupSchedule->frequency !== 'off') {
            // Extract HH:mm from time field (handles both HH:mm and HH:mm:ss formats)
            $time = $backupSchedule->time ?? '02:00';
            if (strlen($time) > 5) {
                $time = substr($time, 0, 5); // Extract HH:mm from HH:mm:ss
            }
            
            switch ($backupSchedule->frequency) {
                case 'daily':
                    $schedule->command('backup:run')->dailyAt($time);
                    break;
                    
                case 'weekly':
                    $dayOfWeek = $backupSchedule->day_of_week ?? 0; // 0 = Sunday, 1 = Monday, etc.
                    $schedule->command('backup:run')->weeklyOn($dayOfWeek, $time);
                    break;
                    
                case 'monthly':
                    $dayOfMonth = $backupSchedule->day_of_month ?? 1;
                    $schedule->command('backup:run')->monthlyOn($dayOfMonth, $time);
                    break;
                    
                case 'yearly':
                    $month = $backupSchedule->month ?? 1;
                    $day = $backupSchedule->day_of_month ?? 1;
                    $schedule->command('backup:run')->yearlyOn($month, $day, $time);
                    break;
            }
        }

        // Auto-cleanup trash: Delete files older than 30 days every day at 3 AM
        $schedule->command('trash:cleanup --days=30')
            ->dailyAt('03:00')
            ->name('Auto Trash Cleanup')
            ->onSuccess(function () {
                \Log::info('Trash cleanup completed successfully');
            })
            ->onFailure(function () {
                \Log::error('Trash cleanup failed');
            });

        // Auto-fix folders without hash: Run every day at 4 AM
        $schedule->command('folders:auto-fix-hash')
            ->dailyAt('04:00')
            ->name('Auto Fix Folder Hash')
            ->onSuccess(function () {
                \Log::info('Auto-fix folder hash completed successfully');
            })
            ->onFailure(function () {
                \Log::error('Auto-fix folder hash failed');
            });
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}