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
     * @param clippingsFolder - Path to store YouTube clippings
     */
    async updateYouTubeSettings(
        language: string, 
        timeframeSeconds: number,
        clippingsFolder?: string
    ): Promise<void> {
        if (timeframeSeconds <= 0) {
            throw new Error('Timeframe must be greater than 0 seconds');
        }

        await this.updateSettings({
            youtube: {
                ...this.settings.youtube,
                language,
                timeframeSeconds,
                ...(clippingsFolder && { clippingsFolder })
            }
        });
    }

    /**
     * Updates LLM settings
     * @param anthropicKey - Anthropic API key
     * @param model - Anthropic model selection
     * @param temperature - Controls randomness (0.0 to 1.0)
     * @param maxTokens - Maximum length of generated text
     * @param topP - Nucleus sampling threshold (0.0 to 1.0)
     * @param topK - Number of tokens to consider
     */
    async updateLLMSettings(
        anthropicKey?: string,
        model?: AnthropicModel,
        temperature?: number,
        maxTokens?: number,
        topP?: number,
        topK?: number
    ): Promise<void> {
        // Validate required settings if being updated
        if (anthropicKey === '') {
            throw new Error('Anthropic API key is required');
        }

        // Create new settings object with only defined values
        const newSettings = {
            ...this.settings.llm,
            ...(anthropicKey !== undefined && { anthropicKey }),
            ...(model !== undefined && { model }),
            ...(temperature !== undefined && { temperature }),
            ...(maxTokens !== undefined && { maxTokens }),
            ...(topP !== undefined && { topP }),
            ...(topK !== undefined && { topK })
        };

        // Validate numeric ranges
        if (temperature !== undefined && (temperature < 0 || temperature > 1)) {
            throw new Error('Temperature must be between 0 and 1');
        }
        if (maxTokens !== undefined && maxTokens <= 0) {
            throw new Error('Max tokens must be greater than 0');
        }
        if (topP !== undefined && (topP < 0 || topP > 1)) {
            throw new Error('Top P must be between 0 and 1');
        }
        if (topK !== undefined && topK <= 0) {
            throw new Error('Top K must be greater than 0');
        }

        await this.updateSettings({
            llm: newSettings
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
