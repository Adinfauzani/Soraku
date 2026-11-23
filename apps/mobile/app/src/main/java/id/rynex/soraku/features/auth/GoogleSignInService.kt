package id.rynex.soraku.features.auth

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.activity.result.ActivityResult
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability

class GoogleSignInService(private val context: Context) {

    private val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
        .requestEmail()
        .requestIdToken(WEB_CLIENT_ID)
        .requestId()
        .build()

    val googleSignInClient: GoogleSignInClient = GoogleSignIn.getClient(context, gso)

    fun getSignInIntent(): Intent = googleSignInClient.signInIntent

    fun isGooglePlayServicesAvailable(): Boolean {
        val googleApiAvailability = GoogleApiAvailability.getInstance()
        val result = googleApiAvailability.isGooglePlayServicesAvailable(context)
        if (result != ConnectionResult.SUCCESS) {
            Log.w(TAG, "Google Play Services not available: $result")
        }
        return result == ConnectionResult.SUCCESS
    }

    fun handleSignInResult(result: ActivityResult): GoogleSignInResult {
        Log.i(TAG, "handleSignInResult: resultCode=${result.resultCode}, data=${result.data}")
        return try {
            if (result.resultCode != android.app.Activity.RESULT_OK && result.data == null) {
                Log.w(TAG, "Sign-in cancelled, resultCode=${result.resultCode}")
                return GoogleSignInResult.Error("Sign-in cancelled (code=${result.resultCode})")
            }

            val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
            val account = task.getResult(ApiException::class.java)

            Log.i(TAG, "GoogleSignIn account: email=${account?.email}, idToken=${account?.idToken?.take(20)}...")

            if (account != null) {
                GoogleSignInResult.Success(account)
            } else {
                GoogleSignInResult.Error("Google account is null")
            }
        } catch (e: ApiException) {
            Log.e(TAG, "GoogleSignIn ApiException: status=${e.statusCode}, message=${e.message}", e)
            GoogleSignInResult.Error("Google Sign-In failed: ${e.statusCode} - ${e.message}")
        } catch (e: Exception) {
            Log.e(TAG, "Sign-In error", e)
            GoogleSignInResult.Error("Sign-In error: ${e.message}")
        }
    }

    fun signOut() {
        googleSignInClient.signOut()
    }

    companion object {
        private const val TAG = "GoogleSignInService"
        private const val WEB_CLIENT_ID = "615344504842-bjo4tg9p4oatchip2u2hrk6aqsim4s52.apps.googleusercontent.com"

        fun signOut(context: Context) {
            val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .requestIdToken(WEB_CLIENT_ID)
                .requestId()
                .build()
            GoogleSignIn.getClient(context, gso).signOut()
        }
    }
}

sealed class GoogleSignInResult {
    data class Success(val account: GoogleSignInAccount) : GoogleSignInResult()
    data class Error(val message: String) : GoogleSignInResult()
}

data class UserInfo(
    val email: String,
    val displayName: String,
    val photoUrl: String?
)