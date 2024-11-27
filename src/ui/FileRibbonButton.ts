import { App, Plugin } from 'obsidian';
import { FileService } from '../services/FileService';

export class FileRibbonButton {
    private ribbonIcon: HTMLElement;

    constructor(
        private app: App,
        private plugin: Plugin,
        private fileService: FileService
    ) {
        this.initialize();
    }

    private initialize(): void {
        // Add ribbon icon
        this.ribbonIcon = this.plugin.addRibbonIcon(
            'file-text',
            'Create new file',
            (evt: MouseEvent) => {
                // Handle click event
                this.handleClick();
            }
        );
    }

    private async handleClick(): Promise<void> {
        try {
            // Generate a timestamp-based filename
            const timestamp = new Date().getTime();
            const path = `new-file-${timestamp}.md`;
            
            // Create an empty markdown file
            await this.fileService.createFile(path, '');
        } catch (error) {
            console.error('Failed to create file:', error);
        }
    }

    // Method to update button visibility if needed
    public setVisibility(visible: boolean): void {
        if (!visible) {
            this.ribbonIcon.addClass('ribbon-button-hidden');
        } else {
            this.ribbonIcon.removeClass('ribbon-button-hidden');
        }
    }

    // Cleanup method to be called when plugin is disabled
    public cleanup(): void {
        this.ribbonIcon?.remove();
    }
}
