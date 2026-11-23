package id.rynex.soraku.data.repository

import id.rynex.soraku.data.mapper.AnimeMapper
import id.rynex.soraku.data.remote.api.AnimeApi
import id.rynex.soraku.domain.model.Anime
import id.rynex.soraku.domain.model.Character
import id.rynex.soraku.domain.model.EpisodeInfo
import id.rynex.soraku.domain.model.MediaRelation
import id.rynex.soraku.domain.repository.AnimeRepository
import id.rynex.soraku.data.remote.dto.ApiResponse
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay

class AnimeRepositoryImpl(
    private val animeApi: AnimeApi,
    private val authTokenProvider: id.rynex.soraku.domain.repository.AuthRepository
) : AnimeRepository {

    override suspend fun getTrending(forceRefresh: Boolean): Result<List<Anime>> {
        return safeCall {
            val response = animeApi.trending()
            if (!response.isSuccessful) error("Trending request failed (${response.code()})")
            response.body()?.data?.map { AnimeMapper.toDomain(it) } ?: error("Trending response is empty")
        }
    }

    override suspend fun getPopular(forceRefresh: Boolean): Result<List<Anime>> {
        return safeCall {
            val response = animeApi.popular()
            if (!response.isSuccessful) error("Popular request failed (${response.code()})")
            response.body()?.data?.map { AnimeMapper.toDomain(it) } ?: error("Popular response is empty")
        }
    }

    override suspend fun getLatest(forceRefresh: Boolean): Result<List<Anime>> {
        return safeCall {
            val response = animeApi.latest()
            if (!response.isSuccessful) error("Latest request failed (${response.code()})")
            response.body()?.data?.map { AnimeMapper.toDomain(it) } ?: error("Latest response is empty")
        }
    }

    override suspend fun getTopRated(forceRefresh: Boolean): Result<List<Anime>> {
        return safeCall {
            val response = animeApi.topRated()
            if (!response.isSuccessful) error("Top rated request failed (${response.code()})")
            response.body()?.data?.map { AnimeMapper.toDomain(it) } ?: error("Top rated response is empty")
        }
    }

    override suspend fun getAiring(forceRefresh: Boolean): Result<List<Anime>> {
        return safeCall {
            val response = animeApi.upcoming()
            if (!response.isSuccessful) error("Airing request failed (${response.code()})")
            response.body()?.data?.map { AnimeMapper.toDomain(it) } ?: error("Airing response is empty")
        }
    }

    override suspend fun getMovies(forceRefresh: Boolean): Result<List<Anime>> {
        return safeCall { emptyList() }
    }

    override suspend fun getSpotlight(forceRefresh: Boolean): Result<List<Anime>> {
        return safeCall {
            val response = animeApi.spotlight()
            if (!response.isSuccessful) error("Spotlight request failed (${response.code()})")
            response.body()?.data?.map { AnimeMapper.toDomain(it) } ?: error("Spotlight response is empty")
        }
    }

    override suspend fun search(query: String): Result<List<Anime>> {
        return safeCall {
            val response = animeApi.search(query)
            if (response.isSuccessful) {
                response.body()?.data?.map { AnimeMapper.toDomain(it) } ?: emptyList()
            } else {
                throw Exception("Search failed: ${response.code()}")
            }
        }
    }

    override suspend fun searchFiltered(format: String?, status: String?): Result<List<Anime>> {
        return safeCall {
            val response = animeApi.searchFilter(format = format, status = status)
            if (response.isSuccessful) {
                response.body()?.data?.map { AnimeMapper.toDomain(it) } ?: emptyList()
            } else {
                throw Exception("Filter failed: ${response.code()}")
            }
        }
    }

    override suspend fun getAnimeDetail(id: String): Result<Anime> {
        return safeCall {
            val response = animeApi.detail(id)
            if (response.isSuccessful) {
                val body = response.body()?.data
                if (body != null) AnimeMapper.toDomain(body) else throw Exception("Empty response")
            } else {
                throw Exception("Detail failed: ${response.code()}")
            }
        }
    }

    override suspend fun getCharacters(id: String): Result<List<Character>> {
        return safeCall {
            val response = animeApi.characters(id)
            if (response.isSuccessful) {
                AnimeMapper.toCharacters(response.body()?.data ?: emptyList())
            } else {
                throw Exception("Characters failed: ${response.code()}")
            }
        }
    }

    override suspend fun getRelations(id: String): Result<List<MediaRelation>> {
        return safeCall {
            val response = animeApi.relations(id)
            if (response.isSuccessful) {
                AnimeMapper.toRelations(response.body()?.data ?: emptyList())
            } else {
                throw Exception("Relations failed: ${response.code()}")
            }
        }
    }

    override suspend fun getRecommendations(id: String): Result<List<Anime>> {
        return safeCall {
            val response = animeApi.recommendations(id)
            if (response.isSuccessful) {
                response.body()?.data?.map { AnimeMapper.toDomain(it) } ?: emptyList()
            } else {
                throw Exception("Recommendations failed: ${response.code()}")
            }
        }
    }

    override suspend fun getEpisodes(id: String): Result<List<EpisodeInfo>> {
        return safeCall {
            val response = animeApi.episodes(id)
            if (response.isSuccessful) {
                AnimeMapper.toEpisodes(id, response.body() ?: emptyList())
            } else {
                throw Exception("Episodes failed: ${response.code()}")
            }
        }
    }

    override suspend fun getSeasonal(year: Int, season: String): Result<List<Anime>> {
        return safeCall {
            emptyList()
        }
    }

    private suspend fun <T> safeCall(block: suspend () -> T): Result<T> {
        return try {
            Result.success(block())
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}