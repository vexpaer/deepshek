import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { formatMessage, getDict } from '../i18n'
import { getActiveThread, getSiblingInfo, useAppStore } from '../store/useAppStore'
import type { ChatMessage, ChatSession, SearchSource } from '../types/chat'
import {
  DeepSeekWhaleLogo,
  IconArrowDown,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCopy,
  IconEdit,
  IconFile,
  IconGlobe,
  IconRefresh,
  IconSpeaker,
  IconThink,
  IconThumbDown,
  IconThumbUp,
} from './Icons'
import { MarkdownRenderer } from './MarkdownRenderer'
import styles from './MessageStream.module.css'

const SourceFavicons: React.FC<{ sources: SearchSource[] }> = ({ sources }) => {
  const unique = useMemo(() => {
    const map = new Map<string, SearchSource>()
    for (const s of sources) {
      if (!map.has(s.siteName)) map.set(s.siteName, s)
      if (map.size >= 4) break
    }
    return Array.from(map.values())
  }, [sources])

  return (
    <div className={styles.faviconStack}>
      {unique.map((s) => (
        <span key={s.id} className={styles.faviconDot}>
          {s.siteIcon ? (
            <img
              src={s.siteIcon}
              alt=""
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : null}
          <span>{s.siteName.slice(0, 1).toUpperCase()}</span>
        </span>
      ))}
    </div>
  )
}

const BranchNav: React.FC<{
  session: ChatSession
  message: ChatMessage
}> = ({ session, message }) => {
  const switchBranch = useAppStore((s) => s.switchBranch)
  const info = getSiblingInfo(session, message)
  if (info.total <= 1) return null
  const prev = info.siblings[info.index - 1]
  const next = info.siblings[info.index + 1]
  return (
    <div className={styles.branchNav}>
      <button
        type="button"
        disabled={!prev}
        className={styles.branchBtn}
        onClick={() => prev && switchBranch(session.id, message.parentId, prev.id)}
      >
        <IconChevronLeft size={13} />
      </button>
      <span className={styles.branchText}>
        {info.index + 1} / {info.total}
      </span>
      <button
        type="button"
        disabled={!next}
        className={styles.branchBtn}
        onClick={() => next && switchBranch(session.id, message.parentId, next.id)}
      >
        <IconChevronRight size={13} />
      </button>
    </div>
  )
}

const AssistantMessageCard: React.FC<{
  session: ChatSession
  message: ChatMessage
  streaming: boolean
}> = memo(({ session, message, streaming }) => {
  const settings = useAppStore((s) => s.settings)
  const setSourcesSheet = useAppStore((s) => s.setSourcesSheet)
  const regenerateAssistantMessage = useAppStore((s) => s.regenerateAssistantMessage)
  const setFeedback = useAppStore((s) => s.setFeedback)
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen)
  const showToast = useAppStore((s) => s.showToast)

  const dict = getDict(settings.locale)
  const turn = message.assistant
  const [thinkOpen, setThinkOpen] = useState(true)
  const [copied, setCopied] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const autoCollapsedRef = useRef(false)

  useEffect(() => {
    if (
      settings.autoCollapseThinking &&
      turn?.thinkingDone &&
      !autoCollapsedRef.current &&
      (turn.content.length > 0 || !streaming)
    ) {
      autoCollapsedRef.current = true
      setThinkOpen(false)
    }
  }, [settings.autoCollapseThinking, turn?.thinkingDone, turn?.content.length, streaming])

  useEffect(() => {
    return () => {
      if (speaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [speaking])

  if (!turn) return null

  const allSources = useMemo(() => {
    const map = new Map<string, SearchSource>()
    for (const step of turn.steps) {
      for (const s of step.sources) {
        if (!map.has(s.url)) map.set(s.url, s)
      }
    }
    return Array.from(map.values())
  }, [turn.steps])

  const hasThinking = Boolean(turn.thinking || (!turn.thinkingDone && streaming))
  const isWaiting = streaming && !turn.thinking && !turn.content && turn.steps.length === 0

  const handleCopy = async () => {
    if (!turn.content) return
    try {
      await navigator.clipboard.writeText(turn.content)
      setCopied(true)
      showToast(dict.copied, 'success')
      setTimeout(() => setCopied(false), 1800)
    } catch {
      showToast('复制失败', 'error')
    }
  }

  const handleReadAloud = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      showToast('当前设备暂不支持语音朗读', 'info')
      return
    }
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    if (!turn.content.trim()) return
    window.speechSynthesis.cancel()
    const plain = turn.content
      .replace(/```[\s\S]*?```/g, ' 代码块 ')
      .replace(/\[(\d+)\]/g, '')
      .replace(/[#*`>$]/g, '')
    const utter = new SpeechSynthesisUtterance(plain)
    utter.lang = settings.locale === 'en-US' ? 'en-US' : 'zh-CN'
    utter.rate = settings.ttsVoice === 'tide' ? 0.96 : 1.04
    utter.pitch = settings.ttsVoice === 'stella' ? 1.08 : settings.ttsVoice === 'tide' ? 0.9 : 1.0
    utter.onend = () => setSpeaking(false)
    utter.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utter)
  }

  const friendlyError = () => {
    if (turn.errorKind === 'invalid_key') return dict.errorInvalidKey
    if (turn.errorKind === 'insufficient_balance') return dict.errorBalance
    if (turn.errorKind === 'rate_limit') return dict.errorRateLimit
    if (turn.errorKind === 'network') return `${dict.errorNetwork} (${turn.errorMessage || ''})`
    return turn.errorMessage || '请求失败，请重试'
  }

  return (
    <div className={styles.assistantTurn}>
      <div className={styles.assistantHeaderRow}>
        <div className={styles.assistantAvatar}>
          <DeepSeekWhaleLogo size={22} />
        </div>
        <span className={styles.assistantName}>DeepSeek</span>
        {message.modelUsed === 'DeepSeek Demo' ? (
          <span className={styles.demoTag}>Demo</span>
        ) : null}
      </div>

      {/* Web search / URL read step summary */}
      {turn.steps.length > 0 ? (
        <div className={styles.stepsWrap}>
          {turn.steps.map((step) => {
            const count = step.sources.length
            const isRunning = step.status === 'running'
            return (
              <button
                key={step.id}
                type="button"
                className={styles.searchPillCard}
                disabled={count === 0}
                onClick={() => {
                  if (count > 0) {
                    setSourcesSheet({ title: dict.sourcesTitle, sources: allSources })
                  }
                }}
              >
                <span className={styles.searchPillIcon}>
                  <IconGlobe size={14} />
                </span>
                <span className={clsx(styles.searchPillText, isRunning && styles.shimmerText)}>
                  {isRunning
                    ? step.type === 'read_link'
                      ? dict.readingLinkActive
                      : dict.searchingActive
                    : step.type === 'read_link'
                      ? formatMessage(dict.readingLinkDone, { count: Math.max(1, count) })
                      : formatMessage(dict.searchingDone, { count })}
                </span>
                {count > 0 ? <SourceFavicons sources={step.sources} /> : null}
                {count > 0 ? <IconChevronRight size={13} /> : null}
              </button>
            )
          })}
        </div>
      ) : null}

      {/* Deep thinking collapsible block */}
      {hasThinking ? (
        <div className={styles.thinkingSection}>
          <button
            type="button"
            className={styles.thinkingToggle}
            onClick={() => setThinkOpen((v) => !v)}
          >
            <span className={styles.thinkingIcon}>
              <IconThink size={14} />
            </span>
            <span
              className={clsx(
                styles.thinkingTitle,
                !turn.thinkingDone && streaming && styles.shimmerText
              )}
            >
              {!turn.thinkingDone && streaming
                ? dict.thinkingActive
                : turn.stopReason === 'stopped' && !turn.content
                  ? dict.thinkingStopped
                  : formatMessage(dict.thinkingDone, {
                      seconds: Math.max(1, turn.thinkingDurationSec || 1),
                    })}
            </span>
            <span className={clsx(styles.chevron, thinkOpen && styles.chevronOpen)}>
              <IconChevronDown size={13} />
            </span>
          </button>

          {thinkOpen && turn.thinking ? (
            <div className={styles.thinkingBody}>
              <MarkdownRenderer
                content={turn.thinking}
                className="ds-thinking-markdown"
                streaming={streaming && !turn.thinkingDone}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {isWaiting ? (
        <div className={styles.waitingDots}>
          <span />
          <span />
          <span />
        </div>
      ) : null}

      {turn.content ? (
        <div className={styles.answerBody}>
          <MarkdownRenderer
            content={turn.content}
            sources={allSources}
            streaming={streaming}
            onOpenCitation={() => {
              if (allSources.length > 0) {
                setSourcesSheet({ title: dict.sourcesTitle, sources: allSources })
              }
            }}
          />
        </div>
      ) : null}

      {turn.stopReason === 'error' ? (
        <div className={styles.errorBox}>
          <div className={styles.errorText}>{friendlyError()}</div>
          {(turn.errorKind === 'invalid_key' || turn.errorKind === 'insufficient_balance') && (
            <button
              type="button"
              className={styles.errorActionBtn}
              onClick={() => setSettingsOpen(true)}
            >
              {dict.goToSettings}
            </button>
          )}
        </div>
      ) : null}

      {!streaming && allSources.length > 0 ? (
        <button
          type="button"
          className={styles.sourcesBarBtn}
          onClick={() => setSourcesSheet({ title: dict.sourcesTitle, sources: allSources })}
        >
          <SourceFavicons sources={allSources} />
          <span>{formatMessage(dict.viewSources, { count: allSources.length })}</span>
          <IconChevronRight size={13} />
        </button>
      ) : null}

      {!streaming && (turn.content || turn.stopReason === 'error') ? (
        <div className={styles.actionBar}>
          <div className={styles.actionGroup}>
            {turn.content ? (
              <button
                type="button"
                className={styles.actionBtn}
                aria-label={dict.copy}
                onClick={() => void handleCopy()}
              >
                {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
              </button>
            ) : null}
            <button
              type="button"
              className={styles.actionBtn}
              aria-label={dict.regenerate}
              onClick={() => void regenerateAssistantMessage(session.id, message.id)}
            >
              <IconRefresh size={15} />
            </button>
            {turn.content ? (
              <button
                type="button"
                className={clsx(styles.actionBtn, speaking && styles.actionBtnActive)}
                aria-label={speaking ? dict.stopReading : dict.readAloud}
                onClick={handleReadAloud}
              >
                <IconSpeaker size={15} />
              </button>
            ) : null}
            <button
              type="button"
              className={clsx(
                styles.actionBtn,
                turn.feedback === 'like' && styles.actionBtnActive
              )}
              aria-label={dict.like}
              onClick={() => {
                const next = turn.feedback === 'like' ? null : 'like'
                setFeedback(session.id, message.id, next)
                if (next) showToast(dict.feedbackThanks, 'info')
              }}
            >
              <IconThumbUp size={15} active={turn.feedback === 'like'} />
            </button>
            <button
              type="button"
              className={clsx(
                styles.actionBtn,
                turn.feedback === 'dislike' && styles.actionBtnActive
              )}
              aria-label={dict.dislike}
              onClick={() => {
                const next = turn.feedback === 'dislike' ? null : 'dislike'
                setFeedback(session.id, message.id, next)
                if (next) showToast(dict.feedbackThanks, 'info')
              }}
            >
              <IconThumbDown size={15} active={turn.feedback === 'dislike'} />
            </button>
          </div>
          <BranchNav session={session} message={message} />
        </div>
      ) : null}

      {!streaming && message.modelUsed === 'DeepSeek Demo' && turn.content ? (
        <div className={styles.demoFooterHint}>
          <span>{dict.demoBadge}</span>
          <button type="button" onClick={() => setSettingsOpen(true)}>
            {dict.goToSettings}
          </button>
        </div>
      ) : null}
    </div>
  )
})

const UserMessageBubble: React.FC<{
  session: ChatSession
  message: ChatMessage
  busy: boolean
}> = memo(({ session, message, busy }) => {
  const settings = useAppStore((s) => s.settings)
  const editUserMessage = useAppStore((s) => s.editUserMessage)
  const setLightboxImageUrl = useAppStore((s) => s.setLightboxImageUrl)
  const showToast = useAppStore((s) => s.showToast)
  const dict = getDict(settings.locale)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.text || '')

  const handleSave = async () => {
    const clean = draft.trim()
    if (!clean) return
    setEditing(false)
    await editUserMessage(session.id, message.id, clean)
  }

  return (
    <div className={styles.userTurn}>
      {message.attachments && message.attachments.length > 0 ? (
        <div className={styles.userAttachments}>
          {message.attachments.map((att) =>
            att.kind === 'image' && att.dataUrl ? (
              <button
                key={att.id}
                type="button"
                className={styles.userImgBtn}
                onClick={() => setLightboxImageUrl(att.dataUrl!)}
              >
                <img src={att.dataUrl} alt={att.name} className={styles.userImg} />
              </button>
            ) : (
              <div key={att.id} className={styles.userFilePill}>
                <IconFile size={14} />
                <span>{att.name}</span>
              </div>
            )
          )}
        </div>
      ) : null}

      {editing ? (
        <div className={styles.editBox}>
          <textarea
            value={draft}
            rows={3}
            autoFocus
            className={styles.editTextarea}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className={styles.editActions}>
            <button
              type="button"
              className={styles.editCancelBtn}
              onClick={() => {
                setDraft(message.text || '')
                setEditing(false)
              }}
            >
              {dict.cancel}
            </button>
            <button
              type="button"
              className={styles.editSaveBtn}
              onClick={() => void handleSave()}
            >
              {dict.saveAndSubmit}
            </button>
          </div>
        </div>
      ) : message.text ? (
        <div className={styles.userBubble}>
          <div className={styles.userText}>{message.text}</div>
        </div>
      ) : null}

      <div className={styles.userMetaRow}>
        <BranchNav session={session} message={message} />
        {!editing && !busy ? (
          <div className={styles.userHoverActions}>
            {message.text ? (
              <button
                type="button"
                className={styles.smallMetaBtn}
                aria-label={dict.copy}
                onClick={async () => {
                  await navigator.clipboard.writeText(message.text || '')
                  showToast(dict.copied, 'success')
                }}
              >
                <IconCopy size={13} />
              </button>
            ) : null}
            <button
              type="button"
              className={styles.smallMetaBtn}
              aria-label={dict.edit}
              onClick={() => {
                setDraft(message.text || '')
                setEditing(true)
              }}
            >
              <IconEdit size={13} />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
})

export const MessageStream: React.FC<{ session: ChatSession }> = ({ session }) => {
  const streamingSessionId = useAppStore((s) => s.streamingSessionId)
  const settings = useAppStore((s) => s.settings)
  const dict = getDict(settings.locale)
  const thread = useMemo(() => getActiveThread(session), [session])
  const streaming = streamingSessionId === session.id

  const scrollRef = useRef<HTMLDivElement>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const stickBottomRef = useRef(true)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (stickBottomRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [thread, session.id])

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight
    const nearBottom = dist < 72
    stickBottomRef.current = nearBottom
    setShowScrollBtn(!nearBottom)
  }

  const scrollToBottom = () => {
    const el = scrollRef.current
    if (!el) return
    stickBottomRef.current = true
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }

  return (
    <div className={styles.streamRoot}>
      <div ref={scrollRef} className={styles.scrollArea} onScroll={handleScroll}>
        <div className={styles.threadInner}>
          {thread.map((msg, idx) =>
            msg.role === 'user' ? (
              <UserMessageBubble
                key={msg.id}
                session={session}
                message={msg}
                busy={streaming}
              />
            ) : (
              <AssistantMessageCard
                key={msg.id}
                session={session}
                message={msg}
                streaming={streaming && idx === thread.length - 1}
              />
            )
          )}
        </div>
      </div>

      {showScrollBtn ? (
        <button
          type="button"
          className={styles.scrollBottomBtn}
          aria-label={dict.scrollToBottom}
          onClick={scrollToBottom}
        >
          <IconArrowDown size={16} />
        </button>
      ) : null}
    </div>
  )
}
