import { useLogout } from '../../../auth/useLogout'
import { Panel, PanelGrid } from '../../../components/Panel'
import { TitleBar } from '../../../components/TitleBar'
import { THEMES } from '../../../theme/themes'
import { useTheme } from '../../../theme/useTheme'
import { useWorkspace } from '../../../workspace/useWorkspace'
import './TitleBarDemo.css'

const MOCK_USER = 'Alex Morgan'

/** Mockup page showing the main title bar above sample content. */
export function TitleBarDemo() {
  const logOut = useLogout()
  const { theme } = useTheme()
  const { current, workspaces } = useWorkspace()

  return (
    <>
      <TitleBar userName={MOCK_USER} onLogout={logOut} />
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
