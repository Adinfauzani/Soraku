package id.rynex.soraku.features.home.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import id.rynex.soraku.core.common.UiState
import id.rynex.soraku.domain.model.ContinueWatching
import id.rynex.soraku.ui.theme.SorakuPadding

@Composable
fun ContinueWatchingSection(
    items: UiState<List<ContinueWatching>>,
    onAnimeClick: (ContinueWatching) -> Unit,
    modifier: Modifier = Modifier
) {
    when (items) {
        is UiState.Loading -> {}
        is UiState.Error -> {}
        is UiState.Success -> {
            val list = items.data
            if (list.isEmpty()) return

            Column(
                modifier = modifier
                    .fillMaxWidth()
                    .padding(bottom = SorakuPadding.section)
            ) {
                SectionHeader(
                    title = "Continue Watching",
                    seeAll = null,
                    onSeeAll = null
                )

                LazyRow(
                    contentPadding = PaddingValues(horizontal = SorakuPadding.screen),
                    horizontalArrangement = Arrangement.spacedBy(SorakuPadding.cardGap)
                ) {
                    items(list, key = { "${it.animeId}_${it.episode}" }) { item ->
                        ContinueWatchingCard(
                            item = item,
                            onClick = { onAnimeClick(item) }
                        )
                    }
                }
            }
        }
    }
}