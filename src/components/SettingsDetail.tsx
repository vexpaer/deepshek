import React, { useRef, useState } from 'react'
import clsx from 'clsx'
import { formatMessage, getDict } from '../i18n'
import { verifyApiKeyConnection } from '../services/deepseekApi'
import { saveFile } from '../services/download'
import { exportSessionsToZip } from '../services/storage'
import { useAppStore } from '../store/useAppStore'
import type { ApiProtocol, ApiVerificationResult, FontSizeScale, ThemePreference } from '../types/chat'
import {
  DeepSeekWhaleLogo,
  IconCheck,
  IconChevronLeft,
  IconExternalLink,
  IconEye,
  IconKey,
  IconMoon,
  IconSun,
  IconSystem,
} from './Icons'
import styles from './SettingsView.module.css'

const PRESET_MODELS = [
  { id: 'deepseek-flash', label: 'deepseek-flash (V4.1 Flash)' },
  { id: 'deepseek-v4-pro', label: 'deepseek-v4-pro (V4 Pro)' },
  { id: 'deepseek-chat', label: 'deepseek-chat (V3)' },
  { id: 'deepseek-reasoner', label: 'deepseek-reasoner (R1)' },
]

export const SettingsDetail: React.FC<{ page: 'account' | 'data' | 'advanced'; onBack: () => void }> = ({ page, onBack }) => {
  const settingsOpen = useAppStore((s) => s.settingsOpen)
  const settings = useAppStore((s) => s.settings)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const sessions = useAppStore((s) => s.sessions)
  const clearAllSessions = useAppStore((s) => s.clearAllSessions)
  const importZip = useAppStore((s) => s.importZip)
  const showToast = useAppStore((s) => s.showToast)

  const dict = getDict(settings.locale)

  const [apiKeyDraft, setApiKeyDraft] = useState(settings.apiKey)
  const [baseUrlDraft, setBaseUrlDraft] = useState(settings.baseUrl)
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [verifyResult, setVerifyResult] = useState<ApiVerificationResult | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)

  if (!settingsOpen) return null

  const saveApiFields = () => {
    updateSettings({
      apiKey: apiKeyDraft.trim(),
      baseUrl: baseUrlDraft.trim() || 'https://api.deepseek.com',
    })
    showToast(settings.locale === 'en-US' ? 'API configuration saved' : 'API 配置已保存', 'success')
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setVerifyResult(null)
    const result = await verifyApiKeyConnection(apiKeyDraft, baseUrlDraft)
    setVerifyResult(result)
    setTesting(false)
    if (result.ok) {
      updateSettings({
        apiKey: apiKeyDraft.trim(),
        baseUrl: baseUrlDraft.trim() || 'https://api.deepseek.com',
      })
      showToast(
        formatMessage(dict.settingsKeyValid, { ms: result.latencyMs }),
        'success'
      )
    } else {
      showToast(
        formatMessage(dict.settingsKeyInvalid, { error: result.error || 'Unknown' }),
        'error'
      )
    }
  }

  const handleExportZip = async () => {
    try {
      const { filename, blob } = exportSessionsToZip(sessions)
      await saveFile(filename, blob)
      showToast('导出成功', 'success')
    } catch {
      showToast('导出失败', 'error')
    }
  }

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const count = await importZip(file)
      showToast(`已导入 ${count} 条对话`, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '导入失败', 'error')
    }
  }

  const availableModels = Array.from(
    new Set([
      ...PRESET_MODELS.map((m) => m.id),
      ...(verifyResult?.models ?? []),
      settings.model,
    ].filter(Boolean))
  )

  return (
    <div className={styles.settingsScreen} role="dialog" aria-label={dict.settingsTitle}>
      <header className={styles.topBar}>
        <button
          type="button"
          className={styles.backBtn}
          aria-label={dict.back}
          onClick={onBack}
        >
          <IconChevronLeft size={21} />
        </button>
        <h1 className={styles.topTitle}>{page === 'account' ? '账号管理' : page === 'data' ? '数据管理' : '对话与语音'}</h1>
        <div className={styles.topSpacer} />
      </header>

      <div className={styles.scrollContent}>
        {/* Section 1: Personal DeepSeek API Key */}
        {page === 'account' && (<section className={styles.section}>
          <div className={styles.sectionTitle}>
            <IconKey size={14} />
            <span>{dict.settingsApiSection}</span>
          </div>
          <div className={styles.card}>
            <div className={styles.fieldBlock}>
              <div className={styles.fieldHeader}>
                <label className={styles.fieldLabel}>{dict.settingsApiKeyLabel}</label>
                <a
                  href="https://platform.deepseek.com/api_keys"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.helperLink}
                >
                  <span>{dict.settingsGetKeyTip}</span>
                  <IconExternalLink size={12} />
                </a>
              </div>
              <div className={styles.inputRow}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKeyDraft}
                  placeholder={dict.settingsApiKeyPlaceholder}
                  autoComplete="off"
                  spellCheck={false}
                  className={styles.textInput}
                  onChange={(e) => setApiKeyDraft(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.inputIconBtn}
                  aria-label="Toggle visibility"
                  onClick={() => setShowKey((v) => !v)}
                >
                  <IconEye size={16} off={showKey} />
                </button>
              </div>
              <div className={styles.apiBtnRow}>
                <button
                  type="button"
                  disabled={testing || !apiKeyDraft.trim()}
                  className={styles.secondaryBtn}
                  onClick={() => void handleTestConnection()}
                >
                  {testing ? dict.settingsTesting : dict.settingsTestConnection}
                </button>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={saveApiFields}
                >
                  {dict.settingsSaveKey}
                </button>
                {apiKeyDraft ? (
                  <button
                    type="button"
                    className={styles.ghostDangerBtn}
                    onClick={() => {
                      setApiKeyDraft('')
                      setVerifyResult(null)
                      updateSettings({ apiKey: '' })
                    }}
                  >
                    {dict.settingsClearKey}
                  </button>
                ) : null}
              </div>

              {verifyResult ? (
                <div
                  className={clsx(
                    styles.verifyBanner,
                    verifyResult.ok ? styles.verifyOk : styles.verifyErr
                  )}
                >
                  <div className={styles.verifyLine}>
                    {verifyResult.ok ? <IconCheck size={14} /> : null}
                    <span>
                      {verifyResult.ok
                        ? formatMessage(dict.settingsKeyValid, { ms: verifyResult.latencyMs })
                        : formatMessage(dict.settingsKeyInvalid, {
                            error: verifyResult.error || 'Error',
                          })}
                    </span>
                  </div>
                  {verifyResult.balance ? (
                    <div className={styles.balanceText}>
                      {dict.settingsBalanceLabel}: {verifyResult.balance.totalBalance}{' '}
                      {verifyResult.balance.currency}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className={styles.divider} />

            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel}>{dict.settingsBaseUrlLabel}</label>
              <input
                type="url"
                value={baseUrlDraft}
                placeholder="https://api.deepseek.com"
                className={styles.textInput}
                onChange={(e) => setBaseUrlDraft(e.target.value)}
                onBlur={() =>
                  updateSettings({
                    baseUrl: baseUrlDraft.trim() || 'https://api.deepseek.com',
                  })
                }
              />
            </div>

            <div className={styles.divider} />

            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel}>{dict.settingsProtocolLabel}</label>
              <select
                value={settings.protocol}
                className={styles.selectInput}
                onChange={(e) => updateSettings({ protocol: e.target.value as ApiProtocol })}
              >
                <option value="anthropic">{dict.settingsProtocolAnthropic}</option>
                <option value="openai">{dict.settingsProtocolOpenAI}</option>
              </select>
            </div>

            <div className={styles.divider} />

            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel}>{dict.settingsModelLabel}</label>
              <select
                value={settings.model}
                className={styles.selectInput}
                onChange={(e) => updateSettings({ model: e.target.value })}
              >
                {availableModels.map((m) => {
                  const preset = PRESET_MODELS.find((p) => p.id === m)
                  return (
                    <option key={m} value={m}>
                      {preset ? preset.label : m}
                    </option>
                  )
                })}
              </select>
            </div>

            <div className={styles.divider} />

            <div className={styles.switchRow}>
              <div className={styles.switchText}>
                <div className={styles.switchTitle}>{dict.settingsDemoModeLabel}</div>
                <div className={styles.switchDesc}>{dict.settingsDemoModeDesc}</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.demoMode}
                className={clsx(styles.switchTrack, settings.demoMode && styles.switchOn)}
                onClick={() => updateSettings({ demoMode: !settings.demoMode })}
              >
                <span className={styles.switchThumb} />
              </button>
            </div>
          </div>
        </section>)}

        {/* Section 2: Appearance & Interaction */}
        {page === 'advanced' && (<section className={styles.section}>
          <div className={styles.sectionTitle}>{dict.settingsAppearanceSection}</div>
          <div className={styles.card}>
            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel}>{dict.settingsThemeLabel}</label>
              <div className={styles.segmentedGrid}>
                {(
                  [
                    { val: 'light', label: dict.settingsThemeLight, icon: <IconSun size={15} /> },
                    { val: 'dark', label: dict.settingsThemeDark, icon: <IconMoon size={15} /> },
                    {
                      val: 'system',
                      label: dict.settingsThemeSystem,
                      icon: <IconSystem size={15} />,
                    },
                  ] as Array<{ val: ThemePreference; label: string; icon: React.ReactNode }>
                ).map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    className={clsx(
                      styles.segmentBtn,
                      settings.theme === item.val && styles.segmentBtnActive
                    )}
                    onClick={() => updateSettings({ theme: item.val })}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.inlineRow}>
              <span className={styles.rowLabel}>{dict.settingsLocaleLabel}</span>
              <select
                value={settings.locale}
                className={styles.compactSelect}
                onChange={(e) =>
                  updateSettings({ locale: e.target.value as 'zh-CN' | 'en-US' })
                }
              >
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            </div>

            <div className={styles.divider} />

            <div className={styles.inlineRow}>
              <span className={styles.rowLabel}>{dict.settingsFontSizeLabel}</span>
              <div className={styles.miniSegments}>
                {(
                  [
                    { val: 'compact', label: dict.settingsFontCompact },
                    { val: 'standard', label: dict.settingsFontStandard },
                    { val: 'comfortable', label: dict.settingsFontComfortable },
                  ] as Array<{ val: FontSizeScale; label: string }>
                ).map((f) => (
                  <button
                    key={f.val}
                    type="button"
                    className={clsx(
                      styles.miniSegBtn,
                      settings.fontSize === f.val && styles.miniSegBtnActive
                    )}
                    onClick={() => updateSettings({ fontSize: f.val })}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.divider} />

            <div className={styles.switchRow}>
              <div className={styles.switchText}>
                <div className={styles.switchTitle}>{dict.settingsAutoCollapseLabel}</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.autoCollapseThinking}
                className={clsx(
                  styles.switchTrack,
                  settings.autoCollapseThinking && styles.switchOn
                )}
                onClick={() =>
                  updateSettings({ autoCollapseThinking: !settings.autoCollapseThinking })
                }
              >
                <span className={styles.switchThumb} />
              </button>
            </div>

            <div className={styles.divider} />

            <div className={styles.switchRow}>
              <div className={styles.switchText}>
                <div className={styles.switchTitle}>{dict.settingsHapticsLabel}</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.hapticsEnabled}
                className={clsx(styles.switchTrack, settings.hapticsEnabled && styles.switchOn)}
                onClick={() => updateSettings({ hapticsEnabled: !settings.hapticsEnabled })}
              >
                <span className={styles.switchThumb} />
              </button>
            </div>

            <div className={styles.divider} />

            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel}>{dict.settingsSystemPromptLabel}</label>
              <textarea
                rows={2}
                value={settings.systemPrompt}
                placeholder={dict.settingsSystemPromptPlaceholder}
                className={styles.textareaInput}
                onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
              />
            </div>
          </div>
        </section>)}

        {/* Section 3: Voice */}
        {page === 'advanced' && (<section className={styles.section}>
          <div className={styles.sectionTitle}>{dict.settingsVoiceSection}</div>
          <div className={styles.card}>
            <div className={styles.inlineRow}>
              <span className={styles.rowLabel}>{dict.settingsTtsVoiceLabel}</span>
              <select
                value={settings.ttsVoice}
                className={styles.compactSelect}
                onChange={(e) =>
                  updateSettings({ ttsVoice: e.target.value as 'stella' | 'tide' | 'system' })
                }
              >
                <option value="stella">{dict.settingsTtsStella}</option>
                <option value="tide">{dict.settingsTtsTide}</option>
                <option value="system">{dict.settingsTtsSystem}</option>
              </select>
            </div>
          </div>
        </section>)}

        {/* Section 4: Data & Backup */}
        {page === 'data' && (<section className={styles.section}>
          <div className={styles.sectionTitle}>{dict.settingsDataSection}</div>
          <div className={styles.card}>
            <div className={styles.inlineRow}>
              <div className={styles.switchText}>
                <div className={styles.switchTitle}>{dict.settingsImportZip}</div>
                <div className={styles.switchDesc}>{dict.settingsImportDesc}</div>
              </div>
              <button
                type="button"
                className={styles.outlinePillBtn}
                onClick={() => importInputRef.current?.click()}
              >
                导入
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept=".zip,application/zip"
                hidden
                onChange={(e) => {
                  void handleImportFile(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </div>

            <div className={styles.divider} />

            <div className={styles.inlineRow}>
              <div className={styles.switchText}>
                <div className={styles.switchTitle}>{dict.settingsExportZip}</div>
                <div className={styles.switchDesc}>{dict.settingsExportDesc}</div>
              </div>
              <button
                type="button"
                disabled={sessions.length === 0}
                className={styles.outlinePillBtn}
                onClick={handleExportZip}
              >
                导出
              </button>
            </div>

            <div className={styles.divider} />

            <button
              type="button"
              className={styles.clearAllBtn}
              onClick={() => setConfirmClear(true)}
            >
              {dict.settingsClearAll}
            </button>
          </div>
        </section>)}

        {/* Section 5: About */}
        {false && (<section className={styles.section}>
          <div className={styles.sectionTitle}>{dict.settingsAboutSection}</div>
          <div className={styles.card}>
            <div className={styles.aboutHeader}>
              <DeepSeekWhaleLogo size={36} />
              <div>
                <div className={styles.aboutName}>Deepshek Android</div>
                <div className={styles.aboutVersion}>{dict.settingsVersionLabel} v0.2.0</div>
              </div>
            </div>
            <div className={styles.aboutDesc}>{dict.settingsProjectDesc}</div>
          </div>
        </section>)}
      </div>

      {confirmClear ? (
        <div className={styles.modalScrim} onClick={() => setConfirmClear(false)}>
          <div className={styles.dialogCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dialogTitle}>{dict.settingsClearAll}</div>
            <div className={styles.dialogBody}>{dict.settingsClearAllConfirm}</div>
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setConfirmClear(false)}
              >
                {dict.cancel}
              </button>
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={async () => {
                  await clearAllSessions()
                  setConfirmClear(false)
                  showToast('已清空所有历史对话', 'success')
                }}
              >
                {dict.confirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
