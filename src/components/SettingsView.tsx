import { useState } from 'react'
import type { ReactNode } from 'react'
import { useBackLayer } from '../hooks/useBackLayer'
import { useAppStore } from '../store/useAppStore'
import { SettingsDetail } from './SettingsDetail'
import { IconAccount, IconDatabase, IconGlobe, IconMoon, IconFont, IconInfo, IconHelp, IconLogout, IconFile, IconChevronRight, IconChevronLeft, IconCheck, IconSettings } from './Icons'
import styles from './SettingsView.module.css'

type Page = 'home' | 'account' | 'data' | 'language' | 'theme' | 'font' | 'advanced' | 'about'
export function SettingsView() {
  const settings = useAppStore((s) => s.settings)
  const update = useAppStore((s) => s.updateSettings)
  const close = useAppStore((s) => s.setSettingsOpen)
  const [page, setPage] = useState<Page>('home')
  const [confirmLogout, setConfirmLogout] = useState(false)
  const en = settings.locale === 'en-US'
  const back = () => page === 'home' ? close(false) : setPage('home')
  useBackLayer(true, back, 30)
  useBackLayer(confirmLogout, () => setConfirmLogout(false), 50)
  const title = ({ home: en ? 'Settings' : '设置', language: en ? 'Language' : '语言', theme: en ? 'Appearance' : '外观', font: en ? 'Font size' : '字体大小', about: en ? 'About Deepshek' : '关于 Deepshek' } as Partial<Record<Page, string>>)[page]
  const row = (icon: ReactNode, label: string, action: () => void, value?: string) => <button className={styles.menuRow} onClick={action}><span className={styles.menuIcon}>{icon}</span><span className={styles.menuLabel}>{label}</span>{value && <span className={styles.menuValue}>{value}</span>}<IconChevronRight size={20} /></button>
  const section = (label: string, children: ReactNode) => <section className={styles.menuSection}><h2>{label}</h2><div className={styles.menuCard}>{children}</div></section>
  const choice = (label: string, selected: boolean, action: () => void) => <button className={styles.choice} aria-pressed={selected} onClick={action}><span>{label}</span>{selected && <IconCheck size={23} />}</button>
  if (page === 'account' || page === 'data' || page === 'advanced') return <SettingsDetail page={page} onBack={() => setPage('home')} />
  return <div className={styles.settingsScreen} role="dialog" aria-modal="true" aria-label={title}>
    <header className={styles.topBar}><button className={styles.backBtn} aria-label={en ? 'Back' : '返回'} onClick={back}><IconChevronLeft size={25} /></button><h1 className={styles.topTitle}>{title}</h1><div className={styles.topSpacer} /></header>
    <div className={styles.menuScroll}>
      {page === 'home' && <>
        {section(en ? 'Account' : '账户', <>{row(<IconAccount />, en ? 'Account management' : '账号管理', () => setPage('account'))}{row(<IconDatabase />, en ? 'Data management' : '数据管理', () => setPage('data'))}</>)}
        {section(en ? 'App' : '应用', <>{row(<IconGlobe size={24} />, en ? 'Language' : '语言', () => setPage('language'), en ? 'English' : '中文 (简体中文)')}{row(<IconMoon size={24} />, en ? 'Appearance' : '外观', () => setPage('theme'), ({system: en ? 'System' : '系统', dark: en ? 'Dark' : '深色', light: en ? 'Light' : '浅色'})[settings.theme])}{row(<IconFont />, en ? 'Font size' : '字体大小', () => setPage('font'))}</>)}
        {section(en ? 'About' : '关于', <>{row(<IconInfo />, en ? 'Check for updates' : '检查更新', () => window.open('https://github.com/vexpaer/deepshek/releases/latest', '_blank', 'noopener,noreferrer'), '0.1.1')}{row(<IconFile size={24} />, en ? 'License & privacy' : '服务协议', () => setPage('about'))}</>)}
        <div className={styles.standalone}>{row(<IconHelp />, en ? 'Help & feedback' : '帮助与反馈', () => window.open('https://github.com/vexpaer/deepshek/issues', '_blank', 'noopener,noreferrer'))}</div>

        <div className={styles.standalone}>{row(<IconLogout />, en ? 'Disconnect API key' : '退出登录', () => setConfirmLogout(true))}</div>
        <div className={styles.extraSettings}>{row(<IconSettings size={24} />, en ? 'Chat & voice' : '对话与语音', () => setPage('advanced'))}</div>
      </>}
      {page === 'language' && <div className={styles.menuCard}>{choice('中文 (简体中文)', !en, () => update({ locale: 'zh-CN' }))}{choice('English', en, () => update({ locale: 'en-US' }))}</div>}
      {page === 'theme' && <div className={styles.menuCard}>{(['system', 'light', 'dark'] as const).map((value) => <div key={value}>{choice(({ system: en ? 'System' : '跟随系统', light: en ? 'Light' : '浅色', dark: en ? 'Dark' : '深色' })[value], settings.theme === value, () => update({ theme: value }))}</div>)}</div>}
      {page === 'font' && <><div className={styles.menuCard}>{(['compact', 'standard', 'comfortable'] as const).map((value) => <div key={value}>{choice(({ compact: en ? 'Small' : '小', standard: en ? 'Standard' : '标准', comfortable: en ? 'Large' : '大' })[value], settings.fontSize === value, () => update({ fontSize: value }))}</div>)}</div><div className={styles.fontPreview}><p>DeepSeek</p><div className="ds-markdown">{en ? 'A little curiosity goes a long way.' : '今天有什么可以帮到你？每一次提问，都开启新的可能。'}</div></div></>}
      {page === 'about' && <div className={styles.aboutCopy}><h2>Deepshek 0.1.1</h2><p>{en ? 'An independent, open source DeepSeek-style client.' : '独立开源的 DeepSeek 风格客户端。'}</p><p>{en ? 'Conversations and settings are stored on this device. Messages and attachments are sent to the API endpoint you configure. Backups include conversations and attachments, without your API key.' : '对话与设置保存在当前设备。发送消息时，消息与附件会传给你配置的 API 服务。备份包含对话和附件，不包含 API 密钥。'}</p><a href="https://github.com/vexpaer/deepshek/blob/main/LICENSE" target="_blank" rel="noreferrer">MIT License</a></div>}
    </div>
    {confirmLogout && <div className={styles.modalScrim} onClick={() => setConfirmLogout(false)}><div className={styles.dialogCard} role="alertdialog" aria-label={en ? 'Disconnect API key' : '退出登录'} onClick={(event) => event.stopPropagation()}><h2 className={styles.dialogTitle}>{en ? 'Disconnect API key?' : '退出当前 API 连接？'}</h2><p>{en ? 'The saved API key will be removed. Your conversations stay on this device.' : '将清除本机保存的 API 密钥，历史对话保留。'}</p><div className={styles.dialogActions}><button className={styles.secondaryBtn} onClick={() => setConfirmLogout(false)}>{en ? 'Cancel' : '取消'}</button><button className={styles.dangerBtn} onClick={() => { update({ apiKey: '' }); setConfirmLogout(false) }}>{en ? 'Disconnect' : '退出登录'}</button></div></div></div>}
  </div>
}
