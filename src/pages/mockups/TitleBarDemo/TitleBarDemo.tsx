import { useState } from 'react'
import { Button } from '../../../components/FormControls'
import { Panel, PanelGrid } from '../../../components/Panel'
import { TitleBar } from '../../../components/TitleBar'
import { THEMES } from '../../../theme/themes'
import { useTheme } from '../../../theme/useTheme'
import { useWorkspace } from '../../../workspace/useWorkspace'
import './TitleBarDemo.css'

const MOCK_USER = 'Alex Morgan'

/** Mockup page showing the main title bar above sample content. */
export function TitleBarDemo() {
  const [signedIn, setSignedIn] = useState(true)
  const { theme } = useTheme()
  const { current, workspaces } = useWorkspace()

  if (!signedIn) {
    return (
      <main className="tbd-signed-out">
        <h1>You've been signed out</h1>
        <p>This is a mockup, so nothing actually happened.</p>
        <Button onClick={() => setSignedIn(true)}>Sign back in</Button>
      </main>
    )
  }

  return (
    <>
      <TitleBar userName={MOCK_USER} onLogout={() => setSignedIn(false)} />
      <main className="tbd-content">
        <h1>Title bar</h1>
        <p className="tbd-muted">
          Use the Workspaces menu to switch or create a workspace, and the settings icon to change the theme.
        </p>
        <PanelGrid>
          <Panel title="Current workspace" subtitle="Shared by every page through WorkspaceProvider" columns={3}>
            <p className="tbd-value">{current.name}</p>
            <p className="tbd-muted">{workspaces.length} workspaces available</p>
          </Panel>
          <Panel title="Theme" subtitle="Also set from the settings menu" columns={3}>
            <p className="tbd-value">{THEMES.find((t) => t.id === theme)?.label}</p>
          </Panel>
          <Panel title="Signed in as" subtitle="Mock user" columns={3}>
            <p className="tbd-value">{MOCK_USER}</p>
          </Panel>
        </PanelGrid>
      </main>
    </>
  )
}
