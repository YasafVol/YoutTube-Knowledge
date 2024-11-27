import { App, Plugin, setIcon } from 'obsidian';
import { TranscriptModal } from './TranscriptModal';

export class RibbonButton {
    private ribbonIcon: HTMLElement;

    constructor(
        private app: App,
        private plugin: Plugin,
        private onTranscriptUrlSubmit: (url: string) => void
    ) {
        this.initialize();
    }

    private initialize(): void {
        // Add ribbon icon
        this.ribbonIcon = this.plugin.addRibbonIcon(
            'message-square-share',
            'Open transcript',
            (evt: MouseEvent) => {
                // Handle click event
                this.handleClick();
            }
        );

        // Update the icon to ensure proper styling
        setIcon(this.ribbonIcon, 'message-square-share');
    }

    private handleClick(): void {
        // Create and open modal with URL submission handler
        const modal = new TranscriptModal(this.app, this.onTranscriptUrlSubmit);
        modal.open();
    }

    // Public method to programmatically trigger the click action
    public click(): void {
        this.handleClick();
    }

    // Method to update button visibility if needed
    public setVisibility(visible: boolean): void {
        if (visible) {
            this.ribbonIcon.classList.remove('youtube-knowledge-ribbon-hidden');
        } else {
            this.ribbonIcon.classList.add('youtube-knowledge-ribbon-hidden');
        }
    }

    // Cleanup method to be called when plugin is disabled
    public cleanup(): void {
        this.ribbonIcon?.remove();
    }
}
