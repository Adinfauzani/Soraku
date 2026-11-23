package id.rynex.soraku.features.home.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import id.rynex.soraku.ui.theme.SorakuPadding
import id.rynex.soraku.ui.theme.SorakuSpacing
import id.rynex.soraku.ui.theme.TextSecondary

private val Genres = listOf(
    "Action", "Adventure", "Comedy", "Drama", "Fantasy",
    "Horror", "Mystery", "Romance", "Sci-Fi", "Slice of Life",
    "Sports", "Supernatural", "Suspense", "Thriller"
)

@Composable
fun GenreSection(
    onGenreClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(bottom = SorakuPadding.section)
    ) {
        SectionHeader(
            title = "Browse by Genre",
            seeAll = null,
            onSeeAll = null
        )

        LazyRow(
            contentPadding = PaddingValues(horizontal = SorakuPadding.screen),
            horizontalArrangement = Arrangement.spacedBy(SorakuSpacing.sm)
        ) {
            items(Genres) { genre ->
                GenreChip(
                    genre = genre,
                    selected = false,
                    onSelected = { onGenreClick(genre) }
                )
            }
        }
    }
}