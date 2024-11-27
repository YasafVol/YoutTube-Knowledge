import type { Plugin } from 'obsidian';
import type { Settings } from '../types/settings';

export class DebugLogger {
    private plugin: Plugin & { settings: Settings };
    private prefix = '[YouTube Knowledge]';

    constructor(plugin: Plugin & { settings: Settings }) {
        this.plugin = plugin;
    }

    log(message: string, data?: any) {
        if (this.plugin.settings.debugMode) {
            const timestamp = new Date().toISOString();
            console.log(`${this.prefix} [${timestamp}] ${message}`, data || '');
        }
    }

    warn(message: string, data?: any) {
        if (this.plugin.settings.debugMode) {
            const timestamp = new Date().toISOString();
            console.warn(`${this.prefix} [${timestamp}] ${message}`, data || '');
        }
    }

    error(message: string, error?: any) {
        if (this.plugin.settings.debugMode) {
            const timestamp = new Date().toISOString();
            console.error(`${this.prefix} [${timestamp}] ${message}`, error || '');
        }
    }
}
