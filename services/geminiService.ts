import { GoogleGenAI, Type } from "@google/genai";
import { RepoFile, AnalysisResult, ChatMessage, AppConfig } from '../types';
import { DEFAULT_SYSTEM_PROMPT } from '../constants';

// --- Generic Helper for OpenAI Compatible APIs ---
const callOpenAICompatible = async (
    config: AppConfig, 
    messages: any[], 
    jsonMode: boolean = false
) => {
    let baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    
    const url = `${baseUrl}/chat/completions`;

    const body: any = {
        model: config.modelName,
        messages: messages,
    };

    if (jsonMode) {
        body.response_format = { type: "json_object" };
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Provider Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error("Empty response from provider");
        return content;
    } catch (e: any) {
        console.error("OpenAI Compatible Call Failed", e);
        throw new Error(e.message || "Failed to connect to LLM provider");
    }
};

// --- Test Connection ---
export const testApiKey = async (config: AppConfig): Promise<boolean> => {
    try {
        if (config.provider === 'google') {
            // Prioritize config.apiKey if available (user settings), fallback to env var
            const apiKey = config.apiKey || process.env.API_KEY;
            const ai = new GoogleGenAI({ apiKey });
            await ai.models.generateContent({
                model: config.modelName,
                contents: "Test connection",
            });
            return true;
        } else {
            // OpenAI / Custom
            await callOpenAICompatible(config, [{ role: 'user', content: 'Test connection' }]);
            return true;
        }
    } catch (e) {
        console.error("API Connection Test Failed", e);
        return false;
    }
};

// --- Main Analysis Function ---
export const analyzeRepoAndGenerate = async (
    config: AppConfig,
    repoName: string,
    files: RepoFile[]
): Promise<AnalysisResult> => {
    
    // Prepare context from file contents
    let fileContext = `Repository: ${repoName}\n\n`;
    for (const file of files) {
        if (file.content) {
            fileContext += `--- FILE: ${file.path} ---\n${file.content}\n\n`;
        }
    }

    const prompt = `
    Analyze the following files from a GitHub repository. 
    If a Dockerfile or docker-compose.yml already exists in the files provided, extract them and suggest improvements if needed.
    If not, GENERATE them based on the dependencies found (requirements.txt, setup.py, environment.yml, etc.).
    
    Look closely for CUDA/GPU requirements.
    
    Files provided:
    ${fileContext}
    `;

    // --- Google Strategy ---
    if (config.provider === 'google') {
        // Prioritize config.apiKey if available (user settings), fallback to env var
        const apiKey = config.apiKey || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: config.modelName,
            contents: prompt,
            config: {
                systemInstruction: DEFAULT_SYSTEM_PROMPT,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        dockerfile: { type: Type.STRING },
                        dockerCompose: { type: Type.STRING },
                        readmeSummary: { type: Type.STRING },
                        instructions: { type: Type.STRING },
                        detectedDependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
                        healthCheckSuggestion: { type: Type.STRING }
                    }
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("Empty response from Gemini");
        return JSON.parse(text) as AnalysisResult;
    } 
    
    // --- OpenAI / Custom Strategy ---
    else {
        const messages = [
            { role: "system", content: DEFAULT_SYSTEM_PROMPT + "\n\nIMPORTANT: You must return valid JSON only." },
            { role: "user", content: prompt }
        ];
        
        const content = await callOpenAICompatible(config, messages, true);
        
        // Clean markdown code blocks if present
        let jsonStr = content.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.replace(/^```json/, '').replace(/```$/, '');
        } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```/, '').replace(/```$/, '');
        }
        
        try {
            return JSON.parse(jsonStr) as AnalysisResult;
        } catch (e) {
            console.error("JSON Parse Error", jsonStr);
            throw new Error("Failed to parse JSON response from LLM.");
        }
    }
};

// --- Chat Function ---
export const sendChatMessage = async (
    config: AppConfig,
    history: ChatMessage[],
    newMessage: string,
    context: AnalysisResult
): Promise<string> => {
    
    const contextPrompt = `
    Context:
    You have previously generated the following Docker configuration:
    Dockerfile: ${context.dockerfile}
    Compose: ${context.dockerCompose}
    
    User Query: ${newMessage}
    
    Respond as a helpful DevOps assistant. Provide updated code snippets if necessary.
    `;

    // --- Google Strategy ---
    if (config.provider === 'google') {
        // Prioritize config.apiKey if available (user settings), fallback to env var
        const apiKey = config.apiKey || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey });
        const chat = ai.chats.create({
            model: config.modelName,
            config: {
                systemInstruction: "You are a helpful Docker and DevOps assistant."
            },
            history: history.map(h => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.text }]
            }))
        });

        const result = await chat.sendMessage({ message: contextPrompt });
        return result.text || "I couldn't generate a response.";
    } 
    
    // --- OpenAI / Custom Strategy ---
    else {
        const messages = [
            { role: "system", content: "You are a helpful Docker and DevOps assistant." },
            ...history.map(h => ({ role: h.role, content: h.text })),
            { role: "user", content: contextPrompt }
        ];

        return await callOpenAICompatible(config, messages, false);
    }
};