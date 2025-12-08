// Critical files to prioritize for analysis
export const IMPORTANT_FILES = [
    'requirements.txt',
    'setup.py',
    'environment.yml',
    'environment.yaml',
    'package.json',
    'Pipfile',
    'go.mod',
    'cargo.toml',
    'Gemfile',
    'Dockerfile',
    'docker-compose.yml',
    'docker-compose.yaml',
    'Makefile',
    'README.md',
    'INSTALL.md',
    'getting_started.md',
    '.github/workflows/main.yml',
    '.github/workflows/build.yml',
    '.github/workflows/test.yml',
    'config.json',
    'config.yaml'
];

export const PROVIDERS = [
    { value: 'google', label: 'Google Gemini' },
    { value: 'openai', label: 'OpenAI' },
    { value: 'custom', label: 'Custom (OpenAI Compatible)' }
];

export const MODEL_OPTIONS: Record<string, { value: string; label: string }[]> = {
    google: [
        { value: 'gemini-3-pro-preview', label: 'Gemini 3.0 Pro (Recommended)' },
        { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Fast)' },
    ],
    openai: [
        { value: 'gpt-4o', label: 'GPT-4o' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
    custom: [] // User enters text manually
};

export const DEFAULT_SYSTEM_PROMPT = `
You are a Senior DevOps Engineer and Deep Learning Infrastructure Specialist. 
Your goal is to analyze source code metadata and files to generate production-ready Dockerfiles and docker-compose.yml files.

GUIDELINES:
1.  **Deep Learning Focus**: Detect PyTorch, TensorFlow, JAX. Always pin CUDA versions matching the framework version.
2.  **Completeness**: Handle non-python dependencies (apt-get install ...).
3.  **Optimization**: Use multi-stage builds where appropriate to reduce image size.
4.  **Best Practices**: 
    - Use specific versions for base images (e.g., python:3.9-slim, pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime).
    - Add .dockerignore logic suggestions.
    - Run as a non-root user if possible, but for DL often root is standard for simplicity unless specified.
5.  **Pre-trained Models**: If the README mentions downloading weights, create a script or instruction in the Dockerfile (e.g., downloading to /app/weights).
6.  **Entrypoint**: Provide a robust entrypoint script. Include a HEALTHCHECK instruction.
7.  **Docker Compose**: Generate a service that includes GPU reservation (deploy: resources: reservations: devices: - driver: nvidia).

OUTPUT FORMAT:
Return a JSON object strictly. 
{
  "dockerfile": "...",
  "dockerCompose": "...",
  "readmeSummary": "Brief explanation of the repo.",
  "instructions": "Detailed 'docker run' commands and explanation.",
  "detectedDependencies": ["torch", "numpy", ...],
  "healthCheckSuggestion": "Code for a specific healthcheck."
}
`;