import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { AppState, TranscriptResult } from '../types';

type Store = StateCreator<AppState>;

const store: Store = (set, get) => ({
    isLoading: false,
    error: null,
    lastProcessedUrl: null,
    progress: 0,
    cache: {},
    isCancelled: false,
    
    setLoading: (loading: boolean) => set({ isLoading: loading }),
    setError: (error: string | null) => set({ error }),
    setLastProcessedUrl: (url: string) => set({ lastProcessedUrl: url }),
    setProgress: (progress: number) => set({ progress }),
    
    setCacheItem: (url: string, result: TranscriptResult) => 
        set(state => ({
            cache: {
                ...state.cache,
                [url]: result
            }
        })),
    
    getCacheItem: (url: string) => get().cache[url],
    
    clearCache: () => set({ cache: {} }),
    
    cancelOperation: () => set({ isCancelled: true }),
    
    reset: () => set({
        isLoading: false,
        error: null,
        lastProcessedUrl: null,
        progress: 0,
        isCancelled: false
        // Intentionally not clearing cache on reset
    })
});

export const useAppStore = create<AppState>(store);

// Selector hooks for better component integration
export const useIsLoading = (): boolean => useAppStore((state: AppState) => state.isLoading);
export const useError = (): string | null => useAppStore((state: AppState) => state.error);
export const useLastProcessedUrl = (): string | null => useAppStore((state: AppState) => state.lastProcessedUrl);
export const useProgress = (): number => useAppStore((state: AppState) => state.progress);
export const useIsCancelled = (): boolean => useAppStore((state: AppState) => state.isCancelled);
