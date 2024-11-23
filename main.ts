import { Notice, Plugin } from 'obsidian';
import { RibbonButton } from './src/ui/RibbonButton';
import { FileRibbonButton } from './src/ui/FileRibbonButton';
import { URLProcessor } from './src/services/URLProcessor';
import { YouTubeService } from './src/services/YouTubeService';
import { FileService } from './src/services/FileService';

export default class MyPlugin extends Plugin {
    private ribbonButton: RibbonButton;
    private fileRibbonButton: FileRibbonButton;
    private fileService: FileService;

    async onload() {
        // Initialize services
        this.fileService = new FileService(this.app);

        // Initialize the transcript ribbon button
        this.ribbonButton = new RibbonButton(
            this.app,
            this,
            async (dirtyURL: string) => {
                // Show the dirty URL in a Notice
                new Notice(`Dirty URL: ${dirtyURL}`);
                console.debug('Processing URL:', dirtyURL);
                
                try {
                    // Process and validate the URL
                    const cleanURL = await URLProcessor.processURL(dirtyURL, this.app);
                    new Notice(`Clean URL: ${cleanURL}`);
                    console.debug('Clean URL:', cleanURL);

                    // Fetch transcript using the clean URL
                    const transcript = await YouTubeService.fetchTranscript(cleanURL);
                    console.debug('Transcript:', transcript);
                    new Notice('Transcript fetched successfully');
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                    new Notice(`Error: ${errorMessage}`);
                    console.error('Processing error:', errorMessage);
                }
            }
        );

        // Initialize the file ribbon button with FileService
        this.fileRibbonButton = new FileRibbonButton(
            this.app,
            this,
            this.fileService
        );
    }

    onunload() {
        // Clean up both ribbon buttons when plugin is disabled
        this.ribbonButton?.cleanup();
        this.fileRibbonButton?.cleanup();
    }
}
