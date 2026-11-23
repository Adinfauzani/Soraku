package id.rynex.soraku.core.navigation

import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.composable
import id.rynex.soraku.core.security.TokenManager
import id.rynex.soraku.features.auth.GoogleSignInService
import id.rynex.soraku.features.auth.LoginScreen
import id.rynex.soraku.features.loading.LoadingScreen
import id.rynex.soraku.features.auth.RegisterScreen
import id.rynex.soraku.features.home.HomeScreen
import id.rynex.soraku.features.profile.ProfileScreen
import id.rynex.soraku.features.search.SearchScreen
import id.rynex.soraku.features.library.LibraryScreen
import id.rynex.soraku.features.welcome.WelcomeScreen
import id.rynex.soraku.features.detail.AnimeDetailScreen
import id.rynex.soraku.features.player.PlayerScreen
import id.rynex.soraku.features.splash.SplashScreen
import id.rynex.soraku.features.community.CommunityScreen
import id.rynex.soraku.features.notifications.NotificationsScreen
import id.rynex.soraku.features.history.HistoryScreen
import id.rynex.soraku.features.watchlist.WatchlistScreen
import id.rynex.soraku.features.favorites.FavoritesScreen
import id.rynex.soraku.features.clips.ClipsScreen
import id.rynex.soraku.features.category.CategoryScreen
import id.rynex.soraku.features.askai.AskAiScreen
import id.rynex.soraku.features.provider.ProviderScreen
import id.rynex.soraku.features.metadata.MetadataScreen
import id.rynex.soraku.features.schedule.ScheduleScreen

private val bottomBarRoutes = setOf(
    Route.Home.route,
    Route.Schedule.route,
    Route.Library.route,
    Route.History.route,
    Route.Profile.route
)

@Composable
fun NavGraph(
    navController: NavHostController,
    startDestination: String = Route.Boot.route,
    onLoginWithGoogle: () -> Unit = {}
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val showBottomBar = currentRoute in bottomBarRoutes

    Scaffold(
        contentWindowInsets = WindowInsets(0, 0, 0, 0)
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            NavHost(
                navController = navController,
                startDestination = startDestination,
                modifier = Modifier.fillMaxSize(),
                enterTransition = {
                    slideIntoContainer(
                        towards = AnimatedContentTransitionScope.SlideDirection.Start,
                        animationSpec = tween(300)
                    )
                },
                exitTransition = {
                    slideOutOfContainer(
                        towards = AnimatedContentTransitionScope.SlideDirection.Start,
                        animationSpec = tween(300)
                    )
                },
                popEnterTransition = {
                    slideIntoContainer(
                        towards = AnimatedContentTransitionScope.SlideDirection.End,
                        animationSpec = tween(300)
                    )
                },
                popExitTransition = {
                    slideOutOfContainer(
                        towards = AnimatedContentTransitionScope.SlideDirection.End,
                        animationSpec = tween(300)
                    )
                }
            ) {
            composable(Route.Boot.route) {
                SplashScreen(
                    onSplashComplete = { isLoggedIn ->
                        if (isLoggedIn) {
                            navController.navigate(Route.Home.route) {
                                popUpTo(Route.Boot.route) { inclusive = true }
                            }
                        } else {
                            navController.navigate(Route.Welcome.route) {
                                popUpTo(Route.Boot.route) { inclusive = true }
                            }
                        }
                    }
                )
            }
            composable(Route.Welcome.route) {
                WelcomeScreen(
                    onLoginWithGoogle = onLoginWithGoogle
                )
            }
            composable(Route.Loading.route) {
                LoadingScreen(
                    onSuccess = {
                        navController.navigate(Route.Home.createRoute(loginSuccess = true)) {
                            popUpTo(Route.Welcome.route) { inclusive = true }
                        }
                    },
                    onFailure = {
                        navController.navigate(Route.Welcome.route) {
                            popUpTo(Route.Loading.route) { inclusive = true }
                        }
                    }
                )
            }
            composable(Route.Login.route) {
                LoginScreen(
                    onLoginSuccess = {
                        navController.navigate(Route.Home.route) {
                            popUpTo(Route.Login.route) {
                                inclusive = true
                            }
                        }
                    },
                    onNavigateToRegister = { navController.navigate(Route.Register.route) },
                    onLoginWithGoogle = onLoginWithGoogle
                )
            }
            composable(Route.Register.route) {
                RegisterScreen(
                    onRegisterSuccess = {
                        navController.navigate(Route.Home.route) {
                            popUpTo(Route.Register.route) {
                                inclusive = true
                            }
                        }
                    },
                    onNavigateToLogin = { navController.popBackStack() },
                    onLoginWithGoogle = onLoginWithGoogle
                )
            }
            composable(
                route = Route.Home.route,
                arguments = listOf(
                    androidx.navigation.navArgument("loginSuccess") {
                        type = androidx.navigation.NavType.BoolType
                        defaultValue = false
                    }
                )
            ) { backStackEntry ->
                val loginSuccess = backStackEntry.arguments?.getBoolean("loginSuccess") ?: false
                HomeScreen(
                    onNavigateToSearch = { navController.navigate(Route.Search.createRoute()) },
                    onNavigateToLibrary = { navController.navigate(Route.Library.route) },
                    onNavigateToProfile = { navController.navigate(Route.Profile.route) },
                    onNavigateToDetail = { animeId -> navController.navigate(Route.AnimeDetail.createRoute(animeId)) },
                    onSeeAllAiring = { navController.navigate(Route.Search.createRoute("airing")) },
                    onSeeAllMovies = { navController.navigate(Route.Search.createRoute("movies")) },
                    loginSuccess = loginSuccess
                )
            }
            composable(
                route = Route.Search.route,
                arguments = listOf(
                    androidx.navigation.navArgument("filter") {
                        type = androidx.navigation.NavType.StringType
                        defaultValue = ""
                    }
                )
            ) { backStackEntry ->
                val filter = backStackEntry.arguments?.getString("filter") ?: ""
                SearchScreen(
                    onBack = { navController.popBackStack() },
                    onNavigateToDetail = { animeId -> navController.navigate(Route.AnimeDetail.createRoute(animeId)) },
                    initialFilter = filter
                )
            }
            composable(Route.Library.route) {
                LibraryScreen()
            }
            composable(Route.Schedule.route) {
                ScheduleScreen()
            }
            composable(Route.History.route) {
                HistoryScreen(onBack = { navController.popBackStack() })
            }
            composable(Route.Watchlist.route) {
                WatchlistScreen(onBack = { navController.popBackStack() })
            }
            composable(Route.Favorites.route) {
                FavoritesScreen(onBack = { navController.popBackStack() })
            }
            composable(Route.Clips.route) {
                ClipsScreen(onBack = { navController.popBackStack() })
            }
            composable(Route.Category.route) {
                CategoryScreen(onBack = { navController.popBackStack() })
            }
            composable(Route.AskAi.route) {
                AskAiScreen(onBack = { navController.popBackStack() })
            }
            composable(Route.Provider.route) {
                ProviderScreen(onBack = { navController.popBackStack() })
            }
            composable(Route.Metadata.route) {
                MetadataScreen(onBack = { navController.popBackStack() })
            }
            composable(Route.Profile.route) {
                val context = LocalContext.current
                ProfileScreen(onLogout = {
                    val tokenManager = TokenManager(context)
                    tokenManager.clearTokens()
                    GoogleSignInService.signOut(context)
                    navController.navigate(Route.Welcome.route) {
                        popUpTo(0) { inclusive = true }
                    }
                })
            }
            composable(Route.Community.route) {
                CommunityScreen(onBack = { navController.popBackStack() })
            }
            composable(Route.Notifications.route) {
                NotificationsScreen(onBack = { navController.popBackStack() })
            }
            composable(
                route = Route.AnimeDetail.route,
                arguments = listOf(androidx.navigation.navArgument("animeId") {
                    type = androidx.navigation.NavType.StringType
                })
            ) { backStackEntry ->
                val animeId = backStackEntry.arguments?.getString("animeId") ?: return@composable
                AnimeDetailScreen(
                    animeId = animeId,
                    onBack = { navController.popBackStack() },
                    onPlayEpisode = { episode ->
                        navController.navigate(Route.Player.createRoute(animeId, "slug", episode))
                    }
                )
            }
            composable(
                route = Route.Player.route,
                arguments = listOf(
                    androidx.navigation.navArgument("animeId") { type = androidx.navigation.NavType.StringType },
                    androidx.navigation.navArgument("slug") { type = androidx.navigation.NavType.StringType },
                    androidx.navigation.navArgument("episode") { type = androidx.navigation.NavType.IntType }
                )
            ) { backStackEntry ->
                val animeId = backStackEntry.arguments?.getString("animeId") ?: return@composable
                val slug = backStackEntry.arguments?.getString("slug") ?: return@composable
                val episode = backStackEntry.arguments?.getInt("episode") ?: 1
                PlayerScreen(
                    animeId = animeId,
                    slug = slug,
                    episodeNumber = episode,
                    onBack = { navController.popBackStack() }
                )
                }
            }

            if (showBottomBar) {
                SorakuBottomBar(
                    currentRoute = currentRoute,
                    onNavigate = { route ->
                        navController.navigate(route) {
                            popUpTo(Route.Home.route) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                    modifier = Modifier.align(Alignment.BottomCenter)
                )
            }
        }
    }
}