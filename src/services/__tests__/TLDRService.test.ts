import { TFile, Plugin } from 'obsidian';
import { TLDRService } from '../TLDRService';
import { SettingsStore } from '../../store/SettingsStore';
import { FileService } from '../FileService';
import type { Settings, AnthropicModel } from '../../types/settings';

// Mock implementations
jest.mock('obsidian');
jest.mock('../../store/SettingsStore');
jest.mock('../FileService');

describe('TLDRService', () => {
    let tldrService: TLDRService;
    let settingsStore: jest.Mocked<SettingsStore>;
    let fileService: jest.Mocked<FileService>;
    let mockFile: TFile;
    let mockPlugin: Plugin & { settings: Settings };

    // Mock LLM settings with realistic test values
    const defaultLLMSettings = {
        // Mock Anthropic API key format: sk-ant-api03-*****
        anthropicKey: 'sk-ant-api03-test-key-12345',
        model: 'claude-3-5-sonnet-latest' as AnthropicModel,
        temperature: 0.5,
        maxTokens: 4000,
        topP: 1.0,
        topK: 40
    };

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

        // Create mock plugin with settings
        mockPlugin = {
            settings: {
                debugMode: false,
                youtube: {
                    language: 'en',
                    timeframeSeconds: 60,
                    clippingsFolder: 'YouTube Clippings'
                },
                llm: defaultLLMSettings
            }
        } as Plugin & { settings: Settings };

        // Create a proper TFile instance with realistic test content
        mockFile = new TFile();
        Object.assign(mockFile, {
            path: 'youtube-transcript.md',
            basename: 'youtube-transcript',
            name: 'youtube-transcript.md',
            extension: 'md',
            stat: { mtime: Date.now() },
            parent: null,
            vault: {
                // Mock a realistic YouTube transcript content
                read: jest.fn().mockResolvedValue(
                    `[00:00] Welcome to this video about machine learning
                     [00:15] Today we'll discuss neural networks
                     [00:30] Let's start with the basics...`
                )
            }
        });

        // Verify mockFile is actually a TFile instance
        if (!(mockFile instanceof TFile)) {
            throw new Error('Mock file setup failed: not a TFile instance');
        }

        // Setup service with mock plugin
        tldrService = new TLDRService(settingsStore, fileService, mockPlugin);

        // Default mock implementations
        settingsStore.getLLMSettings.mockReturnValue(defaultLLMSettings);
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ 
                completion: 'Summary of machine learning video:\n- Introduction to neural networks\n- Basic concepts covered\n- Timestamps included for reference' 
            })
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should process file successfully', async () => {
        await tldrService.processFile(mockFile);

        expect(fileService.createFile).toHaveBeenCalledWith(
            'youtube-transcript-summary.md',
            expect.stringContaining('Summary of machine learning video')
        );
    });

    it('should reject non-TFile objects', async () => {
        const invalidFile = {
            path: 'test.md',
            basename: 'test',
            vault: { read: jest.fn() }
        };
        
        await expect(tldrService.processFile(invalidFile)).rejects.toThrow('Invalid file object: Expected TFile instance');
    });

    it('should throw error if API key is missing', async () => {
        settingsStore.getLLMSettings.mockReturnValue({
            ...defaultLLMSettings,
            anthropicKey: ''
        });

        await expect(tldrService.processFile(mockFile)).rejects.toThrow('API key');
    });

    it('should throw error if file is empty', async () => {
        mockFile.vault.read = jest.fn().mockResolvedValue('');

        await expect(tldrService.processFile(mockFile)).rejects.toThrow('empty');
    });

    it('should handle API errors', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({
                error: { message: 'Invalid API key provided' }
            })
        });

        await expect(tldrService.processFile(mockFile)).rejects.toThrow('Invalid API key provided');
    });

    it('should handle rate limit errors', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('rate limit exceeded'));

        await expect(tldrService.processFile(mockFile)).rejects.toThrow('Rate limit');
    });

    it('should handle network errors', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('Failed to connect to Anthropic API'));

        await expect(tldrService.processFile(mockFile)).rejects.toThrow('Failed to connect');
    });

    it('should log debug messages when debug mode is enabled', async () => {
        const consoleSpy = jest.spyOn(console, 'log');
        mockPlugin.settings.debugMode = true;

        await tldrService.processFile(mockFile);

        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Processing YouTube transcript')
        );
        
        consoleSpy.mockRestore();
    });

    it('should not log debug messages when debug mode is disabled', async () => {
        const consoleSpy = jest.spyOn(console, 'log');
        mockPlugin.settings.debugMode = false;

        await tldrService.processFile(mockFile);

        expect(consoleSpy).not.toHaveBeenCalled();
        
        consoleSpy.mockRestore();
    });
});
