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
    const [apiKey, setApiKey] = useState(config.apiKey || '');
    const [model, setModel] = useState(config.modelName);
    const [baseUrl, setBaseUrl] = useState(config.baseUrl || '');
    
    const [showApiKey, setShowApiKey] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Reset local state when opening
    useEffect(() => {
        if (isOpen) {
            setProvider(config.provider || 'google');
            setApiKey(config.apiKey || '');
            setModel(config.modelName);
            setBaseUrl(config.baseUrl || '');
            setTestStatus('idle');
            setShowApiKey(false);
        }
    }, [isOpen, config]);

    // Set default model when provider changes if current model is likely invalid for new provider
    useEffect(() => {
        if (!isOpen) return; // Don't reset if not interacting
        
        const options = MODEL_OPTIONS[provider];
        if (options && options.length > 0) {
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
            apiKey: apiKey,
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
            apiKey: apiKey, 
            modelName: model,
            baseUrl: baseUrl || undefined
        });
        onClose();
    };

    const handleClearData = () => {
        if (confirm("Are you sure? This will remove your API keys and settings from this browser.")) {
            localStorage.removeItem('dockerize_config');
            setApiKey('');
            alert("Data cleared.");
            // We don't close immediately so they can enter new data if they want, 
            // or they can cancel. But usually clearing means a reset.
            // Let's reload the page to be clean or just clear the inputs.
            window.location.reload(); 
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

                    {/* API Key Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            API Key
                            <span className="ml-2 text-xs text-slate-500 font-normal">
                                (Stored in browser local storage)
                            </span>
                        </label>
                        <div className="relative">
                            <input 
                                type={showApiKey ? "text" : "password"}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all pr-24"
                                placeholder={provider === 'google' ? "AIza..." : "sk-..."}
                            />
                            <div className="absolute right-2 top-0 bottom-0 flex items-center gap-2">
                                <button
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="text-slate-500 hover:text-cyan-400 transition-colors p-1"
                                    title={showApiKey ? "Hide API Key" : "Show API Key"}
                                    tabIndex={-1}
                                >
                                    {showApiKey ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                            <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745A10.02 10.02 0 0020 10c0-5.523-4.477-10-10-10-1.928 0-3.684.545-5.166 1.492L3.28 2.22zm-1.5 5.515A8.483 8.483 0 001.066 10c1.237 3.328 4.414 6 8.934 6 .812 0 1.58-.09 2.308-.247l-1.9-1.9a6.52 6.52 0 01-1.408.147c-3.213 0-5.592-1.968-6.702-4.265zM10 5a5 5 0 015 5c0 .356-.036.703-.102 1.036l1.636 1.636a8.503 8.503 0 001.398-3.085C16.892 6.51 13.916 3.5 10 3.5c-1.272 0-2.457.316-3.52.882l1.624 1.624C8.614 5.293 9.283 5 10 5z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                            <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                                {apiKey && (
                                    <button 
                                        onClick={() => setApiKey('')}
                                        className="text-xs text-slate-500 hover:text-red-400"
                                        title="Clear API Key"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
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
                            onClick={handleClearData}
                            className="text-xs text-red-500/70 hover:text-red-500 underline"
                        >
                            Remove Saved Data
                        </button>

                        <button 
                            onClick={handleTest}
                            disabled={isTesting}
                            className={`text-xs px-3 py-2 rounded border transition-colors flex items-center gap-2 ${
                                testStatus === 'success' ? 'border-green-500 text-green-500 bg-green-500/10' :
                                testStatus === 'error' ? 'border-red-500 text-red-500 bg-red-500/10' :
                                'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                            }`}
                        >
                            {isTesting && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
                            {isTesting ? 'Testing...' : testStatus === 'success' ? 'Connection Verified' : testStatus === 'error' ? 'Connection Failed' : 'Test Connection'}
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