import { create } from 'zustand'
import type {
  AppSettings,
  ChatAttachment,
  ChatMessage,
  ChatSession,
  SearchSource,
} from '../types/chat'
import { streamAssistantResponse, uploadFileToDeepSeek } from '../services/deepseekApi'
import { triggerHaptic } from '../services/native'
import {
  clearAllSessionsStorage,
  deleteSessionById,
  hydrateSettings,
  importSessionsFromZip,
  loadAllSessions,
  loadSettingsSync,
  persistSettings,
  saveSession,
} from '../services/storage'

export interface ToastMessage {
  id: number
  text: string
  type: 'info' | 'success' | 'error'
}

export interface SourcesSheetState {
  title: string
  sources: SearchSource[]
}

export interface SiblingInfo {
  index: number
  total: number
  siblings: ChatMessage[]
}

function makeId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function getActiveThread(session: ChatSession | undefined): ChatMessage[] {
  if (!session) return []
  const result: ChatMessage[] = []
  let parentKey = 'root'
  const visited = new Set<string>()
  while (true) {
    let nextId = session.activeBranch[parentKey]
    if (!nextId || !session.messages[nextId]) {
      const candidates = Object.values(session.messages)
        .filter((m) => (m.parentId ?? 'root') === parentKey)
        .sort((a, b) => a.createdAt - b.createdAt)
      if (candidates.length === 0) break
      nextId = candidates[candidates.length - 1].id
    }
    if (visited.has(nextId)) break
    visited.add(nextId)
    const msg = session.messages[nextId]
    if (!msg) break
    result.push(msg)
    parentKey = msg.id
  }
  return result
}

export function getSiblingInfo(session: ChatSession, message: ChatMessage): SiblingInfo {
  const parentKey = message.parentId ?? 'root'
  const siblings = Object.values(session.messages)
    .filter((m) => (m.parentId ?? 'root') === parentKey)
    .sort((a, b) => a.createdAt - b.createdAt)
  const index = Math.max(
    0,
    siblings.findIndex((m) => m.id === message.id)
  )
  return { index, total: siblings.length, siblings }
}

interface AppState {
  initialized: boolean
  settings: AppSettings
  sessions: ChatSession[]
  activeSessionId: string | null
  deepThink: boolean
  webSearch: boolean
  streamingSessionId: string | null
  abortController: AbortController | null
  drawerOpen: boolean
  settingsOpen: boolean
  sourcesSheet: SourcesSheetState | null
  lightboxImageUrl: string | null
  toast: ToastMessage | null

  init: () => Promise<void>
  updateSettings: (patch: Partial<AppSettings>) => void
  setDeepThink: (value: boolean) => void
  setWebSearch: (value: boolean) => void
  setDrawerOpen: (open: boolean) => void
  setSettingsOpen: (open: boolean) => void
  setSourcesSheet: (sheet: SourcesSheetState | null) => void
  setLightboxImageUrl: (url: string | null) => void
  showToast: (text: string, type?: ToastMessage['type']) => void

  newChat: () => void
  selectSession: (id: string) => void
  renameSession: (id: string, title: string) => void
  togglePinSession: (id: string) => void
  deleteSession: (id: string) => Promise<void>
  clearAllSessions: () => Promise<void>
  importZip: (file: File) => Promise<number>

  sendUserMessage: (text: string, attachments: ChatAttachment[]) => Promise<void>
  editUserMessage: (sessionId: string, userMessageId: string, newText: string) => Promise<void>
  regenerateAssistantMessage: (sessionId: string, assistantMessageId: string) => Promise<void>
  switchBranch: (sessionId: string, parentId: string | null, childId: string) => void
  setFeedback: (
    sessionId: string,
    assistantMessageId: string,
    feedback: 'like' | 'dislike' | null
  ) => void
  stopStreaming: () => void
}

let toastTimer: ReturnType<typeof setTimeout> | null = null

export const useAppStore = create<AppState>((set, get) => {
  const runGeneration = async (
    sessionId: string,
    userMessageId: string,
    deepThink: boolean,
    webSearch: boolean
  ) => {
    const prevAbort = get().abortController
    if (prevAbort) prevAbort.abort()

    const controller = new AbortController()
    const assistantId = makeId('ast')
    const assistantMsg: ChatMessage = {
      id: assistantId,
      parentId: userMessageId,
      role: 'assistant',
      createdAt: Date.now(),
      modelUsed: get().settings.apiKey.trim()
        ? get().settings.model
        : 'DeepSeek Demo',
      assistant: {
        thinking: '',
        thinkingDurationSec: 0,
        thinkingDone: !deepThink,
        steps: [],
        content: '',
        citations: [],
      },
    }

    set((state) => {
      const sessions = state.sessions.map((s) => {
        if (s.id !== sessionId) return s
        return {
          ...s,
          updatedAt: Date.now(),
          messages: { ...s.messages, [assistantId]: assistantMsg },
          activeBranch: { ...s.activeBranch, [userMessageId]: assistantId },
        }
      })
      return {
        sessions,
        streamingSessionId: sessionId,
        abortController: controller,
      }
    })

    const currentSession = get().sessions.find((s) => s.id === sessionId)
    if (!currentSession) return
    const thread = getActiveThread(currentSession).filter((m) => m.id !== assistantId)

    let lastSave = 0
    const finalTurn = await streamAssistantResponse({
      settings: get().settings,
      thread,
      deepThink,
      webSearch,
      signal: controller.signal,
      callbacks: {
        onUpdate: (turnUpdate) => {
          const now = Date.now()
          set((state) => ({
            sessions: state.sessions.map((s) => {
              if (s.id !== sessionId) return s
              const existing = s.messages[assistantId]
              if (!existing) return s
              return {
                ...s,
                updatedAt: now,
                messages: {
                  ...s.messages,
                  [assistantId]: { ...existing, assistant: turnUpdate },
                },
              }
            }),
          }))
          if (now - lastSave > 1500) {
            lastSave = now
            const sess = get().sessions.find((s) => s.id === sessionId)
            if (sess) void saveSession(sess)
          }
        },
        onTitle: (title) => {
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId ? { ...s, title } : s
            ),
          }))
        },
      },
    })

    set((state) => {
      const sessions = state.sessions.map((s) => {
        if (s.id !== sessionId) return s
        const existing = s.messages[assistantId]
        if (!existing) return s
        return {
          ...s,
          updatedAt: Date.now(),
          messages: {
            ...s.messages,
            [assistantId]: { ...existing, assistant: finalTurn },
          },
        }
      })
      return {
        sessions,
        streamingSessionId: state.streamingSessionId === sessionId ? null : state.streamingSessionId,
        abortController: state.abortController === controller ? null : state.abortController,
      }
    })

    const updated = get().sessions.find((s) => s.id === sessionId)
    if (updated) void saveSession(updated)
  }

  return {
    initialized: false,
    settings: loadSettingsSync(),
    sessions: [],
    activeSessionId: null,
    deepThink: true,
    webSearch: false,
    streamingSessionId: null,
    abortController: null,
    drawerOpen: false,
    settingsOpen: false,
    sourcesSheet: null,
    lightboxImageUrl: null,
    toast: null,

    init: async () => {
      const [settings, sessions] = await Promise.all([
        hydrateSettings(),
        loadAllSessions(),
      ])
      set({ initialized: true, settings, sessions })
    },

    updateSettings: (patch) => {
      set((state) => {
        const next = { ...state.settings, ...patch }
        void persistSettings(next)
        return { settings: next }
      })
    },

    setDeepThink: (value) => {
      void triggerHaptic(get().settings.hapticsEnabled, 'light')
      set({ deepThink: value })
    },

    setWebSearch: (value) => {
      void triggerHaptic(get().settings.hapticsEnabled, 'light')
      set({ webSearch: value })
    },

    setDrawerOpen: (open) => set({ drawerOpen: open }),
    setSettingsOpen: (open) => set({ settingsOpen: open }),
    setSourcesSheet: (sheet) => set({ sourcesSheet: sheet }),
    setLightboxImageUrl: (url) => set({ lightboxImageUrl: url }),

    showToast: (text, type = 'info') => {
      if (toastTimer) clearTimeout(toastTimer)
      const id = Date.now()
      set({ toast: { id, text, type } })
      toastTimer = setTimeout(() => {
        set((state) => (state.toast?.id === id ? { toast: null } : state))
      }, 2600)
    },

    newChat: () => {
      const { abortController, settings } = get()
      if (abortController) abortController.abort()
      void triggerHaptic(settings.hapticsEnabled, 'light')
      set({
        activeSessionId: null,
        streamingSessionId: null,
        abortController: null,
        drawerOpen: false,
      })
    },

    selectSession: (id) => {
      const { abortController, streamingSessionId } = get()
      if (abortController && streamingSessionId !== id) {
        abortController.abort()
      }
      set({
        activeSessionId: id,
        drawerOpen: false,
        streamingSessionId: streamingSessionId === id ? id : null,
      })
    },

    renameSession: (id, title) => {
      const clean = title.trim()
      if (!clean) return
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === id ? { ...s, title: clean, updatedAt: Date.now() } : s
        ),
      }))
      const updated = get().sessions.find((s) => s.id === id)
      if (updated) void saveSession(updated)
    },

    togglePinSession: (id) => {
      set((state) => {
        const next = state.sessions
          .map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s))
          .sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
            return b.updatedAt - a.updatedAt
          })
        return { sessions: next }
      })
      const updated = get().sessions.find((s) => s.id === id)
      if (updated) void saveSession(updated)
    },

    deleteSession: async (id) => {
      await deleteSessionById(id)
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== id),
        activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
      }))
    },

    clearAllSessions: async () => {
      await clearAllSessionsStorage()
      set({ sessions: [], activeSessionId: null })
    },

    importZip: async (file) => {
      const imported = await importSessionsFromZip(file)
      set({ sessions: imported, activeSessionId: imported[0]?.id ?? null })
      return imported.length
    },

    sendUserMessage: async (text, attachments) => {
      const { activeSessionId, deepThink, webSearch, settings } = get()
      const cleanText = text.trim()
      if (!cleanText && attachments.length === 0) return

      void triggerHaptic(settings.hapticsEnabled, 'medium')

      // Upload attachments to DeepSeek Files API when using Anthropic protocol & personal API Key
      const preparedAttachments: ChatAttachment[] = [...attachments]
      if (settings.apiKey.trim() && settings.protocol === 'anthropic') {
        for (let i = 0; i < preparedAttachments.length; i++) {
          const att = preparedAttachments[i]
          if (!att.remoteFileId && att.dataUrl) {
            try {
              const res = await fetch(att.dataUrl)
              const blob = await res.blob()
              const file = new File([blob], att.name, { type: att.mimeType })
              const remoteId = await uploadFileToDeepSeek(
                settings.apiKey,
                settings.baseUrl,
                file,
                att.kind
              )
              preparedAttachments[i] = { ...att, remoteFileId: remoteId }
            } catch {
              // Fallback to inline base64 / textContent
            }
          }
        }
      }

      const now = Date.now()
      const userId = makeId('usr')
      let sessionId = activeSessionId

      if (!sessionId) {
        sessionId = makeId('chat')
        const fallbackTitle =
          cleanText.replace(/\s+/g, ' ').slice(0, 26) ||
          preparedAttachments[0]?.name ||
          (settings.locale === 'en-US' ? 'New chat' : '新对话')
        const userMsg: ChatMessage = {
          id: userId,
          parentId: null,
          role: 'user',
          createdAt: now,
          text: cleanText,
          attachments: preparedAttachments,
          deepThinkEnabled: deepThink,
          webSearchEnabled: webSearch,
        }
        const newSession: ChatSession = {
          id: sessionId,
          title: fallbackTitle,
          pinned: false,
          createdAt: now,
          updatedAt: now,
          messages: { [userId]: userMsg },
          activeBranch: { root: userId },
        }
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: sessionId,
        }))
        void saveSession(newSession)
      } else {
        const existing = get().sessions.find((s) => s.id === sessionId)
        if (!existing) return
        const thread = getActiveThread(existing)
        const parentId = thread.length > 0 ? thread[thread.length - 1].id : null
        const parentKey = parentId ?? 'root'
        const userMsg: ChatMessage = {
          id: userId,
          parentId,
          role: 'user',
          createdAt: now,
          text: cleanText,
          attachments: preparedAttachments,
          deepThinkEnabled: deepThink,
          webSearchEnabled: webSearch,
        }
        set((state) => ({
          sessions: state.sessions
            .map((s) =>
              s.id === sessionId
                ? {
                    ...s,
                    updatedAt: now,
                    messages: { ...s.messages, [userId]: userMsg },
                    activeBranch: { ...s.activeBranch, [parentKey]: userId },
                  }
                : s
            )
            .sort((a, b) => {
              if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
              return b.updatedAt - a.updatedAt
            }),
        }))
        const updated = get().sessions.find((s) => s.id === sessionId)
        if (updated) void saveSession(updated)
      }

      await runGeneration(sessionId, userId, deepThink, webSearch)
    },

    editUserMessage: async (sessionId, userMessageId, newText) => {
      const clean = newText.trim()
      if (!clean) return
      const session = get().sessions.find((s) => s.id === sessionId)
      const original = session?.messages[userMessageId]
      if (!session || !original) return

      const newUserId = makeId('usr')
      const parentKey = original.parentId ?? 'root'
      const newUserMsg: ChatMessage = {
        ...original,
        id: newUserId,
        createdAt: Date.now(),
        text: clean,
      }

      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                updatedAt: Date.now(),
                messages: { ...s.messages, [newUserId]: newUserMsg },
                activeBranch: { ...s.activeBranch, [parentKey]: newUserId },
              }
            : s
        ),
      }))
      await runGeneration(
        sessionId,
        newUserId,
        get().deepThink,
        get().webSearch
      )
    },

    regenerateAssistantMessage: async (sessionId, assistantMessageId) => {
      const session = get().sessions.find((s) => s.id === sessionId)
      const ast = session?.messages[assistantMessageId]
      if (!session || !ast || !ast.parentId) return
      await runGeneration(
        sessionId,
        ast.parentId,
        get().deepThink,
        get().webSearch
      )
    },

    switchBranch: (sessionId, parentId, childId) => {
      const parentKey = parentId ?? 'root'
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                activeBranch: { ...s.activeBranch, [parentKey]: childId },
              }
            : s
        ),
      }))
      const updated = get().sessions.find((s) => s.id === sessionId)
      if (updated) void saveSession(updated)
    },

    setFeedback: (sessionId, assistantMessageId, feedback) => {
      void triggerHaptic(get().settings.hapticsEnabled, 'light')
      set((state) => ({
        sessions: state.sessions.map((s) => {
          if (s.id !== sessionId) return s
          const msg = s.messages[assistantMessageId]
          if (!msg || !msg.assistant) return s
          return {
            ...s,
            messages: {
              ...s.messages,
              [assistantMessageId]: {
                ...msg,
                assistant: { ...msg.assistant, feedback },
              },
            },
          }
        }),
      }))
      const updated = get().sessions.find((s) => s.id === sessionId)
      if (updated) void saveSession(updated)
    },

    stopStreaming: () => {
      const { abortController, settings } = get()
      void triggerHaptic(settings.hapticsEnabled, 'light')
      if (abortController) {
        abortController.abort()
      }
      set({ streamingSessionId: null, abortController: null })
    },
  }
})
