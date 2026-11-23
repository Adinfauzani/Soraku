package id.rynex.soraku.ui.theme

import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val SorakuTypography = androidx.compose.material3.Typography(
    // Screen + section headings
    titleLarge = androidx.compose.ui.text.TextStyle(
        fontSize = 22.sp,
        fontWeight = FontWeight.SemiBold,
        color = TextPrimary,
        lineHeight = 28.sp
    ),
    titleMedium = androidx.compose.ui.text.TextStyle(
        fontSize = 18.sp,
        fontWeight = FontWeight.SemiBold,
        color = TextPrimary,
        lineHeight = 24.sp
    ),
    titleSmall = androidx.compose.ui.text.TextStyle(
        fontSize = 16.sp,
        fontWeight = FontWeight.SemiBold,
        color = TextPrimary,
        lineHeight = 22.sp
    ),
    // Body
    bodyLarge = androidx.compose.ui.text.TextStyle(
        fontSize = 15.sp,
        fontWeight = FontWeight.Normal,
        color = TextSecondary,
        lineHeight = 22.sp
    ),
    bodyMedium = androidx.compose.ui.text.TextStyle(
        fontSize = 14.sp,
        fontWeight = FontWeight.Normal,
        color = TextSecondary,
        lineHeight = 20.sp
    ),
    bodySmall = androidx.compose.ui.text.TextStyle(
        fontSize = 12.sp,
        fontWeight = FontWeight.Normal,
        color = TextSecondary,
        lineHeight = 18.sp
    ),
    // Labels / metadata
    labelLarge = androidx.compose.ui.text.TextStyle(
        fontSize = 13.sp,
        fontWeight = FontWeight.Medium,
        color = TextSecondary
    ),
    labelMedium = androidx.compose.ui.text.TextStyle(
        fontSize = 12.sp,
        fontWeight = FontWeight.Medium,
        color = TextSecondary
    ),
    labelSmall = androidx.compose.ui.text.TextStyle(
        fontSize = 11.sp,
        fontWeight = FontWeight.Medium,
        color = TextTertiary
    )
)

// Semantic heading styles used directly by Home Screen composables.
val ScreenTitleStyle = androidx.compose.ui.text.TextStyle(
    fontSize = 28.sp,
    fontWeight = FontWeight.SemiBold,
    color = TextPrimary,
    lineHeight = 34.sp
)

val SectionHeaderStyle = androidx.compose.ui.text.TextStyle(
    fontSize = 18.sp,
    fontWeight = FontWeight.SemiBold,
    color = TextPrimary,
    lineHeight = 24.sp
)

val AnimeTitleStyle = androidx.compose.ui.text.TextStyle(
    fontSize = 13.sp,
    fontWeight = FontWeight.Medium,
    color = TextPrimary,
    lineHeight = 17.sp
)

val AnimeMetaStyle = androidx.compose.ui.text.TextStyle(
    fontSize = 11.sp,
    fontWeight = FontWeight.Normal,
    color = TextSecondary,
    lineHeight = 15.sp
)

val EpisodeInfoStyle = androidx.compose.ui.text.TextStyle(
    fontSize = 11.sp,
    fontWeight = FontWeight.Normal,
    color = TextSecondary,
    lineHeight = 15.sp
)

val RatingStyle = androidx.compose.ui.text.TextStyle(
    fontSize = 11.sp,
    fontWeight = FontWeight.SemiBold,
    color = PrimaryBlue,
    lineHeight = 15.sp
)

val BadgeStyle = androidx.compose.ui.text.TextStyle(
    fontSize = 10.sp,
    fontWeight = FontWeight.SemiBold,
    color = TextPrimary,
    lineHeight = 13.sp
)

val BodySmall = androidx.compose.ui.text.TextStyle(
    fontSize = 12.sp,
    fontWeight = FontWeight.Normal,
    color = TextSecondary,
    lineHeight = 18.sp
)

val ButtonLabelStyle = androidx.compose.ui.text.TextStyle(
    fontSize = 13.sp,
    fontWeight = FontWeight.SemiBold,
    color = TextPrimary,
    lineHeight = 18.sp
)