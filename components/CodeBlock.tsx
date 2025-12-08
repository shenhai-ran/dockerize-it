import React, { useState } from 'react';

interface Props {
    code: string;
    language: string;
    filename?: string;
}

const CodeBlock: React.FC<Props> = ({ code, language, filename }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-950 w-full shadow-md">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                <span className="text-xs font-mono text-cyan-400">{filename || language}</span>
                <button 
                    onClick={handleCopy}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <div className="p-4 overflow-x-auto">
                <pre className="font-mono text-sm leading-relaxed text-slate-300">
                    <code>{code}</code>
                </pre>
            </div>
        </div>
    );
};

export default CodeBlock;