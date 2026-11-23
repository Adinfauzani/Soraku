package id.rynex.soraku.features.home.components

import android.util.Log
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.painter.ColorPainter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.repeatOnLifecycle
import coil.compose.AsyncImage
import coil.request.CachePolicy
import coil.request.ImageRequest
import coil.size.Precision
import id.rynex.soraku.core.common.UiState
import id.rynex.soraku.domain.model.Anime
import id.rynex.soraku.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest

private const val AUTO_SLIDE_INTERVAL_MS = 7_000L
private const val TRANSITION_DURATION_MS = 600
private const val MAX_SPOTLIGHT_DOTS = 5

@Composable
fun SpotlightSection(
    items: UiState<List<Anime>>,
    onAnimeClick: (Anime) -> Unit,
    modifier: Modifier = Modifier,
    onRetry: (() -> Unit)? = null
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(bottom = SorakuPadding.section)
    ) {
        when (items) {
            is UiState.Loading -> {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = SorakuPadding.screen)
                        .height(SorakuSize.SpotlightPosterHeight)
                        .clip(SorakuShape.SpotlightCard)
                        .background(SurfaceElevated),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(
                        color = PrimaryBlue,
                        modifier = Modifier.size(28.dp)
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
                val spotlight = remember(items.data) {
                    val valid = items.data.filter { it.id.isNotBlank() }
                    val withImage = valid.filter { !(it.coverImage ?: it.bannerImage).isNullOrBlank() }
                    (if (withImage.isNotEmpty()) withImage else valid).take(MAX_SPOTLIGHT_DOTS)
                }
                if (spotlight.isNotEmpty()) {
                    SpotlightCarousel(
                        items = spotlight,
                        onAnimeClick = onAnimeClick
                    )
                }
            }
        }
    }
}

@Composable
private fun SpotlightLoadingPlaceholder() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = SorakuPadding.screen)
            .height(SorakuSize.SpotlightPosterHeight)
            .clip(SorakuShape.SpotlightCard)
            .background(SurfaceElevated),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator(
            color = PrimaryBlue,
            modifier = Modifier.size(28.dp)
        )
    }
}

@Composable
private fun SpotlightCarousel(
    items: List<Anime>,
    onAnimeClick: (Anime) -> Unit
) {
    if (items.isEmpty()) return

    val pagerState = rememberPagerState(pageCount = { items.size })
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current

    // Keep page in range if the spotlight list size changes.
    LaunchedEffect(items.size) {
        if (items.isNotEmpty() && pagerState.currentPage > items.lastIndex) {
            pagerState.scrollToPage(items.lastIndex)
        }
    }

    // Prefetch current, next and previous carousel images once per settled page
    // (avoids repeated enqueues during drag/animation frames).
    LaunchedEffect(pagerState, items) {
        if (items.isEmpty()) return@LaunchedEffect
        val loader = coil.Coil.imageLoader(context)
        snapshotFlow { pagerState.settledPage }
            .collectLatest { settled ->
                if (items.isEmpty()) return@collectLatest
                val base = settled.coerceIn(0, items.lastIndex)
                listOf(base, (base + 1) % items.size, (base - 1 + items.size) % items.size)
                    .distinct()
                    .filter { it in items.indices }
                    .forEach { idx ->
                        val model = spotlightImageUrl(items[idx]) ?: return@forEach
                        loader.enqueue(
                            ImageRequest.Builder(context)
                                .data(model)
                                .memoryCacheKey(model)
                                .diskCacheKey(model)
                                .memoryCachePolicy(CachePolicy.ENABLED)
                                .diskCachePolicy(CachePolicy.ENABLED)
                                .allowRgb565(true)
                                .build()
                        )
                    }
            }
    }

    // Lifecycle-aware auto-slide: 7s display after each settled page, 600ms transition.
    // Restarts timer on manual swipe settle (collectLatest cancels prior wait).
    // Runs only while Home (this composable) is at least RESUMED; single job, no duplicates.
    LaunchedEffect(lifecycleOwner, pagerState, items.size) {
        if (items.size <= 1) return@LaunchedEffect
        lifecycleOwner.lifecycle.repeatOnLifecycle(Lifecycle.State.RESUMED) {
            snapshotFlow { pagerState.settledPage }
                .collectLatest { settled ->
                    if (items.size <= 1) return@collectLatest
                    delay(AUTO_SLIDE_INTERVAL_MS)
                    if (!pagerState.isScrollInProgress) {
                        val next = (settled + 1) % items.size
                        pagerState.animateScrollToPage(
                            page = next,
                            animationSpec = tween(
                                durationMillis = TRANSITION_DURATION_MS,
                                easing = FastOutSlowInEasing
                            )
                        )
                    }
                }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = SorakuPadding.screen)
    ) {
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxWidth(),
            pageSpacing = SorakuSpacing.md,
            beyondViewportPageCount = 1,
            key = { page -> items[page].id }
        ) { page ->
            SpotlightCard(
                anime = items[page],
                onClick = { onAnimeClick(items[page]) },
                modifier = Modifier.fillMaxWidth()
            )
        }

        // Vertical pagination indicator — right side, vertically centered.
        if (items.size > 1) {
            val selected = pagerState.currentPage.coerceIn(0, items.lastIndex)
            Column(
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .padding(end = SorakuSpacing.md),
                verticalArrangement = Arrangement.spacedBy(SorakuSpacing.xs),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                items.forEachIndexed { index, _ ->
                    val isActive = index == selected
                    val height by animateDpAsState(
                        targetValue = if (isActive) 18.dp else 6.dp,
                        animationSpec = tween(durationMillis = 220),
                        label = "dotHeight"
                    )
                    Box(
                        modifier = Modifier
                            .width(6.dp)
                            .height(height)
                            .clip(CircleShape)
                            .background(
                                if (isActive) TextPrimary
                                else TextSecondary.copy(alpha = 0.4f)
                            )
                    )
                }
            }
        }
    }
}

private fun spotlightImageUrl(anime: Anime): String? {
    // Prefer cover (reliable across sections) with banner fallback for hero.
    return anime.coverImage?.takeIf { it.isNotBlank() }
        ?: anime.bannerImage?.takeIf { it.isNotBlank() }
}
@Composable
private fun SpotlightCard(
    anime: Anime,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .height(SorakuSize.SpotlightPosterHeight)
            .clip(SorakuShape.SpotlightCard)
            .clickable(onClick = onClick)
    ) {
        val context = LocalContext.current
        val imageUrl = spotlightImageUrl(anime)
        val placeholder = remember { ColorPainter(SurfaceElevated) }
        AsyncImage(
            model = ImageRequest.Builder(context)
                .data(imageUrl)
                .crossfade(false)
                .allowRgb565(true)
                .apply { if (imageUrl != null) memoryCacheKey(imageUrl).diskCacheKey(imageUrl) }
                .precision(Precision.INEXACT)
                .memoryCachePolicy(CachePolicy.ENABLED)
                .diskCachePolicy(CachePolicy.ENABLED)
                .listener(
                    onError = { _, result ->
                        Log.w("SpotlightImg", "load failed url=$imageUrl err=${result.throwable.message}")
                    }
                )
                .build(),
            contentDescription = anime.title,
            modifier = Modifier
                .fillMaxWidth()
                .height(SorakuSize.SpotlightPosterHeight)
                .graphicsLayer {
                    scaleX = 1.08f
                    scaleY = 1.08f
                },
            placeholder = placeholder,
            error = placeholder,
            fallback = placeholder,
            contentScale = ContentScale.Crop
        )

        // Cinematic bottom gradient for readable text.
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(SorakuSize.SpotlightPosterHeight)
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color.Transparent,
                            BackgroundSecondary.copy(alpha = 0.7f),
                            Background.copy(alpha = 0.95f)
                        ),
                        startY = 0.4f,
                        endY = 1f
                    )
                )
        )

        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .fillMaxWidth()
                .padding(SorakuPadding.screen)
                .padding(end = SorakuSpacing.xxl), // keep clear of the vertical dots
            verticalArrangement = Arrangement.spacedBy(SorakuSpacing.sm)
        ) {
            if (anime.format.isNotEmpty()) {
                val shape = SorakuShape.Chip
                Surface(
                    shape = shape,
                    color = PrimaryBlue.copy(alpha = 0.18f),
                    border = BorderStroke(1.dp, BorderSubtle),
                    modifier = Modifier.height(28.dp)
                ) {
                    Text(
                        text = anime.format,
                        style = BadgeStyle,
                        modifier = Modifier.padding(
                            horizontal = SorakuSpacing.sm,
                            vertical = SorakuSpacing.xs
                        )
                    )
                }
            }

            Text(
                text = anime.title,
                style = androidx.compose.ui.text.TextStyle(
                    fontSize = 22.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary,
                    lineHeight = 28.sp
                ),
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )

            Row(
                horizontalArrangement = Arrangement.spacedBy(SorakuSpacing.md),
                verticalAlignment = Alignment.CenterVertically
            ) {
                anime.averageScore?.let { score ->
                    Text(
                        text = "★ ${String.format("%.1f", score / 10.0)}",
                        style = RatingStyle
                    )
                }

                anime.episodes?.let { episodes ->
                    Text(
                        text = "$episodes EP",
                        style = EpisodeInfoStyle
                    )
                }

                if (anime.genres.isNotEmpty()) {
                    Text(
                        text = anime.genres.take(2).joinToString(" · "),
                        style = EpisodeInfoStyle,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            anime.description?.let { desc ->
                Text(
                    text = desc,
                    style = BodySmall,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    color = TextSecondary
                )
            }
        }
    }
}
