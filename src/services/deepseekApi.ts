import type {
  ApiVerificationResult,
  AppSettings,
  AssistantTurnData,
  ChatMessage,
  CitationItem,
  RawAnthropicBlock,
  SearchSource,
  SearchStep,
} from '../types/chat'

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '')
  return trimmed || 'https://api.deepseek.com'
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'web'
  }
}

export async function verifyApiKeyConnection(
  apiKey: string,
  baseUrl: string
): Promise<ApiVerificationResult> {
  const cleanKey = apiKey.trim()
  if (!cleanKey) {
    return { ok: false, latencyMs: 0, models: [], error: 'API Key 不能为空' }
  }
  const origin = normalizeBaseUrl(baseUrl)
  const started = performance.now()
  try {
    const res = await fetch(`${origin}/models`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cleanKey}`,
      },
    })
    const latencyMs = Math.round(performance.now() - started)
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      let errMsg = `HTTP ${res.status}`
      try {
        const parsed = JSON.parse(text) as { error?: { message?: string } }
        if (parsed?.error?.message) errMsg = parsed.error.message
      } catch {
        if (text) errMsg = text.slice(0, 120)
      }
      return { ok: false, latencyMs, models: [], error: errMsg }
    }
    const data = (await res.json()) as { data?: Array<{ id?: string }> }
    const models = (data.data ?? [])
      .map((m) => m.id)
      .filter((id): id is string => Boolean(id))

    let balance: ApiVerificationResult['balance'] | undefined
    try {
      const balRes = await fetch(`${origin}/user/balance`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${cleanKey}` },
      })
      if (balRes.ok) {
        const balJson = (await balRes.json()) as {
          is_available?: boolean
          balance_infos?: Array<{ currency?: string; total_balance?: string }>
        }
        const info = balJson.balance_infos?.[0]
        if (info) {
          balance = {
            isAvailable: Boolean(balJson.is_available),
            currency: info.currency || 'CNY',
            totalBalance: info.total_balance || '0.00',
          }
        }
      }
    } catch {
      // Balance endpoint is optional on custom relays
    }

    return { ok: true, latencyMs, models, balance }
  } catch (err) {
    const latencyMs = Math.round(performance.now() - started)
    return {
      ok: false,
      latencyMs,
      models: [],
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function uploadFileToDeepSeek(
  apiKey: string,
  baseUrl: string,
  file: File,
  kind: 'image' | 'file'
): Promise<string> {
  const origin = normalizeBaseUrl(baseUrl)
  const form = new FormData()
  if (kind === 'file') {
    form.append('purpose', 'file_extract')
  }
  form.append('file', file)
  const res = await fetch(`${origin}/anthropic/v1/files`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey.trim(),
      'anthropic-beta': 'files-api-2025-04-14',
    },
    body: form,
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText)
    throw new Error(txt || `Upload failed (${res.status})`)
  }
  const json = (await res.json()) as { id: string }
  return json.id
}

async function* parseSseStream(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal
): AsyncGenerator<{ event: string; data: string }> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let currentEvent = ''
  let dataLines: string[] = []

  try {
    while (!signal.aborted) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (line === '') {
          if (dataLines.length > 0) {
            yield { event: currentEvent || 'message', data: dataLines.join('\n') }
          }
          currentEvent = ''
          dataLines = []
        } else if (line.startsWith(':')) {
          // SSE keep-alive comment
        } else if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim()
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trimStart())
        }
      }
    }
    if (dataLines.length > 0) {
      yield { event: currentEvent || 'message', data: dataLines.join('\n') }
    }
  } finally {
    reader.releaseLock()
  }
}

export interface StreamCallbacks {
  onUpdate: (turn: AssistantTurnData) => void
  onTitle?: (title: string) => void
}

function classifyHttpError(
  status: number | undefined,
  message: string
): AssistantTurnData['errorKind'] {
  if (status === 401 || /invalid.*api.*key|authentication/i.test(message)) {
    return 'invalid_key'
  }
  if (status === 402 || /insufficient.*balance|quota/i.test(message)) {
    return 'insufficient_balance'
  }
  if (status === 429) return 'rate_limit'
  if (status === undefined) return 'network'
  return 'generic'
}

export async function streamAssistantResponse({
  settings,
  thread,
  deepThink,
  webSearch,
  signal,
  callbacks,
}: {
  settings: AppSettings
  thread: ChatMessage[]
  deepThink: boolean
  webSearch: boolean
  signal: AbortSignal
  callbacks: StreamCallbacks
}): Promise<AssistantTurnData> {
  const cleanKey = settings.apiKey.trim()
  if (!cleanKey) {
    if (settings.demoMode) {
      return runDemoSimulation({ thread, deepThink, webSearch, signal, callbacks })
    }
    const errTurn: AssistantTurnData = {
      thinking: '',
      thinkingDurationSec: 0,
      thinkingDone: true,
      steps: [],
      content: '',
      citations: [],
      stopReason: 'error',
      errorKind: 'invalid_key',
      errorMessage:
        settings.locale === 'en-US'
          ? 'Please configure your personal DeepSeek API Key in Settings.'
          : '请先在「设置」中配置你的个人 DeepSeek API Key。',
    }
    callbacks.onUpdate(errTurn)
    return errTurn
  }

  if (settings.protocol === 'anthropic') {
    return streamAnthropicProtocol({
      settings,
      thread,
      deepThink,
      webSearch,
      signal,
      callbacks,
    })
  }
  return streamOpenAIProtocol({
    settings,
    thread,
    deepThink,
    webSearch,
    signal,
    callbacks,
  })
}

function buildAnthropicMessages(thread: ChatMessage[]): Array<{
  role: 'user' | 'assistant'
  content: string | RawAnthropicBlock[]
}> {
  const out: Array<{ role: 'user' | 'assistant'; content: string | RawAnthropicBlock[] }> = []
  for (const msg of thread) {
    if (msg.role === 'user') {
      const blocks: RawAnthropicBlock[] = []
      for (const att of msg.attachments ?? []) {
        if (att.remoteFileId) {
          if (att.kind === 'image') {
            blocks.push({
              type: 'image',
              source: { type: 'file', file_id: att.remoteFileId },
            })
          } else {
            blocks.push({
              type: 'document',
              source: { type: 'file', file_id: att.remoteFileId },
            })
          }
        } else if (att.kind === 'image' && att.dataUrl) {
          const match = att.dataUrl.match(/^data:([^;]+);base64,(.+)$/)
          if (match) {
            blocks.push({
              type: 'image',
              source: { type: 'base64', media_type: match[1], data: match[2] },
            })
          }
        } else if (att.textContent) {
          blocks.push({
            type: 'text',
            text: `[附件: ${att.name}]\n\`\`\`\n${att.textContent.slice(0, 24000)}\n\`\`\``,
          })
        }
      }
      if (msg.text) {
        blocks.push({ type: 'text', text: msg.text })
      }
      out.push({
        role: 'user',
        content: blocks.length === 1 && blocks[0].type === 'text' ? String(blocks[0].text) : blocks,
      })
    } else if (msg.role === 'assistant' && msg.assistant) {
      if (msg.assistant.rawBlocks && msg.assistant.rawBlocks.length > 0) {
        out.push({ role: 'assistant', content: msg.assistant.rawBlocks })
      } else if (msg.assistant.content) {
        out.push({ role: 'assistant', content: msg.assistant.content })
      }
    }
  }
  return out
}

async function streamAnthropicProtocol({
  settings,
  thread,
  deepThink,
  webSearch,
  signal,
  callbacks,
}: {
  settings: AppSettings
  thread: ChatMessage[]
  deepThink: boolean
  webSearch: boolean
  signal: AbortSignal
  callbacks: StreamCallbacks
}): Promise<AssistantTurnData> {
  const origin = normalizeBaseUrl(settings.baseUrl)
  const messages = buildAnthropicMessages(thread)
  const hasRemoteFiles = thread.some((m) =>
    m.attachments?.some((a) => Boolean(a.remoteFileId))
  )

  const tools: Array<{ type: string; name: string }> = [
    { type: 'deepseek_read_url', name: 'deepseek_read_url' },
  ]
  if (webSearch) {
    tools.unshift({ type: 'deepseek_web_search', name: 'deepseek_web_search' })
  }

  const body: Record<string, unknown> = {
    model: settings.model || 'deepseek-flash',
    max_tokens: 8192,
    thinking: { type: deepThink ? 'enabled' : 'disabled' },
    tools,
    title: { enabled: thread.length <= 2 },
    messages,
    stream: true,
  }
  if (settings.systemPrompt.trim()) {
    body.system = settings.systemPrompt.trim()
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
    'x-api-key': settings.apiKey.trim(),
  }
  if (hasRemoteFiles) {
    headers['anthropic-beta'] = 'files-api-2025-04-14'
  }

  const turn: AssistantTurnData = {
    thinking: '',
    thinkingDurationSec: 0,
    thinkingDone: !deepThink,
    steps: [],
    content: '',
    citations: [],
    rawBlocks: [],
  }

  let thinkStartTime: number | null = null
  const activeBlocks = new Map<number, RawAnthropicBlock>()
  const stepByToolId = new Map<string, SearchStep>()
  const seenUrls = new Map<string, number>()

  const emit = () => {
    if (thinkStartTime && !turn.thinkingDone) {
      turn.thinkingDurationSec = Math.max(
        1,
        Math.round((Date.now() - thinkStartTime) / 1000)
      )
    }
    callbacks.onUpdate({
      ...turn,
      steps: turn.steps.map((s) => ({ ...s })),
      citations: [...turn.citations],
    })
  }

  try {
    const res = await fetch(`${origin}/anthropic/v1/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText)
      let msg = errText || `HTTP ${res.status}`
      try {
        const parsed = JSON.parse(errText) as { error?: { message?: string } }
        if (parsed?.error?.message) msg = parsed.error.message
      } catch {
        // use raw text
      }
      turn.stopReason = 'error'
      turn.errorMessage = msg
      turn.errorKind = classifyHttpError(res.status, msg)
      turn.thinkingDone = true
      emit()
      return turn
    }

    if (!res.body) {
      throw new Error('Empty response body')
    }

    for await (const { event: eventName, data } of parseSseStream(res.body, signal)) {
      let payload: Record<string, unknown>
      try {
        payload = JSON.parse(data) as Record<string, unknown>
      } catch {
        continue
      }

      if (eventName === 'error' || payload.type === 'error') {
        const errObj = payload.error as { message?: string } | undefined
        const msg = errObj?.message || 'Stream error'
        turn.stopReason = 'error'
        turn.errorMessage = msg
        turn.errorKind = classifyHttpError(undefined, msg)
        turn.thinkingDone = true
        emit()
        return turn
      }

      if (payload.type === 'content_block_start') {
        const idx = Number(payload.index ?? 0)
        const block = (payload.content_block ?? {}) as RawAnthropicBlock
        activeBlocks.set(idx, { ...block })

        if (block.type === 'thinking' && !thinkStartTime) {
          thinkStartTime = Date.now()
        } else if (block.type === 'server_tool_use') {
          const id = String(block.id ?? `tool_${idx}`)
          const input = (block.input ?? {}) as Record<string, unknown>
          const action = String(input.action ?? 'search')
          const step: SearchStep = {
            id,
            type:
              action === 'read_link'
                ? 'read_link'
                : action === 'open_page'
                  ? 'open_page'
                  : 'search',
            status: 'running',
            queries: Array.isArray(input.queries) ? (input.queries as string[]) : undefined,
            url: typeof input.url === 'string' ? input.url : undefined,
            sources: [],
          }
          stepByToolId.set(id, step)
          turn.steps.push(step)
          emit()
        } else if (block.type === 'web_search_tool_result') {
          const toolUseId = String(block.tool_use_id ?? '')
          const step = stepByToolId.get(toolUseId)
          const rawResults = Array.isArray(block.content)
            ? (block.content as Array<Record<string, unknown>>)
            : []
          const sources: SearchSource[] = []
          for (const r of rawResults) {
            if (r.type === 'web_search_result' && typeof r.url === 'string') {
              let sourceIndex = seenUrls.get(r.url)
              if (!sourceIndex) {
                sourceIndex = seenUrls.size + 1
                seenUrls.set(r.url, sourceIndex)
              }
              sources.push({
                id: `${toolUseId}_${sources.length}`,
                index: sourceIndex,
                title: String(r.title ?? r.url),
                url: r.url,
                siteName: String(r.site_name ?? getHostname(r.url)),
                siteIcon: typeof r.site_icon === 'string' ? r.site_icon : undefined,
                snippet: String(r.snippet ?? ''),
                publishedAt: typeof r.page_age === 'string' ? r.page_age : null,
              })
            }
          }
          if (step) {
            step.status = sources.length > 0 ? 'done' : 'done'
            step.sources = sources
          }
          emit()
        } else if (block.type === 'web_fetch_tool_result') {
          const toolUseId = String(block.tool_use_id ?? '')
          const step = stepByToolId.get(toolUseId)
          const fetchContent = (block.content ?? {}) as Record<string, unknown>
          if (step) {
            if (fetchContent.type === 'web_fetch_result' && typeof fetchContent.url === 'string') {
              const doc = (fetchContent.content ?? {}) as Record<string, unknown>
              const title = typeof doc.title === 'string' ? doc.title : fetchContent.url
              let sourceIndex = seenUrls.get(fetchContent.url)
              if (!sourceIndex) {
                sourceIndex = seenUrls.size + 1
                seenUrls.set(fetchContent.url, sourceIndex)
              }
              step.status = 'done'
              step.title = title
              step.sources = [
                {
                  id: `${toolUseId}_fetch`,
                  index: sourceIndex,
                  title,
                  url: fetchContent.url,
                  siteName: getHostname(fetchContent.url),
                  snippet: '',
                  publishedAt:
                    typeof fetchContent.published_at === 'string'
                      ? fetchContent.published_at
                      : null,
                },
              ]
            } else {
              step.status = 'error'
              step.errorMessage = String(fetchContent.error_code ?? 'unavailable')
            }
          }
          emit()
        } else if (block.type === 'text') {
          if (thinkStartTime && !turn.thinkingDone) {
            turn.thinkingDone = true
            turn.thinkingDurationSec = Math.max(
              1,
              Math.round((Date.now() - thinkStartTime) / 1000)
            )
          }
        }
      } else if (payload.type === 'content_block_delta') {
        const idx = Number(payload.index ?? 0)
        const delta = (payload.delta ?? {}) as Record<string, unknown>
        const block = activeBlocks.get(idx)

        if (delta.type === 'thinking_delta' && typeof delta.thinking === 'string') {
          if (!thinkStartTime) thinkStartTime = Date.now()
          turn.thinking += delta.thinking
          if (block) {
            block.thinking = String(block.thinking ?? '') + delta.thinking
          }
          emit()
        } else if (delta.type === 'signature_delta' && typeof delta.signature === 'string') {
          if (block) {
            block.signature = String(block.signature ?? '') + delta.signature
          }
        } else if (delta.type === 'text_delta' && typeof delta.text === 'string') {
          if (!turn.thinkingDone) {
            turn.thinkingDone = true
            if (thinkStartTime) {
              turn.thinkingDurationSec = Math.max(
                1,
                Math.round((Date.now() - thinkStartTime) / 1000)
              )
            }
          }
          turn.content += delta.text
          if (block) {
            block.text = String(block.text ?? '') + delta.text
          }
          emit()
        } else if (delta.type === 'citations_delta' && delta.citation) {
          const cit = delta.citation as Record<string, unknown>
          if (typeof cit.url === 'string') {
            let num = seenUrls.get(cit.url)
            if (!num) {
              num = seenUrls.size + 1
              seenUrls.set(cit.url, num)
            }
            const item: CitationItem = {
              index: num,
              url: cit.url,
              title: typeof cit.title === 'string' && cit.title ? cit.title : cit.url,
              siteName: getHostname(cit.url),
              citedText: typeof cit.cited_text === 'string' ? cit.cited_text : undefined,
            }
            if (!turn.citations.some((c) => c.index === item.index)) {
              turn.citations.push(item)
            }
            turn.content += `[${num}]`
            if (block) {
              const existing = Array.isArray(block.citations) ? block.citations : []
              block.citations = [...existing, cit]
            }
            emit()
          }
        }
      } else if (payload.type === 'content_block_stop') {
        const idx = Number(payload.index ?? 0)
        const block = activeBlocks.get(idx)
        if (block) {
          turn.rawBlocks?.push(block)
        }
      } else if (payload.type === 'message_delta') {
        const delta = (payload.delta ?? {}) as Record<string, unknown>
        if (typeof delta.title === 'string' && delta.title.trim()) {
          callbacks.onTitle?.(delta.title.trim())
        }
        if (delta.stop_reason === 'refusal') {
          turn.stopReason = 'refusal'
        } else if (delta.stop_reason === 'max_tokens') {
          turn.stopReason = 'max_tokens'
        } else if (delta.stop_reason === 'end_turn') {
          turn.stopReason = 'end_turn'
        }
        const usage = payload.usage as Record<string, unknown> | undefined
        if (usage) {
          const outDetails = usage.output_tokens_details as Record<string, unknown> | undefined
          turn.usage = {
            inputTokens: Number(usage.input_tokens ?? 0),
            outputTokens: Number(usage.output_tokens ?? 0),
            thinkingTokens: outDetails ? Number(outDetails.thinking_tokens ?? 0) : undefined,
          }
        }
      } else if (payload.type === 'message_stop') {
        turn.thinkingDone = true
        if (!turn.stopReason) turn.stopReason = 'end_turn'
        emit()
        return turn
      }
    }

    turn.thinkingDone = true
    if (!turn.stopReason) {
      turn.stopReason = signal.aborted ? 'stopped' : 'end_turn'
    }
    emit()
    return turn
  } catch (err) {
    if (signal.aborted) {
      turn.thinkingDone = true
      turn.stopReason = 'stopped'
      emit()
      return turn
    }
    turn.thinkingDone = true
    turn.stopReason = 'error'
    turn.errorMessage = err instanceof Error ? err.message : String(err)
    turn.errorKind = 'network'
    emit()
    return turn
  }
}

async function streamOpenAIProtocol({
  settings,
  thread,
  deepThink,
  webSearch,
  signal,
  callbacks,
}: {
  settings: AppSettings
  thread: ChatMessage[]
  deepThink: boolean
  webSearch: boolean
  signal: AbortSignal
  callbacks: StreamCallbacks
}): Promise<AssistantTurnData> {
  const origin = normalizeBaseUrl(settings.baseUrl)
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: unknown }> = []

  if (settings.systemPrompt.trim()) {
    messages.push({ role: 'system', content: settings.systemPrompt.trim() })
  }

  for (const m of thread) {
    if (m.role === 'user') {
      const parts: Array<Record<string, unknown>> = []
      for (const att of m.attachments ?? []) {
        if (att.kind === 'image' && att.dataUrl) {
          parts.push({ type: 'image_url', image_url: { url: att.dataUrl } })
        } else if (att.textContent) {
          parts.push({
            type: 'text',
            text: `[附件: ${att.name}]\n\`\`\`\n${att.textContent.slice(0, 24000)}\n\`\`\``,
          })
        }
      }
      if (m.text) {
        parts.push({ type: 'text', text: m.text })
      }
      messages.push({
        role: 'user',
        content: parts.length === 1 && parts[0].type === 'text' ? parts[0].text : parts,
      })
    } else if (m.role === 'assistant' && m.assistant?.content) {
      messages.push({ role: 'assistant', content: m.assistant.content })
    }
  }

  const chosenModel =
    settings.model === 'deepseek-chat' && deepThink
      ? 'deepseek-reasoner'
      : settings.model === 'deepseek-reasoner' && !deepThink
        ? 'deepseek-chat'
        : settings.model || (deepThink ? 'deepseek-reasoner' : 'deepseek-chat')

  const body: Record<string, unknown> = {
    model: chosenModel,
    messages,
    stream: true,
  }
  if (chosenModel.includes('flash') || chosenModel.includes('v4')) {
    body.thinking = { type: deepThink ? 'enabled' : 'disabled' }
    if (webSearch) {
      body.tools = [
        { type: 'deepseek_web_search' },
        { type: 'deepseek_read_url' },
      ]
    }
  }

  const turn: AssistantTurnData = {
    thinking: '',
    thinkingDurationSec: 0,
    thinkingDone: !deepThink,
    steps: [],
    content: '',
    citations: [],
  }
  let thinkStart: number | null = null
  const emit = () => {
    if (thinkStart && !turn.thinkingDone) {
      turn.thinkingDurationSec = Math.max(1, Math.round((Date.now() - thinkStart) / 1000))
    }
    callbacks.onUpdate({ ...turn })
  }

  try {
    const res = await fetch(`${origin}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey.trim()}`,
      },
      body: JSON.stringify(body),
      signal,
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText)
      let msg = errText || `HTTP ${res.status}`
      try {
        const parsed = JSON.parse(errText) as { error?: { message?: string } }
        if (parsed?.error?.message) msg = parsed.error.message
      } catch {
        // raw
      }
      turn.stopReason = 'error'
      turn.errorMessage = msg
      turn.errorKind = classifyHttpError(res.status, msg)
      turn.thinkingDone = true
      emit()
      return turn
    }

    if (!res.body) throw new Error('Empty response body')

    for await (const { data } of parseSseStream(res.body, signal)) {
      if (data === '[DONE]') break
      let chunk: Record<string, unknown>
      try {
        chunk = JSON.parse(data) as Record<string, unknown>
      } catch {
        continue
      }
      if (chunk.error) {
        const msg = String((chunk.error as { message?: string }).message ?? 'API error')
        turn.stopReason = 'error'
        turn.errorMessage = msg
        turn.errorKind = classifyHttpError(undefined, msg)
        turn.thinkingDone = true
        emit()
        return turn
      }
      const choices = chunk.choices as Array<Record<string, unknown>> | undefined
      const delta = choices?.[0]?.delta as Record<string, unknown> | undefined
      if (delta) {
        if (typeof delta.reasoning_content === 'string' && delta.reasoning_content) {
          if (!thinkStart) thinkStart = Date.now()
          turn.thinking += delta.reasoning_content
          emit()
        }
        if (typeof delta.content === 'string' && delta.content) {
          if (!turn.thinkingDone) {
            turn.thinkingDone = true
            if (thinkStart) {
              turn.thinkingDurationSec = Math.max(1, Math.round((Date.now() - thinkStart) / 1000))
            }
          }
          turn.content += delta.content
          emit()
        }
      }
    }

    turn.thinkingDone = true
    turn.stopReason = signal.aborted ? 'stopped' : 'end_turn'
    emit()
    return turn
  } catch (err) {
    if (signal.aborted) {
      turn.thinkingDone = true
      turn.stopReason = 'stopped'
      emit()
      return turn
    }
    turn.thinkingDone = true
    turn.stopReason = 'error'
    turn.errorMessage = err instanceof Error ? err.message : String(err)
    turn.errorKind = 'network'
    emit()
    return turn
  }
}

const delay = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const t = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(t)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })

async function runDemoSimulation({
  thread,
  deepThink,
  webSearch,
  signal,
  callbacks,
}: {
  thread: ChatMessage[]
  deepThink: boolean
  webSearch: boolean
  signal: AbortSignal
  callbacks: StreamCallbacks
}): Promise<AssistantTurnData> {
  const lastUser = [...thread].reverse().find((m) => m.role === 'user')
  const prompt = (lastUser?.text || '').trim()
  const turn: AssistantTurnData = {
    thinking: '',
    thinkingDurationSec: 0,
    thinkingDone: !deepThink,
    steps: [],
    content: '',
    citations: [],
  }
  const emit = () => callbacks.onUpdate({ ...turn, steps: turn.steps.map((s) => ({ ...s })) })

  try {
    if (deepThink) {
      const thinkSteps = [
        `用户问题：「${prompt || '附件分析'}」。我需要拆解核心诉求，确保回答结构清晰、逻辑严密并兼顾可读性。`,
        webSearch
          ? '\n\n已开启联网搜索，先检索最新权威资料与技术文档，核实关键概念与数据后再组织最终回复。'
          : '\n\n先梳理关键原理与具体示例，如果有代码或数学推导，需确保语法规范、边界条件严谨。',
      ].join('')
      const start = Date.now()
      for (let i = 0; i < thinkSteps.length; i += 4) {
        await delay(28, signal)
        turn.thinking += thinkSteps.slice(i, i + 4)
        turn.thinkingDurationSec = Math.max(1, Math.round((Date.now() - start) / 1000))
        emit()
      }
      turn.thinkingDurationSec = Math.max(2, Math.round((Date.now() - start) / 1000))
    }

    if (webSearch) {
      const step: SearchStep = {
        id: 'demo_search_1',
        type: 'search',
        status: 'running',
        queries: [prompt.slice(0, 28) || 'DeepSeek V4.1', '技术原理与最佳实践'],
        sources: [],
      }
      turn.steps.push(step)
      emit()
      await delay(550, signal)
      const demoSources: SearchSource[] = [
        {
          id: 'src_1',
          index: 1,
          title: 'DeepSeek 官方文档与最新模型能力概览',
          url: 'https://api-docs.deepseek.com/',
          siteName: 'DeepSeek API Docs',
          snippet: '支持思考模式、服务端联网搜索、文件解析、多轮分支对话与流式响应。',
          publishedAt: '2026-11-13T00:00:00Z',
        },
        {
          id: 'src_2',
          index: 2,
          title: '深度推理模型架构与交互体验白皮书',
          url: 'https://www.deepseek.com/',
          siteName: 'DeepSeek',
          snippet: '通过推理链自动折叠、实时引用角标与高密度排版优化移动端阅读体验。',
          publishedAt: '2026-10-20T00:00:00Z',
        },
      ]
      step.status = 'done'
      step.sources = demoSources
      turn.citations = demoSources.map((s) => ({
        index: s.index,
        url: s.url,
        title: s.title,
        siteName: s.siteName,
        citedText: s.snippet,
      }))
      emit()
    }

    turn.thinkingDone = true
    emit()

    let answer = ''
    if (/量子|quantum/i.test(prompt)) {
      answer = `**量子纠缠**（Quantum Entanglement）可以这样直观理解${webSearch ? '[1]' : ''}：\n\n想象有一对特殊的「魔法手套」，分别装进两个完全密封的盒子里，寄给相距一万光年的小明和小红。在打开盒子之前，每只手套处于「既像左手又像右手」的叠加态；而一旦小明打开盒子发现是**左手手套**，无论距离多远，小红盒子里那只的状态瞬间就确定为**右手手套**。\n\n### 核心物理原理\n\n1. **不可分割的联合量子态**：两个粒子共享同一个波函数，例如自旋单态：\n\n$$|\\Psi^-\\rangle = \\frac{1}{\\sqrt{2}}\\left(|\\uparrow\\downarrow\\rangle - |\\downarrow\\uparrow\\rangle\\right)$$\n\n2. **非定域关联**：测量其中一个粒子会让联合态坍缩，但**不能超光速传递经典信息**${webSearch ? '[2]' : ''}。`
    } else if (/mermaid|架构|流程图/i.test(prompt)) {
      answer = `这是一个高并发 **AI 流式对话网关** 的架构示意图${webSearch ? '[1]' : ''}：\n\n\`\`\`mermaid\nflowchart LR\n  A[Android 客户端] -->|SSE 流式请求| B[API 网关鉴权]\n  B --> C{是否启用深度思考}\n  C -->|是| D[推理引擎 DeepSeek-Flash]\n  C -->|否| E[极速响应通道]\n  D -->|deepseek_web_search| F[实时联网检索引擎]\n  F --> D\n  D --> A\n  E --> A\n\`\`\`\n\n### 关键设计要点\n- **SSE 分块传输**：边生成思考链（\`thinking_delta\`）与正文（\`text_delta\`）边渲染，首字延迟控制在百毫秒级${webSearch ? '[2]' : ''}。\n- **端侧分支持久化**：每轮对话保存树形节点与 \`rawBlocks\`，支持无损编辑重发与多版本切换。`
    } else if (/排序|quicksort|代码|typescript|python/i.test(prompt)) {
      answer = `下面给出 **TypeScript** 与 **Python** 版本的快速排序实现，并附复杂度对比${webSearch ? '[1]' : ''}。\n\n### TypeScript 实现\n\n\`\`\`typescript\nexport function quickSort(arr: number[]): number[] {\n  if (arr.length <= 1) return arr\n  const pivot = arr[Math.floor(arr.length / 2)]\n  const left = arr.filter((x) => x < pivot)\n  const middle = arr.filter((x) => x === pivot)\n  const right = arr.filter((x) => x > pivot)\n  return [...quickSort(left), ...middle, ...quickSort(right)]\n}\n\`\`\`\n\n### 复杂度分析\n\n| 情况 | 时间复杂度 | 空间复杂度 |\n| --- | --- | --- |\n| 平均 / 最好 | $O(n \\log n)$ | $O(\\log n)$ |\n| 最坏（已基本有序且选首元素） | $O(n^2)$ | $O(n)$ |`
    } else {
      answer = `你好！这里是 **Deepshek（DeepSeek 安卓端复刻版）** 的本地演示响应${webSearch ? '[1]' : ''}。\n\n你刚才询问的内容是：**「${prompt || '附件与图文解析'}」**\n\n- ✅ **深度思考状态**：${deepThink ? '已开启（支持推理过程流式展示与自动折叠）' : '未开启'}\n- ✅ **联网搜索状态**：${webSearch ? '已开启（支持参考网页卡片与行内角标引用 [1][2]）' : '未开启'}\n\n如需接入 **真实 DeepSeek 官方旗舰模型**：\n1. 点击左上角菜单打开侧边栏，进入底部的 **「设置」**\n2. 在 **「DeepSeek API 配置」** 中粘贴你的 \`sk-...\` 个人密钥并点击 **「测试连接」**\n3. 保存后即可直接调用 \`deepseek-flash\`、\`deepseek-v4-pro\` 等真实模型${webSearch ? '[2]' : ''}！`
    }

    for (let i = 0; i < answer.length; i += 5) {
      await delay(20, signal)
      turn.content += answer.slice(i, i + 5)
      emit()
    }
    turn.stopReason = 'end_turn'
    emit()
    return turn
  } catch (err) {
    if (signal.aborted) {
      turn.thinkingDone = true
      turn.stopReason = 'stopped'
      emit()
      return turn
    }
    throw err
  }
}
