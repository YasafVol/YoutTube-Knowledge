import { ValidationResult } from '../types';

export class ValidationUtils {
    private static readonly MAX_URL_LENGTH = 2048; // Standard max URL length
    private static readonly MIN_VIDEO_ID_LENGTH = 11;
    private static readonly MAX_VIDEO_ID_LENGTH = 11;

    static validateYouTubeUrl(url: string): ValidationResult {
        if (!url) {
            return {
                isValid: false,
                error: 'URL cannot be empty'
            };
        }

        if (url.length > this.MAX_URL_LENGTH) {
            return {
                isValid: false,
                error: 'URL exceeds maximum length'
            };
        }

        // Extract video ID for additional validation
        const videoId = this.extractVideoId(url);
        if (!videoId) {
            return {
                isValid: false,
                error: 'Could not extract video ID from URL'
            };
        }

        if (videoId.length < this.MIN_VIDEO_ID_LENGTH || videoId.length > this.MAX_VIDEO_ID_LENGTH) {
            return {
                isValid: false,
                error: 'Invalid video ID length'
            };
        }

        // Basic YouTube URL patterns
        const patterns = [
            /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{11}$/,
            /^https?:\/\/youtu\.be\/[\w-]{11}$/,
            /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]{11}$/
        ];

        const isValidUrl = patterns.some(pattern => pattern.test(url));
        if (!isValidUrl) {
            return {
                isValid: false,
                error: 'Invalid YouTube URL format'
            };
        }

        return {
            isValid: true
        };
    }

    static validateFileName(fileName: string): ValidationResult {
        if (!fileName) {
            return {
                isValid: false,
                error: 'File name cannot be empty'
            };
        }

        // Check for invalid characters in file name
        const invalidChars = /[<>:"\\|?*]/;
        if (invalidChars.test(fileName)) {
            return {
                isValid: false,
                error: 'File name contains invalid characters'
            };
        }

        // Check for control characters
        if (this.containsControlCharacters(fileName)) {
            return {
                isValid: false,
                error: 'File name contains invalid control characters'
            };
        }

        // Check length
        if (fileName.length > 255) {
            return {
                isValid: false,
                error: 'File name is too long'
            };
        }

        // Check for reserved file names in Windows
        const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
        if (reservedNames.test(fileName)) {
            return {
                isValid: false,
                error: 'File name is a reserved system name'
            };
        }

        // Check for leading/trailing spaces or dots
        if (fileName.startsWith('.') || fileName.endsWith('.') || fileName.trim() !== fileName) {
            return {
                isValid: false,
                error: 'File name cannot start or end with dots or spaces'
            };
        }

        return {
            isValid: true
        };
    }

    static validateTranscriptContent(content: string): ValidationResult {
        if (!content) {
            return {
                isValid: false,
                error: 'Transcript content cannot be empty'
            };
        }

        if (content.length > 1000000) { // 1MB text limit
            return {
                isValid: false,
                error: 'Transcript content is too large'
            };
        }

        // Check for valid UTF-8 characters
        try {
            decodeURIComponent(encodeURIComponent(content));
        } catch (e) {
            return {
                isValid: false,
                error: 'Transcript contains invalid characters'
            };
        }

        return {
            isValid: true
        };
    }

    private static extractVideoId(url: string): string | null {
        const patterns = [
            /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
            /(?:youtu\.be\/)([\w-]{11})/,
            /(?:youtube\.com\/embed\/)([\w-]{11})/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        return null;
    }

    private static containsControlCharacters(str: string): boolean {
        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            if (code < 32) { // ASCII control characters
                return true;
            }
        }
        return false;
    }
}
