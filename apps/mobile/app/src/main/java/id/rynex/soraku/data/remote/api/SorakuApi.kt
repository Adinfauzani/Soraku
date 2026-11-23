package id.rynex.soraku.data.remote.api

import id.rynex.soraku.data.remote.dto.AnimeDto
import id.rynex.soraku.data.remote.dto.AnilistConnectResponse
import id.rynex.soraku.data.remote.dto.AnilistOAuthUrlDto
import id.rynex.soraku.data.remote.dto.AnilistTrackRequest
import id.rynex.soraku.data.remote.dto.AnilistTrackResponse
import id.rynex.soraku.data.remote.dto.ApiResponse
import id.rynex.soraku.data.remote.dto.AuthResponse
import id.rynex.soraku.data.remote.dto.CoverImageDto
import id.rynex.soraku.data.remote.dto.CharacterDto
import id.rynex.soraku.data.remote.dto.ContinueWatchingDto
import id.rynex.soraku.data.remote.dto.EpisodeListResponse
import id.rynex.soraku.data.remote.dto.FavoriteDto
import id.rynex.soraku.data.remote.dto.HistoryDto
import id.rynex.soraku.data.remote.dto.MediaRelationDto
import id.rynex.soraku.data.remote.dto.ProgressRequest
import id.rynex.soraku.data.remote.dto.RefreshRequest
import id.rynex.soraku.data.remote.dto.SearchAnimeDto
import id.rynex.soraku.data.remote.dto.StreamResponse
import id.rynex.soraku.data.remote.dto.UserDto
import id.rynex.soraku.data.remote.dto.WatchlistDto
import kotlinx.serialization.Serializable
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface AuthApi {
    @POST("auth/anilist")
    suspend fun googleLogin(@Body request: Map<String, String>): Response<AuthResponse>

    @POST("auth/firebase")
    suspend fun firebaseLogin(@Body request: Map<String, String>): Response<AuthResponse>

    @POST("auth/refresh")
    suspend fun refresh(@Body request: RefreshRequest): Response<AuthResponse>

    @GET("auth/me")
    suspend fun me(): Response<UserDto>

    @GET("auth/anilist/oauth-url")
    suspend fun anilistOAuthUrl(@Query("redirect_uri") redirectUri: String): Response<AnilistOAuthUrlDto>

    @POST("auth/anilist/connect")
    suspend fun anilistConnect(@Body request: Map<String, String>): Response<AnilistConnectResponse>

    @POST("auth/anilist/track")
    suspend fun anilistTrack(@Body request: AnilistTrackRequest): Response<AnilistTrackResponse>
}

interface AnimeApi {
    @GET("search")
    suspend fun search(@Query("query") query: String): Response<ApiResponse<List<SearchAnimeDto>>>

    @GET("search/filter")
    suspend fun searchFilter(
        @Query("format") format: String? = null,
        @Query("status") status: String? = null,
        @Query("page") page: Int = 1,
        @Query("perPage") perPage: Int = 20
    ): Response<ApiResponse<List<SearchAnimeDto>>>

    @GET("trending")
    suspend fun trending(
        @Query("page") page: Int = 1,
        @Query("perPage") perPage: Int = 20
    ): Response<ApiResponse<List<AnimeDto>>>

    @GET("popular")
    suspend fun popular(
        @Query("page") page: Int = 1,
        @Query("perPage") perPage: Int = 20
    ): Response<ApiResponse<List<AnimeDto>>>

    @GET("latest")
    suspend fun latest(
        @Query("page") page: Int = 1,
        @Query("perPage") perPage: Int = 20
    ): Response<ApiResponse<List<AnimeDto>>>

    @GET("top-rated")
    suspend fun topRated(
        @Query("page") page: Int = 1,
        @Query("perPage") perPage: Int = 20
    ): Response<ApiResponse<List<AnimeDto>>>

    @GET("upcoming")
    suspend fun upcoming(
        @Query("page") page: Int = 1,
        @Query("perPage") perPage: Int = 20
    ): Response<ApiResponse<List<AnimeDto>>>

    @GET("spotlight")
    suspend fun spotlight(): Response<ApiResponse<List<AnimeDto>>>

    @GET("anime/{id}")
    suspend fun detail(@Path("id") id: String): Response<ApiResponse<AnimeDto>>

    @GET("anime/{id}/characters")
    suspend fun characters(@Path("id") id: String): Response<ApiResponse<List<CharacterDto>>>

    @GET("anime/{id}/relations")
    suspend fun relations(@Path("id") id: String): Response<ApiResponse<List<MediaRelationDto>>>

    @GET("anime/{id}/recommendations")
    suspend fun recommendations(@Path("id") id: String): Response<ApiResponse<List<AnimeDto>>>

    @GET("anime/{id}/episodes")
    suspend fun episodes(@Path("id") id: String): Response<List<id.rynex.soraku.data.remote.dto.EpisodeDto>>
}

interface ScheduleApi {
    @GET("schedule")
    suspend fun getSchedule(): Response<ApiResponse<List<ScheduleDto>>>
}

@Serializable
data class ScheduleDto(
    val id: String,
    val airingAt: Long,
    val episode: Int,
    val mediaId: String,
    val media: ScheduleMediaDto? = null
)

@Serializable
data class ScheduleMediaDto(
    val id: String,
    val title: ScheduleTitleDto? = null,
    val coverImage: CoverImageDto? = null,
    val format: String? = null,
    val episodes: Int? = null,
    val averageScore: Double? = null,
    val season: String? = null,
    val seasonYear: Int? = null,
    val status: String? = null,
    val studios: List<ScheduleStudioDto>? = null
)

@Serializable
data class ScheduleTitleDto(
    val romaji: String? = null,
    val english: String? = null,
    val native: String? = null
)

@Serializable
data class ScheduleStudioDto(
    val name: String
)

interface LibraryApi {
    @GET("library/history")
    suspend fun history(): Response<List<HistoryDto>>

    @POST("library/progress")
    suspend fun updateProgress(@Body request: ProgressRequest): Response<Unit>

    @GET("library/watchlist")
    suspend fun watchlist(): Response<List<WatchlistDto>>

    @GET("library/favorites")
    suspend fun favorites(): Response<List<FavoriteDto>>

    @POST("library/favorites/{anilistId}")
    suspend fun addFavorite(@Path("anilistId") anilistId: Int): Response<Unit>

    @DELETE("library/favorites/{anilistId}")
    suspend fun removeFavorite(@Path("anilistId") anilistId: Int): Response<Unit>

    @POST("library/watchlist/{anilistId}")
    suspend fun addToWatchlist(@Path("anilistId") anilistId: Int): Response<Unit>

    @DELETE("library/watchlist/{anilistId}")
    suspend fun removeFromWatchlist(@Path("anilistId") anilistId: Int): Response<Unit>

    @GET("library/continue-watching")
    suspend fun continueWatching(): Response<List<ContinueWatchingDto>>
}

interface EpisodeApi {
    @GET("watch/{animeId}/episodes")
    suspend fun getEpisodes(@Path("animeId") animeId: String): Response<EpisodeListResponse>

    @GET("watch/{animeSlug}/{episodeNumber}/stream")
    suspend fun resolveStream(
        @Path("animeSlug") animeSlug: String,
        @Path("episodeNumber") episodeNumber: Int
    ): Response<StreamResponse>
}