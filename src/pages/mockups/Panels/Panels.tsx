import { useState } from 'react'
import { Panel, PanelGrid, type PanelColumns } from '../../../components/Panel'
import { ThemeSelect } from '../../../components/ThemeSelect'
import { ActivityLineChart, UploadsBarChart } from './DemoChart'
import { Metrics } from './Metrics'
import './Panels.css'

/* ---------- Playground: every property, adjustable ---------- */

const PLAYGROUND_IDS = ['p1', 'p2', 'p3'] as const

function Playground() {
  const [columns, setColumns] = useState<PanelColumns>(2)
  const [showSubtitle, setShowSubtitle] = useState(true)
  const [collapsible, setCollapsible] = useState(true)
  const [deletable, setDeletable] = useState(true)
  const [draggable, setDraggable] = useState(true)
  const [order, setOrder] = useState<string[]>([...PLAYGROUND_IDS])

  const toggles = [
    { label: 'Subtitle', value: showSubtitle, set: setShowSubtitle },
    { label: 'Collapsible', value: collapsible, set: setCollapsible },
    { label: 'Deletable', value: deletable, set: setDeletable },
    { label: 'Draggable', value: draggable, set: setDraggable },
  ]

  return (
    <section className="demo-section" aria-labelledby="playground-title">
      <div className="demo-section__head">
        <div>
          <h2 id="playground-title">Playground</h2>
          <p className="demo-muted">Change the properties below; they apply to every panel in the preview.</p>
        </div>
      </div>

      <div className="demo-controls">
        <fieldset className="demo-segmented">
          <legend>Columns</legend>
          {([1, 2, 3] as const).map((n) => (
            <label key={n}>
              <input type="radio" name="pg-columns" checked={columns === n} onChange={() => setColumns(n)} />
              <span>{n}</span>
            </label>
          ))}
        </fieldset>
        {toggles.map((t) => (
          <label key={t.label} className="demo-toggle">
            <input type="checkbox" checked={t.value} onChange={(e) => t.set(e.target.checked)} />
            <span>{t.label}</span>
          </label>
        ))}
        <button
          type="button"
          className="demo-button"
          disabled={order.length === PLAYGROUND_IDS.length && order.every((id, i) => id === PLAYGROUND_IDS[i])}
          onClick={() => setOrder([...PLAYGROUND_IDS])}
        >
          Reset panels
        </button>
      </div>

      <PanelGrid order={order} onReorder={setOrder}>
        {order.map((id) => {
          const n = PLAYGROUND_IDS.indexOf(id as (typeof PLAYGROUND_IDS)[number]) + 1
          return (
            <Panel
              key={id}
              id={id}
              title={`Panel ${n}`}
              subtitle={showSubtitle ? 'Uploads and downloads, last 7 days' : undefined}
              columns={columns}
              collapsible={collapsible}
              draggable={draggable}
              onDelete={deletable ? () => setOrder((o) => o.filter((x) => x !== id)) : undefined}
            >
              <Metrics />
              <ActivityLineChart height={180} />
            </Panel>
          )
        })}
      </PanelGrid>
      {order.length === 0 && <p className="demo-empty">All panels deleted. Use “Reset panels” to bring them back.</p>}
    </section>
  )
}

/* ---------- Fixed variations ---------- */

function Variations() {
  const [showAllActions, setShowAllActions] = useState(true)

  return (
    <section className="demo-section" aria-labelledby="variations-title">
      <div className="demo-section__head">
        <h2 id="variations-title">Variations</h2>
      </div>

      <h3 className="demo-label">Full width · title only</h3>
      <PanelGrid>
        <Panel title="Asset activity">
          <ActivityLineChart />
        </Panel>
      </PanelGrid>

      <h3 className="demo-label">Two per row · subtitle, collapsible (second starts collapsed)</h3>
      <PanelGrid>
        <Panel title="Library overview" subtitle="Across all collections" columns={2} collapsible>
          <Metrics />
        </Panel>
        <Panel title="Uploads per day" subtitle="This week" columns={2} collapsible defaultCollapsed>
          <UploadsBarChart />
        </Panel>
      </PanelGrid>

      <h3 className="demo-label">Three per row · mixed options</h3>
      <PanelGrid>
        <Panel key="title-only" title="Title only" columns={3}>
          <Metrics items={[{ label: 'Images', value: '1,402' }]} />
        </Panel>
        <Panel key="with-subtitle" title="With subtitle" subtitle="Optional second line" columns={3}>
          <Metrics items={[{ label: 'Videos', value: '318', change: 6 }]} />
        </Panel>
        {showAllActions && (
          <Panel key="all-actions" title="All actions" subtitle="Collapse and delete" columns={3} collapsible
            onDelete={() => setShowAllActions(false)}>
            <Metrics items={[{ label: 'Documents', value: '880', change: -2 }]} />
          </Panel>
        )}
      </PanelGrid>
      {!showAllActions && (
        <button type="button" className="demo-link" onClick={() => setShowAllActions(true)}>
          Restore deleted panel
        </button>
      )}
    </section>
  )
}

/* ---------- Draggable dashboard: fixed and movable panels together ---------- */

interface DashPanel {
  id: string
  title: string
  subtitle?: string
  columns: PanelColumns
  draggable: boolean
  content: 'line' | 'bar' | 'metrics'
}

const DASHBOARD: DashPanel[] = [
  { id: 'summary', title: 'Summary', subtitle: 'Fixed position', columns: 1, draggable: false, content: 'metrics' },
  { id: 'activity', title: 'Activity', subtitle: 'Draggable', columns: 2, draggable: true, content: 'line' },
  { id: 'uploads', title: 'Uploads', subtitle: 'Draggable', columns: 2, draggable: true, content: 'bar' },
  { id: 'images', title: 'Images', subtitle: 'Draggable', columns: 3, draggable: true, content: 'metrics' },
  { id: 'storage', title: 'Storage', subtitle: 'Fixed position', columns: 3, draggable: false, content: 'metrics' },
  { id: 'videos', title: 'Videos', subtitle: 'Draggable', columns: 3, draggable: true, content: 'metrics' },
]

const byId = new Map(DASHBOARD.map((p) => [p.id, p]))

function DraggableDashboard() {
  const [order, setOrder] = useState(DASHBOARD.map((p) => p.id))
  const isDefault = order.every((id, i) => id === DASHBOARD[i].id)

  return (
    <section className="demo-section" aria-labelledby="drag-title">
      <div className="demo-section__head">
        <div>
          <h2 id="drag-title">Draggable layout</h2>
          <p className="demo-muted">
            Drag a panel by its handle onto another draggable panel to swap places, or focus the handle and use the
            arrow keys. Fixed panels keep their position. Panels can be moved but not resized.
          </p>
        </div>
        <button type="button" className="demo-button" disabled={isDefault} onClick={() => setOrder(DASHBOARD.map((p) => p.id))}>
          Reset layout
        </button>
      </div>
      <PanelGrid order={order} onReorder={setOrder}>
        {order.map((id) => {
          const p = byId.get(id)!
          return (
            <Panel key={id} id={id} title={p.title} subtitle={p.subtitle} columns={p.columns} draggable={p.draggable}>
              {p.content === 'line' && <ActivityLineChart height={180} />}
              {p.content === 'bar' && <UploadsBarChart />}
              {p.content === 'metrics' && <Metrics items={p.columns === 1 ? undefined : [{ label: p.title, value: '1,024', change: 4 }]} />}
            </Panel>
          )
        })}
      </PanelGrid>
    </section>
  )
}

/** Mockup page showing the Panel component and all of its properties. */
export function Panels() {
  return (
    <div className="demo-page">
      <header className="demo-header">
        <div>
          <h1>Panels</h1>
          <p className="demo-muted">The Panel component and its properties, in every theme</p>
        </div>
        <ThemeSelect />
      </header>
      <Playground />
      <Variations />
      <DraggableDashboard />
    </div>
  )
}
