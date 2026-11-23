package id.rynex.soraku.domain.repository

import id.rynex.soraku.domain.model.ContinueWatching
import id.rynex.soraku.domain.model.WatchlistItem

interface LibraryRepository {
    suspend fun getContinueWatching(): Result<List<ContinueWatching>>
    suspend fun getWatchlist(): Result<List<WatchlistItem>>
    suspend fun getHistory(): Result<List<ContinueWatching>>
    suspend fun getFavorites(): Result<List<WatchlistItem>>
    suspend fun updateProgress(animeId: String, episode: Int, progress: Float): Result<Unit>
    suspend fun addToWatchlist(animeId: String): Result<Unit>
    suspend fun removeFromWatchlist(animeId: String): Result<Unit>
    suspend fun addFavorite(animeId: String): Result<Unit>
    suspend fun removeFavorite(animeId: String): Result<Unit>
    fun hasValidToken(): Boolean
}