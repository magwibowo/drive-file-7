<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\WindowsMetricsService;
use App\Models\ServerMetric;

class MonitorPoll extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'monitor:poll';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Poll server metrics setiap 30 detik dan simpan ke database';

    protected WindowsMetricsService $metricsService;

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->metricsService = new WindowsMetricsService();
        
        $this->info('🚀 Starting server metrics polling...');
        $this->info('⏱️  Interval: 30 seconds');
        $this->info('📊 Monitoring: 16 metrics (TIER 1 + TIER 2 + TIER 3)');
        $this->line('');
        $this->info('Press Ctrl+C to stop');
        $this->line('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        $iteration = 0;
        
        while (true) {
            $iteration++;
            
            try {
                $startTime = microtime(true);
                
                // Collect all metrics
                $metrics = $this->metricsService->collectMetrics();
                
                // Save to database
                $record = ServerMetric::create($metrics);
                
                $duration = round((microtime(true) - $startTime) * 1000);
                
                // Display summary
                $this->line('');
                $this->info("✅ Poll #{$iteration} - " . now()->format('H:i:s') . " ({$duration}ms)");
                
                // TIER 1 (Critical)
                $this->comment('  TIER 1 (Critical):');
                $this->line("    CPU: {$metrics['cpu_usage_percent']}% | Memory: {$metrics['memory_usage_percent']}% | Users: {$metrics['concurrent_users']}");
                $this->line("    TCP Total: {$metrics['tcp_connections_total']} | TCP Ext: {$metrics['tcp_connections_external']} | Queue: {$metrics['disk_queue_length']}");
                
                // TIER 2 (System)
                $this->comment('  TIER 2 (System):');
                $this->line("    Network: ↓{$metrics['network_rx_bytes_per_sec']} B/s ↑{$metrics['network_tx_bytes_per_sec']} B/s");
                $this->line("    Disk: R:{$metrics['disk_reads_per_sec']} W:{$metrics['disk_writes_per_sec']} IOPS | Latency: {$metrics['latency_ms']}ms");
                $this->line("    Free Space: " . round($metrics['disk_free_space'] / 1024 / 1024 / 1024, 2) . " GB");
                
                // TIER 3 (Application) - HIGHLIGHT if not null
                $this->comment('  TIER 3 (Application):');
                
                $appNet = $metrics['app_network_bytes_per_sec'];
                $mysqlR = $metrics['mysql_reads_per_sec'];
                $mysqlW = $metrics['mysql_writes_per_sec'];
                $appResp = $metrics['app_response_time_ms'];
                $appReq = $metrics['app_requests_per_sec'];
                
                // Highlight app_response_time_ms jika tidak null
                if ($appResp !== null) {
                    $responseColor = $appResp < 100 ? 'green' : ($appResp < 500 ? 'yellow' : 'red');
                    $this->line("    App Network: {$appNet} B/s | MySQL: R:{$mysqlR} W:{$mysqlW} IOPS");
                    $this->line("    <fg={$responseColor}>API Response: {$appResp}ms</> | Requests: {$appReq}/s");
                } else {
                    $this->line("    App Network: {$appNet} B/s | MySQL: R:{$mysqlR} W:{$mysqlW} IOPS");
                    $this->line("    <fg=gray>API Response: N/A</> | Requests: {$appReq}/s");
                }
                
                $this->line("    <fg=gray>Saved to DB (ID: {$record->id})</>");
                
                // Next poll countdown
                $this->line('');
                $this->comment('  Next poll in 30 seconds...');
                
                // Sleep 30 seconds
                sleep(30);
                
            } catch (\Exception $e) {
                $this->error('❌ Error collecting metrics: ' . $e->getMessage());
                $this->error('   ' . $e->getFile() . ':' . $e->getLine());
                $this->line('');
                $this->comment('  Retrying in 30 seconds...');
                sleep(30);
            }
        }
    }
}
