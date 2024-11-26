import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import type { YoutubeKnowledge } from '../main';
import { DEFAULT_PROMPT, MODEL_OPTIONS } from '../types/settings';

export class SettingsTab extends PluginSettingTab {
    plugin: YoutubeKnowledge;

    constructor(app: App, plugin: YoutubeKnowledge) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        this.addYouTubeSection(containerEl);
        this.addLLMSection(containerEl);
    }

    private addYouTubeSection(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: 'YouTube Configuration' });

        // Language Setting
        new Setting(containerEl)
            .setName('Language')
            .setDesc('Select the language for YouTube operations')
            .addDropdown(dropdown => {
                const languages = {
                    'en': 'English',
                    'es': 'Spanish',
                    'fr': 'French',
                    'de': 'German',
                    'it': 'Italian',
                    'pt': 'Portuguese',
                    'ru': 'Russian',
                    'ja': 'Japanese',
                    'ko': 'Korean',
                    'zh': 'Chinese'
                };

                Object.entries(languages).forEach(([value, name]) => {
                    dropdown.addOption(value, name);
                });

                dropdown
                    .setValue(this.plugin.settings.getSettings().youtube.language)
                    .onChange(async (value) => {
                        try {
                            await this.plugin.settings.updateYouTubeSettings(
                                value,
                                this.plugin.settings.getSettings().youtube.timeframeSeconds
                            );
                            new Notice('Language setting saved');
                        } catch (error) {
                            new Notice('Failed to save language setting');
                            console.error(error);
                        }
                    });
            });

        // Timeframe Setting
        new Setting(containerEl)
            .setName('Timeframe')
            .setDesc('Set the timeframe in seconds for processing')
            .addText(text => text
                .setPlaceholder('60')
                .setValue(String(this.plugin.settings.getSettings().youtube.timeframeSeconds))
                .onChange(async (value) => {
                    const timeframe = parseInt(value);
                    if (isNaN(timeframe) || timeframe <= 0) {
                        new Notice('Please enter a valid positive number');
                        return;
                    }

                    try {
                        await this.plugin.settings.updateYouTubeSettings(
                            this.plugin.settings.getSettings().youtube.language,
                            timeframe
                        );
                        new Notice('Timeframe setting saved');
                    } catch (error) {
                        new Notice('Failed to save timeframe setting');
                        console.error(error);
                    }
                }));
    }

    private addLLMSection(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: 'LLM Configuration' });

        // Anthropic API Key Setting
        new Setting(containerEl)
            .setName('Anthropic API Key')
            .setDesc('Enter your Anthropic API key for LLM operations')
            .addText(text => {
                text.setPlaceholder('Enter API key')
                    .setValue(this.plugin.settings.getSettings().llm.anthropicKey)
                    .setDisabled(this.plugin.settings.getSettings().llm.anthropicKey !== '');
                text.inputEl.addClass('api-key-input');
                return text;
            })
            .addButton(button => button
                .setButtonText(this.plugin.settings.getSettings().llm.anthropicKey ? 'Update API Key' : 'Save API Key')
                .onClick(async () => {
                    const input = containerEl.querySelector('.api-key-input') as HTMLInputElement;
                    const apiKey = input.value.trim();

                    if (!apiKey) {
                        new Notice('API key cannot be empty');
                        return;
                    }

                    try {
                        await this.plugin.settings.updateLLMSettings(
                            apiKey,
                            this.plugin.settings.getSettings().llm.summaryPrompt,
                            this.plugin.settings.getSettings().llm.model
                        );
                        new Notice('API key saved successfully');
                        this.display(); // Refresh the display
                    } catch (error) {
                        new Notice('Failed to save API key');
                        console.error(error);
                    }
                }));

        // Model Selection Setting
        new Setting(containerEl)
            .setName('Model Selection')
            .setDesc('Choose the Anthropic Claude model to use')
            .addDropdown(dropdown => {
                Object.entries(MODEL_OPTIONS).forEach(([name, value]) => {
                    dropdown.addOption(value, name);
                });

                dropdown
                    .setValue(this.plugin.settings.getSettings().llm.model)
                    .onChange(async (value) => {
                        try {
                            await this.plugin.settings.updateLLMSettings(
                                this.plugin.settings.getSettings().llm.anthropicKey,
                                this.plugin.settings.getSettings().llm.summaryPrompt,
                                value as keyof typeof MODEL_OPTIONS
                            );
                            new Notice('Model setting saved');
                        } catch (error) {
                            new Notice('Failed to save model setting');
                            console.error(error);
                        }
                    });
            });

        // Summary Prompt Setting
        const promptSetting = new Setting(containerEl)
            .setName('Summary Prompt')
            .setDesc('Customize the prompt used for generating summaries')
            .addTextArea(text => {
                text.setPlaceholder(DEFAULT_PROMPT)
                    .setValue(this.plugin.settings.getSettings().llm.summaryPrompt)
                    .onChange(async (value) => {
                        try {
                            await this.plugin.settings.updateLLMSettings(
                                this.plugin.settings.getSettings().llm.anthropicKey,
                                value,
                                this.plugin.settings.getSettings().llm.model
                            );
                            new Notice('Summary prompt saved');
                        } catch (error) {
                            new Notice('Failed to save summary prompt');
                            console.error(error);
                        }
                    });
                
                return text;
            });

        promptSetting.settingEl.addClass('prompt-setting');
    }
}
