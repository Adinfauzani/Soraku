package id.rynex.soraku.features.home

import android.util.Log
import androidx.lifecycle.viewModelScope
import id.rynex.soraku.core.common.BaseViewModel
import id.rynex.soraku.core.common.UiState
import id.rynex.soraku.core.di.ServiceLocator
import id.rynex.soraku.domain.model.Anime
import id.rynex.soraku.domain.model.ContinueWatching
import id.rynex.soraku.domain.model.WatchlistItem
import id.rynex.soraku.domain.repository.AnimeRepository
import id.rynex.soraku.domain.repository.LibraryRepository
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlin.random.Random

class HomeViewModel(
    private val animeRepository: AnimeRepository = ServiceLocator.provideAnimeRepository(),
    private val libraryRepository: LibraryRepository = ServiceLocator.provideLibraryRepository()
) : BaseViewModel<Unit>() {

    private val cached = HomeCacheStore.load()

    private fun <T> initial(success: List<T>?): UiState<List<T>> =
        if (!success.isNullOrEmpty()) UiState.Success(success) else UiState.Loading

    private val _trending = MutableStateFlow<UiState<List<Anime>>>(initial(cached?.trending))
    val trending: StateFlow<UiState<List<Anime>>> = _trending

    private val _popular = MutableStateFlow<UiState<List<Anime>>>(initial(cached?.popular))
    val popular: StateFlow<UiState<List<Anime>>> = _popular

    private val _latest = MutableStateFlow<UiState<List<Anime>>>(UiState.Loading)
    val latest: StateFlow<UiState<List<Anime>>> = _latest

    private val _topRated = MutableStateFlow<UiState<List<Anime>>>(initial(cached?.topRated))
    val topRated: StateFlow<UiState<List<Anime>>> = _topRated

    private val _airing = MutableStateFlow<UiState<List<Anime>>>(initial(cached?.airing))
    val airing: StateFlow<UiState<List<Anime>>> = _airing

    private val _seasonal = MutableStateFlow<UiState<List<Anime>>>(initial(cached?.seasonal))
    val seasonal: StateFlow<UiState<List<Anime>>> = _seasonal

    private val _continueWatching = MutableStateFlow<UiState<List<ContinueWatching>>>(
        if (!cached?.continueWatching.isNullOrEmpty()) UiState.Success(cached!!.continueWatching) else UiState.Loading
    )
    val continueWatching: StateFlow<UiState<List<ContinueWatching>>> = _continueWatching

    private val _watchlist = MutableStateFlow<UiState<List<WatchlistItem>>>(UiState.Loading)
    val watchlist: StateFlow<UiState<List<WatchlistItem>>> = _watchlist

    private fun initialSpotlight(cached: HomeCacheStore.CachedHomeData?): UiState<List<Anime>> {
        val list = cached?.spotlight.orEmpty()
        return if (list.any { !it.coverImage.isNullOrBlank() || !it.bannerImage.isNullOrBlank() }) {
            UiState.Success(list)
        } else {
            UiState.Loading
        }
    }

    private val _spotlight = MutableStateFlow<UiState<List<Anime>>>(initialSpotlight(cached))
    val spotlight: StateFlow<UiState<List<Anime>>> = _spotlight

    private val _recommendations = MutableStateFlow<UiState<List<Anime>>>(initial(cached?.recommendations))
    val recommendations: StateFlow<UiState<List<Anime>>> = _recommendations

    private val _recentlyAdded = MutableStateFlow<UiState<List<Anime>>>(UiState.Loading)
    val recentlyAdded: StateFlow<UiState<List<Anime>>> = _recentlyAdded

    // Randomized grid display limit (max 20), stable per screen session / data refresh.
    private val _gridDisplayLimit = MutableStateFlow(randomGridLimit())
    val gridDisplayLimit: StateFlow<Int> = _gridDisplayLimit

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing

    fun loadHomeData() {
        // Prevent duplicate concurrent loads (e.g. repeated calls / recomposition)
        if (_isRefreshing.value) return
        viewModelScope.launch {
            _isRefreshing.value = true
            try {
                // If no persisted cache, show loading until each section resolves.
                // If cache exists, show cached content immediately and refresh in background.
                val hasCache = HomeCacheStore.hasCache() || _spotlight.value is UiState.Success
                if (!hasCache) {
                    _trending.value = UiState.Loading
                    _popular.value = UiState.Loading
                    _latest.value = UiState.Loading
                    _topRated.value = UiState.Loading
                    _airing.value = UiState.Loading
                    _seasonal.value = UiState.Loading
                    _continueWatching.value = UiState.Loading
                    _watchlist.value = UiState.Loading
                    _spotlight.value = UiState.Loading
                    _recommendations.value = UiState.Loading
                    _recentlyAdded.value = UiState.Loading
                }
                _gridDisplayLimit.value = randomGridLimit()

                // Each request updates its own state independently (partial rendering, no global hang).
                coroutineScope {
                    val trendingDeferred = async { fetchAnime("trending", _trending) { animeRepository.getTrending() } }
                    val popularDeferred = async { fetchAnime("popular", _popular) { animeRepository.getPopular() } }
                    val latestDeferred = async { fetchAnime("latest", _latest) { animeRepository.getLatest() } }
                    val topRatedDeferred = async { fetchAnime("top_rated", _topRated) { animeRepository.getTopRated() } }
                    val airingDeferred = async { fetchAnime("airing", _airing) { animeRepository.getAiring() } }
                    val seasonalDeferred = async { fetchAnime("seasonal", _seasonal) { animeRepository.getSeasonal(2026, "FALL") } }
                    val continueDeferred = async { fetchContinueWatching() }
                    val watchlistDeferred = async { fetchWatchlist() }
                    val spotlightDeferred = async { fetchAnime("spotlight", _spotlight) { animeRepository.getSpotlight() } }

                    val trendingResult = trendingDeferred.await()
                    val popularResult = popularDeferred.await()
                    val latestResult = latestDeferred.await()
                    val topRatedResult = topRatedDeferred.await()
                    val airingResult = airingDeferred.await()
                    val seasonalResult = seasonalDeferred.await()
                    val continueResult = continueDeferred.await()
                    val watchlistResult = watchlistDeferred.await()
                    val spotlightResult = spotlightDeferred.await()

                    val recs = trendingResult
                    _recommendations.value = if (recs.isNotEmpty()) {
                        UiState.Success(recs)
                    } else {
                        UiState.Error("Recommendations unavailable")
                    }
                    _recentlyAdded.value = _latest.value

                    // Persist for instant display on next app open (images served from Coil disk cache).
                    withContext(Dispatchers.IO) {
                        runCatching {
                            HomeCacheStore.save(
                                HomeCacheStore.CachedHomeData(
                                    spotlight = spotlightResult,
                                    trending = trendingResult,
                                    popular = popularResult,
                                    topRated = topRatedResult,
                                    airing = airingResult,
                                    seasonal = seasonalResult,
                                    recommendations = recs,
                                    continueWatching = continueResult
                                )
                            )
                        }
                    }
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                Log.w(TAG, "loadHomeData failed: ${e.message}")
                // Ensure no gated section remains stuck in Loading on unexpected failure.
                ensureResolved(_trending, "Trending unavailable")
                ensureResolved(_popular, "Popular unavailable")
                ensureResolved(_topRated, "Top rated unavailable")
                ensureResolved(_airing, "Airing unavailable")
                ensureResolved(_spotlight, "Spotlight unavailable")
                ensureResolved(_continueWatching, "Continue watching unavailable")
                ensureResolved(_seasonal, "Seasonal unavailable")
                ensureResolved(_latest, "Latest unavailable")
                ensureResolved(_recentlyAdded, "Recently added unavailable")
                ensureResolved(_recommendations, "Recommendations unavailable")
                ensureResolved(_watchlist, "Watchlist unavailable")
            } finally {
                _isRefreshing.value = false
            }
        }
    }

    private fun <T> ensureResolved(flow: MutableStateFlow<UiState<List<T>>>, message: String) {
        if (flow.value is UiState.Loading) flow.value = UiState.Error(message)
    }

    private suspend fun fetchAnime(
        tag: String,
        target: MutableStateFlow<UiState<List<Anime>>>,
        block: suspend () -> Result<List<Anime>>
    ): List<Anime> {
        return try {
            val result = block()
            val data = result.getOrNull()
            if (result.isSuccess && data != null) {
                target.value = UiState.Success(data)
                data
            } else {
                val msg = result.exceptionOrNull()?.message ?: "Failed to load $tag"
                Log.w(TAG, "$tag: $msg")
                target.value = UiState.Error(msg)
                emptyList()
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.w(TAG, "$tag exception: ${e.message}")
            target.value = UiState.Error(e.message ?: "Failed to load $tag")
            emptyList()
        }
    }

    private suspend fun fetchContinueWatching(): List<ContinueWatching> {
        return try {
            val result = if (libraryRepository.hasValidToken()) {
                libraryRepository.getContinueWatching()
            } else {
                Result.success(emptyList())
            }
            val data = result.getOrNull()
            if (result.isSuccess && data != null) {
                _continueWatching.value = UiState.Success(data)
                data
            } else {
                val msg = result.exceptionOrNull()?.message ?: "Failed to load continue watching"
                Log.w(TAG, "continue: $msg")
                _continueWatching.value = UiState.Error(msg)
                emptyList()
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.w(TAG, "continue exception: ${e.message}")
            _continueWatching.value = UiState.Error(e.message ?: "Failed to load continue watching")
            emptyList()
        }
    }

    private suspend fun fetchWatchlist(): List<WatchlistItem> {
        return try {
            val result = if (libraryRepository.hasValidToken()) {
                libraryRepository.getWatchlist()
            } else {
                Result.success(emptyList())
            }
            val data = result.getOrNull()
            if (result.isSuccess && data != null) {
                _watchlist.value = UiState.Success(data)
                data
            } else {
                val msg = result.exceptionOrNull()?.message ?: "Failed to load watchlist"
                Log.w(TAG, "watchlist: $msg")
                _watchlist.value = UiState.Error(msg)
                emptyList()
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.w(TAG, "watchlist exception: ${e.message}")
            _watchlist.value = UiState.Error(e.message ?: "Failed to load watchlist")
            emptyList()
        }
    }

    private fun randomGridLimit(): Int = GRID_LIMIT_OPTIONS.random()

    companion object {
        private const val TAG = "HomeViewModel"
        // Predefined display-count options (max 20). Randomized once per session/refresh.
        val GRID_LIMIT_OPTIONS = listOf(8, 10, 12, 14, 15, 16, 18, 20)
    }
}