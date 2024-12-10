import { Setting } from 'obsidian';
import { SettingsStore } from '../../../store/SettingsStore';
import { MODEL_OPTIONS } from '../../../types/settings';
import { DEFAULT_PROMPT } from '../../../prompts/default_prompt';

export class GeneralSettings {
    constructor(containerEl: HTMLElement, private settingsStore: SettingsStore) {
        const settings = settingsStore.getSettings();

        // Language Settings
        new Setting(containerEl)
            .setName('Language')
            .setDesc('Select the language for YouTube operations')
            .addDropdown(dropdown => {
                dropdown
                    .addOption('en', 'English')
                    .addOption('es', 'Spanish')
                    .addOption('fr', 'French')
                    .addOption('de', 'German')
                    .addOption('it', 'Italian')
                    .addOption('pt', 'Portuguese')
                    .addOption('ru', 'Russian')
                    .addOption('ja', 'Japanese')
                    .addOption('ko', 'Korean')
                    .addOption('zh', 'Chinese')
                    .setValue(settings.youtube.language)
                    .onChange(async (value) => {
                        await settingsStore.updateYouTubeSettings(
                            value,
                            settings.youtube.timeframeSeconds,
                            settings.youtube.clippingsFolder
                        );
                    });
            });

        // Timeframe Settings
        new Setting(containerEl)
            .setName('Timeframe')
            .setDesc('Set the timeframe in seconds for processing')
            .addText(text => text
                .setPlaceholder('60')
                .setValue(settings.youtube.timeframeSeconds.toString())
                .onChange(async (value) => {
                    const timeframe = parseInt(value, 10);
                    if (!isNaN(timeframe) && timeframe > 0) {
                        await settingsStore.updateYouTubeSettings(
                            settings.youtube.language,
                            timeframe,
                            settings.youtube.clippingsFolder
                        );
                    }
                })
            );

        // Clippings Folder Settings
        new Setting(containerEl)
            .setName('Clippings Folder')
            .setDesc('Set the folder path for storing YouTube clippings')
            .addText(text => text
                .setPlaceholder('YouTube Clippings')
                .setValue(settings.youtube.clippingsFolder)
                .onChange(async (value) => {
                    if (value.trim()) {
                        await settingsStore.updateYouTubeSettings(
                            settings.youtube.language,
                            settings.youtube.timeframeSeconds,
                            value.trim()
                        );
                    }
                })
            );

        // Debug Mode Settings
        new Setting(containerEl)
            .setName('Debug mode')
            .setDesc('Enable detailed console logging for troubleshooting')
            .addToggle(toggle => toggle
                .setValue(settings.debugMode)
                .onChange(async (value) => {
                    await settingsStore.updateDebugMode(value);
                })
            );

        // Add heading for AI Model Settings
        containerEl.createEl('h3', { text: 'AI Model Settings' });

        // Anthropic API Key Setting
        new Setting(containerEl)
            .setName('Anthropic API Key')
            .setDesc('Enter your Anthropic API key for Claude access')
            .addText(text => {
                const input = text
                    .setPlaceholder('Enter your API key')
                    .setValue(settings.llm.anthropicKey)
                    .onChange(async (value) => {
                        await settingsStore.updateLLMSettings(
                            value,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined
                        );
                    });
                
                // Get the input element and set its type to password
                const inputEl = input.inputEl;
                inputEl.type = 'password';
                
                return input;
            });

        // Model Selection
        new Setting(containerEl)
            .setName('Model')
            .setDesc('Select the Claude model to use for summaries')
            .addDropdown(dropdown => {
                Object.entries(MODEL_OPTIONS).forEach(([name, value]) => {
                    dropdown.addOption(value, name);
                });
                dropdown.setValue(settings.llm.model)
                    .onChange(async (value) => {
                        await settingsStore.updateLLMSettings(
                            undefined,
                            value as any,
                            undefined,
                            undefined,
                            undefined,
                            undefined
                        );
                    });
            });

        // Model Prompt Display
        const promptSetting = new Setting(containerEl)
            .setName('Model Prompt')
            .setDesc('The default prompt used for generating summaries');

        const promptTextArea = document.createElement('textarea');
        promptTextArea.value = DEFAULT_PROMPT;
        promptTextArea.rows = 10;
        promptTextArea.style.width = '100%';
        promptTextArea.style.marginTop = '10px';
        promptTextArea.readOnly = true;
        promptTextArea.style.backgroundColor = 'var(--background-secondary)';
        promptTextArea.style.cursor = 'default';

        promptSetting.settingEl.appendChild(promptTextArea);

        // Temperature Setting
        new Setting(containerEl)
            .setName('Temperature')
            .setDesc('Controls randomness in the output. Lower values (0.0) are more focused, higher values (1.0) are more creative.')
            .addSlider(slider => {
                slider
                    .setLimits(0, 1, 0.1)
                    .setValue(settings.llm.temperature)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        await settingsStore.updateLLMSettings(
                            undefined,
                            undefined,
                            value,
                            undefined,
                            undefined,
                            undefined
                        );
                    });
            });

        // Max Tokens Setting
        new Setting(containerEl)
            .setName('Max Tokens')
            .setDesc('Maximum length of the generated summary. Higher values allow longer responses.')
            .addText(text => {
                text
                    .setPlaceholder('4000')
                    .setValue(settings.llm.maxTokens.toString())
                    .onChange(async (value) => {
                        const tokens = parseInt(value, 10);
                        if (!isNaN(tokens) && tokens > 0) {
                            await settingsStore.updateLLMSettings(
                                undefined,
                                undefined,
                                undefined,
                                tokens,
                                undefined,
                                undefined
                            );
                        }
                    });
            });

        // Top P Setting
        new Setting(containerEl)
            .setName('Top P')
            .setDesc('Controls diversity by limiting cumulative probability of considered tokens. Lower values (0.1) focus on likely tokens, higher values (1.0) allow more diversity.')
            .addSlider(slider => {
                slider
                    .setLimits(0, 1, 0.1)
                    .setValue(settings.llm.topP)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        await settingsStore.updateLLMSettings(
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            value,
                            undefined
                        );
                    });
            });

        // Top K Setting
        new Setting(containerEl)
            .setName('Top K')
            .setDesc('Number of highest probability tokens to consider. Lower values (10) give more focused word choice, higher values (100) allow more diverse vocabulary.')
            .addSlider(slider => {
                slider
                    .setLimits(1, 100, 1)
                    .setValue(settings.llm.topK)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        await settingsStore.updateLLMSettings(
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            value
                        );
                    });
            });
    }
}
