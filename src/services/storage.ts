import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import type { AppSettings, ChatSession } from '../types/chat'
import { loadPreference, savePreference } from './native'

const SETTINGS_STORAGE_KEY = 'deepshek.settings.v1'

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  protocol: 'anthropic',
  model: 'deepseek-flash',
  demoMode: true,
  theme: 'system',
  locale: 'zh-CN',
  autoCollapseThinking: true,
  hapticsEnabled: true,
  fontSize: 'standard',
  ttsVoice: 'stella',
  systemPrompt: '',
}

export function loadSettingsSync(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export async function hydrateSettings(): Promise<AppSettings> {
  try {
    const raw = await loadPreference(SETTINGS_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch {
    return loadSettingsSync()
  }
}

export async function persistSettings(settings: AppSettings): Promise<void> {
  await savePreference(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

interface DeepshekDB extends DBSchema {
  sessions: {
    key: string
    value: ChatSession
    indexes: { 'by-updated': number }
  }
}

let dbPromise: Promise<IDBPDatabase<DeepshekDB>> | null = null

function getDb(): Promise<IDBPDatabase<DeepshekDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DeepshekDB>('deepshek-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('sessions', { keyPath: 'id' })
        store.createIndex('by-updated', 'updatedAt')
      },
    })
  }
  return dbPromise
}

export async function loadAllSessions(): Promise<ChatSession[]> {
  try {
    const db = await getDb()
    const list = await db.getAll('sessions')
    return list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.updatedAt - a.updatedAt
    })
  } catch {
    return []
  }
}

export async function saveSession(session: ChatSession): Promise<void> {
  try {
    const db = await getDb()
    await db.put('sessions', session)
  } catch {
    // Ignore storage write error
  }
}

export async function deleteSessionById(id: string): Promise<void> {
  try {
    const db = await getDb()
    await db.delete('sessions', id)
  } catch {
    // Ignore
  }
}

export async function clearAllSessionsStorage(): Promise<void> {
  try {
    const db = await getDb()
    await db.clear('sessions')
  } catch {
    // Ignore
  }
}

export function exportSessionsToZip(sessions: ChatSession[]): {
  filename: string
  blob: Blob
} {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: 'deepshek',
    conversations: sessions,
  }
  const zipped = zipSync({
    'conversations.json': strToU8(JSON.stringify(payload, null, 2)),
  })
  const dateStr = new Date().toISOString().slice(0, 10)
  const copy = new Uint8Array(zipped.length)
  copy.set(zipped)
  return {
    filename: `deepshek-history-${dateStr}.zip`,
    blob: new Blob([copy.buffer], { type: 'application/zip' }),
  }
}

export async function importSessionsFromZip(file: File): Promise<ChatSession[]> {
  const buf = new Uint8Array(await file.arrayBuffer())
  const files = unzipSync(buf)
  const jsonEntry =
    files['conversations.json'] ??
    Object.entries(files).find(([name]) => name.endsWith('.json'))?.[1]
  if (!jsonEntry) {
    throw new Error('ZIP 中未找到 JSON 对话文件')
  }
  const parsed = JSON.parse(strFromU8(jsonEntry)) as
    | { conversations?: unknown }
    | unknown[]
  const rawList = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.conversations)
      ? parsed.conversations
      : null
  if (!rawList) {
    throw new Error('无效的对话备份格式')
  }
  const now = Date.now()
  const imported: ChatSession[] = []
  for (const item of rawList) {
    if (
      item &&
      typeof item === 'object' &&
      'id' in item &&
      'messages' in item &&
      typeof (item as ChatSession).id === 'string'
    ) {
      const sess = item as ChatSession
      imported.push({
        id: sess.id,
        title: sess.title || '导入的对话',
        pinned: Boolean(sess.pinned),
        createdAt: sess.createdAt || now,
        updatedAt: sess.updatedAt || now,
        messages: sess.messages || {},
        activeBranch: sess.activeBranch || {},
      })
    }
  }
  const db = await getDb()
  if (imported.length === 0) throw new Error('备份中没有有效的对话，未修改现有记录')
  const existing = await db.getAll('sessions')
  const merged = new Map(existing.map((session) => [session.id, session]))
  for (const session of imported) {
    const previous = merged.get(session.id)
    if (!previous || session.updatedAt >= previous.updatedAt) merged.set(session.id, session)
  }
  const tx = db.transaction('sessions', 'readwrite')
  for (const s of merged.values()) {
    await tx.store.put(s)
  }
  await tx.done
  return [...merged.values()].sort((a, b) => b.updatedAt - a.updatedAt)
}
