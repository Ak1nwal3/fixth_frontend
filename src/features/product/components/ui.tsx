import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Copy, Check, X, CircleCheck, CircleAlert } from 'lucide-react'
export function Badge({ children, tone }: { children: ReactNode; tone?: 'success' | 'warning' | 'danger' | 'neutral' }) {
  const text = String(children)
  const resolved = tone || (/Verified|Active|Eligible|Accepted|Approved|Ready|Low|Published/.test(text) ? 'success' : /Rejected|Suspended|Unpublished/.test(text) ? 'danger' : /Pending|Shortlisted|Review|Flagged|Medium|Expired/.test(text) ? 'warning' : 'neutral')
  return <span className={`p-badge ${resolved}`}>{resolved === 'success' ? <CircleCheck aria-hidden size={13} /> : resolved === 'warning' || resolved === 'danger' ? <CircleAlert aria-hidden size={13} /> : null}{children}</span>
}
export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={`p-panel ${className}`}>{children}</section> }
export function Empty({ title, children }: { title: string; children?: ReactNode }) { return <div className="p-empty"><CircleAlert size={28} aria-hidden /><h2>{title}</h2>{children}</div> }
export function Metrics({ items }: { items: [string, number | string][] }) { return <dl className="p-metrics">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> }
export function Tabs({ items, value, onChange, label }: { items: string[]; value: string; onChange: (value: string) => void; label: string }) {
  return <div className="p-tabs" role="group" aria-label={label}>{items.map(item => <button type="button" aria-pressed={value === item} onClick={() => onChange(item)} key={item}>{item}</button>)}</div>
}
export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    return () => previous?.focus()
  }, [])
  useEffect(() => {
    const dialog = ref.current!
    if (!dialog.open) dialog.showModal()
    const close = () => onClose()
    dialog.addEventListener('close', close)
    return () => dialog.removeEventListener('close', close)
  }, [onClose])
  return <dialog ref={ref} className="p-dialog" aria-modal="true" aria-labelledby="dialog-title" onClick={e => { if (e.target === e.currentTarget) onClose() }}><div className="p-dialog-content"><div className="p-between"><h2 id="dialog-title">{title}</h2><button type="button" className="p-icon" onClick={onClose} aria-label="Close dialog"><X aria-hidden size={20} /></button></div>{children}</div></dialog>
}
export function CopyLink({ slug, title }: { slug: string; title: string }) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const url = `${window.location.origin}/p/${slug}`
  async function copy() {
    setAnnouncement('')
    try {
      let clipboardSuccess = false
      if (navigator.clipboard?.writeText) {
        try { await navigator.clipboard.writeText(url); clipboardSuccess = true } catch { /* Try legacy copying when permission is unavailable. */ }
      }
      if (!clipboardSuccess) {
        const active = document.activeElement as HTMLElement | null
        const field = document.createElement('textarea')
        field.value = url; field.style.position = 'fixed'; field.style.opacity = '0'
        document.body.append(field); field.select()
        const success = document.execCommand('copy'); field.remove(); active?.focus()
        if (!success) throw new Error('Copy unavailable')
      }
      setCopied(true); setFailed(false)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 4000)
      setTimeout(() => setAnnouncement('Link copied to clipboard.'), 30)
    } catch { setFailed(true); setAnnouncement('Unable to copy. Select and copy the link manually.') }
  }
  return <div className="p-copy"><button type="button" className="p-button subtle" aria-label={`Copy link to ${title}`} onClick={copy}>{copied ? <Check aria-hidden size={16} /> : <Copy aria-hidden size={16} />}{copied ? 'Copied' : 'Copy link'}</button><span className="p-sr" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>{failed && <label className="p-field"><span>Unable to copy. Select and copy this link manually.</span><input value={url} readOnly onFocus={e => e.target.select()} /></label>}</div>
}
export function FilePreview({ file, title, onClose }: { file: File | null; title: string; onClose: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const download = useRef<HTMLAnchorElement>(null)
  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    if (frame.current) frame.current.src = url
    if (download.current) download.current.href = url
    return () => URL.revokeObjectURL(url)
  }, [file])
  return <Modal title={title} onClose={onClose}>{file ? <><p>This file is available locally in this tab.</p>{file.type === 'application/pdf' && <iframe ref={frame} title={title} className="p-document" />}<a ref={download} className="p-button" download={file.name}>Download {file.name}</a></> : <p>The reference shows this document, but no document file is attached to the sample record.</p>}</Modal>
}
