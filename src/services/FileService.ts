import { App, TFile } from 'obsidian';

export class FileService {
    constructor(private app: App) {}

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

            // Create the file
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
        
        // Create the file with .md extension
        return await this.createFile(
            `${safeTitle}.md`,
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
        const ext = basePath.includes('.') ? basePath.split('.').pop() : '';
        const baseWithoutExt = basePath.includes('.') ? 
            basePath.slice(0, basePath.lastIndexOf('.')) : 
            basePath;

        while (await this.app.vault.adapter.exists(uniquePath)) {
            uniquePath = `${baseWithoutExt} ${counter}.${ext}`;
            counter++;
        }

        return uniquePath;
    }
}
