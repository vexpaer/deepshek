import { Capacitor, registerPlugin } from '@capacitor/core'

interface NativeVoice {
  start(options: { language: string }): Promise<{ text: string }>
  stop(): Promise<void>
  cancel(): Promise<void>
}
const VoiceInput = registerPlugin<NativeVoice>('VoiceInput')

interface Recognition {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

export function startVoice(language: string, onText: (text: string) => void, onEnd: () => void, onError: () => void) {
  let cancelled = false
  if (Capacitor.isNativePlatform()) {
    void VoiceInput.start({ language }).then(({ text }) => {
      if (!cancelled && text) onText(text)
    }).catch(() => { if (!cancelled) onError() }).finally(onEnd)
    return {
      stop: () => { void VoiceInput.stop().catch(onError) },
      cancel: () => { cancelled = true; void VoiceInput.cancel().catch(() => {}); onEnd() },
    }
  }
  const browser = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }
  const Constructor = browser.SpeechRecognition || browser.webkitSpeechRecognition
  if (!Constructor) { onError(); onEnd(); return null }
  const recognition = new Constructor()
  recognition.lang = language
  recognition.interimResults = true
  recognition.continuous = false
  recognition.onresult = ({ results }) => {
    if (!cancelled) onText(Array.from(results).map((result) => result[0]?.transcript || '').join(''))
  }
  recognition.onerror = () => { if (!cancelled) onError() }
  recognition.onend = onEnd
  try { recognition.start() } catch { onError(); onEnd(); return null }
  return { stop: () => recognition.stop(), cancel: () => { cancelled = true; recognition.abort(); onEnd() } }
}
