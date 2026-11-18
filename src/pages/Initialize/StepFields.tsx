import { useState, type ReactNode } from 'react'
import { TextField } from '../../components/FormControls'
import { DEFAULT_WORKSPACE_NAME, ROOT_USERNAME } from '../../services/installationService'
import { PASSWORD_RULES, type StepErrors, type StepId, type WizardData } from './wizardModel'

interface StepFieldsProps {
  step: StepId
  data: WizardData
  errors: StepErrors
  onChange: (patch: Partial<WizardData>) => void
  onEditStep: (step: StepId) => void
}

const TYPE_OPTIONS = [
  { value: 'organization', title: 'An organization', text: 'A company, team or institution. Several people will share it.' },
  { value: 'individual', title: 'An individual', text: 'Just for you, for example a photographer’s or designer’s own library.' },
] as const

const EyeIcon = ({ off }: { off: boolean }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
)

function ReviewRow({ label, value, step, onEditStep }: { label: string; value: ReactNode; step: StepId; onEditStep: (s: StepId) => void }) {
  return (
    <div className="iw-review__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
      <button type="button" className="iw-link" onClick={() => onEditStep(step)} aria-label={`Change ${label.toLowerCase()}`}>
        Change
      </button>
    </div>
  )
}

/** The inputs for one wizard step. */
export function StepFields({ step, data, errors, onChange, onEditStep }: StepFieldsProps) {
  const [showPassword, setShowPassword] = useState(false)

  switch (step) {
    case 'type':
      return (
        <fieldset className="iw-choices">
          <legend className="fc-visually-hidden">Installation type</legend>
          {TYPE_OPTIONS.map((o) => (
            <label key={o.value} className={`iw-choice${data.type === o.value ? ' iw-choice--selected' : ''}`}>
              <input type="radio" name="installation-type" value={o.value} checked={data.type === o.value}
                onChange={() => onChange({ type: o.value })} />
              <span className="iw-choice__title">{o.title}</span>
              <span className="iw-choice__text">{o.text}</span>
            </label>
          ))}
          {errors.type && <p className="iw-error" role="alert">{errors.type}</p>}
        </fieldset>
      )

    case 'name':
      return (
        <TextField
          label={data.type === 'individual' ? 'Your name' : 'Organization name'}
          required
          autoComplete={data.type === 'individual' ? 'name' : 'organization'}
          maxLength={160}
          value={data.ownerName}
          error={errors.ownerName}
          placeholder={data.type === 'individual' ? 'e.g. Jamie Rivera' : 'e.g. Northwind Studios'}
          onChange={(e) => onChange({ ownerName: e.target.value })}
        />
      )

    case 'workspace':
      return (
        <TextField
          label="Workspace name"
          maxLength={80}
          value={data.workspaceName}
          error={errors.workspaceName}
          placeholder={DEFAULT_WORKSPACE_NAME}
          hint={`Optional. Leave blank to use “${DEFAULT_WORKSPACE_NAME}”.`}
          onChange={(e) => onChange({ workspaceName: e.target.value })}
        />
      )

    case 'catalog':
      return (
        <TextField
          label="Catalog name"
          maxLength={80}
          value={data.catalogName}
          error={errors.catalogName}
          placeholder="e.g. Brand"
          hint="Optional. Leave blank to skip."
          onChange={(e) => onChange({ catalogName: e.target.value })}
        />
      )

    case 'password': {
      const reveal = (
        <button type="button" className="iw-reveal" aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}
          aria-pressed={showPassword} onClick={() => setShowPassword((s) => !s)}>
          <EyeIcon off={showPassword} />
        </button>
      )
      return (
        <div className="iw-fields">
          {/* Lets password managers save the new password against the root account. */}
          <input type="text" name="username" autoComplete="username" value={ROOT_USERNAME} readOnly hidden />
          <p className="iw-note">The root user’s name is <strong>{ROOT_USERNAME}</strong>.</p>
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            required
              autoComplete="new-password"
            value={data.password}
            error={errors.password}
            suffix={reveal}
            onChange={(e) => onChange({ password: e.target.value })}
          />
          <ul className="iw-rules" aria-label="Password rules">
            {PASSWORD_RULES.map((rule) => {
              const met = rule.test(data.password)
              return (
                <li key={rule.label} className={met ? 'iw-rules__met' : undefined}>
                  <span aria-hidden="true">{met ? '✓' : '•'}</span> {rule.label}
                  <span className="fc-visually-hidden">{met ? ' (met)' : ' (not met)'}</span>
                </li>
              )
            })}
          </ul>
          <TextField
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={data.confirmPassword}
            error={errors.confirmPassword}
            onChange={(e) => onChange({ confirmPassword: e.target.value })}
          />
        </div>
      )
    }

    case 'review':
      return (
        <dl className="iw-review">
          <ReviewRow label="Installation for" value={data.type === 'individual' ? 'An individual' : 'An organization'} step="type" onEditStep={onEditStep} />
          <ReviewRow label={data.type === 'individual' ? 'Your name' : 'Organization name'} value={data.ownerName.trim()} step="name" onEditStep={onEditStep} />
          <ReviewRow label="Workspace" value={data.workspaceName.trim() || <>{DEFAULT_WORKSPACE_NAME} <span className="iw-muted">(default)</span></>} step="workspace" onEditStep={onEditStep} />
          <ReviewRow label="Catalog" value={data.catalogName.trim() || <span className="iw-muted">None</span>} step="catalog" onEditStep={onEditStep} />
          <ReviewRow label="Root password" value={<span className="iw-muted">Set ({data.password.length} characters)</span>} step="password" onEditStep={onEditStep} />
        </dl>
      )
  }
}
