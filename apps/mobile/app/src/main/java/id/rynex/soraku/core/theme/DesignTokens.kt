package id.rynex.soraku.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

// --- Spacing Scale ---
object SorakuSpacing {
    val xs: Dp = 4.dp
    val sm: Dp = 8.dp
    val md: Dp = 12.dp
    val lg: Dp = 16.dp
    val xl: Dp = 20.dp
    val xxl: Dp = 24.dp
    val xxxl: Dp = 32.dp
    val section: Dp = 24.dp
}

// --- Corner Radius ---
object SorakuRadius {
    val sm: Dp = 8.dp
    val md: Dp = 12.dp
    val lg: Dp = 16.dp
    val pill: Dp = 20.dp
    val full: Dp = 999.dp
}

// --- Component Dimensions ---
object SorakuSize {
    // Anime cards
    val PosterWidth: Dp = 130.dp
    val PosterHeight: Dp = 186.dp
    val PosterRatio: Float = 1.43f
    val SpotlightPosterHeight: Dp = 260.dp

    // Header
    val HeaderHeight: Dp = 64.dp
    val IconSize: Dp = 24.dp
    val IconButtonSize: Dp = 48.dp
    val AvatarSize: Dp = 36.dp

    // Bottom navigation
    val BottomBarHeight: Dp = 64.dp
    val BottomBarIconSize: Dp = 24.dp
    val BottomBarTouchTarget: Dp = 48.dp
    val BottomBarWidth: Dp = 340.dp

    // Chips
    val ChipHeight: Dp = 36.dp
    val ChipMinWidth: Dp = 64.dp

    // Progress
    val ProgressHeight: Dp = 4.dp
}

// --- Shapes ---
object SorakuShape {
    val Card: Shape = RoundedCornerShape(SorakuRadius.md)
    val SpotlightCard: Shape = RoundedCornerShape(SorakuRadius.lg)
    val Poster: Shape = RoundedCornerShape(SorakuRadius.md)
    val Pill: Shape = RoundedCornerShape(SorakuRadius.pill)
    val Full: Shape = RoundedCornerShape(SorakuRadius.full)
    val Chip: Shape = RoundedCornerShape(SorakuRadius.pill)
    val BottomBar: Shape = RoundedCornerShape(SorakuRadius.lg)
}

// --- Elevation ---
object SorakuElevation {
    val none: Dp = 0.dp
    val sm: Dp = 2.dp
    val md: Dp = 4.dp
    val lg: Dp = 8.dp
    val xl: Dp = 16.dp
}

// --- Horizontal screen padding ---
object SorakuPadding {
    val screen: Dp = 16.dp
    val section: Dp = 16.dp
    val cardGap: Dp = 12.dp
    val sectionGap: Dp = 24.dp
}