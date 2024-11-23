import { App, Plugin, setIcon } from 'obsidian';
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
            'Create New File',
            (evt: MouseEvent) => {
                // Handle click event
                this.handleClick();
            }
        );

        // Update the icon to ensure proper styling
        setIcon(this.ribbonIcon, 'file-text');
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
        this.ribbonIcon.style.display = visible ? 'block' : 'none';
    }

    // Cleanup method to be called when plugin is disabled
    public cleanup(): void {
        this.ribbonIcon?.remove();
    }
}
