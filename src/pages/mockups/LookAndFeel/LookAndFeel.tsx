import { useState } from 'react'
import { motion } from 'motion/react'
import { useLogout } from '../../../auth/useLogout'
import { ThemeSelect } from '../../../components/ThemeSelect'
import { Icon, type IconName } from './icons'
import { LineChart, RingGauge, Sparkline } from './charts'
import {
  ACTIVITY,
  ACTIVITY_DAYS,
  COLLECTIONS,
  KPIS,
  RANGES,
  RECENT_ASSETS,
  SPARKLINE,
  STATS,
} from './mockData'
import './LookAndFeel.css'

const NAV: { icon: IconName; label: string }[] = [
  { icon: 'home', label: 'Dashboard' },
  { icon: 'assets', label: 'Assets' },
  { icon: 'collections', label: 'Collections' },
  { icon: 'reports', label: 'Reports' },
]

const rise = (index: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay: index * 0.05 },
})

function formatChange(change: number) {
  return `${change > 0 ? '↑ +' : '↓ '}${change}%`
}

/** Mockup dashboard used to compare the White, Blue and Dark themes. */
export function LookAndFeel() {
  const [range, setRange] = useState<(typeof RANGES)[number]>('2w')
  const logOut = useLogout()

  return (
    <div className="laf">
      <nav className="laf-nav" aria-label="Main">
        <div className="laf-nav__logo" aria-hidden="true">◆</div>
        <ul>
          {NAV.map(({ icon, label }, i) => (
            <li key={icon}>
              <a href="#" className={i === 0 ? 'is-active' : undefined} aria-label={label} title={label}>
                <Icon name={icon} />
              </a>
            </li>
          ))}
        </ul>
        <button type="button" className="laf-nav__logout" aria-label="Log out" title="Log out" onClick={logOut}>
          <Icon name="logout" />
        </button>
      </nav>

      <div className="laf-body">
        <header className="laf-header">
          <div>
            <h1>Look and Feel</h1>
            <p className="laf-muted">Mockup dashboard for comparing colour themes</p>
          </div>
          <ThemeSelect />
        </header>

        <div className="laf-grid">
          <main className="laf-main">
            <section className="laf-kpis" aria-label="Key metrics">
              {KPIS.map((kpi, i) => (
                <motion.article key={kpi.label} className={`laf-card laf-kpi${i === 0 ? ' laf-kpi--highlight' : ''}`} {...rise(i)}>
                  <p className="laf-kpi__value">{kpi.value}</p>
                  <p className="laf-kpi__label">{kpi.label}</p>
                  {i === 0 ? (
                    <Sparkline values={SPARKLINE} />
                  ) : (
                    <p className={kpi.change >= 0 ? 'laf-positive' : 'laf-negative'}>{formatChange(kpi.change)}</p>
                  )}
                </motion.article>
              ))}
            </section>

            <motion.section className="laf-card laf-activity" {...rise(4)}>
              <div className="laf-section-head">
                <div>
                  <h2>Asset activity</h2>
                  <p className="laf-muted">11/15/26 – 11/28/26</p>
                </div>
                <div className="laf-activity__actions">
                  <div className="laf-tabs" role="group" aria-label="Date range">
                    {RANGES.map((r) => (
                      <button key={r} type="button" aria-pressed={r === range} onClick={() => setRange(r)}>
                        {r}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="laf-button">Download CSV</button>
                </div>
              </div>
              <LineChart series={ACTIVITY} labels={ACTIVITY_DAYS} />
            </motion.section>

            <section className="laf-collections" aria-label="Highlights">
              {COLLECTIONS.map((c, i) => (
                <motion.article key={c.label} className="laf-card" {...rise(5 + i)}>
                  <p className="laf-eyebrow">{c.label}</p>
                  <p className="laf-collections__name">{c.name}</p>
                  <p className="laf-collections__count">
                    {c.count.toLocaleString()} <span className="laf-muted">/ {c.unit}</span>
                  </p>
                </motion.article>
              ))}
            </section>
          </main>

          <aside className="laf-side">
            <motion.section className="laf-panel" {...rise(3)}>
              <h2>Statistics</h2>
              {STATS.map((s) => (
                <div key={s.label} className="laf-stat">
                  <p className="laf-stat__label">{s.label}</p>
                  <RingGauge value={s.value} max={s.max} />
                  <div className="laf-stat__numbers">
                    <p className="laf-eyebrow">Max {s.max}</p>
                    <p className="laf-stat__value">{s.value}</p>
                  </div>
                </div>
              ))}
            </motion.section>

            <motion.section className="laf-panel" {...rise(6)}>
              <h2>Recent assets</h2>
              <table className="laf-table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Type</th>
                    <th scope="col">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {RECENT_ASSETS.map((a) => (
                    <tr key={a.name}>
                      <td>
                        {a.name}
                        <span className="laf-muted laf-table__sub">{a.updated}</span>
                      </td>
                      <td>{a.type}</td>
                      <td>{a.size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.section>
          </aside>
        </div>
      </div>
    </div>
  )
}
