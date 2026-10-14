import { inputCls, labelCls } from './ui'

export function Field({
  label, name, id, type = 'text', required, placeholder, defaultValue, hint,
}: {
  label: string; name: string; id?: string; type?: string; required?: boolean
  placeholder?: string; defaultValue?: string | number | null; hint?: string
}) {
  const fid = id ?? name
  return (
    <div>
      <label htmlFor={fid} className={labelCls}>{label}</label>
      <input
        id={fid} name={name} type={type} required={required} placeholder={placeholder}
        defaultValue={defaultValue ?? undefined} className={inputCls}
      />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export function TextArea({
  label, name, id, rows = 3, required, placeholder, defaultValue, maxLength = 4000,
}: {
  label?: string; name: string; id?: string; rows?: number; required?: boolean
  placeholder?: string; defaultValue?: string | null; maxLength?: number
}) {
  const fid = id ?? name
  return (
    <div>
      {label && <label htmlFor={fid} className={labelCls}>{label}</label>}
      <textarea
        id={fid} name={name} rows={rows} required={required} placeholder={placeholder}
        defaultValue={defaultValue ?? undefined} maxLength={maxLength} className={inputCls}
      />
    </div>
  )
}

export function Select({
  label, name, id, options, defaultValue, required, emptyLabel,
}: {
  label: string; name: string; id?: string; options: { value: string; label: string }[]
  defaultValue?: string; required?: boolean; emptyLabel?: string
}) {
  const fid = id ?? name
  return (
    <div>
      <label htmlFor={fid} className={labelCls}>{label}</label>
      <select id={fid} name={name} required={required} defaultValue={defaultValue ?? ''} className={inputCls}>
        {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500" />
      {label}
    </label>
  )
}

export function FileInput({ name = 'file', label }: { name?: string; label?: string }) {
  return (
    <div>
      {label && <label htmlFor={name} className={labelCls}>{label}</label>}
      <input
        id={name}
        name={name}
        type="file"
        required
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.webp"
        className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-800 hover:file:bg-brand-100"
      />
      <p className="mt-1 text-xs text-slate-500">PDF, Word, Excel, PowerPoint, text, CSV or image. Maximum 8 MB.</p>
    </div>
  )
}
