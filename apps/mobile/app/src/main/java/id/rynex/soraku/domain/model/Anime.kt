package id.rynex.soraku.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class Anime(
    val id: String,
    val title: String,
    val titleRomaji: String = "",
    val titleEnglish: String? = null,
    val bannerImage: String? = null,
    val coverImage: String? = null,
    val genres: List<String> = emptyList(),
    val format: String = "TV",
    val episodes: Int? = null,
    val duration: Int? = null,
    val averageScore: Int? = null,
    val meanScore: Int? = null,
    val popularity: Int? = null,
    val favourites: Int? = null,
    val season: String = "",
    val seasonYear: Int? = null,
    val status: String = "FINISHED",
    val description: String? = null,
    val studios: List<String> = emptyList(),
    val nextAiringEpisode: Int? = null,
    val source: String? = null,
    val trailer: String? = null,
    val trailerSite: String? = null,
    val synonyms: List<String> = emptyList(),
    val startDate: AnimeDate? = null,
    val endDate: AnimeDate? = null,
    val countryOfOrigin: String? = null,
    val externalLinks: List<ExternalLink> = emptyList(),
    val rankings: List<Ranking> = emptyList(),
    val characters: List<Character> = emptyList(),
    val relations: List<MediaRelation> = emptyList(),
    val recommendations: List<Anime> = emptyList()
)

@Serializable
data class AnimeDate(
    val year: Int? = null,
    val month: Int? = null,
    val day: Int? = null
)

@Serializable
data class ExternalLink(
    val url: String,
    val site: String
)

@Serializable
data class Ranking(
    val rank: Int,
    val type: String,
    val context: String
)

@Serializable
data class Character(
    val id: Int,
    val name: String,
    val image: String? = null,
    val role: String = "",
    val voiceActors: List<VoiceActor> = emptyList()
)

@Serializable
data class VoiceActor(
    val name: String,
    val image: String? = null,
    val language: String? = null
)

@Serializable
data class MediaRelation(
    val id: Int,
    val title: String,
    val coverImage: String? = null,
    val format: String = "",
    val relationType: String = ""
)