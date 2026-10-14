import { deleteTask, toggleTask, updateTask } from '@/app/lawyer/practice-actions'
import { PRIORITIES } from '@/lib/constants'
import { formatDate, todayISO } from '@/lib/format'
import type { TaskRow } from '@/lib/types'
import ActionForm from './ActionForm'
import { PriorityBadge } from './Badge'
import ConfirmButton from './ConfirmButton'
import EmptyState from './EmptyState'
import { Field, Select } from './Field'
import { dangerLinkCls } from './ui'

type CaseOption = { id: string; title: string; case_number: string }

export default function TaskList({
  tasks, caseTitles = {}, showCase = true, cases,
}: { tasks: TaskRow[]; caseTitles?: Record<string, string>; showCase?: boolean; cases?: CaseOption[] }) {
  if (tasks.length === 0) return <EmptyState title="No tasks" hint="Add a task to stay on top of your work." />
  const today = todayISO()

  return (
    <ul className="divide-y divide-slate-100">
      {tasks.map((t) => {
        const overdue = !t.done && t.due_date !== null && t.due_date < today
        return (
          <li key={t.id} className="px-5 py-3">
            <div className="flex items-center gap-3">
              <form action={toggleTask}>
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="done" value={String(!t.done)} />
                <button
                  type="submit"
                  aria-label={t.done ? 'Mark as not done' : 'Mark as done'}
                  className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
                    t.done ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white hover:border-brand-500'
                  }`}
                >
                  {t.done ? '✓' : ''}
                </button>
              </form>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm ${t.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{t.title}</p>
                <p className={`text-xs ${overdue ? 'font-medium text-alert-700' : 'text-slate-500'}`}>
                  {t.due_date ? `${overdue ? 'Overdue · ' : 'Due '}${formatDate(t.due_date)}` : 'No due date'}
                  {showCase && t.case_id && caseTitles[t.case_id] ? ` · ${caseTitles[t.case_id]}` : ''}
                </p>
              </div>
              <PriorityBadge priority={t.priority} />
              <form action={deleteTask}>
                <input type="hidden" name="id" value={t.id} />
                <ConfirmButton message="Delete this task?" className={dangerLinkCls}>Delete</ConfirmButton>
              </form>
            </div>

            <details className="mt-1 pl-8">
              <summary className="cursor-pointer text-xs font-medium text-brand-700 hover:underline">Edit</summary>
              <div className="mt-3 rounded-xl bg-slate-50 p-4">
                <ActionForm action={updateTask} submitLabel="Save task" pendingLabel="Saving..." resetOnSuccess={false}>
                  <input type="hidden" name="id" value={t.id} />
                  {!cases && <input type="hidden" name="case_id" value={t.case_id ?? ''} />}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2"><Field id={`t-title-${t.id}`} label="Task" name="title" required defaultValue={t.title} /></div>
                    <Field id={`t-due-${t.id}`} label="Due date" name="due_date" type="date" defaultValue={t.due_date} />
                    <Select id={`t-prio-${t.id}`} label="Priority" name="priority" defaultValue={t.priority}
                      options={PRIORITIES.map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) }))} />
                    {cases && (
                      <div className="sm:col-span-2">
                        <Select id={`t-case-${t.id}`} label="Related case" name="case_id" emptyLabel="None" defaultValue={t.case_id ?? ''}
                          options={cases.map((c) => ({ value: c.id, label: `${c.case_number} · ${c.title}` }))} />
                      </div>
                    )}
                  </div>
                </ActionForm>
              </div>
            </details>
          </li>
        )
      })}
    </ul>
  )
}
