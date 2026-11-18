// Installation service. For now it emulates the API; replace the bodies with real requests
// once the API supports first-time setup. Callers only depend on these signatures.

export type InstallationType = 'organization' | 'individual'

/** Everything the setup wizard collects. */
export interface InstallationRequest {
  type: InstallationType
  /** The organization's name, or the person's name for an individual installation. */
  ownerName: string
  /** Null to use the default workspace name. */
  workspaceName: string | null
  /** Null to skip creating a catalog. */
  catalogName: string | null
  /** Password for the root user. Never logged or stored by the front end. */
  rootPassword: string
}

export interface InstallationResult {
  workspaceName: string
  catalogName: string | null
  /** User name of the root account. */
  rootUsername: string
}

export const DEFAULT_WORKSPACE_NAME = 'Default'
export const ROOT_USERNAME = 'root'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Whether this installation still needs setting up. In the final app the start page calls this and
 * shows the setup wizard when it returns false; for now the wizard is reached from the menu.
 */
export async function isInitialized(): Promise<boolean> {
  await delay(300)
  return true
}

/** Emulates the call that creates the root user, the first workspace and (optionally) a catalog. */
export async function initializeInstallation(request: InstallationRequest): Promise<InstallationResult> {
  await delay(1800)
  return {
    workspaceName: request.workspaceName?.trim() || DEFAULT_WORKSPACE_NAME,
    catalogName: request.catalogName?.trim() || null,
    rootUsername: ROOT_USERNAME,
  }
}
