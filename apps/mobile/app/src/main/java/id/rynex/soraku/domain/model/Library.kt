package id.rynex.soraku.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class ContinueWatching(
    val animeId: String,
    val animeTitle: String,
    val coverImage: String?,
    val episode: Int,
    val progress: Float
)

@Serializable
data class WatchlistItem(
    val animeId: String,
    val animeTitle: String,
    val coverImage: String?,
    val status: String? = null,
    val progress: Int? = null
)