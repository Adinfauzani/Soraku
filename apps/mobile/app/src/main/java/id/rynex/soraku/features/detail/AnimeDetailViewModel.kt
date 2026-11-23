package id.rynex.soraku.features.detail

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import id.rynex.soraku.core.common.UiState
import id.rynex.soraku.core.di.ServiceLocator
import id.rynex.soraku.domain.model.Anime
import id.rynex.soraku.domain.model.Character
import id.rynex.soraku.domain.model.EpisodeInfo
import id.rynex.soraku.domain.model.MediaRelation
import id.rynex.soraku.domain.repository.AnimeRepository
import id.rynex.soraku.domain.repository.LibraryRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class DetailTab(val label: String) {
    OVERVIEW("Overview"),
    CHARACTERS("Characters"),
    ARTWORK("Artwork"),
    EPISODES("Episodes")
}

class AnimeDetailViewModel(
    private val animeId: String,
    private val animeRepository: AnimeRepository = ServiceLocator.provideAnimeRepository(),
    private val libraryRepository: LibraryRepository = ServiceLocator.provideLibraryRepository()
) : ViewModel() {

    private val _detail = MutableStateFlow<UiState<Anime>>(UiState.Loading)
    val detail: StateFlow<UiState<Anime>> = _detail.asStateFlow()

    private val _characters = MutableStateFlow<UiState<List<Character>>>(UiState.Loading)
    val characters: StateFlow<UiState<List<Character>>> = _characters.asStateFlow()

    private val _relations = MutableStateFlow<UiState<List<MediaRelation>>>(UiState.Loading)
    val relations: StateFlow<UiState<List<MediaRelation>>> = _relations.asStateFlow()

    private val _episodes = MutableStateFlow<UiState<List<EpisodeInfo>>>(UiState.Loading)
    val episodes: StateFlow<UiState<List<EpisodeInfo>>> = _episodes.asStateFlow()

    private val _selectedTab = MutableStateFlow(DetailTab.OVERVIEW)
    val selectedTab: StateFlow<DetailTab> = _selectedTab.asStateFlow()

    private val _isSynopsisExpanded = MutableStateFlow(false)
    val isSynopsisExpanded: StateFlow<Boolean> = _isSynopsisExpanded.asStateFlow()

    private val _isBookmarked = MutableStateFlow(false)
    val isBookmarked: StateFlow<Boolean> = _isBookmarked.asStateFlow()

    private val _isBookmarkBusy = MutableStateFlow(false)
    val isBookmarkBusy: StateFlow<Boolean> = _isBookmarkBusy.asStateFlow()

    private val _continueEpisode = MutableStateFlow<Int?>(null)
    val continueEpisode: StateFlow<Int?> = _continueEpisode.asStateFlow()

    init {
        loadAll()
    }

    fun loadAll() {
        loadDetail()
        loadCharacters()
        loadRelations()
        loadEpisodes()
        loadBookmarkState()
    }

    fun loadDetail() {
        viewModelScope.launch {
            _detail.value = UiState.Loading
            _detail.value = animeRepository.getAnimeDetail(animeId).fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Failed to load detail") }
            )
        }
    }

    fun loadCharacters() {
        viewModelScope.launch {
            _characters.value = UiState.Loading
            _characters.value = animeRepository.getCharacters(animeId).fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Failed to load characters") }
            )
        }
    }

    fun loadRelations() {
        viewModelScope.launch {
            _relations.value = UiState.Loading
            _relations.value = animeRepository.getRelations(animeId).fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Failed to load related anime") }
            )
        }
    }

    fun loadEpisodes() {
        viewModelScope.launch {
            _episodes.value = UiState.Loading
            _episodes.value = animeRepository.getEpisodes(animeId).fold(
                onSuccess = { UiState.Success(it) },
                onFailure = { UiState.Error(it.message ?: "Failed to load episodes") }
            )
        }
    }

    fun loadBookmarkState() {
        viewModelScope.launch {
            if (!libraryRepository.hasValidToken()) {
                _isBookmarked.value = false
                _continueEpisode.value = null
                return@launch
            }
            val favorites = libraryRepository.getFavorites().getOrNull().orEmpty()
            val watchlist = libraryRepository.getWatchlist().getOrNull().orEmpty()
            _isBookmarked.value = favorites.any { it.animeId == animeId } || watchlist.any { it.animeId == animeId }
            val cont = libraryRepository.getContinueWatching().getOrNull().orEmpty()
            _continueEpisode.value = cont.firstOrNull { it.animeId == animeId }?.episode
        }
    }

    fun selectTab(tab: DetailTab) {
        _selectedTab.value = tab
    }

    fun toggleSynopsis() {
        _isSynopsisExpanded.value = !_isSynopsisExpanded.value
    }

    fun toggleBookmark() {
        if (_isBookmarkBusy.value || !libraryRepository.hasValidToken()) return
        viewModelScope.launch {
            _isBookmarkBusy.value = true
            try {
                val result = if (_isBookmarked.value) {
                    val r1 = libraryRepository.removeFavorite(animeId)
                    val r2 = libraryRepository.removeFromWatchlist(animeId)
                    if (r1.isSuccess || r2.isSuccess) Result.success(Unit) else r1
                } else {
                    val r = libraryRepository.addFavorite(animeId)
                    if (r.isSuccess) r else libraryRepository.addToWatchlist(animeId)
                }
                if (result.isSuccess) {
                    _isBookmarked.value = !_isBookmarked.value
                }
            } finally {
                _isBookmarkBusy.value = false
            }
        }
    }

    fun canBookmark(): Boolean = libraryRepository.hasValidToken()

    companion object {
        fun factory(animeId: String): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return AnimeDetailViewModel(animeId) as T
                }
            }
    }
}
