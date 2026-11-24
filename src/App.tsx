import React, { useEffect, useMemo, useRef } from 'react'
import { ChatInput } from './components/ChatInput'
import { DeepSeekWhaleLogo, IconMenu, IconNewChat } from './components/Icons'
import { MessageStream } from './components/MessageStream'
import { NavigationDrawer } from './components/NavigationDrawer'
import { Overlays } from './components/Overlays'
import { SettingsView } from './components/SettingsView'
import { dismissTopLayer, useBackLayer } from './hooks/useBackLayer'
import { getDict } from './i18n'
import { initViewportAndKeyboard, registerAndroidBackButton, syncStatusBarTheme, triggerHaptic } from './services/native'
import { getActiveThread, useAppStore } from './store/useAppStore'
import styles from './App.module.css'

export function App() {
  const init = useAppStore((s) => s.init)
  const settings = useAppStore((s) => s.settings)
  const sessions = useAppStore((s) => s.sessions)
  const activeSessionId = useAppStore((s) => s.activeSessionId)
  const composerKey = useAppStore((s) => s.composerKey)
  const drawerOpen = useAppStore((s) => s.drawerOpen)
  const settingsOpen = useAppStore((s) => s.settingsOpen)
  const sourcesSheet = useAppStore((s) => s.sourcesSheet)
  const lightboxImageUrl = useAppStore((s) => s.lightboxImageUrl)
  const setDrawerOpen = useAppStore((s) => s.setDrawerOpen)
  const setSourcesSheet = useAppStore((s) => s.setSourcesSheet)
  const setLightboxImageUrl = useAppStore((s) => s.setLightboxImageUrl)
  const newChat = useAppStore((s) => s.newChat)
  const dict = getDict(settings.locale)
  const activeSession = useMemo(() => sessions.find((s) => s.id === activeSessionId), [sessions, activeSessionId])
  const hasConversation = getActiveThread(activeSession).length > 0
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null)

  useBackLayer(Boolean(lightboxImageUrl), () => setLightboxImageUrl(null), 120)
  useBackLayer(Boolean(sourcesSheet), () => setSourcesSheet(null), 110)

  useEffect(() => {
    void init()
    return initViewportAndKeyboard()
  }, [init])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && mq.matches)
      document.body.setAttribute('data-ds-dark-theme', String(dark))
      document.body.dataset.ui = settings.uiStyle
      document.body.setAttribute('data-font-size', settings.fontSize)
      document.documentElement.lang = settings.locale
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
      void syncStatusBarTheme(dark, settingsOpen)
    }
    applyTheme()
    mq.addEventListener('change', applyTheme)
    return () => mq.removeEventListener('change', applyTheme)
  }, [settings.uiStyle, settings.theme, settings.fontSize, settings.locale, settingsOpen])

  useEffect(() => {
    const remove = registerAndroidBackButton(dismissTopLayer)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissTopLayer()) event.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => { remove(); window.removeEventListener('keydown', onKey) }
  }, [])

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0]
    swipeStartRef.current = !drawerOpen && !settingsOpen && !sourcesSheet && !lightboxImageUrl && touch?.clientX <= 28
      ? { x: touch.clientX, y: touch.clientY } : null
  }
  const handleTouchEnd = (event: React.TouchEvent) => {
    const start = swipeStartRef.current
    const touch = event.changedTouches[0]
    swipeStartRef.current = null
    if (start && touch && touch.clientX - start.x > 64 && Math.abs(touch.clientY - start.y) < 56) {
      void triggerHaptic(settings.hapticsEnabled)
      setDrawerOpen(true)
    }
  }

  return (
    <div className={styles.shell} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className={styles.chatSurface} aria-hidden={drawerOpen || settingsOpen || Boolean(sourcesSheet) || Boolean(lightboxImageUrl)}>
        <header className={styles.header}>
          <button type="button" className={styles.headerIconBtn} aria-label={settings.locale === 'en-US' ? 'Open menu' : '打开侧边栏'} onClick={() => setDrawerOpen(true)}>
            <IconMenu size={24} />
          </button>
          <h1 className={styles.headerTitle}>{hasConversation ? activeSession?.title : dict.untitledChat}</h1>
          <button type="button" className={styles.headerIconBtn} aria-label={dict.newChat} onClick={newChat}>
            <IconNewChat size={24} />
          </button>
        </header>
        <main className={styles.main}>
          {hasConversation && activeSession ? <MessageStream session={activeSession} /> : (
            <div className={styles.welcomeWrap}>
              <DeepSeekWhaleLogo size={52} className={styles.welcomeLogo} />
              <p className={styles.greeting}>{dict.greeting}</p>
            </div>
          )}
          <div className={styles.bottomDock}>
            <ChatInput key={composerKey} />
          </div>
        </main>
      </div>
      <NavigationDrawer />
      {settingsOpen && <SettingsView />}
      <Overlays />
    </div>
  )
}
export default App
