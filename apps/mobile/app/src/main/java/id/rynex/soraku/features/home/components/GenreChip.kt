package id.rynex.soraku.features.home.components

import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.clickable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.border
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import id.rynex.soraku.ui.theme.Border
import id.rynex.soraku.ui.theme.PrimaryBlue
import id.rynex.soraku.ui.theme.SorakuShape
import id.rynex.soraku.ui.theme.SorakuSize
import id.rynex.soraku.ui.theme.SorakuSpacing
import id.rynex.soraku.ui.theme.TextSecondary

@Composable
fun GenreChip(
    genre: String,
    selected: Boolean,
    onSelected: (Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    val containerColor = if (selected) PrimaryBlue.copy(alpha = 0.18f) else PrimaryBlue.copy(alpha = 0.06f)
    val borderColor = if (selected) PrimaryBlue else Border
    val textColor = if (selected) PrimaryBlue else TextSecondary
    val shape = SorakuShape.Chip

    Surface(
        shape = shape,
        color = containerColor,
        modifier = modifier
            .height(SorakuSize.ChipHeight)
            .border(width = 1.dp, color = borderColor, shape = shape)
            .clickable { onSelected(!selected) }
    ) {
        Text(
            text = genre,
            color = textColor,
            style = androidx.compose.ui.text.TextStyle(
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                color = textColor
            ),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.padding(
                horizontal = SorakuSpacing.md,
                vertical = SorakuSpacing.xs
            )
        )
    }
}