package id.rynex.soraku.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class CharacterDto(
    val id: Int? = null,
    val name: String? = null,
    val image: String? = null,
    val role: String? = null,
    val voiceActors: List<VoiceActorDto> = emptyList()
)

@Serializable
data class MediaRelationDto(
    val id: Int? = null,
    val title: String? = null,
    val coverImage: String? = null,
    val format: String? = null,
    val relationType: String? = null
)

@Serializable
data class HistoryDto(
    val animeId: String,
    val animeTitle: String,
    val coverImage: String?,
    val episode: Int,
    val progress: Float,
    val timestamp: Long
)

@Serializable
data class ProgressRequest(
    val animeId: String,
    val episode: Int,
    val progress: Float
)

@Serializable
data class WatchlistDto(
    val animeId: String,
    val animeTitle: String,
    val coverImage: String?,
    val status: String?,
    val progress: Int?
)

@Serializable
data class FavoriteDto(
    val animeId: String,
    val animeTitle: String,
    val coverImage: String?
)

@Serializable
data class ContinueWatchingDto(
    val animeId: String,
    val animeTitle: String,
    val coverImage: String?,
    val episode: Int,
    val progress: Float
)

@Serializable
data class EpisodeListResponse(
    val episodes: List<EpisodeDto> = emptyList()
)

@Serializable
data class EpisodeDto(
    val id: String? = null,
    val animeId: String? = null,
    val number: Int = 0,
    val title: String? = null,
    val image: String? = null,
    val thumbnail: String? = null,
    val duration: String? = null,
    val episodePageUrl: String? = null
)

@Serializable
data class StreamResponse(
    val url: String,
    val headers: Map<String, String>? = null
)