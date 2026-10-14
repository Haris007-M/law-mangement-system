import { changePassword, updateProfile } from '@/app/actions/account'
import { ROLE_LABEL, type Profile } from '@/lib/types'
import ActionForm from './ActionForm'
import Card from './Card'
import { Checkbox, Field } from './Field'
import TwoFactorCard from './TwoFactorCard'
import { inputCls, labelCls } from './ui'

export default function SettingsPanel({ profile }: { profile: Profile }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Profile">
        <ActionForm action={updateProfile} submitLabel="Save profile" resetOnSuccess={false}>
          <div>
            <label className={labelCls}>Email</label>
            <input value={profile.email} disabled readOnly className={`${inputCls} bg-slate-50 text-slate-500`} />
            <p className="mt-1 text-xs text-slate-500">Role: {ROLE_LABEL[profile.role]}. Your email is your sign-in and cannot be changed here.</p>
          </div>
          <Field label="Full name" name="full_name" required defaultValue={profile.full_name} />
          <Field label="Phone" name="phone" type="tel" defaultValue={profile.phone} />
          {profile.role === 'lawyer' && (
            <Field label="Firm name" name="firm_name" defaultValue={profile.firm_name} hint="Shown on your invoices." />
          )}
          <Checkbox name="notify_email" label="Email me about new messages, shared documents, invoices and reminders" defaultChecked={profile.notify_email} />
        </ActionForm>
      </Card>

      <TwoFactorCard enabled={profile.mfa_enabled} />

      <Card title="Change password">
        <ActionForm action={changePassword} submitLabel="Update password">
          <Field label="Current password" name="current" type="password" required />
          <Field label="New password" name="password" type="password" required hint="At least 10 characters, with a letter and a number." />
          <Field label="Confirm new password" name="confirm" type="password" required />
        </ActionForm>
      </Card>
    </div>
  )
}
