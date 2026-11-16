import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import mermaid from 'mermaid'
import Prism from 'prismjs'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-yaml'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { mathFromMarkdown } from 'mdast-util-math'
import { gfm } from 'micromark-extension-gfm'
import { math } from 'micromark-extension-llm-math'
import type { PhrasingContent, Root, RootContent } from 'mdast'
import type { SearchSource } from '../types/chat'
import { IconCheck, IconCopy } from './Icons'
import styles from './MarkdownRenderer.module.css'

mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'default' })

const CodeBlock: React.FC<{ lang?: string | null; code: string }> = ({ lang, code }) => {
  const [copied, setCopied] = useState(false)
  const language = (lang || 'text').toLowerCase()

  const highlighted = useMemo(() => {
    const grammar = Prism.languages[language]
    if (!grammar) return null
    try {
      return Prism.highlight(code, grammar, language)
    } catch {
      return null
    }
  }, [code, language])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Ignore
    }
  }

  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeHeader}>
        <span className={styles.codeLang}>{language}</span>
        <button type="button" className={styles.copyCodeBtn} onClick={handleCopy}>
          {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
          <span>{copied ? '已复制' : '复制'}</span>
        </button>
      </div>
      <pre className="ds-code-body">
        {highlighted ? (
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        ) : (
          <code>{code}</code>
        )}
      </pre>
    </div>
  )
}

const MermaidBlock: React.FC<{ code: string; streaming?: boolean }> = ({ code, streaming }) => {
  const [mode, setMode] = useState<'diagram' | 'code'>('diagram')
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<boolean>(false)
  const [isDark, setIsDark] = useState<boolean>(
    () => typeof document !== 'undefined' && document.body.getAttribute('data-ds-dark-theme') === 'true'
  )
  const seqRef = useRef(0)

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.getAttribute('data-ds-dark-theme') === 'true')
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (streaming || mode !== 'diagram') return
    let active = true
    const renderId = `mmd_${Math.random().toString(36).slice(2, 8)}_${++seqRef.current}`
    const render = async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: isDark ? 'dark' : 'default',
        })
        const res = await mermaid.render(renderId, code)
        if (active) {
          setSvg(res.svg)
          setError(false)
        }
      } catch {
        if (active) setError(true)
      }
    }
    void render()
    return () => {
      active = false
    }
  }, [code, streaming, mode, isDark])

  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeHeader}>
        <span className={styles.codeLang}>mermaid</span>
        <div className={styles.mermaidTabs}>
          <button
            type="button"
            className={mode === 'diagram' ? styles.mermaidTabActive : styles.mermaidTab}
            onClick={() => setMode('diagram')}
          >
            图表
          </button>
          <button
            type="button"
            className={mode === 'code' ? styles.mermaidTabActive : styles.mermaidTab}
            onClick={() => setMode('code')}
          >
            代码
          </button>
        </div>
      </div>
      {mode === 'code' || error || !svg ? (
        <pre className="ds-code-body">
          <code>{code}</code>
        </pre>
      ) : (
        <div className={styles.mermaidCanvas} dangerouslySetInnerHTML={{ __html: svg }} />
      )}
    </div>
  )
}

const MathSpan: React.FC<{ value: string; display: boolean }> = ({ value, display }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(value, {
        displayMode: display,
        throwOnError: false,
        strict: false,
      })
    } catch {
      return null
    }
  }, [value, display])

  if (!html) {
    return display ? <pre>{value}</pre> : <code>{value}</code>
  }
  return display ? (
    <div className="katex-display" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <span dangerouslySetInnerHTML={{ __html: html }} />
  )
}

function renderTextWithCitations(
  text: string,
  sources: SearchSource[],
  onOpenCitation?: (source: SearchSource) => void
): React.ReactNode {
  if (!sources.length || !text.includes('[')) return text
  const parts = text.split(/(\[\d+\])/g)
  return parts.map((part, idx) => {
    const match = part.match(/^\[(\d+)\]$/)
    if (match) {
      const num = Number(match[1])
      const found = sources.find((s) => s.index === num)
      if (found) {
        return (
          <button
            key={idx}
            type="button"
            className={styles.citationBadge}
            title={found.title}
            onClick={() => onOpenCitation?.(found)}
          >
            {num}
          </button>
        )
      }
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>
  })
}

function renderInlineNodes(
  nodes: PhrasingContent[],
  sources: SearchSource[],
  onOpenCitation?: (source: SearchSource) => void
): React.ReactNode {
  return nodes.map((node, i) => {
    switch (node.type) {
      case 'text':
        return (
          <React.Fragment key={i}>
            {renderTextWithCitations(node.value, sources, onOpenCitation)}
          </React.Fragment>
        )
      case 'strong':
        return <strong key={i}>{renderInlineNodes(node.children, sources, onOpenCitation)}</strong>
      case 'emphasis':
        return <em key={i}>{renderInlineNodes(node.children, sources, onOpenCitation)}</em>
      case 'delete':
        return <del key={i}>{renderInlineNodes(node.children, sources, onOpenCitation)}</del>
      case 'inlineCode':
        return (
          <code key={i} className="ds-inline-code">
            {node.value}
          </code>
        )
      case 'inlineMath':
        return <MathSpan key={i} value={node.value} display={false} />
      case 'link':
        return (
          <a key={i} href={node.url} target="_blank" rel="noreferrer">
            {renderInlineNodes(node.children, sources, onOpenCitation)}
          </a>
        )
      case 'break':
        return <br key={i} />
      case 'image':
        return <img key={i} src={node.url} alt={node.alt || ''} className={styles.inlineImg} />
      default:
        return null
    }
  })
}

function renderBlockNodes(
  nodes: RootContent[],
  sources: SearchSource[],
  streaming: boolean,
  onOpenCitation?: (source: SearchSource) => void
): React.ReactNode {
  return nodes.map((node, i) => {
    switch (node.type) {
      case 'paragraph':
        return <p key={i}>{renderInlineNodes(node.children, sources, onOpenCitation)}</p>
      case 'heading': {
        const Tag = `h${Math.min(4, node.depth)}` as 'h1' | 'h2' | 'h3' | 'h4'
        return <Tag key={i}>{renderInlineNodes(node.children, sources, onOpenCitation)}</Tag>
      }
      case 'list': {
        const Tag = node.ordered ? 'ol' : 'ul'
        return (
          <Tag key={i} start={node.start ?? undefined}>
            {node.children.map((item, j) => (
              <li key={j}>
                {renderBlockNodes(item.children, sources, streaming, onOpenCitation)}
              </li>
            ))}
          </Tag>
        )
      }
      case 'blockquote':
        return (
          <blockquote key={i}>
            {renderBlockNodes(node.children, sources, streaming, onOpenCitation)}
          </blockquote>
        )
      case 'code':
        if ((node.lang || '').toLowerCase() === 'mermaid') {
          return <MermaidBlock key={i} code={node.value} streaming={streaming} />
        }
        return <CodeBlock key={i} lang={node.lang} code={node.value} />
      case 'math':
        return <MathSpan key={i} value={node.value} display />
      case 'thematicBreak':
        return <hr key={i} />
      case 'table': {
        const [head, ...rows] = node.children
        return (
          <div key={i} className="ds-markdown-table-wrap">
            <table>
              {head ? (
                <thead>
                  <tr>
                    {head.children.map((cell, ci) => (
                      <th key={ci}>{renderInlineNodes(cell.children, sources, onOpenCitation)}</th>
                    ))}
                  </tr>
                </thead>
              ) : null}
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.children.map((cell, ci) => (
                      <td key={ci}>{renderInlineNodes(cell.children, sources, onOpenCitation)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      default:
        return null
    }
  })
}

export const MarkdownRenderer: React.FC<{
  content: string
  sources?: SearchSource[]
  streaming?: boolean
  className?: string
  onOpenCitation?: (source: SearchSource) => void
}> = memo(({ content, sources = [], streaming = false, className, onOpenCitation }) => {
  const ast = useMemo<Root>(() => {
    try {
      return fromMarkdown(content, {
        extensions: [gfm(), math()],
        mdastExtensions: [gfmFromMarkdown(), mathFromMarkdown()],
      })
    } catch {
      return {
        type: 'root',
        children: [{ type: 'paragraph', children: [{ type: 'text', value: content }] }],
      }
    }
  }, [content])

  return (
    <div className={className ? `ds-markdown ${className}` : 'ds-markdown'}>
      {renderBlockNodes(ast.children, sources, streaming, onOpenCitation)}
    </div>
  )
})
