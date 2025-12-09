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

## License

MIT