# Dockerize It - AI DevOps Assistant

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
    npm start
    ```

## Usage

1.  Open the application in your browser.
2.  Click the **Configuration** button (top right) to enter your API Key (Google Gemini or OpenAI).
3.  Paste a GitHub repository URL (e.g., `https://github.com/fundamentalvision/BEVFormer`).
4.  Click **Analyze**.
5.  Review the generated `Dockerfile` and `docker-compose.yml`.
6.  Use the **Deployment Instructions** section to run the application.
7.  Use the **Chat** feature to ask questions like "How do I mount a local volume for my dataset?"

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **AI Integration**: Google GenAI SDK, OpenAI Compatible Fetch
- **Utilities**: `marked` (Markdown), `lucide-react` (Icons)

## License

MIT
