import { App, request } from 'obsidian';
import { FileService } from './FileService';
import { YouTubeService } from './YouTubeService';

export class URLProcessor {
    /**
     * Processes and validates a YouTube URL
     * @param dirtyURL - The raw URL input from the user
     * @param app - The Obsidian App instance
     * @returns The cleaned and validated URL
     * @throws Error if URL is invalid
     */
    public static async processURL(dirtyURL: string, app: App): Promise<string> {
        try {
            // Remove whitespace
            let cleanURL = dirtyURL.trim();

            // Extract video ID using various YouTube URL formats
            const videoId = URLProcessor.extractVideoId(cleanURL);
            if (!videoId) {
                throw new Error('Invalid YouTube URL format');
            }

            // Construct clean YouTube URL
            cleanURL = `https://www.youtube.com/watch?v=${videoId}`;

            // Get video data using request to get the page HTML
            const response = await request(cleanURL);
            const parser = new DOMParser();
            const doc = parser.parseFromString(response, 'text/html');
            const titleMeta = doc.querySelector('meta[name="title"]');
            const title = titleMeta?.getAttribute("content") || "Untitled Video";
            
            // Fetch transcript
            const transcript = await YouTubeService.fetchTranscript(cleanURL);
            
            // Create file using FileService
            const fileService = new FileService(app);
            await fileService.createYouTubeVideoFile(title, cleanURL, transcript);

            return cleanURL;
        } catch (error) {
            throw new Error(`URL Processing failed: ${error.message}`);
        }
    }

    /**
     * Extracts the video ID from various YouTube URL formats
     * @param url - The YouTube URL
     * @returns The video ID or null if invalid
     */
    private static extractVideoId(url: string): string | null {
        const patterns = [
            // Standard YouTube URL
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
            // YouTube Shorts
            /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
            // Embedded URL
            /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
            // Mobile URL
            /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        return null;
    }
}
