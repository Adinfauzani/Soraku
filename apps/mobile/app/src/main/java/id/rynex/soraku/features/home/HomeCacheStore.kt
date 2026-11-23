package id.rynex.soraku.features.home

import android.content.Context
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import id.rynex.soraku.domain.model.Anime
import id.rynex.soraku.domain.model.ContinueWatching

object HomeCacheStore {
    private const val PREFS = "home_cache"
    private const val KEY_SPOTLIGHT = "spotlight"
    private const val KEY_SPOTLIGHT_LEGACY = "featured"
    private const val KEY_TRENDING = "trending"
    private const val KEY_POPULAR = "popular"
    private const val KEY_TOP_RATED = "top_rated"
    private const val KEY_AIRING = "airing"
    private const val KEY_SEASONAL = "seasonal"
    private const val KEY_RECOMMENDATIONS = "recommendations"
    private const val KEY_CONTINUE = "continue_watching"

    private val gson = Gson()
    private var appContext: Context? = null

    fun init(context: Context) {
        appContext = context.applicationContext
    }

    private fun prefs() = appContext?.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun hasCache(): Boolean {
        val p = prefs() ?: return false
        return p.contains(KEY_SPOTLIGHT) || p.contains(KEY_SPOTLIGHT_LEGACY) ||
            p.contains(KEY_AIRING) || p.contains(KEY_TRENDING)
    }

    fun loadAnimeList(key: String): List<Anime>? {
        val p = prefs() ?: return null
        val json = p.getString(key, null) ?: return null
        return runCatching {
            val type = object : TypeToken<List<Anime>>() {}.type
            gson.fromJson<List<Anime>>(json, type)
        }.getOrNull()
    }

    fun saveAnimeList(key: String, list: List<Anime>) {
        val p = prefs() ?: return
        runCatching {
            p.edit().putString(key, gson.toJson(list)).apply()
        }
    }

    fun loadContinueWatching(): List<ContinueWatching>? {
        val p = prefs() ?: return null
        val json = p.getString(KEY_CONTINUE, null) ?: return null
        return runCatching {
            val type = object : TypeToken<List<ContinueWatching>>() {}.type
            gson.fromJson<List<ContinueWatching>>(json, type)
        }.getOrNull()
    }

    fun saveContinueWatching(list: List<ContinueWatching>) {
        val p = prefs() ?: return
        runCatching {
            p.edit().putString(KEY_CONTINUE, gson.toJson(list)).apply()
        }
    }

    fun load(): CachedHomeData? {
        if (!hasCache()) return null
        val spotlight = loadAnimeList(KEY_SPOTLIGHT) ?: loadAnimeList(KEY_SPOTLIGHT_LEGACY) ?: emptyList()
        val trending = loadAnimeList(KEY_TRENDING) ?: emptyList()
        val popular = loadAnimeList(KEY_POPULAR) ?: emptyList()
        val topRated = loadAnimeList(KEY_TOP_RATED) ?: emptyList()
        val airing = loadAnimeList(KEY_AIRING) ?: emptyList()
        val seasonal = loadAnimeList(KEY_SEASONAL) ?: emptyList()
        val recommendations = loadAnimeList(KEY_RECOMMENDATIONS) ?: emptyList()
        val continueWatching = loadContinueWatching() ?: emptyList()
        // Consider cache valid if we have at least spotlight or a main list
        if (spotlight.isEmpty() && airing.isEmpty() && trending.isEmpty() && popular.isEmpty()) return null
        return CachedHomeData(
            spotlight = spotlight,
            trending = trending,
            popular = popular,
            topRated = topRated,
            airing = airing,
            seasonal = seasonal,
            recommendations = recommendations,
            continueWatching = continueWatching
        )
    }

    fun save(data: CachedHomeData) {
        saveAnimeList(KEY_SPOTLIGHT, data.spotlight)
        saveAnimeList(KEY_TRENDING, data.trending)
        saveAnimeList(KEY_POPULAR, data.popular)
        saveAnimeList(KEY_TOP_RATED, data.topRated)
        saveAnimeList(KEY_AIRING, data.airing)
        saveAnimeList(KEY_SEASONAL, data.seasonal)
        saveAnimeList(KEY_RECOMMENDATIONS, data.recommendations)
        saveContinueWatching(data.continueWatching)
    }

    data class CachedHomeData(
        val spotlight: List<Anime>,
        val trending: List<Anime>,
        val popular: List<Anime>,
        val topRated: List<Anime>,
        val airing: List<Anime>,
        val seasonal: List<Anime>,
        val recommendations: List<Anime>,
        val continueWatching: List<ContinueWatching>
    )
}
