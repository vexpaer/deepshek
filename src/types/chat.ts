export type ThemePreference = 'light' | 'dark' | 'system'
export type LocalePreference = 'zh-CN' | 'en-US'
export type ApiProtocol = 'anthropic' | 'openai'
export type FontSizeScale = 'compact' | 'standard' | 'comfortable'
export type TtsVoice = 'stella' | 'tide' | 'system'

export interface AppSettings {
  apiKey: string
  baseUrl: string
  protocol: ApiProtocol
  model: string
  demoMode: boolean
  theme: ThemePreference
  locale: LocalePreference
  autoCollapseThinking: boolean
  hapticsEnabled: boolean
  fontSize: FontSizeScale
  ttsVoice: TtsVoice
  systemPrompt: string
}

export interface ChatAttachment {
  id: string
  name: string
  size: number
  mimeType: string
  kind: 'image' | 'file'
  dataUrl?: string
  textContent?: string
  remoteFileId?: string
  status: 'ready' | 'uploading' | 'error'
  errorMessage?: string
}

export interface SearchSource {
  id: string
  index: number
  title: string
  url: string
  siteName: string
  siteIcon?: string
  snippet: string
  publishedAt?: string | null
}

export interface SearchStep {
  id: string
  type: 'search' | 'read_link' | 'open_page'
  status: 'running' | 'done' | 'error'
  queries?: string[]
  url?: string
  title?: string
  sources: SearchSource[]
  errorMessage?: string
}

export interface CitationItem {
  index: number
  url: string
  title: string
  siteName: string
  citedText?: string
}

export interface RawAnthropicBlock {
  type: string
  [key: string]: unknown
}

export interface AssistantTurnData {
  thinking: string
  thinkingDurationSec: number
  thinkingDone: boolean
  steps: SearchStep[]
  content: string
  citations: CitationItem[]
  rawBlocks?: RawAnthropicBlock[]
  stopReason?: 'end_turn' | 'max_tokens' | 'refusal' | 'stopped' | 'error'
  errorMessage?: string
  errorKind?: 'invalid_key' | 'insufficient_balance' | 'rate_limit' | 'network' | 'generic'
  feedback?: 'like' | 'dislike' | null
  usage?: {
    inputTokens?: number
    outputTokens?: number
    thinkingTokens?: number
  }
}

export interface ChatMessage {
  id: string
  parentId: string | null
  role: 'user' | 'assistant'
  createdAt: number
  /** User message fields */
  text?: string
  attachments?: ChatAttachment[]
  deepThinkEnabled?: boolean
  webSearchEnabled?: boolean
  /** Assistant message fields */
  assistant?: AssistantTurnData
  modelUsed?: string
}

export interface ChatSession {
  id: string
  title: string
  pinned: boolean
  createdAt: number
  updatedAt: number
  messages: Record<string, ChatMessage>
  /** Selected child ID per parent node (parentId || 'root' -> childId) */
  activeBranch: Record<string, string>
}

export interface ApiVerificationResult {
  ok: boolean
  latencyMs: number
  models: string[]
  balance?: {
    isAvailable: boolean
    currency: string
    totalBalance: string
  }
  error?: string
}
