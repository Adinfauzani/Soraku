package id.rynex.soraku.domain.repository

import id.rynex.soraku.domain.model.Anime
import id.rynex.soraku.domain.model.Character
import id.rynex.soraku.domain.model.EpisodeInfo
import id.rynex.soraku.domain.model.MediaRelation

interface AnimeRepository {
    suspend fun getTrending(forceRefresh: Boolean = false): Result<List<Anime>>
    suspend fun getPopular(forceRefresh: Boolean = false): Result<List<Anime>>
    suspend fun getLatest(forceRefresh: Boolean = false): Result<List<Anime>>
    suspend fun getTopRated(forceRefresh: Boolean = false): Result<List<Anime>>
    suspend fun getAiring(forceRefresh: Boolean = false): Result<List<Anime>>
    suspend fun getMovies(forceRefresh: Boolean = false): Result<List<Anime>>
    suspend fun getSpotlight(forceRefresh: Boolean = false): Result<List<Anime>>
    suspend fun search(query: String): Result<List<Anime>>
    suspend fun searchFiltered(format: String? = null, status: String? = null): Result<List<Anime>>
    suspend fun getAnimeDetail(id: String): Result<Anime>
    suspend fun getCharacters(id: String): Result<List<Character>>
    suspend fun getRelations(id: String): Result<List<MediaRelation>>
    suspend fun getRecommendations(id: String): Result<List<Anime>>
    suspend fun getEpisodes(id: String): Result<List<EpisodeInfo>>
    suspend fun getSeasonal(year: Int, season: String): Result<List<Anime>>
}