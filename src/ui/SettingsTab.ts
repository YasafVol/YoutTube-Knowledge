import { App, PluginSettingTab, Setting } from 'obsidian';
import { GeneralSettings } from './settings/components/GeneralSettings';
import { APIKeySettings } from './settings/components/APIKeySettings';
import { ModelSettings } from './settings/components/ModelSettings';
import type YoutubeKnowledgePlugin from '../../main';

export class SettingsTab extends PluginSettingTab {
    constructor(app: App, private plugin: YoutubeKnowledgePlugin) {
        super(app, plugin);
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // YouTube Configuration Section
        new Setting(containerEl)
            .setName('YouTube configuration')
            .setHeading();

        // Initialize YouTube settings
        new GeneralSettings(containerEl, this.plugin.settingsStore);

        // LLM Configuration Section
        new Setting(containerEl)
            .setName('LLM configuration')
            .setHeading();

        // Initialize LLM settings
        new APIKeySettings(containerEl, this.plugin.settingsStore);
        new ModelSettings(containerEl, this.plugin.settingsStore);
    }
}
