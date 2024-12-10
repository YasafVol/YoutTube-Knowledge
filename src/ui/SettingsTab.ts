import { App, PluginSettingTab } from 'obsidian';
import { GeneralSettings } from './settings/components/GeneralSettings';
import type YoutubeKnowledgePlugin from '../../main';

export class SettingsTab extends PluginSettingTab {
    constructor(app: App, private plugin: YoutubeKnowledgePlugin) {
        super(app, plugin);
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // Initialize all settings through GeneralSettings
        new GeneralSettings(containerEl, this.plugin.settingsStore);
    }
}
