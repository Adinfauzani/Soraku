package id.rynex.soraku

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.ActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.navigation.compose.rememberNavController
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import id.rynex.soraku.core.di.ServiceLocator
import id.rynex.soraku.core.navigation.NavGraph
import id.rynex.soraku.core.navigation.Route
import id.rynex.soraku.features.auth.GoogleSignInService
import id.rynex.soraku.features.auth.GoogleSignInResult
import id.rynex.soraku.features.auth.UserInfo
import id.rynex.soraku.features.anilist.AnilistCallbackBus
import id.rynex.soraku.ui.theme.SorakuTheme
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class MainActivity : ComponentActivity() {
    private lateinit var googleSignInService: GoogleSignInService
    private lateinit var navController: androidx.navigation.NavHostController
    private lateinit var firebaseAuth: FirebaseAuth
    private val mainScope = CoroutineScope(Dispatchers.Main)

override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)

        val insetsController = WindowCompat.getInsetsController(window, window.decorView)
        insetsController.isAppearanceLightStatusBars = false
        insetsController.isAppearanceLightNavigationBars = false

        googleSignInService = GoogleSignInService(this)
        firebaseAuth = FirebaseAuth.getInstance()

        enableEdgeToEdge()

        window.statusBarColor = android.graphics.Color.BLACK
        window.navigationBarColor = android.graphics.Color.BLACK
        handleAnilistCallback(intent)
        setContent {
            SorakuTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    navController = rememberNavController()
                    NavGraph(
                        navController = navController,
                        startDestination = Route.Boot.route,
                        onLoginWithGoogle = {
                            Log.i(TAG, "onLoginWithGoogle clicked")
                            if (!googleSignInService.isGooglePlayServicesAvailable()) {
                                Toast.makeText(
                                    this@MainActivity,
                                    "Google Play Services tidak tersedia. Silakan update atau instal Google Play Services.",
                                    Toast.LENGTH_LONG
                                ).show()
                            } else {
                                val signInIntent = googleSignInService.getSignInIntent()
                                googleSignInLauncher.launch(signInIntent)
                            }
                        }
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleAnilistCallback(intent)
    }

    private fun handleAnilistCallback(intent: Intent?) {
        val data = intent?.data ?: return
        if (data.scheme == "soraku" && data.host == "anilist-callback") {
            val code = data.getQueryParameter("code")
            if (code != null) {
                Log.i(TAG, "AniList OAuth callback code received")
                AnilistCallbackBus.post(code)
            }
        }
    }

    private val googleSignInLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        Log.i(TAG, "googleSignInLauncher resultCode=${result.resultCode}")
        mainScope.launch {
            val signInResult = googleSignInService.handleSignInResult(result)
            when (signInResult) {
                is GoogleSignInResult.Success -> {
                    Log.i(TAG, "GoogleSignIn success: email=${signInResult.account.email}")
                    val googleIdToken = signInResult.account.idToken
                    if (googleIdToken.isNullOrBlank()) {
                        Log.e(TAG, "Google ID token is null")
                        Toast.makeText(
                            this@MainActivity,
                            "Login failed: missing Google ID token",
                            Toast.LENGTH_LONG
                        ).show()
                        return@launch
                    }

                    try {
                        val firebaseCredential = GoogleAuthProvider.getCredential(googleIdToken, null)
                        val firebaseUser = firebaseAuth.signInWithCredential(firebaseCredential).await().user
                        val firebaseIdToken = firebaseUser?.getIdToken(false)?.await()?.token

                        if (firebaseIdToken.isNullOrBlank()) {
                            Log.e(TAG, "Firebase ID token is null")
                            Toast.makeText(
                                this@MainActivity,
                                "Login failed: missing Firebase ID token",
                                Toast.LENGTH_LONG
                            ).show()
                            return@launch
                        }

                        val authRepository = ServiceLocator.provideAuthRepository()
                        val loginResult = authRepository.loginWithFirebase(firebaseIdToken)
                        if (loginResult.isSuccess) {
                            val userInfo = UserInfo(
                                email = firebaseUser.email ?: "",
                                displayName = firebaseUser.displayName ?: "",
                                photoUrl = firebaseUser.photoUrl?.toString()
                            )
                            ServiceLocator.provideTokenManager().saveUserInfo(
                                email = userInfo.email,
                                displayName = userInfo.displayName,
                                photoUrl = userInfo.photoUrl
                            )

                            Handler(Looper.getMainLooper()).postDelayed({
                                navController.navigate(Route.Loading.route) {
                                    popUpTo(Route.Welcome.route) { inclusive = true }
                                }
                            }, 1000)
                        } else {
                            val errorMsg = loginResult.exceptionOrNull()?.message ?: "Firebase login failed"
                            Log.e(TAG, "Backend login failed: $errorMsg")
                            Toast.makeText(
                                this@MainActivity,
                                "Login failed: $errorMsg",
                                Toast.LENGTH_LONG
                            ).show()
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Login error", e)
                        Toast.makeText(
                            this@MainActivity,
                            "Login error: ${e.message}",
                            Toast.LENGTH_LONG
                        ).show()
                    }
                }
                is GoogleSignInResult.Error -> {
                    Log.e(TAG, "GoogleSignIn error: ${signInResult.message}")
                    Toast.makeText(
                        this@MainActivity,
                        "Login failed: ${signInResult.message}",
                        Toast.LENGTH_LONG
                    ).show()
                }
                else -> {}
            }
        }
    }

    companion object {
        private const val TAG = "MainActivity"
    }
}
