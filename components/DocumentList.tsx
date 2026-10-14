import { deleteDocument, setDocumentShared } from '@/app/actions/documents'
import { formatBytes, formatDate } from '@/lib/format'
import { nameOf, type NameMap } from '@/lib/data'
import type { DocumentRow } from '@/lib/types'
import { Badge } from './Badge'
import ConfirmButton from './ConfirmButton'
import EmptyState from './EmptyState'
import { dangerLinkCls, linkCls, tdCls, thCls } from './ui'

export default function DocumentList({
  docs, caseTitles = {}, names, role, meId, showCase = true,
}: {
  docs: DocumentRow[]
  caseTitles?: Record<string, string>
  names: NameMap
  role: 'lawyer' | 'client'
  meId: string
  showCase?: boolean
}) {
  if (docs.length === 0) {
    return <EmptyState title="No documents yet" hint={role === 'lawyer' ? 'Upload a file to get started.' : 'Documents your lawyer shares with you will appear here.'} />
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className={thCls}>File</th>
            {showCase && <th className={thCls}>Case</th>}
            <th className={thCls}>Uploaded by</th>
            <th className={thCls}>Date</th>
            {role === 'lawyer' && <th className={thCls}>Client access</th>}
            <th className={thCls} />
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <tr key={d.id} className="border-t border-slate-100">
              <td className={tdCls}>
                <a href={`/api/documents/${d.id}`} className={linkCls}>{d.name}</a>
                <p className="text-xs text-slate-500">{formatBytes(d.size_bytes)}</p>
              </td>
              {showCase && <td className={tdCls}>{caseTitles[d.case_id] ?? '—'}</td>}
              <td className={tdCls}>{nameOf(names, d.uploaded_by)}</td>
              <td className={tdCls}>{formatDate(d.created_at)}</td>
              {role === 'lawyer' && (
                <td className={tdCls}>
                  {d.visible_to_client ? <Badge tone="green">Shared</Badge> : <Badge>Private</Badge>}
                </td>
              )}
              <td className={`${tdCls} text-right`}>
                <div className="flex items-center justify-end gap-4">
                  {role === 'lawyer' && (
                    <form action={setDocumentShared}>
                      <input type="hidden" name="id" value={d.id} />
                      <input type="hidden" name="visible" value={String(!d.visible_to_client)} />
                      <button type="submit" className={linkCls}>{d.visible_to_client ? 'Unshare' : 'Share'}</button>
                    </form>
                  )}
                  {(role === 'lawyer' || d.uploaded_by === meId) && (
                    <form action={deleteDocument}>
                      <input type="hidden" name="id" value={d.id} />
                      <ConfirmButton message="Delete this document permanently?" className={dangerLinkCls}>Delete</ConfirmButton>
                    </form>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
