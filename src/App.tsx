import React, { useEffect, useMemo, useRef } from 'react'
import clsx from 'clsx'
import { ChatInput } from './components/ChatInput'
import {
  DeepSeekWhaleLogo,
  IconChevronRight,
  IconKey,
  IconMenu,
  IconNewChat,
} from './components/Icons'
import { MessageStream } from './components/MessageStream'
import { NavigationDrawer } from './components/NavigationDrawer'
import { Overlays } from './components/Overlays'
import { SettingsView } from './components/SettingsView'
import { getDict } from './i18n'
import {
  initViewportAndKeyboard,
  registerAndroidBackButton,
  syncStatusBarTheme,
  triggerHaptic,
} from './services/native'
import { getActiveThread, useAppStore } from './store/useAppStore'
import styles from './App.module.css'

export function App() {
  const init = useAppStore((s) => s.init)
  const settings = useAppStore((s) => s.settings)
  const sessions = useAppStore((s) => s.sessions)
  const activeSessionId = useAppStore((s) => s.activeSessionId)
  const drawerOpen = useAppStore((s) => s.drawerOpen)
  const settingsOpen = useAppStore((s) => s.settingsOpen)
  const sourcesSheet = useAppStore((s) => s.sourcesSheet)
  const lightboxImageUrl = useAppStore((s) => s.lightboxImageUrl)
  const setDrawerOpen = useAppStore((s) => s.setDrawerOpen)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
  const setSourcesSheet = useAppStore((s) => s.setSourcesSheet)
  const setLightboxImageUrl = useAppStore((s) => s.setLightboxImageUrl)
  const newChat = useAppStore((s) => s.newChat)
  const sendUserMessage = useAppStore((s) => s.sendUserMessage)

  const dict = getDict(settings.locale)

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId),
    [sessions, activeSessionId]
  )
  const activeThread = useMemo(() => getActiveThread(activeSession), [activeSession])
  const hasConversation = Boolean(activeSession && activeThread.length > 0)
  const hasKey = Boolean(settings.apiKey.trim())

  const swipeStartRef = useRef<{ x: number; y: number } | null>(null)

  // Initialize persisted sessions/settings & viewport keyboard handling
  useEffect(() => {
    void init()
    const cleanupViewport = initViewportAndKeyboard()
    return () => {
      cleanupViewport()
    }
  }, [init])

  // Sync theme, font-size, and native Android StatusBar
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      const isDark =
        settings.theme === 'dark' || (settings.theme === 'system' && mq.matches)
      document.body.setAttribute('data-ds-dark-theme', isDark ? 'true' : 'false')
      document.body.setAttribute('data-font-size', settings.fontSize)
      document.documentElement.lang = settings.locale
      void syncStatusBarTheme(isDark)
    }
    applyTheme()
    mq.addEventListener('change', applyTheme)
    return () => mq.removeEventListener('change', applyTheme)
  }, [settings.theme, settings.fontSize, settings.locale])

  // Android hardware back button handling
  useEffect(() => {
    return registerAndroidBackButton(() => {
      if (lightboxImageUrl) {
        setLightboxImageUrl(null)
        return true
      }
      if (sourcesSheet) {
        setSourcesSheet(null)
        return true
      }
      if (settingsOpen) {
        setSettingsOpen(false)
        return true
      }
      if (drawerOpen) {
        setDrawerOpen(false)
        return true
      }
      return false
    })
  }, [
    lightboxImageUrl,
    sourcesSheet,
    settingsOpen,
    drawerOpen,
    setLightboxImageUrl,
    setSourcesSheet,
    setSettingsOpen,
    setDrawerOpen,
  ])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (drawerOpen || settingsOpen || sourcesSheet || lightboxImageUrl) return
    const touch = e.touches[0]
    if (touch && touch.clientX <= 36) {
      swipeStartRef.current = { x: touch.clientX, y: touch.clientY }
    } else {
      swipeStartRef.current = null
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = swipeStartRef.current
    swipeStartRef.current = null
    if (!start) return
    const touch = e.changedTouches[0]
    if (!touch) return
    const dx = touch.clientX - start.x
    const dy = Math.abs(touch.clientY - start.y)
    if (dx > 56 && dx > dy * 1.3) {
      void triggerHaptic(settings.hapticsEnabled, 'light')
      setDrawerOpen(true)
    }
  }

  const handleStarterClick = (prompt: string) => {
    void triggerHaptic(settings.hapticsEnabled, 'light')
    void sendUserMessage(prompt, [])
  }

  return (
    <div
      className={styles.shell}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <header className={styles.header}>
        <button
          type="button"
          className={styles.headerIconBtn}
          onClick={() => {
            void triggerHaptic(settings.hapticsEnabled, 'light')
            setDrawerOpen(true)
          }}
          aria-label="Open navigation menu"
        >
          <IconMenu size={22} />
        </button>

        <div className={styles.headerCenter}>
          {hasConversation ? (
            <span className={styles.headerTitle}>
              {activeSession?.title || dict.untitledChat}
            </span>
          ) : (
            <button
              type="button"
              className={styles.headerBrandPill}
              onClick={() => {
                void triggerHaptic(settings.hapticsEnabled, 'light')
                setSettingsOpen(true)
              }}
            >
              <span
                className={clsx(
                  styles.headerBrandDot,
                  !hasKey && styles.headerBrandDotDemo
                )}
              />
              <span>{hasKey ? settings.model : 'Demo'}</span>
            </button>
          )}
        </div>

        <button
          type="button"
          className={clsx(
            styles.headerIconBtn,
            !hasConversation && styles.headerIconBtnMuted
          )}
          onClick={() => {
            void triggerHaptic(settings.hapticsEnabled, 'light')
            newChat()
          }}
          aria-label={dict.newChat}
          title={dict.newChat}
        >
          <IconNewChat size={21} />
        </button>
      </header>

      <main className={styles.main}>
        {hasConversation && activeSession ? (
          <MessageStream session={activeSession} />
        ) : (
          <div className={styles.welcomeWrap}>
            <div className={styles.logoBadge}>
              <DeepSeekWhaleLogo size={48} />
            </div>
            <h1 className={styles.greeting}>{dict.greeting}</h1>
            <p className={styles.greetingSub}>{dict.greetingSub}</p>

            <div className={styles.starterGrid}>
              {dict.starterPrompts.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  className={styles.starterCard}
                  onClick={() => handleStarterClick(item.prompt)}
                >
                  <span className={styles.starterTitle}>{item.title}</span>
                  <span className={styles.starterDesc}>{item.prompt}</span>
                </button>
              ))}
            </div>

            {!hasKey ? (
              <button
                type="button"
                className={styles.apiBanner}
                onClick={() => {
                  void triggerHaptic(settings.hapticsEnabled, 'light')
                  setSettingsOpen(true)
                }}
              >
                <span className={styles.apiBannerIcon}>
                  <IconKey size={14} />
                </span>
                <span>{dict.apiBannerMissing}</span>
                <span className={styles.apiBannerArrow}>
                  <IconChevronRight size={13} />
                </span>
              </button>
            ) : null}
          </div>
        )}

        <div className={styles.bottomDock}>
          <ChatInput />
          <div className={styles.caveat}>{dict.contentCaveat}</div>
        </div>
      </main>

      <NavigationDrawer />
      <SettingsView />
      <Overlays />
    </div>
  )
}

export default App
