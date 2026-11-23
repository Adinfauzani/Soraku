package id.rynex.soraku.features.home.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.painter.ColorPainter
import coil.compose.AsyncImage
import coil.request.CachePolicy
import coil.request.ImageRequest
import coil.size.Precision
import androidx.compose.ui.platform.LocalContext
import id.rynex.soraku.domain.model.Anime
import id.rynex.soraku.ui.theme.SorakuShape
import id.rynex.soraku.ui.theme.SorakuSpacing
import id.rynex.soraku.ui.theme.Surface
import id.rynex.soraku.ui.theme.SurfaceElevated
import id.rynex.soraku.ui.theme.TextPrimary
import id.rynex.soraku.ui.theme.TextSecondary

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AnimeGridCard(
    anime: Anime,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        // Poster with floating score overlay
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(3f / 4f)
                .clip(SorakuShape.Poster)
                .background(SurfaceElevated)
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
                modifier = Modifier.matchParentSize(),
                placeholder = placeholder,
                error = placeholder,
                fallback = placeholder,
                contentScale = ContentScale.Crop
            )

            anime.averageScore?.let { score ->
                if (score > 0) {
                    ScoreOverlay(
                        score = score,
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(6.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(SorakuSpacing.sm))

        // Status dot + title
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(statusColor(anime.status))
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = anime.title,
                color = TextPrimary,
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(6.dp))

        // Metadata chips: format, year (CC/MIC hidden - not provided by API)
        val chips = buildList {
            if (anime.format.isNotBlank()) add(anime.format)
            anime.seasonYear?.let { add(it.toString()) }
        }
        if (chips.isNotEmpty()) {
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                chips.forEach { label ->
                    MetaChip(label = label)
                }
            }
        }
    }
}

@Composable
private fun ScoreOverlay(score: Int, modifier: Modifier = Modifier) {
    // averageScore is 0-100 (AniList scale, mapped from rating*10); display as 0.0-10.0
    val text = String.format("%.1f", score / 10.0)
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xCC111827))
            .padding(horizontal = 6.dp, vertical = 3.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Rounded.Star,
            contentDescription = null,
            tint = Color(0xFFF5C518),
            modifier = Modifier.size(11.dp)
        )
        Spacer(modifier = Modifier.width(3.dp))
        Text(
            text = text,
            color = TextPrimary,
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            maxLines = 1
        )
    }
}

@Composable
private fun MetaChip(label: String) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(Surface.copy(alpha = 0.9f))
            .padding(horizontal = 6.dp, vertical = 3.dp)
    ) {
        Text(
            text = label,
            color = TextSecondary,
            fontSize = 10.sp,
            fontWeight = FontWeight.Medium,
            maxLines = 1
        )
    }
}

private fun statusColor(status: String): Color {
    return when (status.uppercase()) {
        "RELEASING", "ONGOING", "CURRENTLY_AIRING" -> Color(0xFF22C55E) // green
        "NOT_YET_RELEASED", "UPCOMING" -> Color(0xFFEAB308) // yellow
        "FINISHED", "COMPLETED" -> Color(0xFFEF4444) // red
        "HIATUS" -> Color(0xFF6B7280) // muted gray
        else -> Color(0xFF9CA3AF) // neutral gray (unknown/cancelled/etc.)
    }
}