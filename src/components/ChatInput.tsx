import React, { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { getDict } from '../i18n'
import { useAppStore } from '../store/useAppStore'
import type { ChatAttachment } from '../types/chat'
import {
  IconClose,
  IconFile,
  IconGlobe,
  IconImage,
  IconMic,
  IconPlus,
  IconSend,
  IconStop,
  IconThink,
  IconTrash,
} from './Icons'
import styles from './ChatInput.module.css'

interface SpeechRecognitionAlternative {
  transcript: string
}
interface SpeechRecognitionResult {
  0: SpeechRecognitionAlternative
  isFinal: boolean
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResult>
}
interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function readFileAsAttachment(file: File): Promise<ChatAttachment> {
  const id = `att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
  const isImage = file.type.startsWith('image/')
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

  let textContent: string | undefined
  if (!isImage && (file.type.startsWith('text/') || /\.(txt|md|json|ts|tsx|js|py|csv|log)$/i.test(file.name))) {
    try {
      textContent = await file.text()
    } catch {
      // Binary file like PDF/DOCX will rely on Files API
    }
  }

  return {
    id,
    name: file.name,
    size: file.size,
    mimeType: file.type || (isImage ? 'image/jpeg' : 'application/octet-stream'),
    kind: isImage ? 'image' : 'file',
    dataUrl,
    textContent,
    status: 'ready',
  }
}

export const ChatInput: React.FC<{
  draftText?: string
  onDraftConsumed?: () => void
}> = ({ draftText, onDraftConsumed }) => {
  const settings = useAppStore((s) => s.settings)
  const deepThink = useAppStore((s) => s.deepThink)
  const webSearch = useAppStore((s) => s.webSearch)
  const setDeepThink = useAppStore((s) => s.setDeepThink)
  const setWebSearch = useAppStore((s) => s.setWebSearch)
  const streamingSessionId = useAppStore((s) => s.streamingSessionId)
  const activeSessionId = useAppStore((s) => s.activeSessionId)
  const sendUserMessage = useAppStore((s) => s.sendUserMessage)
  const stopStreaming = useAppStore((s) => s.stopStreaming)
  const showToast = useAppStore((s) => s.showToast)
  const setLightboxImageUrl = useAppStore((s) => s.setLightboxImageUrl)

  const dict = getDict(settings.locale)
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [recording, setRecording] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  const isStreamingHere = Boolean(
    streamingSessionId && streamingSessionId === activeSessionId
  )

  useEffect(() => {
    if (draftText) {
      setText(draftText)
      onDraftConsumed?.()
      requestAnimationFrame(() => textareaRef.current?.focus())
    }
  }, [draftText, onDraftConsumed])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`
  }, [text])

  const handleFilesSelected = async (files: FileList | null) => {
    setSheetOpen(false)
    if (!files || files.length === 0) return
    const list = Array.from(files).slice(0, 6)
    try {
      const next = await Promise.all(list.map(readFileAsAttachment))
      setAttachments((prev) => [...prev, ...next].slice(0, 6))
    } catch {
      showToast('读取附件失败', 'error')
    }
  }

  const handleSend = async () => {
    if (isStreamingHere) {
      stopStreaming()
      return
    }
    const clean = text.trim()
    if (!clean && attachments.length === 0) return
    const currentAttachments = [...attachments]
    setText('')
    setAttachments([])
    await sendUserMessage(clean, currentAttachments)
  }

  const toggleVoice = () => {
    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      return
    }
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike
      webkitSpeechRecognition?: new () => SpeechRecognitionLike
    }
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition
    if (!SpeechRec) {
      showToast(dict.voiceUnsupported, 'info')
      return
    }
    try {
      const rec = new SpeechRec()
      rec.lang = settings.locale === 'en-US' ? 'en-US' : 'zh-CN'
      rec.interimResults = true
      rec.continuous = false
      const baseText = text ? `${text} ` : ''
      rec.onresult = (ev) => {
        let transcript = ''
        for (let i = 0; i < ev.results.length; i++) {
          transcript += ev.results[i][0]?.transcript ?? ''
        }
        setText(baseText + transcript)
      }
      rec.onerror = () => {
        setRecording(false)
        showToast(dict.voiceUnsupported, 'info')
      }
      rec.onend = () => setRecording(false)
      recognitionRef.current = rec
      setRecording(true)
      rec.start()
    } catch {
      setRecording(false)
      showToast(dict.voiceUnsupported, 'info')
    }
  }

  const canSend = Boolean(text.trim() || attachments.length > 0)

  return (
    <>
      <div className={styles.composerOuter}>
        <div className={styles.composerCard}>
          {attachments.length > 0 ? (
            <div className={styles.attachmentsRow}>
              {attachments.map((att) => (
                <div key={att.id} className={styles.attachmentChip}>
                  {att.kind === 'image' && att.dataUrl ? (
                    <button
                      type="button"
                      className={styles.thumbBtn}
                      onClick={() => setLightboxImageUrl(att.dataUrl!)}
                    >
                      <img src={att.dataUrl} alt={att.name} className={styles.thumbImg} />
                    </button>
                  ) : (
                    <div className={styles.fileChipInner}>
                      <span className={styles.fileChipIcon}>
                        <IconFile size={16} />
                      </span>
                      <div className={styles.fileChipMeta}>
                        <div className={styles.fileChipName}>{att.name}</div>
                        <div className={styles.fileChipSize}>{formatBytes(att.size)}</div>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    className={styles.removeChipBtn}
                    aria-label={dict.delete}
                    onClick={() =>
                      setAttachments((prev) => prev.filter((item) => item.id !== att.id))
                    }
                  >
                    <IconClose size={11} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className={styles.inputBoxWrap}>
            {recording ? (
              <div className={styles.voiceSpectrumBanner} onClick={toggleVoice}>
                <div className={styles.spectrumBars}>
                  {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
                    <span
                      key={idx}
                      className={styles.spectrumBar}
                      style={{ animationDelay: `${idx * 90}ms` }}
                    />
                  ))}
                </div>
                <span className={styles.voiceHint}>
                  {dict.voiceListening} · {dict.voiceTapToStop}
                </span>
              </div>
            ) : null}
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              placeholder={dict.inputPlaceholder}
              className={clsx(styles.textarea, recording && styles.textareaHidden)}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                  // On desktop keyboard convenience; Android virtual keyboard uses Enter for newline or send
                  if (window.innerWidth >= 768) {
                    e.preventDefault()
                    void handleSend()
                  }
                }
              }}
            />
          </div>

          <div className={styles.functionRow}>
            <div className={styles.leftToggles}>
              <button
                type="button"
                className={clsx(styles.pillToggle, deepThink && styles.pillToggleActive)}
                aria-pressed={deepThink}
                onClick={() => setDeepThink(!deepThink)}
              >
                <IconThink size={15} />
                <span>{dict.deepThink}</span>
              </button>
              <button
                type="button"
                className={clsx(styles.pillToggle, webSearch && styles.pillToggleActive)}
                aria-pressed={webSearch}
                onClick={() => setWebSearch(!webSearch)}
              >
                <IconGlobe size={14} />
                <span>{dict.webSearch}</span>
              </button>
            </div>

            <div className={styles.rightControls}>
              <button
                type="button"
                className={clsx(styles.iconActionBtn, recording && styles.iconActionRecording)}
                aria-label={dict.voiceTapToStop}
                onClick={toggleVoice}
              >
                <IconMic size={18} filled={recording} />
              </button>
              <button
                type="button"
                className={styles.iconActionBtn}
                aria-label={dict.attachmentSheetTitle}
                onClick={() => setSheetOpen(true)}
              >
                <IconPlus size={19} />
              </button>
              <button
                type="button"
                disabled={!isStreamingHere && !canSend}
                aria-label={isStreamingHere ? 'Stop' : 'Send'}
                className={clsx(
                  styles.sendButton,
                  !isStreamingHere && !canSend && styles.sendButtonDisabled
                )}
                onClick={() => void handleSend()}
              >
                {isStreamingHere ? <IconStop size={15} /> : <IconSend size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          void handleFilesSelected(e.target.files)
          e.target.value = ''
        }}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.csv,.json,.ts,.tsx,.js,.py"
        multiple
        hidden
        onChange={(e) => {
          void handleFilesSelected(e.target.files)
          e.target.value = ''
        }}
      />

      {sheetOpen ? (
        <div className={styles.sheetBackdrop} onClick={() => setSheetOpen(false)}>
          <div className={styles.sheetPanel} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHandle} />
            <div className={styles.sheetHeader}>
              <span>{dict.attachmentSheetTitle}</span>
              <button
                type="button"
                className={styles.sheetCloseBtn}
                aria-label={dict.cancel}
                onClick={() => setSheetOpen(false)}
              >
                <IconClose size={18} />
              </button>
            </div>
            <div className={styles.sheetGrid}>
              <button
                type="button"
                className={styles.sheetActionCard}
                onClick={() => imageInputRef.current?.click()}
              >
                <div className={styles.sheetActionIcon}>
                  <IconImage size={22} />
                </div>
                <div className={styles.sheetActionTitle}>{dict.takePhotoOrImage}</div>
                <div className={styles.sheetActionSub}>{dict.takePhotoSub}</div>
              </button>
              <button
                type="button"
                className={styles.sheetActionCard}
                onClick={() => docInputRef.current?.click()}
              >
                <div className={styles.sheetActionIcon}>
                  <IconFile size={22} />
                </div>
                <div className={styles.sheetActionTitle}>{dict.uploadDocument}</div>
                <div className={styles.sheetActionSub}>{dict.uploadDocumentSub}</div>
              </button>
            </div>
            {text || attachments.length > 0 ? (
              <button
                type="button"
                className={styles.sheetDangerBtn}
                onClick={() => {
                  setText('')
                  setAttachments([])
                  setSheetOpen(false)
                }}
              >
                <IconTrash size={16} />
                <span>{dict.clearComposer}</span>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
