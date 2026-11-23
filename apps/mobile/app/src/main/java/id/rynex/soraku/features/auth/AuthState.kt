package id.rynex.soraku.features.auth

import id.rynex.soraku.core.common.UiState

data class AuthState(
    val isLoading: Boolean = false,
    val isAuthenticated: Boolean = false,
    val error: String? = null
)