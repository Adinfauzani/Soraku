package id.rynex.soraku.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val provider: String? = null,
    val data: T
)

@Serializable
data class AnimeDto(
    val id: String,
    val title: String,
    val englishTitle: String? = null,
    val nativeTitle: String? = null,
    val image: String? = null,
    val banner: String? = null,
    val description: String? = null,
    val genres: List<String>? = null,
    val rating: Double? = null,
    val status: String? = null,
    val type: String? = null,
    val totalEpisodes: Int? = null,
    val episodes: Int? = null,
    val year: Int? = null,
    val season: String? = null,
    val studios: List<String>? = null,
    val nextAiringEpisode: NextAiringEpisodeDto? = null,
    val trailer: String? = null,
    val duration: String? = null,
    val source: String? = null,
    val countryOfOrigin: String? = null
)

@Serializable
data class NextAiringEpisodeDto(
    val episode: Int? = null,
    val timeUntilAiring: Int? = null
)

@Serializable
data class SearchAnimeDto(
    val id: String,
    val title: String,
    val englishTitle: String? = null,
    val nativeTitle: String? = null,
    val image: String? = null,
    val description: String? = null,
    val genres: List<String>? = null,
    val rating: Double? = null,
    val status: String? = null,
    val type: String? = null,
    val year: Int? = null,
    val season: String? = null,
    val studios: List<String>? = null
)

@Serializable
data class RefreshRequest(
    val refreshToken: String
)

@Serializable
data class AuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val user: UserDto
)

@Serializable
data class UserDto(
    val id: String,
    val username: String,
    val email: String,
    val avatar: String? = null,
    val role: String = "USER",
    val isPremium: Boolean = false,
    val createdAt: String? = null
)

@Serializable
data class TitleDto(
    val romaji: String? = null,
    val english: String? = null,
    val native: String? = null
)

@Serializable
data class CoverImageDto(
    val large: String? = null,
    val medium: String? = null
)

@Serializable
data class TrailerDto(
    val id: String? = null,
    val site: String? = null,
    val thumbnail: String? = null
)

@Serializable
data class AnimeDateDto(
    val year: Int? = null,
    val month: Int? = null,
    val day: Int? = null
)

@Serializable
data class ExternalLinkDto(
    val url: String,
    val site: String
)

@Serializable
data class RankingDto(
    val rank: Int,
    val type: String,
    val context: String
)

@Serializable
data class CharacterEdgeDto(
    val id: Int? = null,
    val name: String? = null,
    val image: String? = null,
    val role: String? = null,
    val voiceActors: List<VoiceActorDto> = emptyList()
)

@Serializable
data class VoiceActorDto(
    val name: String? = null,
    val image: String? = null,
    val language: String? = null
)

@Serializable
data class MediaEdgeDto(
    val id: Int? = null,
    val title: String? = null,
    val coverLarge: String? = null,
    val format: String? = null,
    val relationType: String? = null
)

@Serializable
data class AnilistOAuthUrlDto(
    val url: String
)

@Serializable
data class AnilistConnectResponse(
    val accessToken: String,
    val username: String? = null,
    val avatar: String? = null
)

@Serializable
data class AnilistTrackRequest(
    val accessToken: String,
    val mediaId: Int,
    val status: String? = null,
    val progress: Int? = null
)

@Serializable
data class AnilistTrackResponse(
    val id: Int,
    val status: String? = null,
    val progress: Int? = null
)