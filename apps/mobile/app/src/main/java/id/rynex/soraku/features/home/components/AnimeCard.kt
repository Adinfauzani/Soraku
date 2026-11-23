package id.rynex.soraku.features.home.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.clickable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.BorderStroke
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.painter.ColorPainter
import coil.compose.AsyncImage
import coil.request.CachePolicy
import coil.request.ImageRequest
import coil.size.Precision
import androidx.compose.ui.platform.LocalContext
import id.rynex.soraku.domain.model.Anime
import id.rynex.soraku.ui.theme.AnimeMetaStyle
import id.rynex.soraku.ui.theme.AnimeTitleStyle
import id.rynex.soraku.ui.theme.BackgroundSecondary
import id.rynex.soraku.ui.theme.BadgeStyle
import id.rynex.soraku.ui.theme.BorderSubtle
import id.rynex.soraku.ui.theme.PrimaryBlue
import id.rynex.soraku.ui.theme.RatingStyle
import id.rynex.soraku.ui.theme.SorakuShape
import id.rynex.soraku.ui.theme.SorakuSize
import id.rynex.soraku.ui.theme.SorakuSpacing
import id.rynex.soraku.ui.theme.SurfaceElevated
import id.rynex.soraku.ui.theme.TextPrimary

@Composable
fun AnimeCard(
    anime: Anime,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    showRating: Boolean = true,
    showEpisode: Boolean = false
) {
    Column(
        modifier = modifier
            .width(SorakuSize.PosterWidth)
            .clip(SorakuShape.Poster)
            .clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .width(SorakuSize.PosterWidth)
                .height(SorakuSize.PosterHeight)
                .clip(SorakuShape.Poster),
            contentAlignment = Alignment.Center
        ) {
            val context = LocalContext.current
            val imageUrl = anime.coverImage ?: anime.bannerImage
            val placeholder = remember { ColorPainter(SurfaceElevated) }
            AsyncImage(
                model = ImageRequest.Builder(context)
                    .data(imageUrl)
                    .crossfade(false)
                    .allowRgb565(true)
                    .memoryCacheKey(imageUrl)
                    .diskCacheKey(imageUrl)
                    .precision(Precision.INEXACT)
                    .memoryCachePolicy(CachePolicy.ENABLED)
                    .diskCachePolicy(CachePolicy.ENABLED)
                    .build(),
                contentDescription = anime.title,
                modifier = Modifier
                    .width(SorakuSize.PosterWidth)
                    .height(SorakuSize.PosterHeight)
                    .clip(SorakuShape.Poster),
                placeholder = placeholder,
                error = placeholder,
                fallback = placeholder,
                contentScale = ContentScale.Crop
            )

            if (showEpisode && anime.episodes != null) {
                EpisodeBadge(
                    text = "${anime.episodes} EP",
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(SorakuSpacing.sm)
                )
            }

            if (showRating && anime.averageScore != null) {
                RatingBadge(
                    score = anime.averageScore,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(SorakuSpacing.sm)
                )
            }
        }

        Spacer(modifier = Modifier.height(SorakuSpacing.sm))

        Text(
            text = anime.title,
            style = AnimeTitleStyle,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.fillMaxWidth()
        )

        if (anime.format.isNotEmpty()) {
            Text(
                text = anime.format,
                style = AnimeMetaStyle,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
fun EpisodeBadge(text: String, modifier: Modifier = Modifier) {
    val shape = SorakuShape.Chip
    Surface(
        shape = shape,
        color = BackgroundSecondary.copy(alpha = 0.85f),
        border = BorderStroke(1.dp, BorderSubtle),
        modifier = modifier
    ) {
        Text(
            text = text,
            style = BadgeStyle,
            modifier = Modifier.padding(
                horizontal = SorakuSpacing.sm,
                vertical = SorakuSpacing.xs
            )
        )
    }
}

@Composable
fun RatingBadge(score: Int, modifier: Modifier = Modifier) {
    Surface(
        shape = SorakuShape.Chip,
        color = PrimaryBlue.copy(alpha = 0.92f),
        modifier = modifier
    ) {
        Text(
            text = "★ ${String.format("%.1f", score / 10.0)}",
            style = RatingStyle,
            modifier = Modifier.padding(
                horizontal = SorakuSpacing.sm,
                vertical = SorakuSpacing.xs
            )
        )
    }
}