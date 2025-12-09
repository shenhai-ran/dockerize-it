# Dockerize It - AI DevOps Assistant

> ⚡ **This project was built primarily using Vibe Coding with Gemini 3.0 Pro.**

**Dockerize It** is a powerful web application that analyzes GitHub repositories to automatically generate production-ready `Dockerfile` and `docker-compose.yml` configurations. It specializes in detecting complex dependencies, particularly for Deep Learning projects (PyTorch, CUDA, etc.).

## Features

- **Automated Analysis**: Fetches repository structure and reads configuration files (requirements.txt, setup.py, etc.) to understand the project.
- **Deep Learning Smart**: Automatically detects PyTorch/TensorFlow versions and pins appropriate CUDA base images.
- **Interactive Chat**: Includes an AI assistant context-aware of the generated files to help you debug or refine the configuration.
- **Multi-Provider Support**: Works with Google Gemini (default) and OpenAI-compatible providers.
- **Secure**: API keys are stored in your browser's Local Storage or can be injected via environment variables. Keys are never sent to our servers.
- **Live Preview**: Syntax-highlighted previews of generated files with one-click copy.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/dockerize-it.git
    cd dockerize-it
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  (Optional) Configure Environment Variables:
    Copy the example environment file and add your API keys if you want them pre-loaded.
    ```bash
    cp .env.example .env
    ```

4.  Start the development server:
    ```bash
    npm run dev
    ```

## Deployment on Vercel

1.  Push this code to a GitHub repository.
2.  Import the project into Vercel.
3.  Vercel should automatically detect the **Vite** framework preset.
4.  Add your Environment Variables in the Vercel project settings if needed (`REACT_APP_DEFAULT_PROVIDER`, etc.).
5.  Deploy!

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **AI Integration**: Google GenAI SDK, OpenAI Compatible Fetch
- **Utilities**: `marked` (Markdown)
- **Development**: Vibe Coding with Gemini 3.0 Pro

## Known Issues

Google AI Studio environment restrictions prevented the automatic creation/modification of the `.env.example` file. For local development, please create/update the `.env.example` file manually with the following content:

```bash
# Google Gemini API Key
# Required if using Google provider (default).
# Get it from https://aistudio.google.com/
VITE_GEMINI_API_KEY=

# OpenAI API Key
# Required if using OpenAI provider.
# Get it from https://platform.openai.com/
VITE_OPENAI_API_KEY=

# Default Provider
# Options: google | openai | custom
# Default: google
VITE_DEFAULT_PROVIDER=google

# Model Name
# Overrides the default model selection.
# Google Examples: gemini-3-pro-preview, gemini-2.5-flash
# OpenAI Examples: gpt-4o, gpt-4-turbo
VITE_MODEL_NAME=

# Base URL
# Optional. Useful for custom OpenAI-compatible endpoints (e.g., LocalAI, Ollama)
# Example: http://localhost:11434/v1
VITE_BASE_URL=
```

## License

MIT