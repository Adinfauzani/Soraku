package id.rynex.soraku.features.search

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.sp

@Composable
fun SearchScreen(
    onBack: () -> Unit,
    onNavigateToDetail: (String) -> Unit,
    initialFilter: String = ""
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(text = "Search Screen", fontSize = 24.sp)
        Text(text = "Filter: $initialFilter", fontSize = 16.sp)
    }
}