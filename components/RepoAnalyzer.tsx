import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, AnalysisStage, RepoFile, ChatMessage, AppConfig } from '../types';
import CodeBlock from './CodeBlock';
import { analyzeRepoAndGenerate, sendChatMessage } from '../services/geminiService';
import { fetchRepoStructure, fetchFileContent, filterImportantFiles } from '../services/githubService';
// @ts-ignore
import { parse } from 'marked';

interface Props {
    repoInfo: any;
    config: AppConfig;
    onReset: () => void;
}

const CollapsibleSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}> = ({ title, icon, isOpen, onToggle, children }) => (
    <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-lg transition-all duration-200">
        <button 
            onClick={onToggle}
            className="w-full flex items-center justify-between px-6 py-4 bg-slate-800/50 hover:bg-slate-800 transition-colors"
        >
            <div className="flex items-center gap-3">
                {icon}
                <h3 className="font-bold text-white">{title}</h3>
            </div>
            <svg 
                className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
        </button>
        
        {isOpen && (
            <div className="p-4 border-t border-slate-800">
                {children}
            </div>
        )}
    </div>
);

const RepoAnalyzer: React.FC<Props> = ({ repoInfo, config, onReset }) => {
    const [stage, setStage] = useState<AnalysisStage>(AnalysisStage.IDLE);
    const [files, setFiles] = useState<RepoFile[]>([]);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // UI State for Collapsibles
    const [isDockerfileOpen, setIsDockerfileOpen] = useState(true);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
    
    // Chat State
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatting, setIsChatting] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Initial Analysis Effect
    useEffect(() => {
        const runAnalysis = async () => {
            try {
                setStage(AnalysisStage.FETCHING_TREE);
                const allFiles = await fetchRepoStructure(repoInfo);
                
                setStage(AnalysisStage.FETCHING_CONTENT);
                const importantFiles = filterImportantFiles(allFiles);
                
                // Fetch content in parallel
                const filesWithContent = await Promise.all(importantFiles.map(async (f) => ({
                    ...f,
                    content: await fetchFileContent(f)
                })));
                
                setFiles(filesWithContent);

                setStage(AnalysisStage.ANALYZING_LLM);
                const result = await analyzeRepoAndGenerate(config, repoInfo.repo, filesWithContent);
                
                setAnalysis(result);
                setStage(AnalysisStage.COMPLETE);

            } catch (err: any) {
                console.error(err);
                setError(err.message || "An error occurred during analysis.");
                setStage(AnalysisStage.ERROR);
            }
        };

        if (stage === AnalysisStage.IDLE) {
            runAnalysis();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [repoInfo, config]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory, isChatting]);

    const handleChatSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !analysis) return;

        const userMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: Date.now() };
        setChatHistory(prev => [...prev, userMsg]);
        setChatInput('');
        setIsChatting(true);

        try {
            const responseText = await sendChatMessage(
                config, 
                chatHistory, 
                chatInput, 
                analysis
            );
            
            const modelMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
            setChatHistory(prev => [...prev, modelMsg]);
        } catch (e) {
            console.error(e);
            const errorMsg: ChatMessage = { role: 'model', text: "Sorry, I encountered an error responding to that.", timestamp: Date.now() };
            setChatHistory(prev => [...prev, errorMsg]);
        } finally {
            setIsChatting(false);
        }
    };

    if (stage === AnalysisStage.ERROR) {
        return (
            <div className="text-center p-12 bg-slate-900 rounded-xl border border-slate-800">
                <div className="text-red-400 text-xl mb-4 font-bold">Analysis Failed</div>
                <p className="text-slate-400 mb-6 max-w-lg mx-auto">{error}</p>
                <button onClick={onReset} className="text-cyan-400 hover:text-cyan-300 hover:underline">Try another repo</button>
            </div>
        );
    }

    if (stage !== AnalysisStage.COMPLETE) {
        return (
            <div className="max-w-xl mx-auto mt-20 text-center space-y-8">
                <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 border-t-4 border-cyan-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-2 border-t-4 border-blue-600 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Analyzing Repository</h2>
                    <p className="text-slate-400 animate-pulse">
                        {stage === AnalysisStage.FETCHING_TREE && "Scanning file structure..."}
                        {stage === AnalysisStage.FETCHING_CONTENT && "Reading configuration files..."}
                        {stage === AnalysisStage.ANALYZING_LLM && `Consulting ${config.modelName || 'AI'}...`}
                    </p>
                </div>
                <div className="flex justify-center gap-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`w-2 h-2 rounded-full bg-cyan-500 animate-bounce`} style={{animationDelay: `${i * 0.1}s`}}></div>
                    ))}
                </div>
            </div>
        );
    }

    // Render Analysis Result
    return (
        <div className="space-y-6 animate-fade-in-up">
            
            {/* Header / Summary */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-white">{repoInfo.owner}/{repoInfo.repo}</h2>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs text-slate-400 border border-slate-700">{repoInfo.branch}</span>
                    </div>
                    <p className="text-slate-400 max-w-2xl">{analysis?.readmeSummary}</p>
                    
                    {/* Detected Dependencies Chips */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {analysis?.detectedDependencies.map((dep, i) => (
                            <span key={i} className="px-2 py-1 bg-cyan-900/30 text-cyan-300 border border-cyan-800 rounded-md text-xs font-mono">
                                {dep}
                            </span>
                        ))}
                    </div>
                </div>
                <button onClick={onReset} className="text-sm text-slate-500 hover:text-white transition-colors">
                    Analyze Another
                </button>
            </div>

            {/* Generated Content Stack */}
            <div className="flex flex-col space-y-4">
                
                {/* Dockerfile Section */}
                <CollapsibleSection
                    title="Dockerfile"
                    isOpen={isDockerfileOpen}
                    onToggle={() => setIsDockerfileOpen(!isDockerfileOpen)}
                    icon={
                        <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4.82 17.275c-.484 0-.888-.173-1.226-.51-.337-.338-.51-.742-.51-1.226 0-.46.166-.86.48-1.185.315-.325.728-.49 1.256-.49.484 0 .895.166 1.218.49.323.325.484.724.484 1.185 0 .484-.173.888-.51 1.226-.338.337-.742.51-1.226.51zm3.62 0c-.484 0-.888-.173-1.226-.51-.337-.338-.51-.742-.51-1.226 0-.46.166-.86.48-1.185.315-.325.728-.49 1.256-.49.484 0 .895.166 1.218.49.323.325.484.724.484 1.185 0 .484-.173.888-.51 1.226-.338.337-.742.51-1.226.51zm3.62 0c-.484 0-.888-.173-1.226-.51-.337-.338-.51-.742-.51-1.226 0-.46.166-.86.48-1.185.315-.325.728-.49 1.256-.49.484 0 .895.166 1.218.49.323.325.484.724.484 1.185 0 .484-.173.888-.51 1.226-.338.337-.742.51-1.226.51zm3.62 0c-.484 0-.888-.173-1.226-.51-.337-.338-.51-.742-.51-1.226 0-.46.166-.86.48-1.185.315-.325.728-.49 1.256-.49.484 0 .895.166 1.218.49.323.325.484.724.484 1.185 0 .484-.173.888-.51 1.226-.338.337-.742.51-1.226.51zm-7.24-4.7c-.484 0-.888-.173-1.226-.51-.337-.338-.51-.742-.51-1.226 0-.46.166-.86.48-1.185.315-.325.728-.49 1.256-.49.484 0 .895.166 1.218.49.323.325.484.724.484 1.185 0 .484-.173.888-.51 1.226-.338.337-.742.51-1.226.51zm12.38 13.9q-1.275 0-2.388-.562-1.112-.563-1.787-1.538h-4.65q-.675.975-1.787 1.537Q1.275 21.775 0 21.775v-2.35q.8 0 1.5-.325.7-.325 1.15-.875.45-.55.45-1.275v-10.9q0-.725.263-1.375.262-.65.712-1.1.45-.45 1.1-.713.65-.262 1.375-.262h10.9q.725 0 1.375.262.65.263 1.1.713.45.45.713 1.1.262.65.262 1.375v10.9q0 .725.45 1.275.45.55 1.15.875.7.325 1.5.325z"/>
                        </svg>
                    }
                >
                    <CodeBlock code={analysis?.dockerfile || ''} language="dockerfile" filename="Dockerfile" />
                </CollapsibleSection>

                {/* Docker Compose Section */}
                <CollapsibleSection
                    title="Docker Compose"
                    isOpen={isComposeOpen}
                    onToggle={() => setIsComposeOpen(!isComposeOpen)}
                    icon={
                        <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                        </svg>
                    }
                >
                    <CodeBlock code={analysis?.dockerCompose || ''} language="yaml" filename="docker-compose.yml" />
                </CollapsibleSection>

                {/* Deployment Instructions Section */}
                <CollapsibleSection
                    title="Deployment Instructions"
                    isOpen={isInstructionsOpen}
                    onToggle={() => setIsInstructionsOpen(!isInstructionsOpen)}
                    icon={
                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                    }
                >
                    <div 
                        className="prose prose-invert prose-cyan max-w-none prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800"
                        dangerouslySetInnerHTML={{ __html: parse(analysis?.instructions || '') as string }} 
                    />
                </CollapsibleSection>

            </div>

            {/* Chat Interface */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-lg flex flex-col h-[500px]">
                <div className="p-4 border-b border-slate-800 bg-slate-800/30">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>
                        AI DevOps Assistant
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Refine the files or ask questions about the setup.</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatHistory.length === 0 && (
                        <div className="text-center text-slate-600 mt-12">
                            <p>Ask me to explain the Dockerfile or add more dependencies.</p>
                        </div>
                    )}
                    {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-lg p-3 ${
                                msg.role === 'user' 
                                ? 'bg-cyan-900/40 text-cyan-50 border border-cyan-800' 
                                : 'bg-slate-800 text-slate-200 border border-slate-700'
                            }`}>
                                <div 
                                    className="prose prose-sm prose-invert max-w-none" 
                                    dangerouslySetInnerHTML={{ __html: parse(msg.text) as string }} 
                                />
                            </div>
                        </div>
                    ))}
                    {isChatting && (
                        <div className="flex justify-start">
                            <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 flex gap-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900">
                    <form onSubmit={handleChatSubmit} className="flex gap-2">
                        <input 
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                        />
                        <button 
                            type="submit" 
                            disabled={!chatInput.trim() || isChatting}
                            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            Send
                        </button>
                    </form>
                </div>
            </div>

        </div>
    );
};

export default RepoAnalyzer;