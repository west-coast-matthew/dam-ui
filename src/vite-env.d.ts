/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Root URL of the DAM API, e.g. http://localhost:8080. When unset, the services use their mocks. */
  readonly REACT_APP_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
