export interface TranscriptResult {
    text: string;
    title: string;
    url: string;
    timestamp: Date;
}

export interface FileCreationOptions {
    title: string;
    content: string;
    folder?: string;
    timestamp: Date;
}

export interface YouTubeError extends Error {
    code?: string;
    status?: number;
}

export interface AppState {
    isLoading: boolean;
    error: string | null;
    lastProcessedUrl: string | null;
    progress: number;
    cache: Record<string, TranscriptResult>;
    isCancelled: boolean;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setLastProcessedUrl: (url: string) => void;
    setProgress: (progress: number) => void;
    setCacheItem: (url: string, result: TranscriptResult) => void;
    getCacheItem: (url: string) => TranscriptResult | undefined;
    clearCache: () => void;
    cancelOperation: () => void;
    reset: () => void;
}

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}
