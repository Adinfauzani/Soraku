package id.rynex.soraku.features.auth

import androidx.lifecycle.viewModelScope
import id.rynex.soraku.core.common.BaseViewModel
import id.rynex.soraku.core.di.ServiceLocator
import id.rynex.soraku.data.remote.dto.AuthResponse
import id.rynex.soraku.domain.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch

class AuthViewModel : BaseViewModel<Unit>() {

    private val authRepository: AuthRepository = ServiceLocator.provideAuthRepository()

    private val _authState = MutableStateFlow(AuthState())
    val authState = _authState

    fun loginWithGoogle() {
        _authState.value = _authState.value.copy(isLoading = true, error = null)
        viewModelScope.launch {
            try {
                val result = authRepository.loginWithGoogle("google_code_here")
                if (result.isSuccess) {
                    _authState.value = _authState.value.copy(
                        isLoading = false,
                        isAuthenticated = true
                    )
                } else {
                    _authState.value = _authState.value.copy(
                        isLoading = false,
                        error = result.exceptionOrNull()?.message ?: "Google login failed"
                    )
                }
            } catch (e: Exception) {
                _authState.value = _authState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Google login failed"
                )
            }
        }
    }

    fun clearError() {
        _authState.value = _authState.value.copy(error = null)
    }
}