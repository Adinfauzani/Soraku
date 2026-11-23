package id.rynex.soraku.features.home.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import id.rynex.soraku.core.common.UiState
import id.rynex.soraku.domain.model.Anime
import id.rynex.soraku.ui.theme.BodySmall
import id.rynex.soraku.ui.theme.PrimaryBlue
import id.rynex.soraku.ui.theme.SorakuPadding
import id.rynex.soraku.ui.theme.SorakuSpacing
import id.rynex.soraku.ui.theme.TextSecondary

private const val GRID_COLUMNS = 3

@Composable
fun AnimeGridSection(
    title: String?,
    items: UiState<List<Anime>>,
    onAnimeClick: (Anime) -> Unit,
    modifier: Modifier = Modifier,
    displayLimit: Int = 20,
    seeAll: String? = null,
    onSeeAll: (() -> Unit)? = null,
    onRetry: (() -> Unit)? = null
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(bottom = SorakuPadding.section)
    ) {
        if (!title.isNullOrBlank()) {
            SectionHeader(
                title = title,
                seeAll = seeAll,
                onSeeAll = onSeeAll
            )
        }

        when (items) {
            is UiState.Loading -> {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = SorakuPadding.screen, vertical = SorakuSpacing.lg),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(
                        color = PrimaryBlue,
                        modifier = Modifier.size(24.dp)
                    )
                }
            }

            is UiState.Error -> {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = SorakuPadding.screen, vertical = SorakuSpacing.md)
                ) {
                    Text(
                        text = items.message,
                        color = TextSecondary,
                        style = BodySmall
                    )
                    if (onRetry != null) {
                        Spacer(modifier = Modifier.height(SorakuSpacing.xs))
                        Text(
                            text = "Tap to retry",
                            color = PrimaryBlue,
                            style = BodySmall,
                            modifier = Modifier.clickable { onRetry() }
                        )
                    }
                }
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
                            .padding(horizontal = SorakuPadding.screen, vertical = SorakuSpacing.md)
                    )
                } else {
                    val limited = remember(list, displayLimit) {
                        list.take(displayLimit.coerceAtMost(list.size))
                    }
                    val rows = remember(limited) { limited.chunked(GRID_COLUMNS) }

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = SorakuPadding.screen),
                        verticalArrangement = Arrangement.spacedBy(SorakuPadding.cardGap)
                    ) {
                        rows.forEach { rowItems ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(SorakuPadding.cardGap)
                            ) {
                                rowItems.forEach { anime ->
                                    AnimeGridCard(
                                        anime = anime,
                                        onClick = { onAnimeClick(anime) },
                                        modifier = Modifier.weight(1f)
                                    )
                                }
                                // Fill remaining cells in the last row to keep columns aligned
                                repeat(GRID_COLUMNS - rowItems.size) {
                                    Spacer(modifier = Modifier.weight(1f))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}