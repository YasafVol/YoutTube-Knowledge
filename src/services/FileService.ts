import { App, TFile } from 'obsidian';
import { SettingsStore } from '../store/SettingsStore';
import { DEFAULT_SETTINGS } from '../types/settings';

export class FileService {
    private settingsStore: SettingsStore;

    constructor(private app: App, settingsStore: SettingsStore) {
        this.settingsStore = settingsStore;
    }

    /**
     * Creates a new file in the vault
     * @param path The path where the file should be created
     * @param content The content to write to the file
     * @returns Promise<TFile> The created file
     */
    async createFile(path: string, content: string): Promise<TFile> {
        try {
            // Get unique filename
            const uniquePath = await this.getUniqueFilePath(path);

            // Create the file directly in the vault root
            const file = await this.app.vault.create(uniquePath, content);
            return file;
        } catch (error) {
            throw new Error(`Failed to create file: ${error.message}`);
        }
    }

    /**
     * Creates a new file for a YouTube video
     * @param title The video title
     * @param url The video URL
     * @param transcript Optional video transcript
     * @returns Promise<TFile> The created file
     */
    async createYouTubeVideoFile(title: string, url: string, transcript?: string): Promise<TFile> {
        // Create a valid filename from the title
        const safeTitle = title
            .replace(/[\\/:*?"<>|]/g, '') // Remove invalid filename characters
            .trim();
        
        // Get current date in YYYY-MM-DD format
        const currentDate = new Date().toISOString().split('T')[0];

        // Get the clippings folder path from settings
        const settings = this.settingsStore.getSettings();
        const folderPath = settings?.youtube?.clippingsFolder || DEFAULT_SETTINGS.youtube.clippingsFolder;

        // Ensure the clippings folder exists
        if (!(await this.app.vault.adapter.exists(folderPath))) {
            await this.app.vault.createFolder(folderPath);
        }
        
        // Create the file with .md extension in the clippings folder
        return await this.createFile(
            `${folderPath}/${safeTitle}.md`,
            `---\nurl: ${url}\ncreated: ${currentDate}\n---\n\n${transcript || ''}`
        );
    }

    /**
     * Gets a unique file path by appending a number if the file already exists
     * @param basePath The initial desired path
     * @returns Promise<string> A unique file path
     */
    private async getUniqueFilePath(basePath: string): Promise<string> {
        let counter = 1;
        let uniquePath = basePath;

        while (await this.app.vault.adapter.exists(uniquePath)) {
            const ext = basePath.includes('.') ? basePath.split('.').pop() : '';
            const baseWithoutExt = basePath.includes('.') ? 
                basePath.slice(0, basePath.lastIndexOf('.')) : 
                basePath;
            uniquePath = `${baseWithoutExt} ${counter}.${ext}`;
            counter++;
        }

        return uniquePath;
    }
}
