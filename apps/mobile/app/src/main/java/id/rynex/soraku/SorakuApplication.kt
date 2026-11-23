package id.rynex.soraku

import android.app.Application
import android.os.StatFs
import android.util.Log
import coil.ImageLoader
import coil.ImageLoaderFactory
import coil.disk.DiskCache
import coil.memory.MemoryCache
import coil.request.CachePolicy
import id.rynex.soraku.core.di.ServiceLocator
import okhttp3.Cache
import okhttp3.Call
import okhttp3.Connection
import okhttp3.EventListener
import okhttp3.Handshake
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Request
import okhttp3.Response
import java.io.File
import java.io.IOException
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.Proxy
import java.util.concurrent.TimeUnit

class SorakuApplication : Application(), ImageLoaderFactory {
    override fun onCreate() {
        super.onCreate()
        ServiceLocator.init(this)
    }

    override fun newImageLoader(): ImageLoader {
        val httpCacheDir = File(cacheDir, "http_cache").apply { mkdirs() }
        val httpCacheSize = 20L * 1024 * 1024 // 20 MB for HTTP metadata/conditional revalidation

        val okHttpBuilder = OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .writeTimeout(20, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .cache(Cache(httpCacheDir, httpCacheSize))

        if (BuildConfig.DEBUG) {
            okHttpBuilder.eventListenerFactory { call ->
                ImagePerfEventListener(call.request().url.toString())
            }
        }

        val okHttpClient = okHttpBuilder.build()

        val diskCacheDir = File(cacheDir, "image_cache").apply { mkdirs() }
        val diskCacheSize = calculateDiskCacheSize(diskCacheDir)

        return ImageLoader.Builder(this)
            .okHttpClient(okHttpClient)
            .memoryCache {
                MemoryCache.Builder(this)
                    .maxSizePercent(0.25)
                    .strongReferencesEnabled(true)
                    .build()
            }
            .diskCache {
                DiskCache.Builder()
                    .directory(diskCacheDir)
                    .maxSizeBytes(diskCacheSize)
                    .build()
            }
            .diskCachePolicy(CachePolicy.ENABLED)
            .memoryCachePolicy(CachePolicy.ENABLED)
            .networkCachePolicy(CachePolicy.ENABLED)
            .respectCacheHeaders(true)
            .crossfade(false)
            .allowRgb565(true)
            .build()
    }

    private fun calculateDiskCacheSize(dir: File): Long {
        return try {
            val statFs = StatFs(dir.absolutePath)
            val available = statFs.blockCountLong * statFs.blockSizeLong
            // Use ~2% of available space, clamped between 50 MB and 250 MB.
            (available * 0.02).toLong().coerceIn(50L * 1024 * 1024, 250L * 1024 * 1024)
        } catch (_: Exception) {
            150L * 1024 * 1024
        }
    }
}

/**
 * Dev-only timing for image network requests. Separates DNS/connect/TLS/request/response.
 * Coil disk/memory cache hits bypass the network and won't emit these events.
 */
private class ImagePerfEventListener(private val url: String) : EventListener() {
    private val t0 = System.nanoTime()
    private var callStart = 0L
    private var dnsStart = 0L
    private var connectStart = 0L
    private var reqHeadersStart = 0L
    private var reqBodyStart = 0L
    private var respHeadersStart = 0L
    private var respBodyStart = 0L

    private fun ms(from: Long, to: Long) = (to - from) / 1_000_000

    override fun callStart(call: Call) { callStart = System.nanoTime() }
    override fun dnsStart(call: Call, domainName: String) { dnsStart = System.nanoTime() }
    override fun dnsEnd(call: Call, domainName: String, inetAddressList: List<InetAddress>) {
        Log.d(TAG, "dns ${ms(dnsStart, System.nanoTime())}ms $url")
    }
    override fun connectStart(call: Call, inetSocketAddress: InetSocketAddress, proxy: Proxy) {
        connectStart = System.nanoTime()
    }
    override fun secureConnectStart(call: Call) { /* TLS start marker */ }
    override fun connectEnd(call: Call, inetSocketAddress: InetSocketAddress, proxy: Proxy, protocol: Protocol?) {
        Log.d(TAG, "connect ${ms(connectStart, System.nanoTime())}ms $url")
    }
    override fun requestHeadersStart(call: Call) { reqHeadersStart = System.nanoTime() }
    override fun requestBodyStart(call: Call) { reqBodyStart = System.nanoTime() }
    override fun responseHeadersStart(call: Call) { respHeadersStart = System.nanoTime() }
    override fun responseHeadersEnd(call: Call, response: Response) {
        val ttfb = if (reqHeadersStart != 0L) ms(reqHeadersStart, System.nanoTime()) else -1
        Log.d(TAG, "ttfb ${ttfb}ms code=${response.code} cache=${response.cacheResponse != null} $url")
    }
    override fun responseBodyStart(call: Call) { respBodyStart = System.nanoTime() }
    override fun responseBodyEnd(call: Call, byteCount: Long) {
        val bodyMs = if (respBodyStart != 0L) ms(respBodyStart, System.nanoTime()) else -1
        Log.d(TAG, "body ${bodyMs}ms bytes=$byteCount $url")
    }
    override fun callEnd(call: Call) {
        Log.d(TAG, "total ${ms(callStart, System.nanoTime())}ms $url")
    }
    override fun callFailed(call: Call, ioe: IOException) {
        Log.d(TAG, "failed ${ms(callStart, System.nanoTime())}ms err=${ioe.message} $url")
    }
    override fun connectionAcquired(call: Call, connection: Connection) {}
    override fun connectionReleased(call: Call, connection: Connection) {}

    companion object { private const val TAG = "CoilPerf" }
}