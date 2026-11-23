package id.rynex.soraku.features.detail

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.asPaddingValues
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.Bookmark
import androidx.compose.material.icons.rounded.BookmarkBorder
import androidx.compose.material.icons.rounded.MoreVert
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Share
import androidx.compose.material.icons.rounded.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.ScrollableTabRow
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
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
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import coil.request.CachePolicy
import coil.request.ImageRequest
import coil.size.Precision
import id.rynex.soraku.core.common.UiState
import id.rynex.soraku.domain.model.Anime
import id.rynex.soraku.domain.model.Character
import id.rynex.soraku.domain.model.EpisodeInfo
import id.rynex.soraku.domain.model.MediaRelation
import id.rynex.soraku.ui.theme.*

@Composable
fun AnimeDetailScreen(
    animeId: String,
    onBack: () -> Unit,
    onPlayEpisode: (Int) -> Unit
) {
    val viewModel: AnimeDetailViewModel = viewModel(
        key = animeId,
        factory = AnimeDetailViewModel.factory(animeId)
    )
    val detailState by viewModel.detail.collectAsStateWithLifecycle()
    val charactersState by viewModel.characters.collectAsStateWithLifecycle()
    val relationsState by viewModel.relations.collectAsStateWithLifecycle()
    val episodesState by viewModel.episodes.collectAsStateWithLifecycle()
    val selectedTab by viewModel.selectedTab.collectAsStateWithLifecycle()
    val synopsisExpanded by viewModel.isSynopsisExpanded.collectAsStateWithLifecycle()
    val isBookmarked by viewModel.isBookmarked.collectAsStateWithLifecycle()
    val continueEpisode by viewModel.continueEpisode.collectAsStateWithLifecycle()

    val context = LocalContext.current

    when (val state = detailState) {
        is UiState.Loading -> DetailLoading(onBack = onBack)
        is UiState.Error -> DetailError(
            message = state.message,
            onBack = onBack,
            onRetry = { viewModel.loadAll() }
        )
        is UiState.Success -> {
            val anime = state.data
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Background)
            ) {
                item {
                    DetailHeroSection(
                        anime = anime,
                        onBack = onBack,
                        onShare = {
                            val intent = Intent(Intent.ACTION_SEND).apply {
                                type = "text/plain"
                                putExtra(Intent.EXTRA_TEXT, "Check out ${anime.title}")
                            }
                            runCatching { context.startActivity(Intent.createChooser(intent, "Share")) }
                        }
                    )
                }
                item {
                    DetailInfoBlock(
                        anime = anime,
                        synopsisExpanded = synopsisExpanded,
                        onToggleSynopsis = { viewModel.toggleSynopsis() }
                    )
                }
                item {
                    DetailActions(
                        anime = anime,
                        episodes = episodesState,
                        continueEpisode = continueEpisode,
                        isBookmarked = isBookmarked,
                        canBookmark = viewModel.canBookmark(),
                        onWatchNow = { ep -> onPlayEpisode(ep) },
                        onToggleBookmark = { viewModel.toggleBookmark() }
                    )
                }
                item {
                    DetailTabs(
                        selected = selectedTab,
                        onSelect = { viewModel.selectTab(it) }
                    )
                }
                item {
                    when (selectedTab) {
                        DetailTab.OVERVIEW -> OverviewTab(anime = anime)
                        DetailTab.CHARACTERS -> CharactersTab(
                            state = charactersState,
                            onRetry = { viewModel.loadCharacters() }
                        )
                        DetailTab.ARTWORK -> ArtworkTab(
                            anime = anime
                        )
                        DetailTab.EPISODES -> EpisodesTab(
                            state = episodesState,
                            onRetry = { viewModel.loadEpisodes() },
                            onPlay = { ep -> onPlayEpisode(ep) }
                        )
                    }
                }
                item {
                    TrailerSection(anime = anime)
                }
                item {
                    AdditionalInfoSection(anime = anime)
                }
                item {
                    RelatedSection(
                        state = relationsState,
                        onRetry = { viewModel.loadRelations() },
                        onOpen = { /* handled via nav in parent if needed */ }
                    )
                }
                item { Spacer(modifier = Modifier.height(24.dp)) }
            }
        }
    }
}

@Composable
private fun DetailLoading(onBack: () -> Unit) {
    Box(modifier = Modifier.fillMaxSize().background(Background)) {
        Column(modifier = Modifier.fillMaxWidth()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(210.dp)
                    .background(SurfaceElevated)
            )
            Column(modifier = Modifier.padding(horizontal = SorakuPadding.screen)) {
                Spacer(modifier = Modifier.height(100.dp))
                Box(modifier = Modifier.height(22.dp).fillMaxWidth(0.7f).clip(RoundedCornerShape(6.dp)).background(SurfaceElevated))
                Spacer(modifier = Modifier.height(8.dp))
                Box(modifier = Modifier.height(14.dp).fillMaxWidth(0.5f).clip(RoundedCornerShape(6.dp)).background(SurfaceElevated))
            }
        }
        TopNavOverlay(onBack = onBack, onShare = {})
        CircularProgressIndicator(
            color = PrimaryBlue,
            modifier = Modifier.align(Alignment.Center)
        )
    }
}

@Composable
private fun DetailError(message: String, onBack: () -> Unit, onRetry: () -> Unit) {
    Box(modifier = Modifier.fillMaxSize().background(Background)) {
        TopNavOverlay(onBack = onBack, onShare = {})
        Column(
            modifier = Modifier.align(Alignment.Center).padding(SorakuPadding.screen),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(text = message, color = TextSecondary, style = BodySmall)
            Spacer(modifier = Modifier.height(12.dp))
            Button(onClick = onRetry, colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)) {
                Text("Retry", color = TextPrimary)
            }
        }
    }
}

@Composable
private fun DetailHeroSection(
    anime: Anime,
    onBack: () -> Unit,
    onShare: () -> Unit
) {
    val statusBar = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
    BoxWithConstraints(modifier = Modifier.fillMaxWidth()) {
        val heroHeight = maxWidth * 0.54f
        val clampedHero = heroHeight.coerceIn(190.dp, 220.dp)
        val posterWidth = maxWidth * 0.34f
        val clampedPosterWidth = posterWidth.coerceIn(120.dp, 150.dp)
        val posterHeight = clampedPosterWidth / 0.75f
        val overlap = posterHeight * 0.35f

        Box(modifier = Modifier.fillMaxWidth()) {
            // Backdrop
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(clampedHero)
            ) {
                val backdrop = anime.bannerImage?.takeIf { it.isNotBlank() }
                    ?: anime.coverImage?.takeIf { it.isNotBlank() }
                if (backdrop != null) {
                    DetailImage(
                        url = backdrop,
                        contentDescription = anime.title,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Box(modifier = Modifier.fillMaxSize().background(SurfaceElevated))
                }
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                0f to Color.Transparent,
                                0.55f to Background.copy(alpha = 0.25f),
                                1f to Background.copy(alpha = 0.95f)
                            )
                        )
                )
            }

            TopNavOverlay(
                onBack = onBack,
                onShare = onShare,
                modifier = Modifier.padding(top = statusBar)
            )

            // Spacer to position info block start below backdrop minus overlap
            Column(modifier = Modifier.fillMaxWidth()) {
                Spacer(modifier = Modifier.height(clampedHero - overlap))
                DetailPosterAndInfo(
                    anime = anime,
                    posterWidth = clampedPosterWidth,
                    posterHeight = posterHeight,
                    heroHeight = clampedHero,
                    overlap = overlap
                )
            }
        }
    }
}

@Composable
private fun TopNavOverlay(onBack: () -> Unit, onShare: () -> Unit, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(
            onClick = onBack,
            modifier = Modifier
                .size(40.dp)
                .background(Color.Black.copy(alpha = 0.35f), CircleShape)
        ) {
            Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back", tint = TextPrimary)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            IconButton(
                onClick = onShare,
                modifier = Modifier.size(40.dp).background(Color.Black.copy(alpha = 0.35f), CircleShape)
            ) {
                Icon(Icons.Rounded.Share, contentDescription = "Share", tint = TextPrimary)
            }
            IconButton(
                onClick = {},
                modifier = Modifier.size(40.dp).background(Color.Black.copy(alpha = 0.35f), CircleShape)
            ) {
                Icon(Icons.Rounded.MoreVert, contentDescription = "More", tint = TextPrimary)
            }
        }
    }
}

@Composable
private fun DetailPosterAndInfo(
    anime: Anime,
    posterWidth: Dp,
    posterHeight: Dp,
    heroHeight: Dp,
    overlap: Dp
) {
    // This composable is placed starting at (heroHeight - overlap); overlap area is reserved above by caller.
    // Poster drawn with negative offset to overlap hero.
    var synopsisExpanded by remember { mutableStateOf(false) }
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = SorakuPadding.screen),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.Top
    ) {
        // Poster overlapping upward
        Box(
            modifier = Modifier
                .offset(y = -overlap)
                .width(posterWidth)
                .height(posterHeight)
                .clip(SorakuShape.Poster)
                .background(SurfaceElevated)
                .border(1.dp, Border, SorakuShape.Poster)
        ) {
            val poster = anime.coverImage?.takeIf { it.isNotBlank() }
                ?: anime.bannerImage?.takeIf { it.isNotBlank() }
            if (poster != null) {
                DetailImage(
                    url = poster,
                    contentDescription = anime.title,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            }
        }

        // Info beside poster
        Column(
            modifier = Modifier
                .weight(1f)
                .padding(top = 8.dp)
        ) {
            Text(
                text = anime.title,
                style = SectionHeaderStyle,
                color = TextPrimary,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis
            )
            val alt = anime.titleEnglish?.takeIf { it.isNotBlank() && it != anime.title }
                ?: anime.titleRomaji.takeIf { it.isNotBlank() && it != anime.title }
            if (!alt.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = alt,
                    style = BodySmall,
                    color = TextSecondary,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }

            Spacer(modifier = Modifier.height(8.dp))
            MetadataRow(anime = anime)

            val desc = anime.description?.takeIf { it.isNotBlank() }
            if (!desc.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(10.dp))
                Text(text = "Synopsis", style = AnimeTitleStyle, color = TextPrimary)
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = desc,
                    style = BodySmall,
                    color = TextSecondary,
                    maxLines = if (synopsisExpanded) Int.MAX_VALUE else 4,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.animateContentSize()
                )
                Text(
                    text = if (synopsisExpanded) "Show less" else "Read more",
                    color = PrimaryBlue,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier
                        .padding(top = 4.dp)
                        .clickable { synopsisExpanded = !synopsisExpanded }
                )
            }
        }
    }
}

@Composable
private fun MetadataRow(anime: Anime) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        anime.averageScore?.let { score ->
            if (score > 0) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Rounded.Star, contentDescription = null, tint = Color(0xFFF5C518), modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(text = String.format("%.1f", score / 10.0), color = Color(0xFFF5C518), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }
        val chips = buildList {
            anime.status.takeIf { it.isNotBlank() }?.let { add(formatStatus(it)) }
            anime.format.takeIf { it.isNotBlank() }?.let { add(it) }
            anime.seasonYear?.let { add(it.toString()) }
            anime.season.takeIf { it.isNotBlank() }?.let { add(it.replaceFirstChar { c -> c.uppercase() }) }
        }
        if (chips.isNotEmpty()) {
            Text(
                text = chips.joinToString(" • "),
                style = AnimeMetaStyle,
                color = TextSecondary,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

private fun formatStatus(status: String): String = when (status.uppercase()) {
    "RELEASING", "CURRENTLY_AIRING", "ONGOING" -> "Airing"
    "NOT_YET_RELEASED", "UPCOMING" -> "Upcoming"
    "FINISHED", "COMPLETED" -> "Completed"
    else -> status.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }
}

@Composable
private fun DetailInfoBlock(
    anime: Anime,
    synopsisExpanded: Boolean,
    onToggleSynopsis: () -> Unit
) {
    // Poster+info+synopsis handled inside hero composition; nothing extra needed here.
    Spacer(modifier = Modifier.height(4.dp))
}

@Composable
private fun DetailActions(
    anime: Anime,
    episodes: UiState<List<EpisodeInfo>>,
    continueEpisode: Int?,
    isBookmarked: Boolean,
    canBookmark: Boolean,
    onWatchNow: (Int) -> Unit,
    onToggleBookmark: () -> Unit
) {
    val eps = (episodes as? UiState.Success)?.data.orEmpty().sortedBy { it.number }
    val targetEp = continueEpisode ?: eps.firstOrNull()?.number ?: 1
    val hasEpisodes = eps.isNotEmpty() || (anime.episodes ?: 0) > 0

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = SorakuPadding.screen, vertical = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Button(
            onClick = { if (hasEpisodes) onWatchNow(targetEp) },
            enabled = hasEpisodes,
            modifier = Modifier.weight(1f).height(48.dp),
            colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue, disabledContainerColor = SurfaceElevated),
            shape = RoundedCornerShape(12.dp)
        ) {
            Icon(Icons.Rounded.PlayArrow, contentDescription = null, tint = Color.White)
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = if (continueEpisode != null) "Continue EP $continueEpisode" else "Watch Now",
                color = Color.White,
                fontWeight = FontWeight.SemiBold
            )
        }
        OutlinedButton(
            onClick = { if (canBookmark) onToggleBookmark() },
            enabled = canBookmark,
            modifier = Modifier.size(48.dp),
            shape = RoundedCornerShape(12.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Border),
            contentPadding = PaddingValues(0.dp)
        ) {
            Icon(
                imageVector = if (isBookmarked) Icons.Rounded.Bookmark else Icons.Rounded.BookmarkBorder,
                contentDescription = "Bookmark",
                tint = if (isBookmarked) PrimaryBlue else TextSecondary
            )
        }
    }
}

@Composable
private fun DetailTabs(selected: DetailTab, onSelect: (DetailTab) -> Unit) {
    ScrollableTabRow(
        selectedTabIndex = DetailTab.entries.indexOf(selected),
        containerColor = BackgroundSecondary,
        contentColor = TextPrimary,
        edgePadding = SorakuPadding.screen,
        indicator = {},
        divider = {}
    ) {
        DetailTab.entries.forEach { tab ->
            val isSelected = tab == selected
            Tab(
                selected = isSelected,
                onClick = { onSelect(tab) },
                text = {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = tab.label,
                            color = if (isSelected) PrimaryBlue else TextSecondary,
                            fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Medium
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Box(
                            modifier = Modifier
                                .height(2.dp)
                                .width(if (isSelected) 24.dp else 0.dp)
                                .background(if (isSelected) PrimaryBlue else Color.Transparent, RoundedCornerShape(1.dp))
                        )
                    }
                }
            )
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun OverviewTab(anime: Anime) {
    Column(modifier = Modifier.fillMaxWidth().padding(SorakuPadding.screen), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        val desc = anime.description?.takeIf { it.isNotBlank() }
        if (desc != null) {
            SectionTitle("Synopsis")
            Text(text = desc, style = BodySmall, color = TextSecondary)
        }
        if (anime.genres.isNotEmpty()) {
            SectionTitle("Genres")
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                anime.genres.forEach { g ->
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(16.dp))
                            .background(SurfaceElevated)
                            .border(1.dp, Border, RoundedCornerShape(16.dp))
                            .padding(horizontal = 10.dp, vertical = 6.dp)
                    ) { Text(g, color = TextSecondary, fontSize = 12.sp) }
                }
            }
        }
        InfoPairs(
            listOfNotNull(
                anime.studios.takeIf { it.isNotEmpty() }?.let { "Studio" to it.joinToString(", ") },
                anime.season.takeIf { it.isNotBlank() }?.let { "Season" to it.replaceFirstChar { c -> c.uppercase() } },
                anime.seasonYear?.let { "Year" to it.toString() },
                anime.source?.takeIf { it.isNotBlank() }?.let { "Source" to it.replace("_", " ") },
                anime.status.takeIf { it.isNotBlank() }?.let { "Status" to formatStatus(it) },
                anime.format.takeIf { it.isNotBlank() }?.let { "Format" to it }
            )
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun CharactersTab(state: UiState<List<Character>>, onRetry: () -> Unit) {
    when (state) {
        is UiState.Loading -> SectionLoading()
        is UiState.Error -> SectionError(state.message, onRetry)
        is UiState.Success -> {
            if (state.data.isEmpty()) {
                SectionEmpty("Characters not available")
            } else {
                Column(modifier = Modifier.padding(SorakuPadding.screen), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    state.data.take(30).chunked(2).forEach { rowItems ->
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                            rowItems.forEach { ch ->
                                CharacterCard(ch, modifier = Modifier.weight(1f))
                            }
                            if (rowItems.size == 1) Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun CharacterCard(ch: Character, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(Surface)
            .border(1.dp, Border, RoundedCornerShape(12.dp))
            .padding(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(modifier = Modifier.size(48.dp).clip(RoundedCornerShape(8.dp)).background(SurfaceElevated)) {
            if (!ch.image.isNullOrBlank()) {
                DetailImage(url = ch.image, contentDescription = ch.name, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
            }
        }
        Spacer(modifier = Modifier.width(8.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(ch.name, color = TextPrimary, fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            if (ch.role.isNotBlank()) Text(ch.role, color = TextSecondary, fontSize = 11.sp, maxLines = 1)
        }
    }
}

@Composable
private fun ArtworkTab(anime: Anime) {
    val arts = buildList {
        anime.bannerImage?.takeIf { it.isNotBlank() }?.let { add(it) }
        anime.coverImage?.takeIf { it.isNotBlank() }?.let { add(it) }
    }.distinct()
    if (arts.isEmpty()) {
        SectionEmpty("Artwork not available")
    } else {
        Column(modifier = Modifier.padding(SorakuPadding.screen), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            arts.chunked(2).forEach { rowItems ->
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                    rowItems.forEach { url ->
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .aspectRatio(if (rowItems.size == 1 && url == anime.bannerImage) 16f / 9f else 3f / 4f)
                                .clip(RoundedCornerShape(12.dp))
                                .background(SurfaceElevated)
                        ) {
                            DetailImage(url = url, contentDescription = anime.title, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                        }
                    }
                    if (rowItems.size == 1) Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun EpisodesTab(state: UiState<List<EpisodeInfo>>, onRetry: () -> Unit, onPlay: (Int) -> Unit) {
    when (state) {
        is UiState.Loading -> SectionLoading()
        is UiState.Error -> SectionError(state.message, onRetry)
        is UiState.Success -> {
            if (state.data.isEmpty()) {
                SectionEmpty("Episodes not available")
            } else {
                Column(modifier = Modifier.padding(SorakuPadding.screen), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    state.data.sortedBy { it.number }.forEach { ep ->
                        EpisodeRow(ep = ep, onClick = { onPlay(ep.number) })
                    }
                }
            }
        }
    }
}

@Composable
private fun EpisodeRow(ep: EpisodeInfo, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Surface)
            .border(1.dp, Border, RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(modifier = Modifier.size(width = 72.dp, height = 44.dp).clip(RoundedCornerShape(8.dp)).background(SurfaceElevated), contentAlignment = Alignment.Center) {
            val thumb = ep.thumbnail?.takeIf { it.isNotBlank() }
            if (thumb != null) {
                DetailImage(url = thumb, contentDescription = ep.title, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
            } else {
                Icon(Icons.Rounded.PlayArrow, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(18.dp))
            }
        }
        Spacer(modifier = Modifier.width(10.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text("Episode ${ep.number}", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            Text(ep.title, color = TextSecondary, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        Icon(Icons.Rounded.PlayArrow, contentDescription = null, tint = PrimaryBlue)
    }
}

@Composable
private fun TrailerSection(anime: Anime) {
    val trailer = anime.trailer?.takeIf { it.isNotBlank() } ?: return
    val context = LocalContext.current
    val watchUrl = if (trailer.startsWith("http")) trailer else "https://www.youtube.com/watch?v=$trailer"
    val thumb = "https://img.youtube.com/vi/${trailer.removePrefix("https://www.youtube.com/watch?v=").substringBefore('&')}/hqdefault.jpg"
    Column(modifier = Modifier.fillMaxWidth().padding(SorakuPadding.screen)) {
        SectionTitle("Trailer")
        Spacer(modifier = Modifier.height(8.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(16f / 9f)
                .clip(RoundedCornerShape(12.dp))
                .background(SurfaceElevated)
                .clickable { runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(watchUrl))) } },
            contentAlignment = Alignment.Center
        ) {
            DetailImage(url = thumb, contentDescription = "Trailer", modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
            Box(modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.25f)))
            Box(modifier = Modifier.size(52.dp).background(PrimaryBlue, CircleShape), contentAlignment = Alignment.Center) {
                Icon(Icons.Rounded.PlayArrow, contentDescription = "Play trailer", tint = Color.White)
            }
        }
    }
}

@Composable
private fun AdditionalInfoSection(anime: Anime) {
    val pairs = listOfNotNull(
        anime.episodes?.let { "Episodes" to it.toString() },
        anime.duration?.let { "Duration" to "$it min" },
        anime.status.takeIf { it.isNotBlank() }?.let { "Status" to formatStatus(it) },
        anime.format.takeIf { it.isNotBlank() }?.let { "Format" to it },
        anime.season.takeIf { it.isNotBlank() }?.let { "Season" to it.replaceFirstChar { c -> c.uppercase() } },
        anime.seasonYear?.let { "Year" to it.toString() },
        anime.countryOfOrigin?.takeIf { it.isNotBlank() }?.let { "Country" to it },
        anime.studios.takeIf { it.isNotEmpty() }?.let { "Studio" to it.joinToString(", ") },
        anime.source?.takeIf { it.isNotBlank() }?.let { "Source" to it.replace("_", " ") }
    )
    if (pairs.isEmpty()) return
    Column(modifier = Modifier.fillMaxWidth().padding(SorakuPadding.screen)) {
        SectionTitle("Information")
        Spacer(modifier = Modifier.height(8.dp))
        InfoPairs(pairs)
    }
}

@Composable
private fun RelatedSection(state: UiState<List<MediaRelation>>, onRetry: () -> Unit, onOpen: (Int) -> Unit) {
    when (state) {
        is UiState.Loading -> { /* silent while loading */ }
        is UiState.Error -> SectionError(state.message, onRetry)
        is UiState.Success -> {
            if (state.data.isEmpty()) return
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "Related Anime",
                    style = SectionHeaderStyle,
                    color = TextPrimary,
                    modifier = Modifier.padding(horizontal = SorakuPadding.screen, vertical = 8.dp)
                )
                LazyRow(
                    contentPadding = PaddingValues(horizontal = SorakuPadding.screen),
                    horizontalArrangement = Arrangement.spacedBy(SorakuPadding.cardGap)
                ) {
                    items(state.data.distinctBy { it.id }, key = { it.id }) { rel ->
                        Column(modifier = Modifier.width(120.dp)) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .aspectRatio(3f / 4f)
                                    .clip(SorakuShape.Poster)
                                    .background(SurfaceElevated)
                            ) {
                                if (!rel.coverImage.isNullOrBlank()) {
                                    DetailImage(url = rel.coverImage, contentDescription = rel.title, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                                }
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(rel.title, color = TextPrimary, fontSize = 12.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                            if (rel.relationType.isNotBlank()) {
                                Text(rel.relationType.replace("_", " "), color = TextSecondary, fontSize = 11.sp, maxLines = 1)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun InfoPairs(pairs: List<Pair<String, String>>) {
    if (pairs.isEmpty()) return
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        pairs.forEach { (k, v) ->
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(k, color = TextSecondary, fontSize = 13.sp, modifier = Modifier.width(100.dp))
                Text(v, color = TextPrimary, fontSize = 13.sp, modifier = Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun SectionTitle(text: String) {
    Text(text = text, style = AnimeTitleStyle, color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
}

@Composable private fun SectionLoading() {
    Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = PrimaryBlue, modifier = Modifier.size(24.dp))
    }
}
@Composable private fun SectionError(message: String, onRetry: () -> Unit) {
    Column(modifier = Modifier.fillMaxWidth().padding(SorakuPadding.screen), horizontalAlignment = Alignment.CenterHorizontally) {
        Text(message, color = TextSecondary, style = BodySmall)
        Spacer(modifier = Modifier.height(8.dp))
        Button(onClick = onRetry, colors = ButtonDefaults.buttonColors(containerColor = PrimaryBlue)) { Text("Retry", color = TextPrimary) }
    }
}
@Composable private fun SectionEmpty(message: String) {
    Text(message, color = TextSecondary, style = BodySmall, modifier = Modifier.padding(SorakuPadding.screen))
}

@Composable
private fun DetailImage(url: String, contentDescription: String?, modifier: Modifier = Modifier, contentScale: ContentScale = ContentScale.Crop) {
    val context = LocalContext.current
    val placeholder = remember { ColorPainter(SurfaceElevated) }
    AsyncImage(
        model = ImageRequest.Builder(context)
            .data(url)
            .crossfade(false)
            .allowRgb565(true)
            .memoryCacheKey(url)
            .diskCacheKey(url)
            .precision(Precision.INEXACT)
            .memoryCachePolicy(CachePolicy.ENABLED)
            .diskCachePolicy(CachePolicy.ENABLED)
            .build(),
        contentDescription = contentDescription,
        modifier = modifier,
        placeholder = placeholder,
        error = placeholder,
        fallback = placeholder,
        contentScale = contentScale
    )
}
