package id.rynex.soraku.features.home.components

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import id.rynex.soraku.ui.theme.PrimaryBlue
import id.rynex.soraku.ui.theme.SecondaryBlue
import id.rynex.soraku.ui.theme.SorakuPadding
import id.rynex.soraku.ui.theme.SorakuShape
import id.rynex.soraku.ui.theme.SorakuSpacing
import id.rynex.soraku.ui.theme.SurfaceElevated
import id.rynex.soraku.ui.theme.TextPrimary
import id.rynex.soraku.ui.theme.TextSecondary

// TODO: ganti dengan URL sosial resmi Soraku
private const val FACEBOOK_URL = "https://facebook.com/soraku"
private const val TWITTER_URL = "https://x.com/soraku"
private const val REDDIT_URL = "https://reddit.com/r/soraku"
private const val SHARE_DOWNLOAD_URL = "https://play.google.com/store/apps/details?id=id.rynex.soraku"

private val FacebookBlue = Color(0xFF1877F2)
private val XBlack = Color(0xFF000000)
private val RedditOrange = Color(0xFFFF4500)

@Composable
fun SocialShareBar(modifier: Modifier = Modifier) {
    val context = LocalContext.current

    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = SorakuPadding.screen),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(SorakuSpacing.sm)
    ) {
        // Chibi placeholder — ganti dengan asset chibi Soraku nanti
        ChibiPlaceholder()

        // Teks "Follow & Share"
        Text(
            text = "Follow & Share",
            color = TextPrimary,
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f)
        )

        // Ikon sosial + share (brand colors, logo ganti nanti)
        Row(
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            BrandIconButton(
                label = "f",
                background = FacebookBlue,
                contentColor = Color.White,
                onClick = { openUrl(context, FACEBOOK_URL) }
            )
            BrandIconButton(
                label = "X",
                background = XBlack,
                contentColor = Color.White,
                borderColor = Color.White.copy(alpha = 0.25f),
                onClick = { openUrl(context, TWITTER_URL) }
            )
            BrandIconButton(
                label = "r",
                background = RedditOrange,
                contentColor = Color.White,
                onClick = { openUrl(context, REDDIT_URL) }
            )
            BrandIconButton(
                label = "↗",
                background = Brush.horizontalGradient(listOf(PrimaryBlue, SecondaryBlue)),
                contentColor = Color.White,
                onClick = { shareDownload(context) }
            )
        }
    }
}

@Composable
private fun ChibiPlaceholder() {
    Box(
        modifier = Modifier
            .size(36.dp)
            .clip(CircleShape)
            .background(
                Brush.linearGradient(listOf(PrimaryBlue, SecondaryBlue))
            )
            .border(1.dp, Color.White.copy(alpha = 0.2f), CircleShape),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "S",
            color = Color.White,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun BrandIconButton(
    label: String,
    background: Color,
    contentColor: Color,
    onClick: () -> Unit,
    borderColor: Color? = null
) {
    Box(
        modifier = Modifier
            .size(32.dp)
            .clip(CircleShape)
            .background(background)
            .then(
                if (borderColor != null) Modifier.border(1.dp, borderColor, CircleShape)
                else Modifier
            )
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            color = contentColor,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun BrandIconButton(
    label: String,
    background: Brush,
    contentColor: Color,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(32.dp)
            .clip(CircleShape)
            .background(background)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            color = contentColor,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

private fun openUrl(context: android.content.Context, url: String) {
    runCatching {
        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
    }
}

private fun shareDownload(context: android.content.Context) {
    runCatching {
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, "Download Soraku: $SHARE_DOWNLOAD_URL")
        }
        context.startActivity(Intent.createChooser(intent, "Share"))
    }
}