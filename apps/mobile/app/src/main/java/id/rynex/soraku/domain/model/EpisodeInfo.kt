package id.rynex.soraku.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class EpisodeInfo(
    val id: String,
    val animeId: String,
    val number: Int,
    val title: String,
    val thumbnail: String? = null,
    val duration: String? = null,
    val episodePageUrl: String? = null,
    val isWatched: Boolean = false,
    val isCurrent: Boolean = false
)