import { TFile, Vault } from 'obsidian';
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
    let mockFile: jest.Mocked<TFile>;

    beforeEach(() => {
        // Reset mocks
        settingsStore = new SettingsStore(null) as jest.Mocked<SettingsStore>;
        fileService = new FileService(null) as jest.Mocked<FileService>;
        mockFile = {
            path: 'test.md',
            basename: 'test',
            vault: {
                read: jest.fn()
            }
        } as unknown as jest.Mocked<TFile>;

        // Setup service
        tldrService = new TLDRService(settingsStore, fileService);

        // Default mock implementations
        settingsStore.getLLMSettings.mockReturnValue({
            anthropicKey: 'test-key',
            summaryPrompt: 'test-prompt',
            model: 'claude-3-sonnet-20240229'
        });
        mockFile.vault.read.mockResolvedValue('test content');
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
        mockFile.vault.read.mockResolvedValue('');

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
