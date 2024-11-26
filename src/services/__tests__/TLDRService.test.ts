import { TFile } from 'obsidian';
import { TLDRService } from '../TLDRService';
import { SettingsStore } from '../../store/SettingsStore';
import { FileService } from '../FileService';

// Mock implementations
jest.mock('obsidian');
jest.mock('../../store/SettingsStore');
jest.mock('../FileService');

describe('TLDRService', () => {
    let tldrService: TLDRService;
    let settingsStore: jest.Mocked<SettingsStore>;
    let fileService: jest.Mocked<FileService>;
    let mockFile: TFile;

    beforeEach(() => {
        // Reset mocks
        settingsStore = {
            getLLMSettings: jest.fn(),
            loadSettings: jest.fn(),
            saveSettings: jest.fn()
        } as unknown as jest.Mocked<SettingsStore>;
        
        fileService = {
            createFile: jest.fn()
        } as unknown as jest.Mocked<FileService>;

        // Create a proper TFile instance
        mockFile = new TFile();
        Object.assign(mockFile, {
            path: 'test.md',
            basename: 'test',
            name: 'test.md',
            extension: 'md',
            stat: { mtime: Date.now() },
            parent: null,
            vault: {
                read: jest.fn().mockResolvedValue('test content')
            }
        });

        // Verify mockFile is actually a TFile instance
        if (!(mockFile instanceof TFile)) {
            throw new Error('Mock file setup failed: not a TFile instance');
        }

        // Setup service
        tldrService = new TLDRService(settingsStore, fileService);

        // Default mock implementations
        settingsStore.getLLMSettings.mockReturnValue({
            anthropicKey: 'test-key',
            summaryPrompt: 'test-prompt',
            model: 'claude-3-sonnet-20240229'
        });
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ completion: 'test summary' })
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should process file successfully', async () => {
        await tldrService.processFile(mockFile);

        expect(fileService.createFile).toHaveBeenCalledWith(
            'test-summary.md',
            expect.stringContaining('test summary')
        );
    });

    it('should reject non-TFile objects', async () => {
        const invalidFile = {
            path: 'test.md',
            basename: 'test',
            vault: { read: jest.fn() }
        };
        
        // Now we can pass it directly since processFile accepts unknown type
        await expect(tldrService.processFile(invalidFile)).rejects.toThrow('Invalid file object: Expected TFile instance');
    });

    it('should throw error if API key is missing', async () => {
        settingsStore.getLLMSettings.mockReturnValue({
            anthropicKey: '',
            summaryPrompt: 'test-prompt',
            model: 'claude-3-sonnet-20240229'
        });

        await expect(tldrService.processFile(mockFile)).rejects.toThrow('API key');
    });

    it('should throw error if prompt is missing', async () => {
        settingsStore.getLLMSettings.mockReturnValue({
            anthropicKey: 'test-key',
            summaryPrompt: '',
            model: 'claude-3-sonnet-20240229'
        });

        await expect(tldrService.processFile(mockFile)).rejects.toThrow('prompt');
    });

    it('should throw error if file is empty', async () => {
        mockFile.vault.read = jest.fn().mockResolvedValue('');

        await expect(tldrService.processFile(mockFile)).rejects.toThrow('empty');
    });

    it('should handle API errors', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({
                error: { message: 'API error' }
            })
        });

        await expect(tldrService.processFile(mockFile)).rejects.toThrow('API error');
    });

    it('should handle rate limit errors', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('rate limit exceeded'));

        await expect(tldrService.processFile(mockFile)).rejects.toThrow('Rate limit');
    });

    it('should handle network errors', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('network error'));

        await expect(tldrService.processFile(mockFile)).rejects.toThrow('Failed to connect');
    });
});
