{{-- Conditional polling: hanya aktif jika monitoring berjalan --}}
@if($isMonitoring)
    <div wire:poll.2s="updateMetrics">
@else
    <div>
@endif
        <div class="bg-white rounded-xl shadow-lg p-8 max-w-7xl mx-auto">
            {{-- Header Section --}}
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                    <svg class="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    Windows Server Monitor
                </h1>
                <p class="text-gray-600">Real-time monitoring menggunakan WMI (Windows Management Instrumentation)</p>
            </div>

            {{-- Error Message --}}
            @if($errorMessage)
                <div class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div class="flex items-center gap-2 text-red-800">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                        </svg>
                        <strong>Error:</strong> {{ $errorMessage }}
                    </div>
                </div>
            @endif

            {{-- Control Buttons --}}
            <div class="mb-8 flex gap-4 items-center">
                @if(!$isMonitoring)
                    <button wire:click="startMonitoring" 
                            class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Start Monitoring
                    </button>
                @else
                    <button wire:click="stopMonitoring"
                            class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                        Stop Monitoring
                    </button>
                    <div class="flex items-center gap-2 text-green-600">
                        <span class="relative flex h-3 w-3">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <span class="font-semibold">Monitoring Active</span>
                    </div>
                @endif
            </div>

            {{-- Metrics Dashboard Grid --}}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {{-- Network RX Card --}}
                <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-lg font-bold text-blue-900">Network RX</h3>
                        <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                    </div>
                    <div class="text-4xl font-bold text-blue-900 mb-2">
                        {{ number_format($currentMetrics['network_rx_bytes_per_sec'] / 1024, 2) }}
                    </div>
                    <div class="text-sm font-medium text-blue-700">KB/s</div>
                    <div class="text-xs text-blue-600 mt-2">Bytes Received per Second</div>
                </div>

                {{-- Network TX Card --}}
                <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200 shadow-md hover:shadow-lg transition-shadow">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-lg font-bold text-green-900">Network TX</h3>
                        <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                    </div>
                    <div class="text-4xl font-bold text-green-900 mb-2">
                        {{ number_format($currentMetrics['network_tx_bytes_per_sec'] / 1024, 2) }}
                    </div>
                    <div class="text-sm font-medium text-green-700">KB/s</div>
                    <div class="text-xs text-green-600 mt-2">Bytes Sent per Second</div>
                </div>

                {{-- Disk Reads Card --}}
                <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200 shadow-md hover:shadow-lg transition-shadow">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-lg font-bold text-purple-900">Disk Reads</h3>
                        <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                    </div>
                    <div class="text-4xl font-bold text-purple-900 mb-2">
                        {{ number_format($currentMetrics['disk_reads_per_sec'], 2) }}
                    </div>
                    <div class="text-sm font-medium text-purple-700">IOPS</div>
                    <div class="text-xs text-purple-600 mt-2">Disk Reads per Second</div>
                </div>

                {{-- Disk Writes Card --}}
                <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200 shadow-md hover:shadow-lg transition-shadow">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-lg font-bold text-orange-900">Disk Writes</h3>
                        <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                    </div>
                    <div class="text-4xl font-bold text-orange-900 mb-2">
                        {{ number_format($currentMetrics['disk_writes_per_sec'], 2) }}
                    </div>
                    <div class="text-sm font-medium text-orange-700">IOPS</div>
                    <div class="text-xs text-orange-600 mt-2">Disk Writes per Second</div>
                </div>

                {{-- Free Disk Space Card --}}
                <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border-2 border-indigo-200 shadow-md hover:shadow-lg transition-shadow">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-lg font-bold text-indigo-900">Free Space</h3>
                        <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div class="text-4xl font-bold text-indigo-900 mb-2">
                        {{ number_format($currentMetrics['disk_free_space'] / (1024**3), 2) }}
                    </div>
                    <div class="text-sm font-medium text-indigo-700">GB</div>
                    <div class="text-xs text-indigo-600 mt-2">Available on C: Drive</div>
                </div>

                {{-- Network Latency Card --}}
                <div class="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 border-2 border-pink-200 shadow-md hover:shadow-lg transition-shadow">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-lg font-bold text-pink-900">Latency</h3>
                        <svg class="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div class="text-4xl font-bold text-pink-900 mb-2">
                        @if($currentMetrics['latency_ms'] !== null)
                            {{ $currentMetrics['latency_ms'] }}
                        @else
                            <span class="text-gray-400">--</span>
                        @endif
                    </div>
                    <div class="text-sm font-medium text-pink-700">ms</div>
                    <div class="text-xs text-pink-600 mt-2">Ping to 8.8.8.8</div>
                </div>

            </div>

            {{-- Info Footer --}}
            <div class="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="text-sm text-gray-700">
                        <strong class="font-semibold">Informasi:</strong> 
                        @if($isMonitoring)
                            Monitoring aktif, metrics diupdate setiap 2 detik. Delta dihitung dari snapshot sebelumnya dan disimpan ke database.
                        @else
                            Klik tombol "Start Monitoring" untuk memulai. WMI query hanya berjalan saat monitoring aktif.
                        @endif
                    </div>
                </div>
            </div>
        </div>
    </div>
