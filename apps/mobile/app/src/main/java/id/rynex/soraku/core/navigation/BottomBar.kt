package id.rynex.soraku.core.navigation

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentWidth
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Bookmark
import androidx.compose.material.icons.outlined.CalendarToday
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.ripple.rememberRipple
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import id.rynex.soraku.ui.theme.*

// ==========================================
// 1. SORAKU COLOR TOKENS
// ==========================================
object SorakuNavDefaults {
    val GlassSurface = Color(0xE6172235)       // Dark Navy ~90% opacity (lebih jelas)
    val GlassBorder = Color(0x5598A7BC)        // Subtle blue-gray border (lebih terang)
    val PrimaryBlue = Color(0xFF2583FF)        // Electric Blue Active
    val PrimaryBlueBright = Color(0xFF5A9FFF)  // Secondary Blue (gradient)
    val InactiveIcon = Color(0xFF98A7BC)       // Muted Blue-gray
    val ActiveIcon = Color(0xFFF3F6FC)         // Near-white Primary
    val ActiveCapsuleGlow = Color(0x992583FF)  // 60% glow (lebih terang)

    val PillHeight = 56.dp
    val ItemWidth = 56.dp
    val ItemGap = 4.dp
    val CapsuleHeight = 42.dp
    val CapsuleWidth = 54.dp                   // Elongated capsule (52dp - 56dp)
    val SectionShape = RoundedCornerShape(28.dp) // Sedikit lonjong
    val CapsuleShape = RoundedCornerShape(22.dp) // Sedikit lonjong
}

// ==========================================
// 2. DESTINATION ENUM
// ==========================================
enum class SorakuNavDestination(
    val route: String,
    val title: String,
    val icon: ImageVector
) {
    BERANDA(Route.Home.route, "Beranda", Icons.Outlined.Home),
    SCHEDULE(Route.Schedule.route, "Schedule", Icons.Outlined.CalendarToday),
    BOOKMARK(Route.Library.route, "Bookmark", Icons.Outlined.Bookmark),
    HISTORY(Route.History.route, "History", Icons.Outlined.History),
    PROFILE(Route.Profile.route, "Profile", Icons.Outlined.Person)
}

// ==========================================
// 3. MAIN COMPOSABLE: FLOATING GLASS PILL
// ==========================================
@Composable
fun SorakuFloatingBottomNavigation(
    currentRoute: String,
    onNavigate: (SorakuNavDestination) -> Unit,
    modifier: Modifier = Modifier,
    activeCapsuleWidth: Dp = SorakuNavDefaults.CapsuleWidth
) {
val destinations = SorakuNavDestination.values()
    val selectedIndex = destinations.indexOfFirst { it.route == currentRoute }.coerceAtLeast(0)

    // Offset dihitung dalam DP (sama satuan dengan Modifier.offset) agar konsisten
    // pada semua density (HP user beresolusi 3-4x → Animatable+toPx()+dp berbeda 3-4x).
    val itemWidth = SorakuNavDefaults.ItemWidth.value
    val capsuleWidth = activeCapsuleWidth.value
    val gap = SorakuNavDefaults.ItemGap.value
    val count = destinations.size

    // Target posisi kiri capsule agar berada di tengah item terpilih
    val target = selectedIndex * (itemWidth + gap) + (itemWidth - capsuleWidth) / 2f
    // Capsule di-center dalam Box, jadi offset awal = (rowWidth - capsuleWidth) / 2
    val rowWidth = count * itemWidth + (count - 1) * gap
    val initialOffset = (rowWidth - capsuleWidth) / 2f
    val offsetX by animateDpAsState(
        targetValue = (target - initialOffset).dp,
        animationSpec = tween(durationMillis = 260),
        label = "navCapsuleOffset"
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .navigationBarsPadding() // Menghormati gesture bar Android
            .padding(bottom = 20.dp), // Sedikit di atas
        contentAlignment = Alignment.Center
    ) {
        // --- Floating Glass Container ---
        Box(
            modifier = Modifier
                .wrapContentWidth()
                .shadow(
                    elevation = 16.dp,
                    shape = SorakuNavDefaults.SectionShape,
                    spotColor = Color.Black.copy(alpha = 0.5f),
                    ambientColor = Color.Black.copy(alpha = 0.3f)
                )
                .clip(SorakuNavDefaults.SectionShape)
                .background(SorakuNavDefaults.GlassSurface)
                .border(
                    width = 1.dp,
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            Color.White.copy(alpha = 0.20f),
                            SorakuNavDefaults.GlassBorder.copy(alpha = 0.10f)
                        )
                    ),
                    shape = SorakuNavDefaults.SectionShape
                )
                .padding(horizontal = 6.dp, vertical = 6.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                // --- Active capsule (di tengah item terpilih) ---
                Box(
                    modifier = Modifier
                        .offset(x = offsetX)
                        .width(activeCapsuleWidth)
                        .height(SorakuNavDefaults.CapsuleHeight)
                        .clip(SorakuNavDefaults.CapsuleShape)
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(
                                    SorakuNavDefaults.PrimaryBlue,
                                    SorakuNavDefaults.PrimaryBlueBright
                                )
                            )
                        )
                        .border(
                            width = 1.dp,
                            color = Color.White.copy(alpha = 0.35f),
                            shape = SorakuNavDefaults.CapsuleShape
                        )
                )

                Row(
                    modifier = Modifier
                        .wrapContentWidth()
                        .height(SorakuNavDefaults.PillHeight),
                    horizontalArrangement = Arrangement.spacedBy(SorakuNavDefaults.ItemGap),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    destinations.forEach { destination ->
                        val isSelected = destinations.indexOfFirst { it.route == currentRoute } ==
                            destinations.indexOf(destination)

                        SorakuNavItem(
                            destination = destination,
                            isSelected = isSelected,
                            onClick = { onNavigate(destination) }
                        )
                    }
                }
            }
        }
    }
}

// ==========================================
// 4. INDIVIDUAL ITEM (icon only, no background)
// ==========================================
@Composable
private fun SorakuNavItem(
    destination: SorakuNavDestination,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }

    val iconTint by remember {
        androidx.compose.runtime.derivedStateOf {
            if (isSelected) SorakuNavDefaults.ActiveIcon else SorakuNavDefaults.InactiveIcon
        }
    }

    Box(
        modifier = Modifier
            .size(width = SorakuNavDefaults.ItemWidth, height = SorakuNavDefaults.PillHeight)
            .clickable(
                interactionSource = interactionSource,
                indication = rememberRipple(bounded = true, color = SorakuNavDefaults.PrimaryBlue),
                role = Role.Tab,
                onClick = onClick
            )
            .semantics {
                this.contentDescription = destination.title
                this.selected = isSelected
            },
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = destination.icon,
            contentDescription = null,
            tint = iconTint,
            modifier = Modifier.size(22.dp)
        )
    }
}

// ==========================================
// 5. WRAPPER — dipanggil NavGraph
// ==========================================
@Composable
fun SorakuBottomBar(
    currentRoute: String?,
    onNavigate: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    SorakuFloatingBottomNavigation(
        currentRoute = currentRoute ?: "",
        onNavigate = { dest -> onNavigate(dest.route) },
        modifier = modifier
    )
}