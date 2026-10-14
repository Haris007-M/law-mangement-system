export type NavIcon =
  | 'dashboard' | 'lawyers' | 'clients' | 'audit' | 'settings'
  | 'cases' | 'calendar' | 'tasks' | 'documents' | 'billing'

export interface NavItem {
  href: string
  label: string
  icon: NavIcon
  exact?: boolean
  // phones: shown as a tab in the bottom bar (the rest go under "More")
  primary?: boolean
  // phones: shorter label for the tab
  short?: string
}

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Dashboard', short: 'Home', icon: 'dashboard', exact: true, primary: true },
  { href: '/admin/lawyers', label: 'Lawyers', icon: 'lawyers', primary: true },
  { href: '/admin/clients', label: 'Clients', icon: 'clients', primary: true },
  { href: '/admin/audit', label: 'Audit log', short: 'Audit', icon: 'audit', primary: true },
  { href: '/admin/settings', label: 'Settings', icon: 'settings', primary: true },
]

export const LAWYER_NAV: NavItem[] = [
  { href: '/lawyer', label: 'Dashboard', short: 'Home', icon: 'dashboard', exact: true, primary: true },
  { href: '/lawyer/clients', label: 'Clients', icon: 'clients', primary: true },
  { href: '/lawyer/cases', label: 'Cases', icon: 'cases', primary: true },
  { href: '/lawyer/calendar', label: 'Calendar', icon: 'calendar', primary: true },
  { href: '/lawyer/tasks', label: 'Tasks', icon: 'tasks' },
  { href: '/lawyer/documents', label: 'Documents', icon: 'documents' },
  { href: '/lawyer/billing', label: 'Billing', icon: 'billing' },
  { href: '/lawyer/settings', label: 'Settings', icon: 'settings' },
]

export const CLIENT_NAV: NavItem[] = [
  { href: '/client', label: 'Dashboard', short: 'Home', icon: 'dashboard', exact: true, primary: true },
  { href: '/client/cases', label: 'My cases', short: 'Cases', icon: 'cases', primary: true },
  { href: '/client/documents', label: 'Documents', short: 'Files', icon: 'documents', primary: true },
  { href: '/client/appointments', label: 'Appointments', short: 'Calendar', icon: 'calendar', primary: true },
  { href: '/client/invoices', label: 'Invoices', icon: 'billing' },
  { href: '/client/settings', label: 'Settings', icon: 'settings' },
]
