package id.rynex.soraku.features.loading

import android.util.Log
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.Spacer
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import id.rynex.soraku.core.di.ServiceLocator
import kotlinx.coroutines.delay

@Composable
fun LoadingScreen(
    onSuccess: () -> Unit,
    onFailure: () -> Unit
) {
    val tokenManager = ServiceLocator.provideTokenManager()
    val hasToken = remember { mutableStateOf(!tokenManager.getAccessToken().isNullOrBlank()) }

    LaunchedEffect(Unit) {
        if (hasToken.value) {
            Log.d("LoadingScreen", "Token found, navigating to Home")
            onSuccess()
        } else {
            Log.d("LoadingScreen", "No token, navigating to Welcome")
            onFailure()
        }
    }

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        CircularProgressIndicator()
        Spacer(modifier = Modifier.height(16.dp))
        Text(text = "Loading...", fontSize = 16.sp)
    }
}