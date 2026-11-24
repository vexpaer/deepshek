import { useEffect, useState } from 'react'
import { android, APP_VERSION, checkUpdate, downloaded, downloadUpdate, installUpdate, type Update } from '../services/updates'
import styles from './SettingsView.module.css'

export function UpdatePanel({ en }: { en: boolean }) {
  const [attempt, setAttempt] = useState(0)
  const [update, setUpdate] = useState<Update | null>(null)
  const [state, setState] = useState<'checking' | 'current' | 'available' | 'downloading' | 'ready' | 'installing' | 'error'>('checking')
  const [notice, setNotice] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    let mounted = true
    const timeout = setTimeout(() => controller.abort(), 15000)
    async function check() {
      setNotice('')
      setState('checking')
      try {
        const latest = await checkUpdate(controller.signal)
        const ready = android && latest && await downloaded(latest)
        if (!mounted) return
        setUpdate(latest)
        setState(!latest ? 'current' : ready ? 'ready' : 'available')
      } catch {
        if (mounted) setState('error')
      } finally { clearTimeout(timeout) }
    }
    void check()
    return () => { mounted = false; clearTimeout(timeout); controller.abort() }
  }, [attempt])
  async function download() {
    if (!update) return
    setNotice('')
    setState('downloading')
    try { await downloadUpdate(update); setState('ready') }
    catch { setState('available'); setNotice(en ? 'Download failed. Try again.' : '下载失败，请重试。') }
  }
  async function install() {
    if (!update) return
    setNotice('')
    setState('installing')
    try {
      const result = await installUpdate(update)
      if (result.permission) setNotice(en ? 'Allow installation, then return and tap Install.' : '允许安装后，请返回并再次点安装。')
      setState('ready')
    } catch {
      setNotice(en ? 'Cannot install this APK. Download it again.' : '无法安装此安装包，请重新下载。')
      setState('available')
    }
  }
  const messages = {
    checking: en ? 'Checking…' : '正在检查…',
    current: en ? 'You’re up to date' : '已是最新版本',
    error: en ? 'Could not check for updates' : '检查失败，请重试',
    available: en ? 'Update available' : '发现新版本',
    downloading: en ? 'Downloading…' : '正在下载…',
    ready: en ? 'Ready to install' : '已下载，可以安装',
    installing: en ? 'Opening installer…' : '正在打开安装程序…',
  }
  return <section className={styles.card}><div className={styles.fieldBlock}>
    <div>{en ? 'Installed version' : '当前版本'} · v{APP_VERSION}</div>
    <p role="status">{messages[state]} {update && update.tag}</p>
    {state === 'available' && (android
      ? <button className={styles.primaryBtn} onClick={download}>{en ? 'Download APK' : '下载 APK'}</button>
      : <a href={update!.url}>{en ? 'Download Android APK' : '下载 Android APK'}</a>)}
    {state === 'ready' && <button className={styles.primaryBtn} onClick={install}>{en ? 'Install' : '安装'}</button>}
    {notice && <p role="status">{notice}</p>}
    {(state === 'current' || state === 'error') && <button className={styles.secondaryBtn} onClick={() => setAttempt(i => i + 1)}>{en ? 'Check again' : '重新检查'}</button>}
  </div></section>
}
