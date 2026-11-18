import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { useLogout } from '../../auth/useLogout'
import { Button } from '../../components/FormControls'
import { StepProgress } from '../../components/StepProgress'
import { ThemeSelect } from '../../components/ThemeSelect'
import { TitleBarIcon } from '../../components/TitleBar/icons'
import { initializeInstallation, type InstallationResult } from '../../services/installationService'
import { StepFields } from './StepFields'
import { EMPTY_WIZARD, STEPS, validateStep, type StepErrors, type StepId, type WizardData } from './wizardModel'
import './InitializeWizard.css'

/** Collects what a new installation needs, one step at a time, then creates it through the (mock) service. */
export function InitializeWizard() {
  const [data, setData] = useState<WizardData>(EMPTY_WIZARD)
  const [index, setIndex] = useState(0)
  /** Furthest step reached, so the progress indicator can jump forward again after going back. */
  const [reached, setReached] = useState(0)
  const [direction, setDirection] = useState(1)
  const [errors, setErrors] = useState<StepErrors>({})
  const [result, setResult] = useState<InstallationResult | null>(null)
  const moved = useRef(false)
  const reduceMotion = useReducedMotion()
  const { user } = useAuth()
  const logOut = useLogout()
  const navigate = useNavigate()

  const create = useMutation({ mutationFn: initializeInstallation, onSuccess: setResult })

  const step = STEPS[index]
  const isLast = index === STEPS.length - 1

  // When a new step (or the confirmation) appears after the user moved, focus its heading so screen
  // readers announce it. A callback ref fires when the heading mounts, which with the exit animation
  // is after the old step has gone.
  const focusHeading = useCallback((el: HTMLHeadingElement | null) => {
    if (el && moved.current) el.focus()
  }, [])

  const goTo = (next: number) => {
    if (next === index) return
    // Moving forward (Next, or jumping ahead in the progress indicator) needs the current step to be valid.
    if (next > index) {
      const stepErrors = validateStep(step.id, data)
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors)
        return
      }
    }
    moved.current = true
    setDirection(next > index ? 1 : -1)
    setErrors({})
    setIndex(next)
    setReached((r) => Math.max(r, next))
  }

  const onChange = (patch: Partial<WizardData>) => {
    setData((d) => ({ ...d, ...patch }))
    // Clear an error as soon as the field it belongs to changes.
    setErrors((e) => {
      const next = { ...e }
      for (const key of Object.keys(patch) as (keyof WizardData)[]) delete next[key]
      return next
    })
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (create.isPending) return
    if (!isLast) {
      goTo(index + 1)
      return
    }
    create.mutate({
      type: data.type!,
      ownerName: data.ownerName.trim(),
      workspaceName: data.workspaceName.trim() || null,
      catalogName: data.catalogName.trim() || null,
      rootPassword: data.password,
    })
  }

  // The new installation is signed into from scratch, so end any current session first.
  const toSignIn = () => (user ? void logOut() : navigate('/login'))

  const offset = reduceMotion ? 0 : 40
  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * offset }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -offset }),
  }

  return (
    <div className="iw">
      <div className="iw__top">
        <Link to="/" className="iw__exit">Exit setup</Link>
        <ThemeSelect />
      </div>
      <main className="iw__card">
        <header className="iw__header">
          <span className="iw__logo" aria-hidden="true"><TitleBarIcon name="layers" size={22} /></span>
          <h1 className="iw__title">Initialize new installation</h1>
        </header>

        <StepProgress
          className="iw__progress"
          label="Setup progress"
          steps={STEPS}
          current={result ? STEPS.length : index}
          reached={reached}
          onStepSelect={result || create.isPending ? undefined : goTo}
        />

        <AnimatePresence mode="wait" custom={direction} initial={false}>
          {result ? (
            <motion.section key="done" className="iw__done" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.25 }} aria-labelledby="iw-done-title">
              <span className="iw__done-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.4"
                  strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5 10 17l9-10" /></svg>
              </span>
              <h2 id="iw-done-title" ref={focusHeading} tabIndex={-1} className="iw__step-title">Your installation is ready</h2>
              <p className="iw__step-text">
                We created the <strong>{result.workspaceName}</strong> workspace
                {result.catalogName && <> with the <strong>{result.catalogName}</strong> catalog</>} for{' '}
                <strong>{data.ownerName.trim()}</strong>. Sign in as <strong>{result.rootUsername}</strong> with the password you just set.
              </p>
              <Button size="lg" onClick={toSignIn}>Go to sign in</Button>
            </motion.section>
          ) : (
            <motion.form
              key={step.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeOut' }}
              className="iw__step"
              onSubmit={onSubmit}
              noValidate
              aria-labelledby="iw-step-title"
            >
              <h2 id="iw-step-title" ref={focusHeading} tabIndex={-1} className="iw__step-title">{step.title(data)}</h2>
              <p className="iw__step-text">{step.description(data)}</p>

              {create.isError && isLast && (
                <p className="iw-error iw-error--banner" role="alert">
                  {create.error instanceof Error ? create.error.message : 'Setup failed.'} Please try again.
                </p>
              )}

              <fieldset className="iw__fields" disabled={create.isPending}>
                <legend className="fc-visually-hidden">{step.label}</legend>
                <StepFields
                  step={step.id}
                  data={data}
                  errors={errors}
                  onChange={onChange}
                  onEditStep={(id: StepId) => goTo(STEPS.findIndex((s) => s.id === id))}
                />
              </fieldset>

              <div className="iw__actions">
                {index > 0 && (
                  <Button variant="secondary" disabled={create.isPending} onClick={() => goTo(index - 1)}>Back</Button>
                )}
                <Button type="submit" loading={create.isPending}>
                  {isLast ? (create.isPending ? 'Creating…' : 'Create installation') : step.id === 'catalog' && !data.catalogName.trim() ? 'Skip' : 'Next'}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
