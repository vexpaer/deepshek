import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Keyboard } from '@capacitor/keyboard'
import { Preferences } from '@capacitor/preferences'
import { StatusBar, Style } from '@capacitor/status-bar'

export const isNativePlatform = () => Capacitor.isNativePlatform()

export async function triggerHaptic(
  enabled: boolean,
  style: 'light' | 'medium' = 'light'
): Promise<void> {
  if (!enabled) return
  if (isNativePlatform()) {
    try {
      await Haptics.impact({
        style: style === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light,
      })
    } catch {
      // Ignore haptic errors on unsupported devices
    }
  } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(style === 'medium' ? 14 : 7)
    } catch {
      // Ignore
    }
  }
}

export async function syncStatusBarTheme(dark: boolean): Promise<void> {
  const metaTheme = document.querySelector('meta[name="theme-color"]')
  if (metaTheme) {
    metaTheme.setAttribute('content', dark ? '#151517' : '#ffffff')
  }
  if (!isNativePlatform()) return
  try {
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light })
    await StatusBar.setBackgroundColor({ color: dark ? '#151517' : '#ffffff' })
  } catch {
    // Ignore on web or unsupported OS versions
  }
}

export function initViewportAndKeyboard(): () => void {
  const updateHeight = () => {
    const vh = window.visualViewport?.height ?? window.innerHeight
    document.documentElement.style.setProperty('--app-viewport-height', `${vh}px`)
  }
  updateHeight()
  window.addEventListener('resize', updateHeight)
  window.visualViewport?.addEventListener('resize', updateHeight)

  let kbShowRemove: (() => void) | undefined
  let kbHideRemove: (() => void) | undefined
  if (isNativePlatform()) {
    void Keyboard.addListener('keyboardWillShow', () => {
      setTimeout(updateHeight, 40)
    }).then((h) => {
      kbShowRemove = () => void h.remove()
    })
    void Keyboard.addListener('keyboardWillHide', () => {
      setTimeout(updateHeight, 40)
    }).then((h) => {
      kbHideRemove = () => void h.remove()
    })
  }

  return () => {
    window.removeEventListener('resize', updateHeight)
    window.visualViewport?.removeEventListener('resize', updateHeight)
    kbShowRemove?.()
    kbHideRemove?.()
  }
}

export function registerAndroidBackButton(onBack: () => boolean): () => void {
  if (!isNativePlatform()) return () => {}
  let removeFn: (() => void) | undefined
  void CapApp.addListener('backButton', ({ canGoBack }) => {
    const handled = onBack()
    if (!handled) {
      if (canGoBack) {
        window.history.back()
      } else {
        void CapApp.minimizeApp()
      }
    }
  }).then((handle) => {
    removeFn = () => void handle.remove()
  })
  return () => {
    removeFn?.()
  }
}

export async function savePreference(key: string, value: string): Promise<void> {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Ignore localStorage quota errors
  }
  if (isNativePlatform()) {
    try {
      await Preferences.set({ key, value })
    } catch {
      // Ignore
    }
  }
}

export async function loadPreference(key: string): Promise<string | null> {
  if (isNativePlatform()) {
    try {
      const { value } = await Preferences.get({ key })
      if (value !== null) return value
    } catch {
      // Fallback to localStorage
    }
  }
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
