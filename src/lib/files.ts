/**
 * Shortens a long file name in the middle so the extension stays visible,
 * e.g. "Adebayo_Oluwaseun_Computer_Engineering_Resume_2026_final_v3.pdf"
 * → "Adebayo_Oluwaseun_Computer…2026_final_v3.pdf". The full name should
 * still be offered via a `title` tooltip.
 */
export function shortenFileName(name: string, max = 48): string {
  if (name.length <= max) return name
  const dot = name.lastIndexOf('.')
  const ext = dot > 0 && name.length - dot <= 6 ? name.slice(dot) : ''
  const base = ext ? name.slice(0, dot) : name
  const keep = max - ext.length - 1
  const head = Math.ceil(keep * 0.6)
  const tail = keep - head
  return `${base.slice(0, head)}…${base.slice(base.length - tail)}${ext}`
}

const FRIENDLY_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'Word document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word document',
}

/** Short, human label for a MIME type instead of e.g. "application/vnd.openxml…". */
export function fileTypeLabel(mime: string): string {
  return FRIENDLY_TYPES[mime] ?? (mime.split('/').pop()?.toUpperCase() || 'File')
}

/** "820 KB" / "1.4 MB". */
export function fileSizeLabel(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}
