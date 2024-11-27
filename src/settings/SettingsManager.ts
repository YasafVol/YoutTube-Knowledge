import { Settings } from '../types/settings';

export class SettingsManager {
    private settings: Settings;

    constructor(settings: Settings) {
        this.settings = settings;
    }

    getSettings(): Settings {
        return this.settings;
    }

    updateSettings(newSettings: Partial<Settings>): void {
        this.settings = {
            ...this.settings,
            ...newSettings
        };
    }
}
