import { Setting } from 'obsidian';
import { SettingsStore } from '../../../store/SettingsStore';
import { MODEL_OPTIONS, AnthropicModel } from '../../../types/settings';

export class ModelSettings {
    constructor(containerEl: HTMLElement, private settingsStore: SettingsStore) {
        const settings = settingsStore.getSettings();

        new Setting(containerEl)
            .setName('Model Selection')
            .setDesc('Choose the Anthropic Claude model to use')
            .addDropdown(dropdown => {
                Object.entries(MODEL_OPTIONS).forEach(([name, value]) => {
                    dropdown.addOption(value, name);
                });
                dropdown.setValue(settings.llm.model)
                    .onChange(async (value) => {
                        await settingsStore.updateLLMSettings(
                            settings.llm.anthropicKey,
                            settings.llm.summaryPrompt,
                            value as AnthropicModel
                        );
                    });
            });

        new Setting(containerEl)
            .setName('Summary Prompt')
            .setDesc('Customize the prompt used for generating summaries')
            .addTextArea(text => text
                .setValue(settings.llm.summaryPrompt)
                .onChange(async (value) => {
                    await settingsStore.updateLLMSettings(
                        settings.llm.anthropicKey,
                        value,
                        settings.llm.model
                    );
                })
            );
    }
}
