package id.rynex.soraku.core.security

import android.content.Context
import androidx.core.content.edit
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

class TokenManager(private val context: Context) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs = EncryptedSharedPreferences.create(
        context,
        "soraku_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    fun saveTokens(accessToken: String, refreshToken: String) {
        prefs.edit().putString(KEY_ACCESS_TOKEN, accessToken).putString(KEY_REFRESH_TOKEN, refreshToken).apply()
    }

    fun saveUserInfo(email: String, displayName: String, photoUrl: String?) {
        prefs.edit()
            .putString(KEY_USER_EMAIL, email)
            .putString(KEY_USER_NAME, displayName)
            .putString(KEY_USER_PHOTO, photoUrl)
            .apply()
    }

    fun getUserEmail(): String? = prefs.getString(KEY_USER_EMAIL, null)

    fun getUserName(): String? = prefs.getString(KEY_USER_NAME, null)

    fun getUserPhoto(): String? = prefs.getString(KEY_USER_PHOTO, null)

    fun getAccessToken(): String? = prefs.getString(KEY_ACCESS_TOKEN, null)

    fun getRefreshToken(): String? = prefs.getString(KEY_REFRESH_TOKEN, null)

    fun clearTokens() {
        prefs.edit().clear().apply()
    }

    fun saveAnilistToken(token: String, username: String?, avatar: String?) {
        prefs.edit()
            .putString(KEY_ANILIST_TOKEN, token)
            .putString(KEY_ANILIST_USERNAME, username)
            .putString(KEY_ANILIST_AVATAR, avatar)
            .apply()
    }

    fun getAnilistToken(): String? = prefs.getString(KEY_ANILIST_TOKEN, null)

    fun getAnilistUsername(): String? = prefs.getString(KEY_ANILIST_USERNAME, null)

    fun getAnilistAvatar(): String? = prefs.getString(KEY_ANILIST_AVATAR, null)

    fun hasAnilistToken(): Boolean = getAnilistToken() != null

    fun clearAnilist() {
        prefs.edit()
            .remove(KEY_ANILIST_TOKEN)
            .remove(KEY_ANILIST_USERNAME)
            .remove(KEY_ANILIST_AVATAR)
            .apply()
    }

    fun hasValidToken(): Boolean = getAccessToken() != null

    companion object {
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_USER_EMAIL = "user_email"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_USER_PHOTO = "user_photo"
        private const val KEY_ANILIST_TOKEN = "anilist_token"
        private const val KEY_ANILIST_USERNAME = "anilist_username"
        private const val KEY_ANILIST_AVATAR = "anilist_avatar"
    }
}