import { postMessage } from '@/app/actions/cases'
import { formatDateTime } from '@/lib/format'
import { nameOf, type NameMap } from '@/lib/data'
import type { MessageRow } from '@/lib/types'
import ActionForm from './ActionForm'
import { TextArea } from './Field'
import EmptyState from './EmptyState'

export default function CaseMessages({
  caseId, meId, messages, names,
}: { caseId: string; meId: string; messages: MessageRow[]; names: NameMap }) {
  return (
    <div>
      {messages.length === 0 ? (
        <EmptyState title="No messages yet" hint="Start the conversation below. Only you and the other party on this case can read it." />
      ) : (
        <div className="space-y-3">
          {messages.map((m) => {
            const mine = m.author_id === meId
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${mine ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-900'}`}>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-1 text-xs ${mine ? 'text-brand-200' : 'text-slate-500'}`}>
                    {mine ? 'You' : nameOf(names, m.author_id)} · {formatDateTime(m.created_at)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <ActionForm action={postMessage} submitLabel="Send message" pendingLabel="Sending..." className="mt-5 space-y-3 border-t border-slate-200 pt-5">
        <input type="hidden" name="case_id" value={caseId} />
        <TextArea name="body" rows={3} required placeholder="Write a message..." />
      </ActionForm>
    </div>
  )
}
