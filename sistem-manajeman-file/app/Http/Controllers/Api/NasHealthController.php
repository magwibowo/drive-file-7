<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class NasHealthController extends Controller
{
    /**
     * Check NAS drive health and availability
     */
    public function checkHealth(): JsonResponse
    {
        $nasDrivePath = env('NAS_DRIVE_PATH', 'Z:\\');
        $backupPath = $nasDrivePath . 'backups';
        
        $health = [
            'status' => 'healthy',
            'drive_path' => $nasDrivePath,
            'backup_path' => $backupPath,
            'is_mounted' => false,
            'is_writable' => false,
            'free_space_gb' => 0,
            'total_space_gb' => 0,
            'used_space_gb' => 0,
            'backup_count' => 0,
            'last_backup' => null,
            'warnings' => [],
        ];

        // Check if drive exists
        if (file_exists($nasDrivePath)) {
            $health['is_mounted'] = true;
            
            // Check if writable
            if (is_writable($nasDrivePath)) {
                $health['is_writable'] = true;
            } else {
                $health['status'] = 'warning';
                $health['warnings'][] = 'NAS drive is mounted but not writable';
            }
            
            // Get disk space
            try {
                $freeSpace = disk_free_space($nasDrivePath);
                $totalSpace = disk_total_space($nasDrivePath);
                
                if ($freeSpace !== false && $totalSpace !== false) {
                    $health['free_space_gb'] = round($freeSpace / 1024 / 1024 / 1024, 2);
                    $health['total_space_gb'] = round($totalSpace / 1024 / 1024 / 1024, 2);
                    $health['used_space_gb'] = round(($totalSpace - $freeSpace) / 1024 / 1024 / 1024, 2);
                    
                    // Warning if less than 5GB free
                    if ($health['free_space_gb'] < 5) {
                        $health['status'] = 'warning';
                        $health['warnings'][] = 'Low disk space (less than 5GB free)';
                    }
                }
            } catch (\Exception $e) {
                $health['warnings'][] = 'Unable to get disk space information';
            }
            
            // Check backup folder
            if (file_exists($backupPath)) {
                // Count backup files
                $backupFiles = glob($backupPath . DIRECTORY_SEPARATOR . 'backup_*.zip');
                $health['backup_count'] = count($backupFiles);
                
                // Get last backup
                if (count($backupFiles) > 0) {
                    // Sort by modified time
                    usort($backupFiles, function($a, $b) {
                        return filemtime($b) - filemtime($a);
                    });
                    
                    $lastBackup = $backupFiles[0];
                    $health['last_backup'] = [
                        'filename' => basename($lastBackup),
                        'size_mb' => round(filesize($lastBackup) / 1024 / 1024, 2),
                        'created_at' => date('Y-m-d H:i:s', filemtime($lastBackup)),
                    ];
                }
            } else {
                $health['warnings'][] = 'Backup folder does not exist';
            }
            
        } else {
            $health['status'] = 'error';
            $health['warnings'][] = 'NAS drive is not mounted or not accessible';
        }
        
        return response()->json($health);
    }
    
    /**
     * Test NAS write capability
     */
    public function testWrite(): JsonResponse
    {
        $nasDrivePath = env('NAS_DRIVE_PATH', 'Z:\\');
        $testFile = $nasDrivePath . 'test-write-' . time() . '.txt';
        
        try {
            // Try to write
            $content = 'NAS write test - ' . now()->toDateTimeString();
            file_put_contents($testFile, $content);
            
            // Try to read
            $readContent = file_get_contents($testFile);
            
            // Try to delete
            @unlink($testFile);
            
            if ($readContent === $content) {
                return response()->json([
                    'success' => true,
                    'message' => 'NAS write test successful',
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'NAS write test failed: Read content mismatch',
                ], 500);
            }
        } catch (\Exception $e) {
            // Clean up test file if exists
            if (file_exists($testFile)) {
                @unlink($testFile);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'NAS write test failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
