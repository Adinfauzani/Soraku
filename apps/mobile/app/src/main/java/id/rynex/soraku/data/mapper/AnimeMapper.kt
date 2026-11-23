package id.rynex.soraku.data.mapper

import id.rynex.soraku.data.remote.dto.AnimeDto
import id.rynex.soraku.data.remote.dto.ApiResponse
import id.rynex.soraku.data.remote.dto.CharacterDto
import id.rynex.soraku.data.remote.dto.EpisodeDto
import id.rynex.soraku.data.remote.dto.MediaRelationDto
import id.rynex.soraku.data.remote.dto.SearchAnimeDto
import id.rynex.soraku.domain.model.Anime
import id.rynex.soraku.domain.model.Character
import id.rynex.soraku.domain.model.EpisodeInfo
import id.rynex.soraku.domain.model.MediaRelation
import id.rynex.soraku.domain.model.VoiceActor

object AnimeMapper {

    fun toDomain(dto: AnimeDto): Anime {
        return Anime(
            id = dto.id,
            title = dto.englishTitle ?: dto.title ?: "Unknown",
            titleRomaji = dto.nativeTitle ?: dto.title ?: "",
            titleEnglish = dto.englishTitle,
            bannerImage = dto.banner?.takeIf { it.isNotBlank() },
            coverImage = dto.image?.takeIf { it.isNotBlank() },
            genres = dto.genres ?: emptyList(),
            format = dto.type ?: "TV",
            episodes = dto.totalEpisodes ?: dto.episodes,
            duration = dto.duration?.toIntOrNull(),
            averageScore = (dto.rating?.times(10))?.toInt(),
            meanScore = null,
            popularity = null,
            favourites = null,
            season = dto.season ?: "",
            seasonYear = dto.year,
            status = dto.status ?: "FINISHED",
            description = dto.description,
            studios = dto.studios ?: emptyList(),
            nextAiringEpisode = dto.nextAiringEpisode?.episode,
            trailer = dto.trailer,
            trailerSite = if (dto.trailer != null) "youtube" else null,
            source = dto.source,
            synonyms = emptyList(),
            startDate = null,
            endDate = null,
            countryOfOrigin = dto.countryOfOrigin,
            externalLinks = emptyList(),
            rankings = emptyList(),
            characters = emptyList(),
            relations = emptyList(),
            recommendations = emptyList()
        )
    }

    fun toDomain(dto: SearchAnimeDto): Anime {
        return Anime(
            id = dto.id,
            title = dto.englishTitle ?: dto.title ?: "Unknown",
            titleRomaji = dto.nativeTitle ?: dto.title ?: "",
            titleEnglish = dto.englishTitle,
            bannerImage = null,
            coverImage = dto.image?.takeIf { it.isNotBlank() },
            genres = dto.genres ?: emptyList(),
            format = dto.type ?: "TV",
            episodes = null,
            duration = null,
            averageScore = (dto.rating?.times(10))?.toInt(),
            meanScore = null,
            popularity = null,
            favourites = null,
            season = dto.season ?: "",
            seasonYear = dto.year,
            status = dto.status ?: "FINISHED",
            description = dto.description,
            studios = dto.studios ?: emptyList(),
            nextAiringEpisode = null,
            source = null,
            trailer = null,
            trailerSite = null,
            synonyms = emptyList(),
            startDate = null,
            endDate = null,
            countryOfOrigin = null,
            externalLinks = emptyList(),
            rankings = emptyList(),
            characters = emptyList(),
            relations = emptyList(),
            recommendations = emptyList()
        )
    }

    fun toCharacters(dtos: List<CharacterDto>): List<Character> {
        return dtos.map { dto ->
            Character(
                id = dto.id ?: 0,
                name = dto.name ?: "Unknown",
                image = dto.image,
                role = dto.role ?: "",
                voiceActors = (dto.voiceActors ?: emptyList()).map { va ->
                    VoiceActor(
                        name = va.name ?: "Unknown",
                        image = va.image,
                        language = va.language
                    )
                }
            )
        }
    }

    fun toRelations(dtos: List<MediaRelationDto>): List<MediaRelation> {
        return dtos.mapNotNull { dto ->
            if (dto.id == null) return@mapNotNull null
            MediaRelation(
                id = dto.id,
                title = dto.title ?: "Unknown",
                coverImage = dto.coverImage,
                format = dto.format ?: "",
                relationType = dto.relationType ?: ""
            )
        }
    }

    fun toEpisodes(animeId: String, dtos: List<EpisodeDto>): List<EpisodeInfo> {
        return dtos.mapIndexed { index, dto ->
            val number = if (dto.number > 0) dto.number else index + 1
            EpisodeInfo(
                id = dto.id?.takeIf { it.isNotBlank() } ?: "$animeId-$number",
                animeId = dto.animeId?.takeIf { it.isNotBlank() } ?: animeId,
                number = number,
                title = dto.title?.takeIf { it.isNotBlank() } ?: "Episode $number",
                thumbnail = dto.thumbnail?.takeIf { it.isNotBlank() } ?: dto.image?.takeIf { it.isNotBlank() },
                duration = dto.duration?.takeIf { it.isNotBlank() },
                episodePageUrl = dto.episodePageUrl?.takeIf { it.isNotBlank() }
            )
        }
    }

    fun toEpisodeInfo(animeId: String, episodeNumber: Int, dto: Map<String, Any>? = null): EpisodeInfo {
        return EpisodeInfo(
            id = "$animeId-$episodeNumber",
            animeId = animeId,
            number = episodeNumber,
            title = dto?.get("title") as? String ?: "Episode $episodeNumber",
            thumbnail = dto?.get("thumbnail") as? String,
            duration = (dto?.get("duration") as? Int)?.toString(),
            episodePageUrl = dto?.get("episodePageUrl") as? String,
            isWatched = false,
            isCurrent = false
        )
    }
}