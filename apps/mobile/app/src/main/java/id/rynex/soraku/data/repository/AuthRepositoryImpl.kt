package id.rynex.soraku.data.repository

import id.rynex.soraku.core.security.TokenManager
import id.rynex.soraku.data.remote.api.AuthApi
import id.rynex.soraku.data.remote.dto.AnilistConnectResponse
import id.rynex.soraku.data.remote.dto.AnilistTrackRequest
import id.rynex.soraku.data.remote.dto.AnilistTrackResponse
import id.rynex.soraku.data.remote.dto.AuthResponse
import id.rynex.soraku.domain.repository.AuthRepository

class AuthRepositoryImpl(
    private val authApi: AuthApi,
    private val tokenManager: TokenManager
) : AuthRepository {

    override suspend fun loginWithGoogle(idToken: String): Result<AuthResponse> {
        return try {
            val response = authApi.googleLogin(mapOf("idToken" to idToken))
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    tokenManager.saveTokens(body.accessToken, body.refreshToken)
                    Result.success(body)
                } else {
                    Result.failure(Exception("Empty response"))
                }
            } else {
                Result.failure(Exception("Google login failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun loginWithFirebase(idToken: String): Result<AuthResponse> {
        return try {
            val response = authApi.firebaseLogin(mapOf("idToken" to idToken))
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    tokenManager.saveTokens(body.accessToken, body.refreshToken)
                    Result.success(body)
                } else {
                    Result.failure(Exception("Empty response"))
                }
            } else {
                Result.failure(Exception("Firebase login failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun refreshToken(token: String): Result<AuthResponse> {
        return try {
            val response = authApi.refresh(
                id.rynex.soraku.data.remote.dto.RefreshRequest(token)
            )
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    tokenManager.saveTokens(body.accessToken, body.refreshToken)
                    Result.success(body)
                } else {
                    Result.failure(Exception("Empty response"))
                }
            } else {
                Result.failure(Exception("Refresh failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getCurrentUser(): Result<Unit> {
        return try {
            val response = authApi.me()
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Unauthorized"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun saveTokens(accessToken: String, refreshToken: String) {
        tokenManager.saveTokens(accessToken, refreshToken)
    }

    override fun getAccessToken(): String? = tokenManager.getAccessToken()

    override fun getRefreshToken(): String? = tokenManager.getRefreshToken()

    override fun clearTokens() = tokenManager.clearTokens()

    override fun hasValidToken(): Boolean = tokenManager.hasValidToken()

    override suspend fun getAnilistOAuthUrl(redirectUri: String): Result<String> {
        return try {
            val response = authApi.anilistOAuthUrl(redirectUri)
            val body = response.body()
            if (response.isSuccessful && body != null) {
                Result.success(body.url)
            } else {
                Result.failure(Exception("Failed to get AniList OAuth URL"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun connectAnilist(code: String, redirectUri: String): Result<AnilistConnectResponse> {
        return try {
            val response = authApi.anilistConnect(mapOf("code" to code, "redirect_uri" to redirectUri))
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    tokenManager.saveAnilistToken(body.accessToken, body.username, body.avatar)
                    Result.success(body)
                } else {
                    Result.failure(Exception("Empty response"))
                }
            } else {
                Result.failure(Exception("AniList connect failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun trackAnilist(mediaId: Int, status: String?, progress: Int?): Result<AnilistTrackResponse> {
        return try {
            val anilistToken = tokenManager.getAnilistToken()
            if (anilistToken == null) {
                return Result.failure(Exception("AniList belum terhubung"))
            }
            val response = authApi.anilistTrack(
                AnilistTrackRequest(
                    accessToken = anilistToken,
                    mediaId = mediaId,
                    status = status,
                    progress = progress
                )
            )
            val body = response.body()
            if (response.isSuccessful && body != null) {
                Result.success(body)
            } else {
                Result.failure(Exception("AniList track failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override fun isAnilistConnected(): Boolean = tokenManager.hasAnilistToken()

    override fun getAnilistUsername(): String? = tokenManager.getAnilistUsername()

    override fun disconnectAnilist() = tokenManager.clearAnilist()
}