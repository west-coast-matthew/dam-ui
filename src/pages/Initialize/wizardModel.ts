import type { InstallationType } from '../../services/installationService'

export interface WizardData {
  type: InstallationType | null
  ownerName: string
  workspaceName: string
  catalogName: string
  password: string
  confirmPassword: string
}

export const EMPTY_WIZARD: WizardData = {
  type: null,
  ownerName: '',
  workspaceName: '',
  catalogName: '',
  password: '',
  confirmPassword: '',
}

export type StepId = 'type' | 'name' | 'workspace' | 'catalog' | 'password' | 'review'

export interface WizardStep {
  id: StepId
  /** Short name, shown in the progress indicator. */
  label: string
  /** Heading for the step; may depend on the answers so far. */
  title: (data: WizardData) => string
  /** One or two sentences explaining the step. */
  description: (data: WizardData) => string
}

export const STEPS: WizardStep[] = [
  {
    id: 'type',
    label: 'Type',
    title: () => 'Who is this installation for?',
    description: () => 'Choose whether this installation belongs to an organization or to one person. It decides how the installation is named.',
  },
  {
    id: 'name',
    label: 'Name',
    title: (d) => (d.type === 'individual' ? 'What is your name?' : 'What is your organization called?'),
    description: (d) =>
      d.type === 'individual'
        ? 'Enter your name as you’d like it shown. You can change it later.'
        : 'Enter the organization’s name as you’d like it shown. You can change it later.',
  },
  {
    id: 'workspace',
    label: 'Workspace',
    title: () => 'Name your first workspace',
    description: () => 'Workspaces keep assets, catalogs and people separate from each other. Leave the name blank to call it “Default”.',
  },
  {
    id: 'catalog',
    label: 'Catalog',
    title: () => 'Create a catalog (optional)',
    description: () => 'Catalogs group related assets inside a workspace, for example “Brand” or “Product photography”. Skip this step to add catalogs later.',
  },
  {
    id: 'password',
    label: 'Root password',
    title: () => 'Set the root password',
    description: () => 'The root user can manage every workspace and user in this installation. Choose a strong password and store it somewhere safe.',
  },
  {
    id: 'review',
    label: 'Review',
    title: () => 'Review and create',
    description: () => 'Check the details below. You can go back to any step to change them before creating the installation.',
  },
]

export const PASSWORD_RULES = [
  { label: 'At least 12 characters', test: (v: string) => v.length >= 12 },
  { label: 'An upper-case and a lower-case letter', test: (v: string) => /[A-Z]/.test(v) && /[a-z]/.test(v) },
  { label: 'A number', test: (v: string) => /\d/.test(v) },
  { label: 'A symbol, such as ! or #', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
]

export type StepErrors = Partial<Record<keyof WizardData, string>>

/** Errors that stop the user leaving a step. */
export function validateStep(step: StepId, d: WizardData): StepErrors {
  switch (step) {
    case 'type':
      return d.type ? {} : { type: 'Choose who this installation is for.' }
    case 'name': {
      const name = d.ownerName.trim()
      if (!name) return { ownerName: d.type === 'individual' ? 'Enter your name.' : 'Enter the organization’s name.' }
      return name.length > 120 ? { ownerName: 'Use 120 characters or fewer.' } : {}
    }
    case 'workspace':
      return d.workspaceName.trim().length > 60 ? { workspaceName: 'Use 60 characters or fewer.' } : {}
    case 'catalog':
      return d.catalogName.trim().length > 60 ? { catalogName: 'Use 60 characters or fewer.' } : {}
    case 'password': {
      const errors: StepErrors = {}
      if (!PASSWORD_RULES.every((r) => r.test(d.password))) errors.password = 'The password doesn’t meet every rule below.'
      if (!d.confirmPassword) errors.confirmPassword = 'Enter the password again.'
      else if (d.confirmPassword !== d.password) errors.confirmPassword = 'The passwords don’t match.'
      return errors
    }
    case 'review':
      return {}
  }
}
