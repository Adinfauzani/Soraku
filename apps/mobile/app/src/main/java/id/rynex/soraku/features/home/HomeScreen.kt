package id.rynex.soraku.features.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import id.rynex.soraku.R
import id.rynex.soraku.core.common.UiState
import id.rynex.soraku.features.home.components.AnimeGridSection
import id.rynex.soraku.features.home.components.ContinueWatchingSection
import id.rynex.soraku.features.home.components.SpotlightSection
import id.rynex.soraku.features.home.components.HomeContentTab
import id.rynex.soraku.features.home.components.HomeContentTabs
import id.rynex.soraku.features.home.components.HomeHeader
import id.rynex.soraku.features.home.components.SocialShareBar
import id.rynex.soraku.ui.theme.Background
import id.rynex.soraku.ui.theme.BodySmall
import id.rynex.soraku.ui.theme.PrimaryBlue
import id.rynex.soraku.ui.theme.SorakuPadding
import id.rynex.soraku.ui.theme.TextSecondary

@Composable
fun HomeScreen(
    onNavigateToSearch: () -> Unit,
    onNavigateToLibrary: () -> Unit,
    onNavigateToProfile: () -> Unit,
    onNavigateToDetail: (String) -> Unit,
    onSeeAllAiring: () -> Unit,
    onSeeAllMovies: () -> Unit,
    loginSuccess: Boolean = false,
    viewModel: HomeViewModel? = null
) {
    val vm = viewModel ?: remember { HomeViewModel() }
    val gridLimit by vm.gridDisplayLimit.collectAsStateWithLifecycle()
    var selectedTab by remember { mutableStateOf(HomeContentTab.Newest) }

    val spotlight by vm.spotlight.collectAsStateWithLifecycle()
    val continueWatching by vm.continueWatching.collectAsStateWithLifecycle()
    val airing by vm.airing.collectAsStateWithLifecycle()
    val trending by vm.trending.collectAsStateWithLifecycle()
    val popular by vm.popular.collectAsStateWithLifecycle()
    val topRated by vm.topRated.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) {
        vm.loadHomeData()
    }

    val states = listOf(spotlight, continueWatching, airing, trending, popular, topRated)
    val allLoading = states.all { it is UiState.Loading }
    val allFailed = states.all { it is UiState.Error }
    val hasMeaningfulContent = states.any { it is UiState.Success }

    // Full-screen loading only when no meaningful content is available yet.
    if (allLoading && !hasMeaningfulContent) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Background),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator(color = PrimaryBlue)
        }
        return
    }

    // If every primary section failed and nothing is displayable, show a recoverable error.
    if (allFailed && !hasMeaningfulContent) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Background),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(SorakuPadding.screen)
            ) {
                Text(
                    text = "Unable to load content",
                    color = TextSecondary,
                    style = BodySmall
                )
                Spacer(modifier = Modifier.height(SorakuPadding.cardGap))
                Button(onClick = { vm.loadHomeData() }) {
                    Text("Retry")
                }
            }
        }
        return
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Background),
        verticalArrangement = Arrangement.spacedBy(SorakuPadding.section)
    ) {
        item {
            HomeHeader(
                onProfileClick = onNavigateToProfile,
                onNotificationClick = { }
            )
        }

        item {
            SpotlightSection(
                items = spotlight,
                onAnimeClick = { anime -> onNavigateToDetail(anime.id) },
                onRetry = { vm.loadHomeData() }
            )
        }

        item {
            SocialShareBar()
        }

        item {
            ContinueWatchingSection(
                items = continueWatching,
                onAnimeClick = { item -> onNavigateToDetail(item.animeId) }
            )
        }

        item {
            HomeContentTabs(
                selected = selectedTab,
                onSelect = { selectedTab = it }
            )
        }

        item {
            val items = when (selectedTab) {
                HomeContentTab.Newest -> airing
                HomeContentTab.Trending -> trending
                HomeContentTab.Popular -> popular
            }
            AnimeGridSection(
                title = null,
                items = items,
                onAnimeClick = { anime -> onNavigateToDetail(anime.id) },
                displayLimit = gridLimit,
                onRetry = { vm.loadHomeData() }
            )
        }

        item {
            AnimeGridSection(
                title = stringResource(id = R.string.top_rated),
                items = topRated,
                onAnimeClick = { anime -> onNavigateToDetail(anime.id) },
                displayLimit = gridLimit,
                onRetry = { vm.loadHomeData() }
            )
        }

        item {
            Spacer(modifier = Modifier.height(120.dp))
        }
    }
}