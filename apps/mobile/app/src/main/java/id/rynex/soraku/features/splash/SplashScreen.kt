package id.rynex.soraku.features.splash

import android.util.Log
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import coil.compose.AsyncImage
import id.rynex.soraku.core.di.ServiceLocator
import id.rynex.soraku.ui.theme.SorakuTheme
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(onSplashComplete: (Boolean) -> Unit) {
    val tokenManager = ServiceLocator.provideTokenManager()
    val accessToken = tokenManager.getAccessToken()
    val isLoggedIn = !accessToken.isNullOrBlank()
    Log.d("SplashScreen", "accessToken=$accessToken, isLoggedIn=$isLoggedIn")

    LaunchedEffect(Unit) {
        onSplashComplete(isLoggedIn)
    }

    SorakuTheme {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = Color(0xFF0B0B0F)
        ) {}
    }
}