interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_DEFAULT_PROVIDER: string
  readonly VITE_MODEL_NAME: string
  readonly VITE_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}