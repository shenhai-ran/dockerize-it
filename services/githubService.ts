import { GithubRepoInfo, RepoFile } from '../types';
import { IMPORTANT_FILES } from '../constants';

export const parseRepoUrl = (url: string): GithubRepoInfo | null => {
    try {
        const u = new URL(url);
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts.length < 2) return null;
        return {
            owner: parts[0],
            repo: parts[1],
            branch: 'main', // Default, will verify later
            url: url
        };
    } catch (e) {
        return null;
    }
};

export const fetchRepoStructure = async (repo: GithubRepoInfo): Promise<RepoFile[]> => {
    // Try main then master
    const branches = ['main', 'master'];
    let treeData: any = null;

    for (const branch of branches) {
        try {
            const response = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}/git/trees/${branch}?recursive=1`);
            if (response.ok) {
                treeData = await response.json();
                repo.branch = branch; // Update verified branch
                break;
            }
        } catch (e) {
            console.error(`Failed to fetch branch ${branch}`, e);
        }
    }

    if (!treeData) {
        throw new Error("Could not fetch repository structure. Rate limit might be exceeded or repo is private.");
    }

    // Filter relevant files to avoid fetching too much content
    return treeData.tree.map((f: any) => ({
        name: f.path.split('/').pop(),
        path: f.path,
        type: f.type === 'blob' ? 'file' : 'dir',
        download_url: `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${repo.branch}/${f.path}`
    }));
};

// Heuristic to pick the most important files for LLM context
export const filterImportantFiles = (files: RepoFile[]): RepoFile[] => {
    return files.filter(file => {
        if (file.type !== 'file') return false;
        
        // Exact match
        if (IMPORTANT_FILES.includes(file.name)) return true;
        
        // Pattern match
        if (file.path.startsWith('.github/workflows/')) return true;
        if (file.path.startsWith('configs/') && (file.path.endsWith('.yaml') || file.path.endsWith('.py'))) return true;
        if (file.name.endsWith('.sh')) return true;
        
        // Docs check
        if (file.path.startsWith('docs/') && file.name.toLowerCase().includes('install')) return true;

        return false;
    }).slice(0, 15); // Limit to top 15 most relevant files to save context window
};

export const fetchFileContent = async (file: RepoFile): Promise<string> => {
    if (!file.download_url) return "";
    try {
        const response = await fetch(file.download_url);
        if (!response.ok) return "";
        return await response.text();
    } catch (e) {
        return "";
    }
};
