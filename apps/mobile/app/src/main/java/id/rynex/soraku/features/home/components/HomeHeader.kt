package id.rynex.soraku.features.home.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.NotificationsActive
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import id.rynex.soraku.ui.theme.*

/**
 * Minimal Floating Glass Header.
 *
 * Layout:  [ Avatar ] ............... [ Notification ]
 * Center area deliberately left empty — no logo, no wordmark, no search.
 */
@Composable
fun HomeHeader(
    onProfileClick: () -> Unit,
    onNotificationClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val headerHeight = SorakuSize.HeaderHeight

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(headerHeight)
            .padding(horizontal = SorakuPadding.screen),
        contentAlignment = Alignment.Center
    ) {
        // Translucent glass surface spanning the full header width.
        // Low-opacity white border + restrained elevation — premium but lightweight.
        Surface(
            shape = SorakuShape.Card,
            color = SurfaceElevated.copy(alpha = 0.85f),
            tonalElevation = SorakuElevation.sm,
            shadowElevation = SorakuElevation.sm,
            modifier = Modifier
                .fillMaxWidth()
                .border(
                    width = 1.dp,
                    color = BorderSubtle.copy(alpha = 0.6f),
                    shape = SorakuShape.Card
                )
        ) {
            Box(modifier = Modifier.height(headerHeight))
        }

        // --- Left: Avatar ---
        AvatarButton(
            onClick = onProfileClick,
            modifier = Modifier.align(Alignment.CenterStart)
        )

        // --- Right: Notification ---
        NotificationButton(
            onClick = onNotificationClick,
            modifier = Modifier.align(Alignment.CenterEnd)
        )
    }
}

// ==========================================
// Avatar — circular, gradient border, initial fallback
// ==========================================
@Composable
private fun AvatarButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val size = SorakuSize.IconButtonSize
    Box(
        modifier = modifier
            .size(size)
            .shadow(
                elevation = SorakuElevation.sm,
                shape = CircleShape,
                spotColor = PrimaryBlue.copy(alpha = 0.35f)
            )
            .clip(CircleShape)
            .background(
                Brush.linearGradient(
                    colors = listOf(PrimaryBlue, SecondaryBlue)
                )
            )
            .border(width = 1.5.dp, color = Color.White.copy(alpha = 0.25f), shape = CircleShape)
            .clickable(
                interactionSource = null,
                indication = null,
                onClick = onClick
            ),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "R",
            style = androidx.compose.ui.text.TextStyle(
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
        )
    }
}

// ==========================================
// Notification — circular glass button, bell icon
// ==========================================
@Composable
private fun NotificationButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val size = SorakuSize.IconButtonSize
    Surface(
        shape = CircleShape,
        color = SurfaceElevated.copy(alpha = 0.85f),
        tonalElevation = SorakuElevation.sm,
        shadowElevation = SorakuElevation.sm,
        modifier = modifier
            .size(size)
            .border(
                width = 1.dp,
                color = BorderSubtle.copy(alpha = 0.6f),
                shape = CircleShape
            )
            .clickable(onClick = onClick)
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(
                imageVector = Icons.Outlined.NotificationsActive,
                contentDescription = "Notifications",
                tint = TextPrimary,
                modifier = Modifier.size(SorakuSize.IconSize)
            )
        }
    }
}