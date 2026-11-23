package id.rynex.soraku.data.repository

import id.rynex.soraku.core.security.TokenManager
import id.rynex.soraku.data.remote.api.LibraryApi
import id.rynex.soraku.data.remote.dto.ContinueWatchingDto
import id.rynex.soraku.data.remote.dto.FavoriteDto
import id.rynex.soraku.data.remote.dto.HistoryDto
import id.rynex.soraku.data.remote.dto.ProgressRequest
import id.rynex.soraku.data.remote.dto.WatchlistDto
import id.rynex.soraku.domain.model.ContinueWatching
import id.rynex.soraku.domain.model.WatchlistItem
import id.rynex.soraku.domain.repository.LibraryRepository

class LibraryRepositoryImpl(
    private val libraryApi: LibraryApi,
    private val tokenManager: TokenManager
) : LibraryRepository {

    override suspend fun getContinueWatching(): Result<List<ContinueWatching>> {
        return try {
            val response = libraryApi.continueWatching()
            if (response.isSuccessful) {
                Result.success(response.body()?.map { it.toDomain() } ?: emptyList())
            } else {
                Result.failure(Exception("Continue watching failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getWatchlist(): Result<List<WatchlistItem>> {
        return try {
            val response = libraryApi.watchlist()
            if (response.isSuccessful) {
                Result.success(response.body()?.map { it.toDomain() } ?: emptyList())
            } else {
                Result.failure(Exception("Watchlist failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getHistory(): Result<List<ContinueWatching>> {
        return try {
            val response = libraryApi.history()
            if (response.isSuccessful) {
                Result.success(response.body()?.map { it.toDomain() } ?: emptyList())
            } else {
                Result.failure(Exception("History failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getFavorites(): Result<List<WatchlistItem>> {
        return try {
            val response = libraryApi.favorites()
            if (response.isSuccessful) {
                Result.success(response.body()?.map { it.toDomain() } ?: emptyList())
            } else {
                Result.failure(Exception("Favorites failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateProgress(animeId: String, episode: Int, progress: Float): Result<Unit> {
        return try {
            val response = libraryApi.updateProgress(ProgressRequest(animeId, episode, progress))
            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(Exception("Update progress failed: ${response.code()}"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun addToWatchlist(animeId: String): Result<Unit> {
        return try {
            val id = animeId.toIntOrNull()
            if (id == null) return Result.failure(Exception("Invalid anime ID"))
            val response = libraryApi.addToWatchlist(id)
            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(Exception("Add to watchlist failed: ${response.code()}"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun removeFromWatchlist(animeId: String): Result<Unit> {
        return try {
            val id = animeId.toIntOrNull()
            if (id == null) return Result.failure(Exception("Invalid anime ID"))
            val response = libraryApi.removeFromWatchlist(id)
            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(Exception("Remove from watchlist failed: ${response.code()}"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun addFavorite(animeId: String): Result<Unit> {
        return try {
            val id = animeId.toIntOrNull()
            if (id == null) return Result.failure(Exception("Invalid anime ID"))
            val response = libraryApi.addFavorite(id)
            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(Exception("Add favorite failed: ${response.code()}"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun removeFavorite(animeId: String): Result<Unit> {
        return try {
            val id = animeId.toIntOrNull()
            if (id == null) return Result.failure(Exception("Invalid anime ID"))
            val response = libraryApi.removeFavorite(id)
            if (response.isSuccessful) Result.success(Unit)
            else Result.failure(Exception("Remove favorite failed: ${response.code()}"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override fun hasValidToken(): Boolean = tokenManager.hasValidToken()

    private fun ContinueWatchingDto.toDomain() = ContinueWatching(
        animeId = animeId,
        animeTitle = animeTitle,
        coverImage = coverImage,
        episode = episode,
        progress = progress
    )

    private fun HistoryDto.toDomain() = ContinueWatching(
        animeId = animeId,
        animeTitle = animeTitle,
        coverImage = coverImage,
        episode = episode,
        progress = progress
    )

    private fun WatchlistDto.toDomain() = WatchlistItem(
        animeId = animeId,
        animeTitle = animeTitle,
        coverImage = coverImage,
        status = status,
        progress = progress
    )

    private fun FavoriteDto.toDomain() = WatchlistItem(
        animeId = animeId,
        animeTitle = animeTitle,
        coverImage = coverImage
    )
}