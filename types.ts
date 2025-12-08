export interface RepoFile {
    name: string;
    path: string;
    type: 'file' | 'dir';
    download_url?: string;
    content?: string; // Content is populated after fetching
}

export interface GithubRepoInfo {
    owner: string;
    repo: string;
    branch: string;
    description?: string;
    language?: string;
    url: string;
}

export interface AnalysisResult {
    dockerfile: string;
    dockerCompose: string;
    readmeSummary: string;
    instructions: string;
    detectedDependencies: string[];
    healthCheckSuggestion: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}

export enum AnalysisStage {
    IDLE = 'IDLE',
    FETCHING_TREE = 'FETCHING_TREE',
    FETCHING_CONTENT = 'FETCHING_CONTENT',
    ANALYZING_LLM = 'ANALYZING_LLM',
    COMPLETE = 'COMPLETE',
    ERROR = 'ERROR'
}

export type LLMProvider = 'google' | 'openai' | 'custom';

export interface AppConfig {
    provider: LLMProvider;
    apiKey: string;
    modelName: string;
    baseUrl?: string; // Optional, for OpenAI compatible or custom endpoints
}
