package id.rynex.soraku.features.anilist

import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.channels.ReceiveChannel

object AnilistCallbackBus {
    private val channel = Channel<String>()
    val codes: ReceiveChannel<String> = channel

    fun post(code: String) {
        channel.trySend(code)
    }
}