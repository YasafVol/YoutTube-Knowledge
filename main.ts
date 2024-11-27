import { Notice, Plugin } from 'obsidian';
import { RibbonButton } from './src/ui/RibbonButton';
import { URLProcessor } from './src/services/URLProcessor';
import { FileService } from './src/services/FileService';
import { TLDRService } from './src/services/TLDRService';
import { SettingsTab } from './src/ui/SettingsTab';
import { SettingsStore } from './src/store/SettingsStore';
import './styles.css';

export default class YoutubeKnowledgePlugin extends Plugin {
    private ribbonButton: RibbonButton;
    private fileService: FileService;
    private tldrService: TLDRService;
    settingsStore: SettingsStore;

    async onload() {
        this.settingsStore = new SettingsStore(this);
        await this.settingsStore.loadSettings();

        this.fileService = new FileService(this.app);
        this.tldrService = new TLDRService(this.settingsStore, this.fileService);

        this.ribbonButton = new RibbonButton(
            this.app,
            this,
            async (dirtyURL: string) => {
                await this.processYouTubeURL(dirtyURL);
            }
        );

        this.addCommand({
            id: 'open-youtube-transcript',
            name: 'Open YouTube transcript',
            hotkeys: [],
            callback: () => {
                this.ribbonButton.click();
            }
        });

        this.addSettingTab(new SettingsTab(this.app, this));
    }

    private async processYouTubeURL(dirtyURL: string): Promise<void> {
        new Notice(`Processing URL: ${dirtyURL}`);
        
        try {
            const processedData = await URLProcessor.processURL(dirtyURL, this.app);
            new Notice(`Clean URL: ${processedData.cleanURL}`);

            const file = await this.fileService.createYouTubeVideoFile(
                processedData.title,
                processedData.cleanURL,
                processedData.transcript
            );

            await this.tldrService.processFile(file);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            new Notice(`Error: ${errorMessage}`);
            console.error('Processing error:', errorMessage);
        }
    }

    async onunload() {
        this.ribbonButton?.cleanup();
    }
}
