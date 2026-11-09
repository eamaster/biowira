import 'vue-router'
import type { BioWiraMusicTheme } from '@/domain/appAudio'

declare module 'vue-router' {
  interface RouteMeta {
    hideFooter?: boolean
    gameLayout?: boolean
    /**
     * BioWira background music theme for this route.
     * - 'calm-jungle'      → soft ambient music (learn/discover pages)
     * - 'adventure-jungle' → upbeat music (Explorer Rescue Run gameplay)
     * - 'none'             → silence
     * Omitting the field defaults to 'calm-jungle' in AppAudioController.
     */
    audioTheme?: BioWiraMusicTheme
  }
}

export {}
