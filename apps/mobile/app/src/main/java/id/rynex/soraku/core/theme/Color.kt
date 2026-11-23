package id.rynex.soraku.ui.theme

import androidx.compose.ui.graphics.Color

// Legacy Material3 defaults — retained only for surfaces outside the Home Screen.
// Home Screen uses the Soraku design tokens defined below.

val Purple80 = Color(0xFFD0BCFF)
val PurpleGrey80 = Color(0xFFCCC2DC)
val Pink80 = Color(0xFFEFB8C8)

val Purple40 = Color(0xFF7C3AED)
val PurpleLight = Color(0xFFA855F7)
val PurpleGrey40 = Color(0xFF625b71)
val Pink40 = Color(0xFF7D5260)

// --- Soraku Design System Color Tokens ---

val Background = Color(0xFF080D18)
val BackgroundSecondary = Color(0xFF0D1422)
val Surface = Color(0xFF111827)
val SurfaceElevated = Color(0xFF172235)
val SurfaceHover = Color(0xFF1E2A3D)

val PrimaryBlue = Color(0xFF2583FF)
val SecondaryBlue = Color(0xFF5A9FFF)
val PrimaryBlueDim = Color(0xFF1A5FE0)
val BlueGlow = Color(0xFF2583FF).copy(alpha = 0.25f)

val Border = Color(0xFF26364F)
val BorderSubtle = Color(0xFF1E2A3D)

val TextPrimary = Color(0xFFF3F6FC)
val TextSecondary = Color(0xFF98A7BC)
val TextTertiary = Color(0xFF64748B)
val Muted = Color(0xFF64748B)

val Airing = Color(0xFF22C55E)
val Upcoming = Color(0xFF3B82F6)
val Finished = Color(0xFF6B7280)

// Kept for backward compatibility with screens outside Phase 3 scope.
val DarkBase = Color(0xFF0B0B0F)
val SurfaceLight = Color(0xFF1E1E28)
val NeonBlue = Color(0xFF60A5FA)