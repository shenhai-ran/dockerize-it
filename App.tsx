import React, { useState, useEffect } from 'react';
import { AppConfig, LLMProvider } from './types';
import SettingsModal from './components/SettingsModal';
import RepoAnalyzer from './components/RepoAnalyzer';
import { parseRepoUrl } from './services/githubService';

const App: React.FC = () => {
    // Persistent Config State
    const [config, setConfig] = useState<AppConfig>(() => {
        // 1. Try to load from LocalStorage
        let savedConfig: AppConfig | null = null;
        try {
            const saved = localStorage.getItem('dockerize_config');
            if (saved) {
                savedConfig = JSON.parse(saved);
            }
        } catch (e) {
            console.error("Failed to parse config from local storage", e);
        }

        // 2. Load Environment Variables
        const envDefaultProvider = import.meta.env?.VITE_DEFAULT_PROVIDER as LLMProvider;
        const envOpenAIKey = import.meta.env?.VITE_OPENAI_API_KEY;
        const envBaseUrl = import.meta.env?.VITE_BASE_URL;
        const envModelName = import.meta.env?.VITE_MODEL_NAME;

        // 3. Determine Provider
        // Priority: Saved > Env > Default ('google')
        let provider: LLMProvider = savedConfig?.provider || (
             (envDefaultProvider && ['google', 'openai', 'custom'].includes(envDefaultProvider)) 
             ? envDefaultProvider 
             : 'google'
        );

        // 4. Determine API Key
        // For Google: Service handles process.env.API_KEY fallback, so we can leave it empty here if not saved.
        // For OpenAI: We must explicitly load it into config if it's in the env vars.
        let apiKey = savedConfig?.apiKey || '';
        if (!apiKey && provider === 'openai' && envOpenAIKey) {
            apiKey = envOpenAIKey;
        }

        // 5. Determine Model Name
        let modelName = savedConfig?.modelName || envModelName;
        if (!modelName) {
            modelName = provider === 'google' ? 'gemini-3-pro-preview' : 'gpt-4o';
        }

        // 6. Determine Base URL
        let baseUrl = savedConfig?.baseUrl || envBaseUrl || '';

        return { 
            provider, 
            apiKey, 
            modelName,
            baseUrl
        };
    });

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [repoUrl, setRepoUrl] = useState('');
    const [repoInfo, setRepoInfo] = useState<any>(null);
    const [urlError, setUrlError] = useState('');

    useEffect(() => {
        localStorage.setItem('dockerize_config', JSON.stringify(config));
    }, [config]);

    const handleAnalyze = (e: React.FormEvent) => {
        e.preventDefault();
        setUrlError('');
        
        const info = parseRepoUrl(repoUrl);
        if (!info) {
            setUrlError('Invalid GitHub URL. Format: https://github.com/owner/repo');
            return;
        }

        setRepoInfo(info);
    };

    const handleReset = () => {
        setRepoInfo(null);
        setRepoUrl('');
    };

    return (
        <div className="min-h-screen bg-slate-950 font-sans selection:bg-cyan-500/30">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-white">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                            </svg>
                        </div>
                        <span className="font-bold text-xl tracking-tight text-white">Dockerize<span className="text-cyan-400">It</span></span>
                    </div>

                    <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-slate-800"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                        <span>Configuration</span>
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-12">
                {!repoInfo ? (
                    <div className="max-w-3xl mx-auto text-center space-y-8 animate-fade-in-up">
                        <div className="space-y-4">
                            <h1 className="text-5xl font-extrabold text-white tracking-tight">
                                Containerize any Repo <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">in seconds.</span>
                            </h1>
                            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                                AI-powered analysis for GitHub repositories. Detects deep learning frameworks, 
                                handles dependencies, and generates production-ready Dockerfiles automatically.
                            </p>
                        </div>

                        <div className="bg-slate-900 p-2 rounded-2xl shadow-2xl shadow-cyan-900/10 border border-slate-800">
                            <form onSubmit={handleAnalyze} className="relative flex items-center">
                                <div className="absolute left-4 text-slate-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36.5-8 0C6 2 5 2 4 2c-3 .5-4 1.5-4 1.5.3 1.15.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="https://github.com/fundamentalvision/BEVFormer" 
                                    className="w-full bg-transparent text-white placeholder-slate-600 pl-14 pr-32 py-4 focus:outline-none text-lg"
                                    value={repoUrl}
                                    onChange={(e) => setRepoUrl(e.target.value)}
                                />
                                <button 
                                    type="submit" 
                                    className="absolute right-2 top-2 bottom-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 rounded-xl font-medium transition-all shadow-lg shadow-cyan-900/30"
                                >
                                    Analyze
                                </button>
                            </form>
                        </div>
                        
                        {urlError && <p className="text-red-400">{urlError}</p>}
                        
                        <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-cyan-500/30 transition-colors">
                                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center mb-4 text-cyan-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-white mb-2">Deep Learning Ready</h3>
                                <p className="text-sm text-slate-400">
                                    Automatically detects PyTorch/CUDA versions and generates compatible base images to prevent version mismatch hell.
                                </p>
                            </div>
                            
                            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-cyan-500/30 transition-colors">
                                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center mb-4 text-emerald-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-white mb-2">Security First</h3>
                                <p className="text-sm text-slate-400">
                                    Your API keys are stored locally in your browser and are never sent to our servers. You are in control.
                                </p>
                            </div>

                            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-cyan-500/30 transition-colors">
                                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center mb-4 text-purple-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-white mb-2">Interactive Assistant</h3>
                                <p className="text-sm text-slate-400">
                                    Chat with the AI to refine your Dockerfile, explain specific commands, or debug build errors interactively.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <RepoAnalyzer 
                        repoInfo={repoInfo} 
                        config={config} 
                        onReset={handleReset} 
                    />
                )}
            </main>

            <SettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)}
                config={config}
                onSave={setConfig}
            />
        </div>
    );
};

export default App;