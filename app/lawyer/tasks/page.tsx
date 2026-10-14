import ActionForm from '@/components/ActionForm'
import Card from '@/components/Card'
import PageHeader from '@/components/PageHeader'
import TaskList from '@/components/TaskList'
import { Field, Select } from '@/components/Field'
import { requireRole } from '@/lib/auth'
import { PRIORITIES } from '@/lib/constants'
import { createClient } from '@/lib/supabase/server'
import type { TaskRow } from '@/lib/types'
import { addTask } from '../practice-actions'

export default async function TasksPage() {
  const me = await requireRole('lawyer')
  const supabase = await createClient()

  const [taskRes, caseRes] = await Promise.all([
    supabase.from('tasks').select('*').eq('lawyer_id', me.id).order('done').order('due_date', { ascending: true, nullsFirst: false }).limit(300),
    supabase.from('cases').select('id, title, case_number').eq('lawyer_id', me.id).order('title'),
  ])
  const tasks = (taskRes.data ?? []) as TaskRow[]
  const cases = (caseRes.data ?? []) as { id: string; title: string; case_number: string }[]
  const caseTitles = Object.fromEntries(cases.map((c) => [c.id, c.title]))
  const open = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)

  return (
    <>
      <PageHeader title="Tasks" description="Your personal to-do list, optionally linked to a case." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title={`To do (${open.length})`} padded={false}>
            <TaskList tasks={open} caseTitles={caseTitles} cases={cases} />
          </Card>
          {done.length > 0 && (
            <Card title={`Completed (${done.length})`} padded={false}>
              <TaskList tasks={done} caseTitles={caseTitles} cases={cases} />
            </Card>
          )}
        </div>

        <Card title="Add a task" className="h-fit">
          <ActionForm action={addTask} submitLabel="Add task" pendingLabel="Adding...">
            <Field label="Task" name="title" required />
            <Field label="Due date" name="due_date" type="date" />
            <Select label="Priority" name="priority" defaultValue="medium" options={PRIORITIES.map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1) }))} />
            <Select label="Related case" name="case_id" emptyLabel="None" options={cases.map((c) => ({ value: c.id, label: `${c.case_number} · ${c.title}` }))} />
          </ActionForm>
        </Card>
      </div>
    </>
  )
}
