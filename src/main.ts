import { Plugin } from 'obsidian';
import { SettingsStore } from './settings/SettingsStore';
import { SettingsTab } from './settings/SettingsTab';

/**
 * Main plugin class for YouTube Knowledge
 */
class YoutubeKnowledge extends Plugin {
    settings: SettingsStore;

    async onload() {
        // Initialize settings
        this.settings = new SettingsStore(this);
        await this.settings.loadSettings();

        // Add settings tab
        this.addSettingTab(new SettingsTab(this.app, this));

        // Add settings button to plugin header
        this.addRibbonIcon('settings', 'YouTube Knowledge Settings', () => {
            // Users can access settings through the plugin settings menu
            // or by clicking this icon in the ribbon
        });

        // Add command to open settings
        this.addCommand({
            id: 'open-youtube-knowledge-settings',
            name: 'Open Settings',
            callback: () => {
                // Users can access settings through the command palette
            }
        });
    }

    async onunload() {
        // Clean up if needed
    }
}

export type { YoutubeKnowledge };
export default YoutubeKnowledge;
