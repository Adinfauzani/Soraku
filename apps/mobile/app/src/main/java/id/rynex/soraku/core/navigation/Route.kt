package id.rynex.soraku.core.navigation

sealed class Route(val route: String) {
    data object Boot : Route("boot")
    data object Welcome : Route("welcome")
    data object Loading : Route("loading")
    data object Login : Route("login")
    data object Register : Route("register")
    data object Home : Route("home") {
        const val ARG_LOGIN_SUCCESS = "login_success"
        fun createRoute(loginSuccess: Boolean = false) = "home?loginSuccess=$loginSuccess"
    }
    data object Search : Route("search?filter={filter}") {
        const val ARG_FILTER = "filter"
        fun createRoute(filter: String = "") = "search?filter=$filter"
    }
    data object AnimeDetail : Route("anime_detail/{animeId}") {
        fun createRoute(animeId: String) = "anime_detail/$animeId"
    }
    data object Player : Route("player/{animeId}/{slug}/{episode}") {
        fun createRoute(animeId: String, slug: String, episode: Int) =
            "player/$animeId/$slug/$episode"
    }
    data object Library : Route("library")
    data object Schedule : Route("schedule")
    data object Watchlist : Route("watchlist")
    data object Favorites : Route("favorites")
    data object History : Route("history")
    data object Profile : Route("profile")
    data object Notifications : Route("notifications")
    data object Community : Route("community")
    data object Clips : Route("clips")
    data object Category : Route("category")
    data object AskAi : Route("ask_ai")
    data object Provider : Route("provider")
    data object Metadata : Route("metadata")
}