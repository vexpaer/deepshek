import React, { useMemo, useState } from 'react'
import clsx from 'clsx'
import { getDict } from '../i18n'
import { getActiveThread, useAppStore } from '../store/useAppStore'
import type { ChatSession } from '../types/chat'
import {
  DeepSeekWhaleLogo,
  IconClose,
  IconEdit,
  IconEllipsis,
  IconKey,
  IconNewChat,
  IconPin,
  IconSearch,
  IconSettings,
  IconTrash,
} from './Icons'
import styles from './NavigationDrawer.module.css'

interface SessionGroup {
  key: string
  label: string
  items: ChatSession[]
}

function groupSessions(
  sessions: ChatSession[],
  locale: 'zh-CN' | 'en-US',
  query: string
): SessionGroup[] {
  const dict = getDict(locale)
  const q = query.trim().toLowerCase()
  const filtered = q
    ? sessions.filter((s) => {
        if (s.title.toLowerCase().includes(q)) return true
        return Object.values(s.messages).some((m) =>
          (m.text || m.assistant?.content || '').toLowerCase().includes(q)
        )
      })
    : sessions

  const pinned = filtered.filter((s) => s.pinned)
  const regular = filtered.filter((s) => !s.pinned)

  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const dayMs = 86400 * 1000

  const buckets = new Map<string, SessionGroup>()
  const addToBucket = (key: string, label: string, item: ChatSession) => {
    let g = buckets.get(key)
    if (!g) {
      g = { key, label, items: [] }
      buckets.set(key, g)
    }
    g.items.push(item)
  }

  for (const s of pinned) {
    addToBucket('pinned', dict.pinnedSection, s)
  }

  for (const s of regular) {
    const t = s.updatedAt
    if (t >= startToday) {
      addToBucket('today', dict.today, s)
    } else if (t >= startToday - dayMs) {
      addToBucket('yesterday', dict.yesterday, s)
    } else if (t >= startToday - 7 * dayMs) {
      addToBucket('7days', dict.last7Days, s)
    } else if (t >= startToday - 30 * dayMs) {
      addToBucket('30days', dict.last30Days, s)
    } else {
      const d = new Date(t)
      const ymKey = `${d.getFullYear()}-${d.getMonth() + 1}`
      const ymLabel =
        locale === 'en-US'
          ? d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
          : `${d.getFullYear()}年${d.getMonth() + 1}月`
      addToBucket(ymKey, ymLabel, s)
    }
  }

  return Array.from(buckets.values())
}

export const NavigationDrawer: React.FC = () => {
  const drawerOpen = useAppStore((s) => s.drawerOpen)
  const setDrawerOpen = useAppStore((s) => s.setDrawerOpen)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
  const sessions = useAppStore((s) => s.sessions)
  const activeSessionId = useAppStore((s) => s.activeSessionId)
  const settings = useAppStore((s) => s.settings)
  const newChat = useAppStore((s) => s.newChat)
  const selectSession = useAppStore((s) => s.selectSession)
  const renameSession = useAppStore((s) => s.renameSession)
  const togglePinSession = useAppStore((s) => s.togglePinSession)
  const deleteSession = useAppStore((s) => s.deleteSession)
  const showToast = useAppStore((s) => s.showToast)

  const dict = getDict(settings.locale)
  const [searchQuery, setSearchQuery] = useState('')
  const [menuSession, setMenuSession] = useState<ChatSession | null>(null)
  const [renameTarget, setRenameTarget] = useState<ChatSession | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ChatSession | null>(null)

  const groups = useMemo(
    () => groupSessions(sessions, settings.locale, searchQuery),
    [sessions, settings.locale, searchQuery]
  )

  if (!drawerOpen) return null

  const hasKey = Boolean(settings.apiKey.trim())

  const exportMarkdown = (sess: ChatSession) => {
    const thread = getActiveThread(sess)
    const md = thread
      .map((m) =>
        m.role === 'user'
          ? `### User\n\n${m.text || ''}`
          : `### DeepSeek\n\n${
              m.assistant?.thinking
                ? `<details><summary>Thinking</summary>\n\n${m.assistant.thinking}\n\n</details>\n\n`
                : ''
            }${m.assistant?.content || ''}`
      )
      .join('\n\n---\n\n')
    const blob = new Blob([`# ${sess.title}\n\n${md}`], {
      type: 'text/markdown;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sess.title.replace(/[^\w\u4e00-\u9fa5-]+/g, '_') || 'chat'}.md`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
    showToast('已导出 Markdown', 'success')
  }

  return (
    <>
      <div className={styles.scrim} onClick={() => setDrawerOpen(false)} />
      <aside className={styles.drawer} aria-label="Chat history">
        <div className={styles.drawerHeader}>
          <div className={styles.brandRow}>
            <DeepSeekWhaleLogo size={26} />
            <span className={styles.brandText}>deepseek</span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            aria-label={dict.cancel}
            onClick={() => setDrawerOpen(false)}
          >
            <IconClose size={17} />
          </button>
        </div>

        <button type="button" className={styles.newChatPill} onClick={newChat}>
          <IconNewChat size={17} />
          <span>{dict.newChat}</span>
        </button>

        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>
            <IconSearch size={14} />
          </span>
          <input
            type="search"
            value={searchQuery}
            placeholder={dict.searchHistoryPlaceholder}
            className={styles.searchInput}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery ? (
            <button
              type="button"
              className={styles.searchClearBtn}
              onClick={() => setSearchQuery('')}
            >
              <IconClose size={12} />
            </button>
          ) : null}
        </div>

        <div className={styles.listScroll}>
          {groups.length === 0 ? (
            <div className={styles.emptyState}>
              {searchQuery ? dict.noSearchResults : dict.emptyHistory}
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.key} className={styles.group}>
                <div className={styles.groupTitle}>{group.label}</div>
                {group.items.map((sess) => {
                  const active = sess.id === activeSessionId
                  return (
                    <div
                      key={sess.id}
                      className={clsx(styles.sessionRow, active && styles.sessionRowActive)}
                    >
                      <button
                        type="button"
                        className={styles.sessionBtn}
                        onClick={() => selectSession(sess.id)}
                      >
                        {sess.pinned ? (
                          <span className={styles.pinMark}>
                            <IconPin size={12} />
                          </span>
                        ) : null}
                        <span className={styles.sessionTitle}>{sess.title}</span>
                      </button>
                      <button
                        type="button"
                        className={styles.sessionMoreBtn}
                        aria-label="Session options"
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuSession(sess)
                        }}
                      >
                        <IconEllipsis size={15} />
                      </button>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        <div className={styles.drawerFooter}>
          <button
            type="button"
            className={styles.footerCard}
            onClick={() => {
              setDrawerOpen(false)
              setSettingsOpen(true)
            }}
          >
            <div className={styles.avatarCircle}>
              <IconKey size={16} />
            </div>
            <div className={styles.footerText}>
              <div className={styles.footerTitle}>{dict.settings}</div>
              <div className={styles.footerSub}>
                <span
                  className={clsx(
                    styles.statusDot,
                    hasKey ? styles.statusDotOk : styles.statusDotWarn
                  )}
                />
                <span>{hasKey ? dict.apiKeyConfigured : dict.apiKeyMissing}</span>
              </div>
            </div>
            <span className={styles.footerGear}>
              <IconSettings size={18} />
            </span>
          </button>
        </div>
      </aside>

      {/* Session options bottom sheet */}
      {menuSession ? (
        <div className={styles.modalScrim} onClick={() => setMenuSession(null)}>
          <div className={styles.bottomSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHandle} />
            <div className={styles.sheetTitle}>{menuSession.title}</div>
            <button
              type="button"
              className={styles.sheetItem}
              onClick={() => {
                togglePinSession(menuSession.id)
                setMenuSession(null)
              }}
            >
              <IconPin size={16} />
              <span>{menuSession.pinned ? dict.unpin : dict.pin}</span>
            </button>
            <button
              type="button"
              className={styles.sheetItem}
              onClick={() => {
                setRenameTarget(menuSession)
                setRenameDraft(menuSession.title)
                setMenuSession(null)
              }}
            >
              <IconEdit size={16} />
              <span>{dict.rename}</span>
            </button>
            <button
              type="button"
              className={styles.sheetItem}
              onClick={() => {
                exportMarkdown(menuSession)
                setMenuSession(null)
              }}
            >
              <IconNewChat size={16} />
              <span>{dict.exportMarkdown}</span>
            </button>
            <button
              type="button"
              className={clsx(styles.sheetItem, styles.sheetItemDanger)}
              onClick={() => {
                setDeleteTarget(menuSession)
                setMenuSession(null)
              }}
            >
              <IconTrash size={16} />
              <span>{dict.delete}</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* Rename Modal */}
      {renameTarget ? (
        <div className={styles.modalScrim} onClick={() => setRenameTarget(null)}>
          <div className={styles.dialogCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dialogTitle}>{dict.renameSessionTitle}</div>
            <input
              type="text"
              autoFocus
              value={renameDraft}
              placeholder={dict.renamePlaceholder}
              className={styles.dialogInput}
              onChange={(e) => setRenameDraft(e.target.value)}
            />
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.dialogCancelBtn}
                onClick={() => setRenameTarget(null)}
              >
                {dict.cancel}
              </button>
              <button
                type="button"
                className={styles.dialogPrimaryBtn}
                onClick={() => {
                  renameSession(renameTarget.id, renameDraft)
                  setRenameTarget(null)
                }}
              >
                {dict.confirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete Confirm Modal */}
      {deleteTarget ? (
        <div className={styles.modalScrim} onClick={() => setDeleteTarget(null)}>
          <div className={styles.dialogCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dialogTitle}>{dict.deleteSessionTitle}</div>
            <div className={styles.dialogBody}>{dict.deleteSessionDesc}</div>
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.dialogCancelBtn}
                onClick={() => setDeleteTarget(null)}
              >
                {dict.cancel}
              </button>
              <button
                type="button"
                className={styles.dialogDangerBtn}
                onClick={() => {
                  void deleteSession(deleteTarget.id)
                  setDeleteTarget(null)
                }}
              >
                {dict.delete}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
