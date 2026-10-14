import 'server-only'
import nodemailer from 'nodemailer'
import { BRAND } from '@/lib/brand'

// Works with any SMTP provider (Resend, Brevo, Mailgun, Gmail app password, ...).
export function mailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.MAIL_FROM
  )
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null
function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 587)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  }
  return transporter
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

type SendResult = { ok: true } | { ok: false; error: string }

async function send(to: string, subject: string, text: string, html: string): Promise<SendResult> {
  try {
    await getTransporter().sendMail({ from: process.env.MAIL_FROM, to, subject, text, html })
    return { ok: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error'
    console.error('sendMail failed:', message)
    return { ok: false, error: message }
  }
}

function layout(heading: string, body: string, link: string, button: string, footer = 'If you were not expecting this email, you can ignore it.') {
  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#0f172a">
  <h2 style="margin:0 0 16px">${heading}</h2>
  <p style="line-height:1.55;white-space:pre-line">${body}</p>
  <p style="margin:24px 0"><a href="${esc(link)}" style="background:#c5a880;color:#0f172a;font-weight:600;padding:12px 22px;border-radius:6px;text-decoration:none;display:inline-block">${button}</a></p>
  <p style="font-size:12px;color:#64748b;line-height:1.5">If the button does not work, copy this address into your browser:<br>${esc(link)}</p>
  <p style="font-size:12px;color:#64748b">${footer}</p>
</div>`
}

export function sendInviteEmail(p: { to: string; name: string; invitedBy: string; link: string }) {
  const subject = `You have been invited to ${BRAND.name}`
  const text = `Hello ${p.name},\n\n${p.invitedBy} invited you to ${BRAND.name}. Choose your password here:\n${p.link}\n\nIf you were not expecting this, ignore this email.`
  const html = layout(
    `Welcome, ${esc(p.name)}`,
    `${esc(p.invitedBy)} invited you to ${BRAND.name}. Click below to choose your password.`,
    p.link,
    'Set my password'
  )
  return send(p.to, subject, text, html)
}

export function sendResetEmail(p: { to: string; name: string; link: string }) {
  const subject = `Reset your ${BRAND.name} password`
  const text = `Hello ${p.name},\n\nUse this link to choose a new password:\n${p.link}\n\nIf you did not ask for this, ignore this email.`
  const html = layout(
    'Reset your password',
    `Hello ${esc(p.name)}, click below to choose a new password.`,
    p.link,
    'Reset password'
  )
  return send(p.to, subject, text, html)
}

// Short "something happened, sign in to see it" emails. They deliberately contain no
// case details or message text, only a link back into the app.
export function sendNotificationEmail(p: {
  to: string; name: string; subject: string; heading: string; body: string; link: string; button: string
}) {
  const text = `Hello ${p.name},\n\n${p.body}\n\n${p.button}: ${p.link}\n\nYou can turn these emails off in Settings.`
  const html = layout(
    esc(p.heading),
    `Hello ${esc(p.name)},\n\n${esc(p.body)}`,
    p.link,
    esc(p.button),
    'You receive this because email notifications are on. You can turn them off in Settings.'
  )
  return send(p.to, p.subject, text, html)
}
