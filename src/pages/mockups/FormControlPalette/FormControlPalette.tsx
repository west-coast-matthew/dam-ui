import { useState, type FormEvent } from 'react'
import {
  Button,
  Checkbox,
  FileDrop,
  RadioGroup,
  RangeSlider,
  SegmentedControl,
  Select,
  Slider,
  Switch,
  TagInput,
  TextArea,
  TextField,
} from '../../../components/FormControls'
import { Panel, PanelGrid } from '../../../components/Panel'
import { StepProgress } from '../../../components/StepProgress'
import { ThemeSelect } from '../../../components/ThemeSelect'
import { Icon } from './icons'
import { PASSWORD_RULES, validateEmail, validateUsername } from './validation'
import './FormControlPalette.css'

const COLLECTIONS = [
  { value: 'brand', label: 'Brand Assets' },
  { value: 'campaigns', label: 'Campaigns' },
  { value: 'product', label: 'Product Photography' },
  { value: 'archive', label: 'Archive', disabled: true },
]

const FORMATS = [
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
  { value: 'svg', label: 'SVG' },
  { value: 'mp4', label: 'MP4' },
]

/* ---------- Text field states ---------- */

function TextFieldStates() {
  return (
    <Panel title="Text field states" subtitle="Default, placeholder, filled, required, disabled, read-only" columns={2}>
      <div className="fcp-stack">
        <TextField label="Default" />
        <TextField label="With placeholder" placeholder="e.g. Spring campaign hero" />
        <TextField label="Filled with hint" defaultValue="spring-campaign-hero.jpg" hint="Shown to everyone with access." />
        <TextField label="Required" required placeholder="Required field" />
        <TextField label="Disabled" disabled defaultValue="Can't be edited" />
        <TextField label="Read-only" readOnly defaultValue="ASSET-2026-00412" hint="Assigned automatically." />
      </div>
    </Panel>
  )
}

/* ---------- Validation ---------- */

function ValidationStates() {
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [quantity, setQuantity] = useState('120')

  const emailError = emailTouched ? validateEmail(email) : undefined
  const usernameError = validateUsername(username)
  const qty = Number(quantity)
  const quantityError = quantity === '' || Number.isNaN(qty) || qty < 1 || qty > 100 ? 'Enter a number from 1 to 100.' : undefined

  return (
    <Panel title="Validation" subtitle="Static states and live input validation" columns={2}>
      <div className="fcp-stack">
        <TextField label="Error" defaultValue="campaign hero" error="File names can't contain spaces." />
        <TextField label="Success" defaultValue="campaign-hero" success="Looks good." />
        <TextField
          label="Email (validated after you leave the field)"
          type="email"
          placeholder="name@example.com"
          prefix={<Icon name="mail" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          error={emailError}
          success={emailTouched && !emailError ? 'Valid email address.' : undefined}
        />
        <TextField
          label="Username (validated as you type)"
          placeholder="Try “admin”"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={usernameError}
          success={username && !usernameError ? 'Available.' : undefined}
          hint="Letters, numbers, - and _."
        />
        <div>
          <TextField
            label="Password with rules"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            suffix={
              <button type="button" className="fcp-affix-button" onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                <Icon name={showPassword ? 'eyeOff' : 'eye'} />
              </button>
            }
          />
          <ul className="fcp-rules" aria-label="Password requirements">
            {PASSWORD_RULES.map((rule) => {
              const ok = rule.test(password)
              return (
                <li key={rule.label} className={ok ? 'is-met' : undefined}>
                  <Icon name={ok ? 'check' : 'x'} size={14} />
                  {rule.label}
                  <span className="fc-visually-hidden">{ok ? ' (met)' : ' (not met)'}</span>
                </li>
              )
            })}
          </ul>
        </div>
        <TextField
          label="Number with range"
          type="number"
          inputMode="numeric"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          error={quantityError}
          hint="From 1 to 100."
        />
      </div>
    </Panel>
  )
}

/* ---------- Input types ---------- */

function InputTypes() {
  return (
    <Panel title="Input types" subtitle="Specialised inputs, prefixes and suffixes" columns={2}>
      <div className="fcp-stack">
        <TextField label="Search" type="search" placeholder="Search assets" prefix={<Icon name="search" />} />
        <TextField label="Price" type="number" defaultValue="49.00" step="0.01" prefix="$" suffix="USD" />
        <TextField label="Max file size" type="number" defaultValue="250" suffix="MB" />
        <TextField label="Website" type="url" placeholder="https://" />
        <TextField label="Phone" type="tel" placeholder="+1 555 0100" autoComplete="off" />
        <div className="fcp-row">
          <TextField label="Date" type="date" defaultValue="2026-11-15" />
          <TextField label="Time" type="time" defaultValue="09:30" />
        </div>
        <TextField label="Date and time" type="datetime-local" defaultValue="2026-11-15T09:30" />
        <TextField label="Brand colour" type="color" defaultValue="#2f2fd0" suffix="Pick a colour" />
      </div>
    </Panel>
  )
}

/* ---------- Text areas and selects ---------- */

function TextAreasAndSelects() {
  const [description, setDescription] = useState('Hero image for the spring campaign landing page.')
  return (
    <Panel title="Text areas and selects" subtitle="Multi-line text, dropdowns and suggestions" columns={2}>
      <div className="fcp-stack">
        <TextArea label="Description" maxLength={200} value={description}
          onChange={(e) => setDescription(e.target.value)} hint="Up to 200 characters." />
        <TextArea label="Notes with error" defaultValue="TBD" error="Notes must be at least 10 characters." rows={2} />
        <Select label="Collection" placeholder="Choose a collection" options={COLLECTIONS} defaultValue="" />
        <Select label="Collection (with value)" options={COLLECTIONS} defaultValue="campaigns" hint="Archive is read-only." />
        <Select label="Required select, error" required placeholder="Choose a format" options={FORMATS}
          defaultValue="" error="Choose a format." />
        <Select label="Disabled select" options={FORMATS} defaultValue="png" disabled />
        <Select label="Multi-select" options={FORMATS} multiple defaultValue={['jpeg', 'png']} size={5}
          hint="Hold Cmd or Ctrl to select several." />
        <div>
          <TextField label="With suggestions" list="fcp-tags" placeholder="Start typing a tag" />
          <datalist id="fcp-tags">
            {['spring', 'summer', 'campaign', 'hero', 'social', 'print'].map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
      </div>
    </Panel>
  )
}

/* ---------- Tag input ---------- */

const TAG_SUGGESTIONS = [
  { name: 'brand', count: 42 },
  { name: 'campaign', count: 18 },
  { name: 'hero', count: 9 },
  { name: 'print', count: 7 },
  { name: 'social', count: 25 },
  { name: 'spring', count: 4 },
  { name: 'summer', count: 3 },
]

function TagInputs() {
  const [tags, setTags] = useState(['brand', 'hero'])
  const [empty, setEmpty] = useState<string[]>([])
  return (
    <Panel title="Tag input" subtitle="Chips with suggestions; Enter or comma adds, Backspace removes" columns={2}>
      <div className="fcp-stack">
        <TagInput label="Tags" value={tags} onChange={setTags} suggestions={TAG_SUGGESTIONS}
          hint="Pick existing tags or type new ones." />
        <TagInput label="Empty, with placeholder" value={empty} onChange={setEmpty} suggestions={TAG_SUGGESTIONS}
          placeholder="e.g. campaign" />
        <TagInput label="With error" value={['x']} onChange={() => {}} error="Add at least two tags." />
        <TagInput label="Disabled" value={['archive', 'approved']} onChange={() => {}} disabled />
      </div>
    </Panel>
  )
}

/* ---------- Choices ---------- */

function Checkboxes() {
  const [selected, setSelected] = useState(['images'])
  const kinds = ['images', 'videos', 'documents']
  const all = selected.length === kinds.length
  const some = selected.length > 0 && !all
  const toggle = (k: string) => setSelected((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]))

  return (
    <Panel title="Checkboxes" subtitle="States and a select-all group" columns={3}>
      <div className="fcp-stack fcp-stack--tight">
        <Checkbox label="Unchecked" />
        <Checkbox label="Checked" defaultChecked />
        <Checkbox label="With description" description="Extra detail on a second line." defaultChecked />
        <Checkbox label="Disabled" disabled />
        <Checkbox label="Disabled, checked" disabled defaultChecked />
        <hr className="fcp-divider" />
        <Checkbox label="All asset types" checked={all} indeterminate={some}
          onChange={() => setSelected(all ? [] : kinds)} />
        <div className="fcp-indent">
          {kinds.map((k) => (
            <Checkbox key={k} label={k[0].toUpperCase() + k.slice(1)} checked={selected.includes(k)} onChange={() => toggle(k)} />
          ))}
        </div>
      </div>
    </Panel>
  )
}

function Radios() {
  const [visibility, setVisibility] = useState('team')
  return (
    <Panel title="Radio buttons" subtitle="Vertical, horizontal, disabled, error" columns={3}>
      <div className="fcp-stack">
        <RadioGroup
          legend="Visibility"
          value={visibility}
          onChange={setVisibility}
          options={[
            { value: 'private', label: 'Private', description: 'Only you' },
            { value: 'team', label: 'Team', description: 'Everyone on your team' },
            { value: 'public', label: 'Public', description: 'Anyone with the link' },
            { value: 'org', label: 'Organisation', description: 'Not available on your plan', disabled: true },
          ]}
        />
        <RadioGroup legend="Orientation" direction="horizontal" defaultValue="landscape"
          options={[{ value: 'landscape', label: 'Landscape' }, { value: 'portrait', label: 'Portrait' }, { value: 'square', label: 'Square' }]} />
        <RadioGroup legend="Disabled group" direction="horizontal" disabled defaultValue="a"
          options={[{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }]} />
        <RadioGroup legend="Licence" direction="horizontal" error="Choose a licence."
          options={[{ value: 'internal', label: 'Internal' }, { value: 'commercial', label: 'Commercial' }]} />
      </div>
    </Panel>
  )
}

function Switches() {
  const [autoTag, setAutoTag] = useState(true)
  return (
    <Panel title="Switches" subtitle="On/off settings that apply immediately" columns={3}>
      <div className="fcp-stack fcp-stack--tight">
        <Switch label="Auto-tag uploads" description={autoTag ? 'On: tags are suggested for new files' : 'Off'}
          checked={autoTag} onChange={(e) => setAutoTag(e.target.checked)} />
        <Switch label="Email notifications" />
        <Switch label="Watermark previews" defaultChecked />
        <Switch label="Disabled (off)" disabled />
        <Switch label="Disabled (on)" disabled defaultChecked />
      </div>
    </Panel>
  )
}

/* ---------- Sliders ---------- */

function Sliders() {
  const [quality, setQuality] = useState(80)
  return (
    <Panel title="Sliders" subtitle="Single value, marks, steps, formatted values, range" columns={1}>
      <div className="fcp-grid-2">
        <Slider label="Basic" defaultValue={40} />
        <Slider label="Export quality" value={quality} onChange={setQuality} formatValue={(v) => `${v}%`}
          hint={quality < 60 ? 'Lower quality makes smaller files.' : 'Good balance of size and quality.'} />
        <Slider label="With marks" min={0} max={100} step={25} defaultValue={50} marks={[0, 25, 50, 75, 100]} />
        <Slider label="Thumbnail size" min={64} max={512} step={64} defaultValue={256}
          marks={[64, 128, 192, 256, 320, 384, 448, 512]} formatValue={(v) => `${v}px`} />
        <RangeSlider label="File size range" min={0} max={500} step={10} defaultValue={[50, 250]} formatValue={(v) => `${v} MB`} />
        <RangeSlider label="Year" min={2010} max={2026} defaultValue={[2018, 2024]} />
        <Slider label="Disabled" defaultValue={30} disabled />
        <RangeSlider label="Disabled range" defaultValue={[20, 70]} disabled />
      </div>
    </Panel>
  )
}

/* ---------- Buttons ---------- */

function Buttons() {
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'grid' | 'list' | 'table'>('grid')
  const run = () => {
    setLoading(true)
    window.setTimeout(() => setLoading(false), 1500)
  }
  return (
    <Panel title="Buttons" subtitle="Variants, sizes, states and segmented control" columns={2}>
      <div className="fcp-stack">
        <div className="fcp-buttons">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Delete</Button>
        </div>
        <div className="fcp-buttons">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
        <div className="fcp-buttons">
          <Button icon={<Icon name="upload" />}>Upload</Button>
          <Button variant="secondary" icon={<Icon name="plus" />}>New collection</Button>
          <Button variant="secondary" icon={<Icon name="trash" />} aria-label="Delete asset" />
          <Button variant="ghost" icon={<Icon name="search" />} aria-label="Search" />
        </div>
        <div className="fcp-buttons">
          <Button disabled>Disabled</Button>
          <Button variant="secondary" disabled>Disabled</Button>
          <Button loading={loading} onClick={run}>{loading ? 'Saving…' : 'Click to load'}</Button>
        </div>
        <SegmentedControl legend="View" value={view} onChange={setView}
          options={[{ value: 'grid', label: 'Grid' }, { value: 'list', label: 'List' }, { value: 'table', label: 'Table' }]} />
      </div>
    </Panel>
  )
}

function FileUpload() {
  return (
    <Panel title="File upload" subtitle="Drop zone with file picker" columns={2}>
      <div className="fcp-stack">
        <FileDrop label="Single file" accept="image/*" hint="PNG, JPEG or WebP, up to 50 MB" />
        <FileDrop label="Multiple files" multiple />
        <FileDrop label="Disabled" disabled />
      </div>
    </Panel>
  )
}

/* ---------- Complete form ---------- */

interface AssetForm {
  title: string
  collection: string
  description: string
  licence: string
  agree: boolean
}

type Errors = Partial<Record<keyof AssetForm, string>>

function validate(form: AssetForm): Errors {
  const errors: Errors = {}
  if (!form.title.trim()) errors.title = 'Enter a title.'
  if (!form.collection) errors.collection = 'Choose a collection.'
  if (form.description.length > 0 && form.description.length < 10) errors.description = 'Use at least 10 characters, or leave it empty.'
  if (!form.licence) errors.licence = 'Choose a licence.'
  if (!form.agree) errors.agree = 'You need to confirm you have the rights to this asset.'
  return errors
}

function ExampleForm() {
  const empty: AssetForm = { title: '', collection: '', description: '', licence: '', agree: false }
  const [form, setForm] = useState(empty)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const errors = submitted ? validate(form) : {}

  const set = <K extends keyof AssetForm>(key: K, value: AssetForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.keys(validate(form)).length > 0) return
    setSaving(true)
    window.setTimeout(() => {
      setSaving(false)
      setSaved(true)
    }, 1200)
  }

  const reset = () => {
    setForm(empty)
    setSubmitted(false)
    setSaved(false)
  }

  return (
    <Panel title="Example form" subtitle="Validation on submit. Nothing is sent anywhere." columns={1} collapsible>
      <form className="fcp-form" onSubmit={onSubmit} noValidate>
        <TextField label="Title" required value={form.title} onChange={(e) => set('title', e.target.value)}
          error={errors.title} placeholder="e.g. Spring campaign hero" />
        <Select label="Collection" required placeholder="Choose a collection" options={COLLECTIONS}
          value={form.collection} onChange={(e) => set('collection', e.target.value)} error={errors.collection} />
        <TextArea label="Description" className="fcp-form__wide" maxLength={200} rows={3}
          value={form.description} onChange={(e) => set('description', e.target.value)} error={errors.description} />
        <RadioGroup legend="Licence" direction="horizontal" value={form.licence} onChange={(v) => set('licence', v)}
          error={errors.licence}
          options={[{ value: 'internal', label: 'Internal use' }, { value: 'commercial', label: 'Commercial' }, { value: 'editorial', label: 'Editorial' }]} />
        <FileDrop label="File" hint="Optional in this mockup" />
        <div className="fcp-form__wide">
          <Checkbox label="I have the rights to share this asset" checked={form.agree}
            onChange={(e) => set('agree', e.target.checked)} aria-invalid={errors.agree ? true : undefined} />
          {errors.agree && <p className="fc-message fcp-error" role="alert">{errors.agree}</p>}
        </div>
        <div className="fcp-form__wide fcp-buttons">
          <Button type="submit" loading={saving}>{saving ? 'Saving…' : 'Save asset'}</Button>
          <Button variant="secondary" onClick={reset}>Reset</Button>
          {saved && <span className="fcp-saved" role="status"><Icon name="check" /> Saved (mockup only)</span>}
        </div>
      </form>
    </Panel>
  )
}

const DEMO_STEPS = [
  { id: 'account', label: 'Account' },
  { id: 'details', label: 'Details' },
  { id: 'files', label: 'Files' },
  { id: 'review', label: 'Review' },
]

function ProgressIndicator() {
  const [current, setCurrentState] = useState(1)
  const [reached, setReached] = useState(1)
  const setCurrent = (next: number) => {
    setCurrentState(next)
    setReached((r) => Math.max(r, next))
  }
  const done = current >= DEMO_STEPS.length
  return (
    <Panel title="Progress indicator" subtitle="StepProgress: finished steps, and the furthest step reached, can be clicked to jump to them" columns={1}>
      <div className="fcp-progress">
        <StepProgress steps={DEMO_STEPS} current={current} reached={reached} onStepSelect={setCurrent} label="Example progress" />
        <div className="fcp-actions">
          <Button variant="secondary" disabled={current === 0} onClick={() => setCurrent(current - 1)}>Back</Button>
          <Button disabled={done} onClick={() => setCurrent(current + 1)}>
            {current === DEMO_STEPS.length - 1 ? 'Finish' : 'Next'}
          </Button>
          {done && <Button variant="ghost" onClick={() => { setCurrentState(0); setReached(0) }}>Start again</Button>}
        </div>
        <div className="fcp-progress__static">
          <p className="fcp-muted">First step</p>
          <StepProgress steps={DEMO_STEPS} current={0} label="First step example" />
          <p className="fcp-muted">All steps complete</p>
          <StepProgress steps={DEMO_STEPS} current={DEMO_STEPS.length} label="Completed example" />
        </div>
      </div>
    </Panel>
  )
}

/** Mockup page showing every form control and its states, grouped into Panels. */
export function FormControlPalette() {
  return (
    <div className="fcp-page">
      <header className="fcp-header">
        <div>
          <h1>Form controls</h1>
          <p className="fcp-muted">Every form control and its states, in every theme</p>
        </div>
        <ThemeSelect />
      </header>
      <PanelGrid>
        <TextFieldStates />
        <ValidationStates />
        <InputTypes />
        <TextAreasAndSelects />
        <TagInputs />
        <Checkboxes />
        <Radios />
        <Switches />
        <Sliders />
        <Buttons />
        <FileUpload />
        <ProgressIndicator />
        <ExampleForm />
      </PanelGrid>
    </div>
  )
}
