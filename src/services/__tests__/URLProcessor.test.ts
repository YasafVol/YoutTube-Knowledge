import { App, request } from 'obsidian';
import { URLProcessor } from '../URLProcessor';
import { YouTubeService } from '../YouTubeService';

// Mock implementations
jest.mock('obsidian');
jest.mock('../YouTubeService');

describe('URLProcessor', () => {
    let mockApp: jest.Mocked<App>;

    beforeEach(() => {
        // Reset mocks
        mockApp = {
            workspace: {},
            vault: {}
        } as unknown as jest.Mocked<App>;

        // Mock request function
        (request as jest.Mock).mockResolvedValue(`
            <html>
                <head>
                    <meta name="title" content="Test Video Title">
                </head>
                <body></body>
            </html>
        `);

        // Mock YouTubeService
        (YouTubeService.prototype.fetchTranscript as jest.Mock).mockResolvedValue('Test transcript content');
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('processURL', () => {
        it('should process valid YouTube URL successfully', async () => {
            const result = await URLProcessor.processURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ', mockApp);

            expect(result).toEqual({
                cleanURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                title: 'Test Video Title',
                transcript: 'Test transcript content'
            });
        });

        it('should process YouTube Shorts URL successfully', async () => {
            const result = await URLProcessor.processURL('https://youtube.com/shorts/dQw4w9WgXcQ', mockApp);

            expect(result).toEqual({
                cleanURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                title: 'Test Video Title',
                transcript: 'Test transcript content'
            });
        });

        it('should handle URLs with whitespace', async () => {
            const result = await URLProcessor.processURL('  https://youtube.com/watch?v=dQw4w9WgXcQ  ', mockApp);

            expect(result).toEqual({
                cleanURL: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                title: 'Test Video Title',
                transcript: 'Test transcript content'
            });
        });

        it('should throw error for invalid YouTube URL', async () => {
            await expect(URLProcessor.processURL('https://invalid-url.com', mockApp))
                .rejects
                .toThrow('URL Processing failed: Invalid YouTube URL format');
        });

        it('should handle missing video title', async () => {
            (request as jest.Mock).mockResolvedValue(`
                <html>
                    <head></head>
                    <body></body>
                </html>
            `);

            const result = await URLProcessor.processURL('https://youtube.com/watch?v=dQw4w9WgXcQ', mockApp);

            expect(result.title).toBe('Untitled Video');
        });

        it('should handle YouTube service errors', async () => {
            (YouTubeService.prototype.fetchTranscript as jest.Mock)
                .mockRejectedValue(new Error('Failed to fetch transcript'));

            await expect(URLProcessor.processURL('https://youtube.com/watch?v=dQw4w9WgXcQ', mockApp))
                .rejects
                .toThrow('URL Processing failed: Failed to fetch transcript');
        });

        it('should handle network errors', async () => {
            (request as jest.Mock).mockRejectedValue(new Error('Network error'));

            await expect(URLProcessor.processURL('https://youtube.com/watch?v=dQw4w9WgXcQ', mockApp))
                .rejects
                .toThrow('URL Processing failed: Network error');
        });
    });

    describe('URL format handling', () => {
        const validURLs = [
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'https://youtu.be/dQw4w9WgXcQ',
            'https://youtube.com/shorts/dQw4w9WgXcQ',
            'https://youtube.com/embed/dQw4w9WgXcQ',
            'https://youtube.com/v/dQw4w9WgXcQ'
        ];

        validURLs.forEach(url => {
            it(`should handle ${url} format`, async () => {
                const result = await URLProcessor.processURL(url, mockApp);
                expect(result.cleanURL).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
            });
        });
    });
});
