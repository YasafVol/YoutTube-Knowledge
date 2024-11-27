import { Setting, Modal } from 'obsidian';
import { SettingsStore } from '../../../store/SettingsStore';

class APIKeyModal extends Modal {
    private apiKey = '';

    constructor(
        private settingsStore: SettingsStore,
        private onSubmit: (apiKey: string) => void
    ) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Enter Anthropic API Key' });

        const inputContainer = contentEl.createDiv();
        const input = inputContainer.createEl('input', {
            type: 'password',
            placeholder: 'Enter your API key'
        });
        input.style.width = '100%';
        input.style.marginBottom = '1rem';

        input.value = this.apiKey;
        input.addEventListener('input', (e: Event) => {
            const target = e.target as HTMLInputElement;
            this.apiKey = target.value;
        });

        const buttonContainer = contentEl.createDiv();
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.gap = '0.5rem';

        const submitButton = buttonContainer.createEl('button', { text: 'Save' });
        submitButton.onclick = () => {
            this.onSubmit(this.apiKey);
            this.close();
        };

        const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelButton.onclick = () => this.close();
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

export class APIKeySettings {
    constructor(containerEl: HTMLElement, private settingsStore: SettingsStore) {
        const settings = settingsStore.getSettings();
        const hasApiKey = !!settings.llm.anthropicKey;

        new Setting(containerEl)
            .setName('Anthropic API key')
            .setDesc('Enter your Anthropic API key for LLM operations')
            .addButton(button => button
                .setButtonText(hasApiKey ? 'Update API key' : 'Save API key')
                .onClick(() => {
                    new APIKeyModal(settingsStore, async (apiKey) => {
                        if (apiKey) {
                            await settingsStore.updateLLMSettings(
                                apiKey,
                                settings.llm.summaryPrompt,
                                settings.llm.model
                            );
                            button.setButtonText('Update API key');
                        }
                    }).open();
                }));
    }
}
