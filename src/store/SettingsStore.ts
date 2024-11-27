import { Plugin } from 'obsidian';
import { Settings, DEFAULT_SETTINGS, AnthropicModel } from '../types/settings';

/**
 * Manages plugin settings persistence and access
 */
export class SettingsStore {
    private plugin: Plugin;
    private settings: Settings;

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.settings = DEFAULT_SETTINGS;
    }

    /**
     * Loads settings from Obsidian's data storage
     */
    async loadSettings(): Promise<void> {
        try {
            const loadedData = await this.plugin.loadData();
            this.settings = {
                ...DEFAULT_SETTINGS,
                ...loadedData
            };
        } catch (error) {
            console.error('Failed to load settings:', error);
            throw new Error('Failed to load settings. Using defaults.');
        }
    }

    /**
     * Saves current settings to Obsidian's data storage
     */
    async saveSettings(): Promise<void> {
        try {
            await this.plugin.saveData(this.settings);
        } catch (error) {
            console.error('Failed to save settings:', error);
            throw new Error('Failed to save settings.');
        }
    }

    /**
     * Updates settings with new values and saves them
     * @param newSettings - Partial settings object to merge with current settings
     */
    async updateSettings(newSettings: Partial<Settings>): Promise<void> {
        try {
            this.settings = {
                ...this.settings,
                ...newSettings
            };
            await this.saveSettings();
        } catch (error) {
            console.error('Failed to update settings:', error);
            throw new Error('Failed to update settings.');
        }
    }

    /**
     * Gets the current settings
     */
    getSettings(): Settings {
        return this.settings;
    }

    /**
     * Gets YouTube-specific settings
     */
    getYouTubeSettings() {
        return this.settings.youtube;
    }

    /**
     * Gets LLM-specific settings
     */
    getLLMSettings() {
        return this.settings.llm;
    }

    /**
     * Updates YouTube settings
     * @param language - Selected language
     * @param timeframeSeconds - Timeframe in seconds
     */
    async updateYouTubeSettings(language: string, timeframeSeconds: number): Promise<void> {
        if (timeframeSeconds <= 0) {
            throw new Error('Timeframe must be greater than 0 seconds');
        }

        await this.updateSettings({
            youtube: {
                ...this.settings.youtube,
                language,
                timeframeSeconds
            }
        });
    }

    /**
     * Updates LLM settings
     * @param anthropicKey - Anthropic API key
     * @param summaryPrompt - Custom summary prompt
     * @param model - Anthropic model selection
     */
    async updateLLMSettings(anthropicKey: string, summaryPrompt: string, model?: AnthropicModel): Promise<void> {
        if (!anthropicKey && this.settings.llm.anthropicKey === '') {
            throw new Error('Anthropic API key is required');
        }

        await this.updateSettings({
            llm: {
                ...this.settings.llm,
                ...(anthropicKey && { anthropicKey }),
                ...(summaryPrompt && { summaryPrompt }),
                ...(model && { model })
            }
        });
    }

    /**
     * Updates debug mode setting
     * @param enabled - Whether debug mode should be enabled
     */
    async updateDebugMode(enabled: boolean): Promise<void> {
        await this.updateSettings({
            debugMode: enabled
        });
    }
}
