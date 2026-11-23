package id.rynex.soraku.features.home.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import id.rynex.soraku.ui.theme.PrimaryBlue
import id.rynex.soraku.ui.theme.SorakuPadding
import id.rynex.soraku.ui.theme.SorakuRadius
import id.rynex.soraku.ui.theme.SorakuSpacing
import id.rynex.soraku.ui.theme.SurfaceElevated
import id.rynex.soraku.ui.theme.TextPrimary
import id.rynex.soraku.ui.theme.TextSecondary

enum class HomeContentTab(val label: String) {
    Newest("Newest"),
    Trending("Trending"),
    Popular("Popular")
}

@Composable
fun HomeContentTabs(
    selected: HomeContentTab,
    onSelect: (HomeContentTab) -> Unit,
    modifier: Modifier = Modifier
) {
    val shape = RoundedCornerShape(SorakuRadius.pill)

    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = SorakuPadding.screen)
    ) {
        Row(
            modifier = Modifier
                .height(40.dp)
                .clip(shape)
                .background(SurfaceElevated.copy(alpha = 0.85f))
                .border(1.dp, Color.White.copy(alpha = 0.08f), shape)
                .padding(4.dp),
            horizontalArrangement = Arrangement.spacedBy(SorakuSpacing.xs),
            verticalAlignment = Alignment.CenterVertically
        ) {
            HomeContentTab.entries.forEach { tab ->
                val isSelected = tab == selected
                Box(
                    modifier = Modifier
                        .height(32.dp)
                        .clip(shape)
                        .background(if (isSelected) PrimaryBlue else Color.Transparent)
                        .clickable { onSelect(tab) }
                        .padding(horizontal = 16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = tab.label,
                        color = if (isSelected) TextPrimary else TextSecondary,
                        fontSize = 13.sp,
                        fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Medium,
                        maxLines = 1
                    )
                }
            }
        }
    }
}