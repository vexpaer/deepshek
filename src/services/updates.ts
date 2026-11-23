import { Capacitor, registerPlugin } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'

export const APP_VERSION = __APP_VERSION__
export const android = Capacitor.getPlatform() === 'android'
const repo = 'https://github.com/vexpaer/deepshek'
type Asset = { name: string; browser_download_url: string; digest?: string; size: number }
export type Update = { tag: string; url: string; digest: string; size: number }
const installer = registerPlugin<{ install(options: { digest: string }): Promise<{ permission: boolean }> }>('ApkInstaller')

export async function checkUpdate(signal: AbortSignal): Promise<Update | null> {
  const res = await fetch('https://api.github.com/repos/vexpaer/deepshek/releases/latest', { signal, cache: 'no-store' })
  if (!res.ok) throw new Error('release')
  const release = await res.json()
  const match = /^v(\d+\.\d+\.\d+)$/.exec(release.tag_name)
  if (!match) throw new Error('version')
  const installed = APP_VERSION.split('.').map(Number)
  const diff = match[1].split('.').map((v, i) => Number(v) - installed[i]).find(n => n !== 0)
  if (!diff || diff < 0) return null
  const tag = release.tag_name as string
  const name = `deepshek-${tag}-android.apk`
  const url = `${repo}/releases/download/${tag}/${name}`
  const asset = release.assets.find((a: Asset) => a.name === name && a.browser_download_url === url)
  if (!asset || !/^sha256:[a-f0-9]{64}$/.test(asset.digest) || !(asset.size > 0)) throw new Error('asset')
  return { tag, url, size: asset.size, digest: asset.digest.slice(7) }
}

function file(update: Update) {
  return { directory: Directory.Cache, path: `update-${update.digest}.apk` }
}
export async function downloaded(update: Update) {
  try { return (await Filesystem.stat(file(update))).size === update.size } catch { return false }
}
const downloads = new Map<string, Promise<void>>()
export function downloadUpdate(update: Update) {
  const existing = downloads.get(update.digest)
  if (existing) return existing
  const task = (async () => {
    await Filesystem.downloadFile({ ...file(update), url: update.url })
    if (!await downloaded(update)) throw new Error('size')
  })().finally(() => downloads.delete(update.digest))
  downloads.set(update.digest, task)
  return task
}
export const installUpdate = (update: Update) => installer.install({ digest: update.digest })
