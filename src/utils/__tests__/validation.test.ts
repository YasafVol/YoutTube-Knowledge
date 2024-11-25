import { ValidationUtils } from '../validation';

describe('ValidationUtils', () => {
    describe('validateYouTubeUrl', () => {
        it('should validate correct YouTube URLs', () => {
            const validUrls = [
                'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'https://youtu.be/dQw4w9WgXcQ',
                'https://youtube.com/watch?v=dQw4w9WgXcQ',
                'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'https://www.youtube.com/embed/dQw4w9WgXcQ'
            ];

            validUrls.forEach(url => {
                const result = ValidationUtils.validateYouTubeUrl(url);
                expect(result.isValid).toBe(true);
                expect(result.error).toBeUndefined();
            });
        });

        it('should reject invalid YouTube URLs', () => {
            const invalidUrls = [
                '',
                'https://youtube.com',
                'https://youtube.com/watch',
                'https://youtube.com/watch?v=',
                'https://youtube.com/watch?v=tooShort',
                'https://youtube.com/watch?v=tooLongIDHere123',
                'https://notyoutube.com/watch?v=dQw4w9WgXcQ',
                'invalid-url'
            ];

            invalidUrls.forEach(url => {
                const result = ValidationUtils.validateYouTubeUrl(url);
                expect(result.isValid).toBe(false);
                expect(result.error).toBeDefined();
            });
        });

        it('should validate video ID length', () => {
            const result = ValidationUtils.validateYouTubeUrl('https://youtube.com/watch?v=abc');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Could not extract video ID from URL');
        });

        it('should handle URLs exceeding maximum length', () => {
            const longUrl = 'https://youtube.com/watch?v=dQw4w9WgXcQ' + 'a'.repeat(2048);
            const result = ValidationUtils.validateYouTubeUrl(longUrl);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('URL exceeds maximum length');
        });
    });

    describe('validateFileName', () => {
        it('should validate correct file names', () => {
            const validNames = [
                'test.md',
                'my-video-transcript',
                'transcript_2023',
                'Valid File Name 123'
            ];

            validNames.forEach(name => {
                const result = ValidationUtils.validateFileName(name);
                expect(result.isValid).toBe(true);
                expect(result.error).toBeUndefined();
            });
        });

        it('should reject invalid file names', () => {
            const invalidNames = [
                '',
                'file/name',
                'file:name',
                'file*name',
                'file?name',
                'file"name',
                'file<name',
                'file>name',
                'file|name',
                'file\\name'
            ];

            invalidNames.forEach(name => {
                const result = ValidationUtils.validateFileName(name);
                expect(result.isValid).toBe(false);
                expect(result.error).toBeDefined();
            });
        });

        it('should reject control characters in file names', () => {
            const invalidNames = [
                String.fromCharCode(0) + 'filename',
                String.fromCharCode(31) + 'filename',
                'file' + String.fromCharCode(7) + 'name'
            ];

            invalidNames.forEach(name => {
                const result = ValidationUtils.validateFileName(name);
                expect(result.isValid).toBe(false);
                expect(result.error).toBe('File name contains invalid control characters');
            });
        });

        it('should reject names exceeding maximum length', () => {
            const result = ValidationUtils.validateFileName('a'.repeat(256));
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('File name is too long');
        });

        it('should reject reserved Windows file names', () => {
            const reservedNames = [
                'CON',
                'PRN',
                'AUX',
                'NUL',
                'COM1',
                'LPT1',
                'con.txt',
                'prn.md',
                'aux.js',
                'nul.ts'
            ];

            reservedNames.forEach(name => {
                const result = ValidationUtils.validateFileName(name);
                expect(result.isValid).toBe(false);
                expect(result.error).toBe('File name is a reserved system name');
            });
        });

        it('should reject names with leading/trailing dots or spaces', () => {
            const invalidNames = [
                '.filename',
                'filename.',
                ' filename',
                'filename ',
                ' filename ',
                '. filename',
                'filename .'
            ];

            invalidNames.forEach(name => {
                const result = ValidationUtils.validateFileName(name);
                expect(result.isValid).toBe(false);
                expect(result.error).toBe('File name cannot start or end with dots or spaces');
            });
        });
    });

    describe('validateTranscriptContent', () => {
        it('should validate correct transcript content', () => {
            const validContent = 'Valid transcript content';
            const result = ValidationUtils.validateTranscriptContent(validContent);
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should reject empty content', () => {
            const result = ValidationUtils.validateTranscriptContent('');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Transcript content cannot be empty');
        });

        it('should reject oversized content', () => {
            const largeContent = 'a'.repeat(1000001);
            const result = ValidationUtils.validateTranscriptContent(largeContent);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Transcript content is too large');
        });

        it('should reject content with invalid UTF-8 characters', () => {
            const invalidContent = String.fromCharCode(0xD800); // Invalid UTF-16 surrogate
            const result = ValidationUtils.validateTranscriptContent(invalidContent);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Transcript contains invalid characters');
        });

        it('should handle null or undefined content', () => {
            // @ts-ignore - Testing invalid input
            const result1 = ValidationUtils.validateTranscriptContent(null);
            expect(result1.isValid).toBe(false);
            expect(result1.error).toBe('Transcript content cannot be empty');

            // @ts-ignore - Testing invalid input
            const result2 = ValidationUtils.validateTranscriptContent(undefined);
            expect(result2.isValid).toBe(false);
            expect(result2.error).toBe('Transcript content cannot be empty');
        });
    });
});
