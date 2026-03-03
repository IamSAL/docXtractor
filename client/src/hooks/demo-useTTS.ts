import { useCallback, useRef, useState } from 'react'
import { HttpClient } from '@/lib/axios'

/**
 * Hook for text-to-speech playback via the TTS API.
 */
export function useTTS() {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const speak = useCallback(async (text: string, id: string) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    setPlayingId(id)

    try {
      const result = await HttpClient<{ audio: string; contentType: string }>('/demo/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voice: 'nova',
          model: 'tts-1',
          format: 'mp3',
        }),
      })

      // Convert base64 to audio and play
      const audioData = atob(result.audio)
      const bytes = new Uint8Array(audioData.length)
      for (let i = 0; i < audioData.length; i++) {
        bytes[i] = audioData.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: result.contentType })
      const url = URL.createObjectURL(blob)

      const audio = new Audio(url)
      audioRef.current = audio

      audio.onended = () => {
        URL.revokeObjectURL(url)
        setPlayingId(null)
        audioRef.current = null
      }

      audio.onerror = () => {
        URL.revokeObjectURL(url)
        setPlayingId(null)
        audioRef.current = null
      }

      await audio.play()
    } catch (error: any) {
      console.error('TTS error:', error)
      const errorMessage = error.response?.data?.error || error.message || 'TTS failed'
      console.error('TTS Detailed Error:', errorMessage)
      // We might want to expose this error to the UI, but existing code just consoles it.
      // Keeping consistent with existing behavior but improving logging.
      setPlayingId(null)
    }
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setPlayingId(null)
  }, [])

  return { playingId, speak, stop }
}
