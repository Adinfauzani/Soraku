package id.rynex.soraku.features.home.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.CircularProgressIndicator
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
import id.rynex.soraku.domain.model.ContinueWatching
import id.rynex.soraku.ui.theme.AnimeTitleStyle
import id.rynex.soraku.ui.theme.BodySmall
import id.rynex.soraku.ui.theme.EpisodeInfoStyle
import id.rynex.soraku.ui.theme.PrimaryBlue
import id.rynex.soraku.ui.theme.SorakuShape
import id.rynex.soraku.ui.theme.SorakuSize
import id.rynex.soraku.ui.theme.SorakuSpacing
import id.rynex.soraku.ui.theme.SurfaceElevated
import id.rynex.soraku.ui.theme.TextPrimary

@Composable
fun ContinueWatchingCard(
    item: ContinueWatching,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
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
            val imageUrl = item.coverImage
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
                contentDescription = item.animeTitle,
                modifier = Modifier
                    .width(SorakuSize.PosterWidth)
                    .height(SorakuSize.PosterHeight)
                    .clip(SorakuShape.Poster),
                placeholder = placeholder,
                error = placeholder,
                fallback = placeholder,
                contentScale = ContentScale.Crop
            )

            ContinueProgressIndicator(
                progress = item.progress,
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .fillMaxWidth()
            )

            EpisodeBadge(
                text = "EP ${item.episode}",
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(SorakuSpacing.sm)
            )
        }

        Spacer(modifier = Modifier.height(SorakuSpacing.sm))

        Text(
            text = item.animeTitle,
            style = AnimeTitleStyle,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.fillMaxWidth()
        )

        Text(
            text = "Episode ${item.episode}",
            style = EpisodeInfoStyle,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
fun ContinueProgressIndicator(
    progress: Float,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .height(SorakuSize.ProgressHeight)
            .clip(SorakuShape.Pill),
        contentAlignment = Alignment.CenterStart
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(SorakuSize.ProgressHeight)
                .background(TextPrimary.copy(alpha = 0.18f))
        )
        Box(
            modifier = Modifier
                .fillMaxWidth(fraction = progress.coerceIn(0f, 1f))
                .height(SorakuSize.ProgressHeight)
                .background(PrimaryBlue)
        )
    }
}