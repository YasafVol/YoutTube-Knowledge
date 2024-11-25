import { useAppStore } from '../appStore';
import { TranscriptResult } from '../../types';

describe('AppStore', () => {
    beforeEach(() => {
        useAppStore.setState({
            isLoading: false,
            error: null,
            lastProcessedUrl: null,
            progress: 0,
            cache: {},
            isCancelled: false
        });
    });

    it('should initialize with default state', () => {
        const state = useAppStore.getState();
        expect(state.isLoading).toBe(false);
        expect(state.error).toBeNull();
        expect(state.lastProcessedUrl).toBeNull();
        expect(state.progress).toBe(0);
        expect(state.cache).toEqual({});
        expect(state.isCancelled).toBe(false);
    });

    it('should set loading state', () => {
        useAppStore.getState().setLoading(true);
        expect(useAppStore.getState().isLoading).toBe(true);

        useAppStore.getState().setLoading(false);
        expect(useAppStore.getState().isLoading).toBe(false);
    });

    it('should set error state', () => {
        const errorMessage = 'Test error message';
        useAppStore.getState().setError(errorMessage);
        expect(useAppStore.getState().error).toBe(errorMessage);

        useAppStore.getState().setError(null);
        expect(useAppStore.getState().error).toBeNull();
    });

    it('should set last processed URL', () => {
        const testUrl = 'https://youtube.com/watch?v=test123';
        useAppStore.getState().setLastProcessedUrl(testUrl);
        expect(useAppStore.getState().lastProcessedUrl).toBe(testUrl);
    });

    it('should set and update progress', () => {
        useAppStore.getState().setProgress(50);
        expect(useAppStore.getState().progress).toBe(50);

        useAppStore.getState().setProgress(100);
        expect(useAppStore.getState().progress).toBe(100);

        // Test boundary values
        useAppStore.getState().setProgress(0);
        expect(useAppStore.getState().progress).toBe(0);

        useAppStore.getState().setProgress(-10);
        expect(useAppStore.getState().progress).toBe(-10);

        useAppStore.getState().setProgress(150);
        expect(useAppStore.getState().progress).toBe(150);
    });

    it('should manage cache operations', () => {
        const testUrl = 'https://youtube.com/watch?v=test123';
        const testResult: TranscriptResult = {
            text: 'Test transcript',
            title: 'Test Video',
            url: testUrl,
            timestamp: new Date()
        };

        // Set cache item
        useAppStore.getState().setCacheItem(testUrl, testResult);
        expect(useAppStore.getState().cache[testUrl]).toEqual(testResult);

        // Get cache item
        const cachedResult = useAppStore.getState().getCacheItem(testUrl);
        expect(cachedResult).toEqual(testResult);

        // Get non-existent cache item
        const nonExistentResult = useAppStore.getState().getCacheItem('nonexistent');
        expect(nonExistentResult).toBeUndefined();

        // Clear cache
        useAppStore.getState().clearCache();
        expect(useAppStore.getState().cache).toEqual({});
        expect(useAppStore.getState().getCacheItem(testUrl)).toBeUndefined();
    });

    it('should handle operation cancellation', () => {
        useAppStore.getState().cancelOperation();
        expect(useAppStore.getState().isCancelled).toBe(true);

        // Reset should clear cancelled state
        useAppStore.getState().reset();
        expect(useAppStore.getState().isCancelled).toBe(false);
    });

    it('should reset state while preserving cache', () => {
        // Set up initial state with cache
        const testUrl = 'https://youtube.com/watch?v=test123';
        const testResult: TranscriptResult = {
            text: 'Test transcript',
            title: 'Test Video',
            url: testUrl,
            timestamp: new Date()
        };
        useAppStore.setState({
            isLoading: true,
            error: 'Test error',
            lastProcessedUrl: testUrl,
            progress: 50,
            isCancelled: true,
            cache: { [testUrl]: testResult }
        });

        // Reset state
        useAppStore.getState().reset();

        // Verify reset (cache should be preserved)
        const state = useAppStore.getState();
        expect(state.isLoading).toBe(false);
        expect(state.error).toBeNull();
        expect(state.lastProcessedUrl).toBeNull();
        expect(state.progress).toBe(0);
        expect(state.isCancelled).toBe(false);
        expect(state.cache[testUrl]).toEqual(testResult);
    });

    it('should handle multiple cache items', () => {
        const urls = ['url1', 'url2', 'url3'];
        const results = urls.map(url => ({
            text: `Transcript ${url}`,
            title: `Video ${url}`,
            url,
            timestamp: new Date()
        }));

        // Add multiple items to cache
        results.forEach((result, index) => {
            useAppStore.getState().setCacheItem(urls[index], result);
        });

        // Verify all items are in cache
        urls.forEach((url, index) => {
            expect(useAppStore.getState().getCacheItem(url)).toEqual(results[index]);
        });

        // Clear cache and verify all items are removed
        useAppStore.getState().clearCache();
        urls.forEach(url => {
            expect(useAppStore.getState().getCacheItem(url)).toBeUndefined();
        });
    });
});
