package id.rynex.soraku.features.home.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import id.rynex.soraku.core.common.UiState
import id.rynex.soraku.domain.model.Anime
import id.rynex.soraku.ui.theme.BodySmall
import id.rynex.soraku.ui.theme.PrimaryBlue
import id.rynex.soraku.ui.theme.SorakuPadding
import id.rynex.soraku.ui.theme.SorakuSize
import id.rynex.soraku.ui.theme.SorakuSpacing
import id.rynex.soraku.ui.theme.TextSecondary

@Composable
fun SeasonalSection(
    items: UiState<List<Anime>>,
    onAnimeClick: (Anime) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(bottom = SorakuPadding.section)
    ) {
        SectionHeader(
            title = "Seasonal",
            seeAll = null,
            onSeeAll = null
        )

        when (items) {
            is UiState.Loading -> {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(SorakuSize.PosterHeight + SorakuSpacing.md),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(
                        color = PrimaryBlue,
                        modifier = Modifier.width(28.dp).height(28.dp)
                    )
                }
            }

            is UiState.Error -> {
                Text(
                    text = items.message,
                    color = TextSecondary,
                    style = BodySmall,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = SorakuPadding.screen, vertical = SorakuSpacing.md)
                )
            }

            is UiState.Success -> {
                val list = items.data
                if (list.isEmpty()) {
                    Text(
                        text = "No data available",
                        color = TextSecondary,
                        style = BodySmall,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(
                                horizontal = SorakuPadding.screen,
                                vertical = SorakuSpacing.md
                            )
                    )
                } else {
                    LazyRow(
                        contentPadding = PaddingValues(horizontal = SorakuPadding.screen),
                        horizontalArrangement = Arrangement.spacedBy(SorakuPadding.cardGap)
                    ) {
                        items(list) { anime ->
                            AnimeCard(
                                anime = anime,
                                onClick = { onAnimeClick(anime) },
                                showRating = true,
                                showEpisode = false
                            )
                        }
                    }
                }
            }
        }
    }
}