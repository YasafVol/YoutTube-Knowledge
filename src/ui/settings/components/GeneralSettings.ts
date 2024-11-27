import { Setting } from 'obsidian';
import { SettingsStore } from '../../../store/SettingsStore';

export class GeneralSettings {
    constructor(containerEl: HTMLElement, private settingsStore: SettingsStore) {
        const settings = settingsStore.getSettings();

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
                            settings.youtube.timeframeSeconds
                        );
                    });
            });

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
                            timeframe
                        );
                    }
                })
            );

        new Setting(containerEl)
            .setName('Debug mode')
            .setDesc('Enable detailed console logging for troubleshooting')
            .addToggle(toggle => toggle
                .setValue(settings.debugMode)
                .onChange(async (value) => {
                    await settingsStore.updateDebugMode(value);
                })
            );
    }
}
