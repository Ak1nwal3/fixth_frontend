/**
 * Authorized document downloads (`GET /documents/{id}/download/`). Access is
 * enforced server-side: the document owner, an admin, or a company that
 * received the resume through an application on one of its placements.
 */
import { requestBlob } from './http'
import type { ApiDocument } from './types'

export async function downloadDocument(
  document: Pick<ApiDocument, 'id' | 'original_name'>,
): Promise<void> {
  const blob = await requestBlob(`/documents/${encodeURIComponent(document.id)}/download/`)
  const url = URL.createObjectURL(blob)
  const anchor = window.document.createElement('a')
  anchor.href = url
  anchor.download = document.original_name || 'document'
  window.document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
