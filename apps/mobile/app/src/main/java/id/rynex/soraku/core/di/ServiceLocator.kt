package id.rynex.soraku.core.di

import android.content.Context
import id.rynex.soraku.core.network.ApiClient
import id.rynex.soraku.data.remote.api.AnimeApi
import id.rynex.soraku.data.remote.api.AuthApi
import id.rynex.soraku.data.remote.api.EpisodeApi
import id.rynex.soraku.data.remote.api.LibraryApi
import id.rynex.soraku.data.remote.api.ScheduleApi
import id.rynex.soraku.data.repository.AnimeRepositoryImpl
import id.rynex.soraku.data.repository.AuthRepositoryImpl
import id.rynex.soraku.data.repository.LibraryRepositoryImpl
import id.rynex.soraku.domain.repository.AnimeRepository
import id.rynex.soraku.domain.repository.AuthRepository
import id.rynex.soraku.domain.repository.LibraryRepository
import id.rynex.soraku.core.security.TokenManager

import id.rynex.soraku.features.home.HomeCacheStore

object ServiceLocator {
    private var apiClient: ApiClient? = null
    private var tokenManager: TokenManager? = null

    fun init(context: Context) {
        apiClient = ApiClient(context.applicationContext)
        tokenManager = TokenManager(context.applicationContext)
        HomeCacheStore.init(context.applicationContext)
    }

    fun provideAnimeRepository(): AnimeRepository {
        val apiClient = apiClient ?: throw IllegalStateException("ServiceLocator not initialized")
        val animeApi = apiClient.retrofit.create(AnimeApi::class.java)
        return AnimeRepositoryImpl(animeApi, provideAuthRepository())
    }

    fun provideEpisodeApi(): EpisodeApi {
        val apiClient = apiClient ?: throw IllegalStateException("ServiceLocator not initialized")
        return apiClient.retrofit.create(EpisodeApi::class.java)
    }

    fun provideScheduleApi(): ScheduleApi {
        val apiClient = apiClient ?: throw IllegalStateException("ServiceLocator not initialized")
        return apiClient.retrofit.create(ScheduleApi::class.java)
    }

    fun provideLibraryRepository(): LibraryRepository {
        val apiClient = apiClient ?: throw IllegalStateException("ServiceLocator not initialized")
        val libraryApi = apiClient.retrofit.create(LibraryApi::class.java)
        val tokenManager = tokenManager ?: throw IllegalStateException("ServiceLocator not initialized")
        return LibraryRepositoryImpl(libraryApi, tokenManager)
    }

    fun provideTokenManager(): TokenManager {
        val tokenManager = tokenManager ?: throw IllegalStateException("ServiceLocator not initialized")
        return tokenManager
    }

    fun provideAuthRepository(): AuthRepository {
        val apiClient = apiClient ?: throw IllegalStateException("ServiceLocator not initialized")
        val authApi = apiClient.retrofit.create(AuthApi::class.java)
        val tokenManager = tokenManager ?: throw IllegalStateException("ServiceLocator not initialized")
        return AuthRepositoryImpl(authApi, tokenManager)
    }

    fun clear() {
        apiClient = null
        tokenManager = null
    }
}