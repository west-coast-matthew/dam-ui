/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Root URL of the DAM API, e.g. http://localhost:8080. When unset, the services use their mocks. */
  readonly REACT_APP_API_URL?: string
  /** Share (0–1) of mocked lightbox calls that fail on purpose, to try the error states. Default 0. */
  readonly REACT_APP_MOCK_FAILURE_RATE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
