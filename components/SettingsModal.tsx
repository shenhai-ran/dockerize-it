import React, { useState, useEffect } from 'react';
import { AppConfig, LLMProvider } from '../types';
import { MODEL_OPTIONS, PROVIDERS } from '../constants';
import { testApiKey } from '../services/geminiService';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    config: AppConfig;
    onSave: (config: AppConfig) => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, config, onSave }) => {
    const [provider, setProvider] = useState<LLMProvider>(config.provider || 'google');
    const [apiKey, setApiKey] = useState(config.apiKey);
    const [model, setModel] = useState(config.modelName);
    const [baseUrl, setBaseUrl] = useState(config.baseUrl || '');
    
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Reset local state when opening
    useEffect(() => {
        if (isOpen) {
            setProvider(config.provider || 'google');
            setApiKey(config.apiKey);
            setModel(config.modelName);
            setBaseUrl(config.baseUrl || '');
            setTestStatus('idle');
        }
    }, [isOpen, config]);

    // Set default model when provider changes if current model is likely invalid for new provider
    // This provides a good default but doesn't lock the user in
    useEffect(() => {
        if (!isOpen) return; // Don't reset if not interacting
        
        const options = MODEL_OPTIONS[provider];
        if (options && options.length > 0) {
            // If the current model string is empty or looks like it belongs to another provider (simple heuristic or just always reset on provider switch)
            // We'll simply reset to the first recommended option to be helpful
            setModel(options[0].value);
        } else {
            // For custom providers with no presets
            if (provider === 'custom' && !model) setModel('');
        }
        
        // Defaults for Base URL
        if (provider === 'openai' && !baseUrl) setBaseUrl('https://api.openai.com/v1');
        if (provider === 'google') setBaseUrl(''); 
        
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [provider]);

    if (!isOpen) return null;

    const handleTest = async () => {
        setIsTesting(true);
        setTestStatus('idle');
        
        const tempConfig: AppConfig = {
            provider,
            apiKey,
            modelName: model,
            baseUrl: baseUrl || undefined
        };

        const valid = await testApiKey(tempConfig);
        setTestStatus(valid ? 'success' : 'error');
        setIsTesting(false);
    };

    const handleSave = () => {
        onSave({ 
            provider,
            apiKey, 
            modelName: model,
            baseUrl: baseUrl || undefined
        });
        onClose();
    };

    const handleClear = () => {
        if (confirm("Are you sure you want to remove your API key and settings from this browser?")) {
            onSave({
                provider: 'google',
                apiKey: '',
                modelName: 'gemini-3-pro-preview',
                baseUrl: ''
            });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Configuration</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="space-y-5">
                    
                    {/* Provider */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">LLM Provider</label>
                        <select 
                            value={provider}
                            onChange={(e) => setProvider(e.target.value as LLMProvider)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                        >
                            {PROVIDERS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* API Key */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">API Key</label>
                        <input 
                            type="password" 
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                            placeholder={provider === 'google' ? "AIza..." : "sk-..."}
                        />
                         <div className="flex items-start gap-2 mt-2 bg-slate-800/50 p-2 rounded border border-slate-800">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400 mt-0.5 shrink-0">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                            </svg>
                            <p className="text-xs text-slate-400">
                                Stored locally in your browser. Never sent to our servers.
                            </p>
                        </div>
                    </div>

                    {/* Base URL (Conditional) */}
                    {(provider === 'openai' || provider === 'custom') && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Base URL</label>
                            <input 
                                type="text" 
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                                placeholder="https://api.openai.com/v1"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Endpoint base (should usually end in /v1).
                            </p>
                        </div>
                    )}

                    {/* Model */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Model Name</label>
                        <input 
                            type="text" 
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                            placeholder="e.g. gemini-1.5-pro, gpt-4o, llama-3"
                        />
                        
                        {/* Quick Select Chips */}
                        {MODEL_OPTIONS[provider] && MODEL_OPTIONS[provider].length > 0 && (
                            <div className="mt-2">
                                <span className="text-xs text-slate-500 mr-2">Quick Select:</span>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {MODEL_OPTIONS[provider].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setModel(opt.value)}
                                            className={`text-xs px-2 py-1 rounded border transition-colors ${
                                                model === opt.value 
                                                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' 
                                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200'
                                            }`}
                                        >
                                            {opt.label.split(' (')[0]} {/* Shorten label for chips */}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <button 
                            onClick={handleTest}
                            disabled={!apiKey || isTesting}
                            className={`text-xs px-3 py-2 rounded border transition-colors flex items-center gap-2 ${
                                testStatus === 'success' ? 'border-green-500 text-green-500 bg-green-500/10' :
                                testStatus === 'error' ? 'border-red-500 text-red-500 bg-red-500/10' :
                                'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                            }`}
                        >
                            {isTesting && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
                            {isTesting ? 'Testing...' : testStatus === 'success' ? 'Connection Verified' : testStatus === 'error' ? 'Connection Failed' : 'Test Connection'}
                        </button>
                        
                        <button 
                            onClick={handleClear}
                            className="text-xs text-red-400 hover:text-red-300 hover:underline"
                        >
                            Remove Saved Data
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 border-t border-slate-800 pt-6">
                    <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Cancel</button>
                    <button 
                        onClick={handleSave}
                        className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium shadow-lg shadow-cyan-900/20 transition-all"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;