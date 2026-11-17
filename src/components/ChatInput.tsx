import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { useBackLayer } from '../hooks/useBackLayer'
import { getDict } from '../i18n'
import { isNativePlatform, triggerHaptic } from '../services/native'
import { startVoice } from '../services/voice'
import { useAppStore } from '../store/useAppStore'
import type { ChatAttachment } from '../types/chat'
import { IconCamera, IconClose, IconFile, IconGlobe, IconImage, IconPaperclip, IconPlus, IconSend, IconStop, IconThink, IconVoice } from './Icons'
import styles from './ChatInput.module.css'

const MAX_FILES = 6
const MAX_BYTES = 20 * 1024 * 1024
function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
async function readFile(file: File): Promise<ChatAttachment> {
  const image = file.type.startsWith('image/')
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('读取附件失败'))
    reader.readAsDataURL(file)
  })
  const textContent = !image && (file.type.startsWith('text/') || /\.(txt|md|json|ts|tsx|js|py|csv|log)$/i.test(file.name)) ? await file.text() : undefined
  return { id: crypto.randomUUID(), name: file.name, size: file.size, mimeType: file.type || 'application/octet-stream', kind: image ? 'image' : 'file', dataUrl, textContent, status: 'ready' }
}

export function ChatInput() {
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
  const en = settings.locale === 'en-US'
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [expanded, setExpanded] = useState(false)
  const [recording, setRecording] = useState(false)
  const [cancelVoice, setCancelVoice] = useState(false)
  const [busy, setBusy] = useState(false)
  const [reading, setReading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInput = useRef<HTMLInputElement>(null)
  const cameraInput = useRef<HTMLInputElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const voiceRef = useRef<ReturnType<typeof startVoice>>(null)
  const holdTimer = useRef<ReturnType<typeof setTimeout>>()
  const hold = useRef<{ y: number; started: boolean; cancel: boolean; original: string } | null>(null)
  const mounted = useRef(true)
  const busyRef = useRef(false)
  const readingRef = useRef(false)
  const isStreaming = Boolean(streamingSessionId && streamingSessionId === activeSessionId)
  const canSend = Boolean(text.trim() || attachments.length)

  useBackLayer(expanded || recording, () => {
    if (recording) { voiceRef.current?.cancel(); setRecording(false) }
    else setExpanded(false)
  }, 10)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false; clearTimeout(holdTimer.current); voiceRef.current?.cancel() }
  }, [])
  useEffect(() => {
    const input = textareaRef.current
    if (input) { input.style.height = '0px'; input.style.height = `${Math.min(input.scrollHeight, 160)}px` }
  }, [text])
  useEffect(() => {
    const viewport = window.visualViewport
    const closeOnKeyboard = () => { if (window.innerHeight - (viewport?.height || window.innerHeight) > 100) setExpanded(false) }
    viewport?.addEventListener('resize', closeOnKeyboard)
    return () => viewport?.removeEventListener('resize', closeOnKeyboard)
  }, [])

  const addFiles = async (files: FileList | File[] | null) => {
    if (!files?.length || readingRef.current) return
    setExpanded(false)
    const list = Array.from(files)
    const capacity = MAX_FILES - attachments.length
    if (list.length > capacity) showToast(en ? 'Up to 6 attachments per message' : '每条消息最多添加 6 个附件')
    const valid = list.slice(0, capacity).filter((file) => file.size <= MAX_BYTES)
    if (valid.length < Math.min(list.length, capacity)) showToast(en ? 'Each file must be under 20 MB' : '单个附件不能超过 20 MB', 'error')
    readingRef.current = true
    setReading(true)
    try {
      const next = await Promise.all(valid.map(readFile))
      if (mounted.current) setAttachments((prev) => [...prev, ...next].slice(0, MAX_FILES))
    } catch { showToast(en ? 'Could not read attachment' : '读取附件失败', 'error') }
    finally { readingRef.current = false; if (mounted.current) setReading(false) }
  }

  const takePhoto = async () => {
    if (!isNativePlatform()) { cameraInput.current?.click(); return }
    try {
      const photo = await Camera.getPhoto({ source: CameraSource.Camera, resultType: CameraResultType.Uri, quality: 85, width: 2048, correctOrientation: true })
      if (photo.webPath) {
        const blob = await (await fetch(photo.webPath)).blob()
        await addFiles([new File([blob], `photo-${Date.now()}.${photo.format}`, { type: blob.type || `image/${photo.format}` })])
      }
    } catch (error) {
      if (!/cancel/i.test(String(error))) showToast(en ? 'Unable to open the camera. Check permissions.' : '无法打开相机，请检查相机权限', 'error')
    }
  }

  const beginVoice = () => {
    if (busyRef.current || readingRef.current || isStreaming) return
    setExpanded(false)
    textareaRef.current?.blur()
    const base = text
    setRecording(true)
    setCancelVoice(false)
    void triggerHaptic(settings.hapticsEnabled)
    voiceRef.current = startVoice(settings.locale,
      (transcript) => { if (mounted.current) setText(`${base}${base ? ' ' : ''}${transcript}`) },
      () => { if (mounted.current) { setRecording(false); setCancelVoice(false) } },
      () => { if (mounted.current) showToast(dict.voiceUnsupported, 'info') })
  }

  const send = async () => {
    if (isStreaming) { stopStreaming(); return }
    if (busyRef.current || readingRef.current || !canSend) return
    busyRef.current = true
    setBusy(true)
    voiceRef.current?.cancel()
    setExpanded(false)
    const sentText = text.trim()
    const sentAttachments = attachments
    setText(''); setAttachments([])
    textareaRef.current?.blur()
    try { await sendUserMessage(sentText, sentAttachments) }
    catch (error) {
      if (mounted.current) { setText(sentText); setAttachments(sentAttachments) }
      showToast(error instanceof Error ? error.message : (en ? 'Could not send message' : '发送失败，请重试'), 'error')
    } finally { busyRef.current = false; if (mounted.current) setBusy(false) }
  }

  const endHold = () => {
    clearTimeout(holdTimer.current)
    const state = hold.current
    hold.current = null
    if (!state?.started) return
    if (state.cancel) { voiceRef.current?.cancel(); setText(state.original) }
    else voiceRef.current?.stop()
    setCancelVoice(false)
  }

  return (
    <div className={styles.composerOuter}>
      <div className={styles.composerCard}>
        {!!attachments.length && <div className={styles.attachmentsRow}>
          {attachments.map((file) => <div className={styles.attachmentChip} key={file.id}>
            {file.kind === 'image' ? <button className={styles.thumbBtn} aria-label={file.name} onClick={() => setLightboxImageUrl(file.dataUrl!)}><img className={styles.thumbImg} src={file.dataUrl} alt={file.name} /></button> : <div className={styles.fileChipInner}><IconFile size={24} /><div className={styles.fileChipMeta}><div className={styles.fileChipName}>{file.name}</div><div className={styles.fileChipSize}>{formatBytes(file.size)}</div></div></div>}
            <button className={styles.removeChipBtn} aria-label={`${dict.delete} ${file.name}`} onClick={() => setAttachments((prev) => prev.filter((item) => item.id !== file.id))}><IconClose size={12} /></button>
          </div>)}
        </div>}
        <div className={styles.inputBoxWrap}>
          <textarea ref={textareaRef} rows={1} value={text} aria-label={en ? 'Message' : '消息'} placeholder={en ? 'Message or hold to talk' : dict.inputPlaceholder} className={clsx(styles.textarea, recording && styles.textareaHidden)}
            onChange={(event) => setText(event.target.value)} onFocus={() => setExpanded(false)}
            onPaste={(event) => { if (event.clipboardData.files.length) { event.preventDefault(); void addFiles(event.clipboardData.files) } }}
            onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && window.matchMedia('(pointer: fine)').matches) { event.preventDefault(); void send() } }}
            onPointerDown={(event) => {
              if (event.pointerType === 'mouse' || text) return
              hold.current = { y: event.clientY, started: false, cancel: false, original: text }
              holdTimer.current = setTimeout(() => { if (hold.current) { hold.current.started = true; beginVoice() } }, 450)
            }}
            onPointerMove={(event) => { if (hold.current) { const moved = hold.current.y - event.clientY; if (!hold.current.started && Math.abs(moved) > 12) clearTimeout(holdTimer.current); hold.current.cancel = moved > 60; if (hold.current.started) setCancelVoice(hold.current.cancel) } }}
            onPointerUp={endHold} onPointerCancel={() => { if (hold.current) hold.current.cancel = true; endHold() }} onContextMenu={(event) => { if (hold.current?.started) event.preventDefault() }} />
          {recording && <button className={clsx(styles.voiceSpectrumBanner, cancelVoice && styles.voiceCancel)} onClick={() => voiceRef.current?.stop()} aria-label={dict.voiceTapToStop}>
            <span className={styles.spectrumBars}>{Array.from({ length: 12 }, (_, index) => <span key={index} style={{ animationDelay: `${index * 75}ms` }} />)}</span>
            <span>{cancelVoice ? (en ? 'Release to cancel' : '松开取消') : (en ? 'Listening · tap to finish' : '正在聆听 · 点击结束')}</span>
          </button>}
        </div>
        <div className={styles.functionRow}>
          <div className={styles.leftToggles}>
            <button className={clsx(styles.pillToggle, deepThink && styles.pillToggleActive)} aria-pressed={deepThink} onClick={() => setDeepThink(!deepThink)}><IconThink size={19} /><span>{dict.deepThink}</span></button>
            <button className={clsx(styles.pillToggle, webSearch && styles.pillToggleActive)} aria-pressed={webSearch} onClick={() => setWebSearch(!webSearch)}><IconGlobe size={18} /><span>{dict.webSearch}</span></button>
          </div>
          <div className={styles.rightControls}>
            <button className={styles.iconActionBtn} aria-label={expanded ? (en ? 'Close attachments' : '收起附件') : dict.attachmentSheetTitle} aria-expanded={expanded} aria-controls="attachment-panel" disabled={reading || busy} onClick={() => { textareaRef.current?.blur(); voiceRef.current?.cancel(); setExpanded(!expanded); void triggerHaptic(settings.hapticsEnabled) }}><span className={styles.outlinedCircle}>{expanded ? <IconClose size={20} /> : <IconPlus size={23} />}</span></button>
            {canSend || isStreaming || busy ? <button className={styles.sendButton} aria-label={isStreaming ? (en ? 'Stop' : '停止生成') : (en ? 'Send' : '发送')} disabled={(!isStreaming && busy) || reading} onClick={() => void send()}>{isStreaming ? <IconStop size={19} /> : busy ? <span className={styles.loadingDot} /> : <IconSend size={24} />}</button> : <button className={clsx(styles.iconActionBtn, recording && styles.iconActionRecording)} aria-label={recording ? dict.voiceTapToStop : (en ? 'Voice input' : '语音输入')} onClick={() => recording ? voiceRef.current?.stop() : beginVoice()}><IconVoice size={32} /></button>}
          </div>
        </div>
        {reading && <div role="status" className={styles.reading}>{en ? 'Reading attachments…' : '正在读取附件…'}</div>}
      </div>
      {expanded && <div id="attachment-panel" className={styles.attachmentPanel} role="group" aria-label={dict.attachmentSheetTitle}>
        <button onClick={() => void takePhoto()}><IconCamera size={26} /><span>{en ? 'Camera' : '拍照'}</span></button>
        <button onClick={() => imageInput.current?.click()}><IconImage size={26} /><span>{en ? 'Photos' : '相册'}</span></button>
        <button onClick={() => fileInput.current?.click()}><IconPaperclip size={26} /><span>{en ? 'Files' : '文件'}</span></button>
      </div>}
      <input ref={cameraInput} data-testid="camera-input" type="file" accept="image/*" capture="environment" hidden onChange={(event) => { void addFiles(event.target.files); event.target.value = '' }} />
      <input ref={imageInput} data-testid="image-input" type="file" accept="image/*" multiple hidden onChange={(event) => { void addFiles(event.target.files); event.target.value = '' }} />
      <input ref={fileInput} data-testid="file-input" type="file" multiple hidden onChange={(event) => { void addFiles(event.target.files); event.target.value = '' }} />
    </div>
  )
}
