package id.rynex.soraku.domain.repository

import id.rynex.soraku.data.remote.dto.AnilistConnectResponse
import id.rynex.soraku.data.remote.dto.AnilistTrackResponse
import id.rynex.soraku.data.remote.dto.AuthResponse

interface AuthRepository {
    suspend fun loginWithGoogle(idToken: String): Result<AuthResponse>
    suspend fun loginWithFirebase(idToken: String): Result<AuthResponse>
    suspend fun refreshToken(token: String): Result<AuthResponse>
    suspend fun getCurrentUser(): Result<Unit>
    suspend fun saveTokens(accessToken: String, refreshToken: String)
    fun getAccessToken(): String?
    fun getRefreshToken(): String?
    fun clearTokens()
    fun hasValidToken(): Boolean
    suspend fun getAnilistOAuthUrl(redirectUri: String): Result<String>
    suspend fun connectAnilist(code: String, redirectUri: String): Result<AnilistConnectResponse>
    suspend fun trackAnilist(mediaId: Int, status: String?, progress: Int?): Result<AnilistTrackResponse>
    fun isAnilistConnected(): Boolean
    fun getAnilistUsername(): String?
    fun disconnectAnilist()
}