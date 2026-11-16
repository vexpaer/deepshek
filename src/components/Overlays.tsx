import React from 'react'
import clsx from 'clsx'
import { getDict } from '../i18n'
import { useAppStore } from '../store/useAppStore'
import { IconClose, IconExternalLink, IconGlobe } from './Icons'
import styles from './Overlays.module.css'

export const Overlays: React.FC = () => {
  const sourcesSheet = useAppStore((s) => s.sourcesSheet)
  const setSourcesSheet = useAppStore((s) => s.setSourcesSheet)
  const lightboxImageUrl = useAppStore((s) => s.lightboxImageUrl)
  const setLightboxImageUrl = useAppStore((s) => s.setLightboxImageUrl)
  const toast = useAppStore((s) => s.toast)
  const locale = useAppStore((s) => s.settings.locale)
  const dict = getDict(locale)

  return (
    <>
      {sourcesSheet ? (
        <div
          className={styles.scrim}
          onClick={() => setSourcesSheet(null)}
          role="dialog"
          aria-modal="true"
          aria-label={sourcesSheet.title || dict.sourcesTitle}
        >
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHandle} />
            <div className={styles.sheetHeader}>
              <div className={styles.sheetTitleWrap}>
                <IconGlobe size={18} />
                <span>{sourcesSheet.title || dict.sourcesTitle}</span>
                <span className={styles.sheetCount}>{sourcesSheet.sources.length}</span>
              </div>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={() => setSourcesSheet(null)}
                aria-label={dict.cancel}
              >
                <IconClose size={18} />
              </button>
            </div>
            <div className={styles.sourceList}>
              {sourcesSheet.sources.map((src, i) => (
                <a
                  key={src.id || `${src.url}_${i}`}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sourceCard}
                >
                  <div className={styles.sourceMeta}>
                    <span className={styles.sourceIndex}>{src.index || i + 1}</span>
                    <span className={styles.sourceSiteIcon}>
                      {src.siteIcon ? (
                        <img
                          src={src.siteIcon}
                          alt=""
                          onError={(e) => {
                            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      ) : null}
                      <span>{(src.siteName || 'W').slice(0, 1).toUpperCase()}</span>
                    </span>
                    <span className={styles.sourceSiteName}>{src.siteName}</span>
                    {src.publishedAt ? (
                      <span className={styles.sourceDate}>
                        {src.publishedAt.slice(0, 10)}
                      </span>
                    ) : null}
                  </div>
                  <div className={styles.sourceTitle}>
                    <span>{src.title}</span>
                    <span className={styles.sourceExtIcon}>
                      <IconExternalLink size={13} />
                    </span>
                  </div>
                  {src.snippet ? <div className={styles.sourceSnippet}>{src.snippet}</div> : null}
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {lightboxImageUrl ? (
        <div
          className={styles.lightbox}
          onClick={() => setLightboxImageUrl(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className={styles.lightboxClose}
            onClick={() => setLightboxImageUrl(null)}
            aria-label={dict.cancel}
          >
            <IconClose size={20} />
          </button>
          <img
            src={lightboxImageUrl}
            alt="preview"
            className={styles.lightboxImg}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}

      {toast ? (
        <div className={styles.toastWrap} role="status" aria-live="polite">
          <div className={styles.toast}>
            <span
              className={clsx(
                styles.toastDot,
                toast.type === 'success' && styles.toastDotSuccess,
                toast.type === 'error' && styles.toastDotError
              )}
            />
            <span>{toast.text}</span>
          </div>
        </div>
      ) : null}
    </>
  )
}
