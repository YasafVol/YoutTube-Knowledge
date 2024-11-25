import { Notice, Plugin } from 'obsidian';
import { RibbonButton } from './src/ui/RibbonButton';
import { URLProcessor } from './src/services/URLProcessor';
import { FileService } from './src/services/FileService';
import { TLDRService } from './src/services/TLDRService';
import { SettingsTab } from './src/ui/SettingsTab';
import { SettingsStore } from './src/store/SettingsStore';

// Export the interface before the class implementation
export interface YoutubeKnowledge extends Plugin {
    settings: SettingsStore;
    onload(): Promise<void>;
    onunload(): Promise<void>;
}

export default class MyPlugin extends Plugin implements YoutubeKnowledge {
    private ribbonButton: RibbonButton;
    private fileService: FileService;
    private tldrService: TLDRService;
    settings: SettingsStore;

    async onload() {
        // Initialize settings
        this.settings = new SettingsStore(this);
        await this.settings.loadSettings();

        // Initialize services
        this.fileService = new FileService(this.app);
        this.tldrService = new TLDRService(this.settings, this.fileService);

        // Initialize the transcript ribbon button
        this.ribbonButton = new RibbonButton(
            this.app,
            this,
            async (dirtyURL: string) => {
                await this.processYouTubeURL(dirtyURL);
            }
        );

        // Register commands
        this.addCommand({
            id: 'open-youtube-transcript',
            name: 'Open YouTube Transcript',
            hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'y' }], // Default hotkey: Cmd/Ctrl+Shift+Y
            callback: () => {
                // Simply trigger the ribbon button's click action
                this.ribbonButton.click();
            }
        });

        // Add settings tab
        this.addSettingTab(new SettingsTab(this.app, this));
    }

    /**
     * Process a YouTube URL to create transcript and summary
     * @param dirtyURL The raw YouTube URL to process
     */
    private async processYouTubeURL(dirtyURL: string): Promise<void> {
        new Notice(`Processing URL: ${dirtyURL}`);
        console.debug('Processing URL:', dirtyURL);
        
        try {
            // Process and validate the URL
            const processedData = await URLProcessor.processURL(dirtyURL, this.app);
            new Notice(`Clean URL: ${processedData.cleanURL}`);
            console.debug('Clean URL:', processedData.cleanURL);
            console.debug('Video Title:', processedData.title);

            // Create transcript file
            const file = await this.fileService.createYouTubeVideoFile(
                processedData.title,
                processedData.cleanURL,
                processedData.transcript
            );

            // Generate TLDR summary
            await this.tldrService.processFile(file);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            new Notice(`Error: ${errorMessage}`);
            console.error('Processing error:', errorMessage);
        }
    }

    async onunload() {
        // Clean up ribbon button when plugin is disabled
        this.ribbonButton?.cleanup();
    }
}
