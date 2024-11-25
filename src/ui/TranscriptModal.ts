import { App, Modal, Notice, Setting } from 'obsidian';

export class TranscriptModal extends Modal {
    private url = '';
    private onSubmit: (url: string) => void;

    constructor(app: App, onSubmit: (url: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'YouTube Transcript' });

        const submitUrl = () => {
            if (!this.url) {
                new Notice('Please enter a YouTube URL');
                return;
            }

            try {
                // Return the URL and close the modal
                this.onSubmit(this.url);
                this.close();
            } catch (error) {
                new Notice('Failed to process URL: ' + error.message);
            }
        };

        new Setting(contentEl)
            .setName('YouTube URL')
            .setDesc('Enter a YouTube video link')
            .addText((text) =>
                text
                    .setPlaceholder('https://www.youtube.com/watch?v=...')
                    .onChange((value) => {
                        this.url = value;
                    })
                    .inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            submitUrl();
                        }
                    })
            );

        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText('Get Transcript')
                    .setCta()
                    .onClick(submitUrl)
            );
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
