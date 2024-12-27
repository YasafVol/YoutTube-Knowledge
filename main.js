'use strict';

var obsidian = require('obsidian');

class YouTubeKnowledgePlugin extends obsidian.Plugin {
    async onload() {
        console.log('Loading YouTube Knowledge plugin');

        // Load settings
        await this.loadSettings();

        // Add ribbon icon
        this.addRibbonIcon('youtube', 'YouTube Knowledge', async () => {
            const modal = new TranscriptModal(this.app, this);
            modal.open();
        });

        // Add settings tab
        this.addSettingTab(new SettingsTab(this.app, this));

        // Register file creation command
        this.addCommand({
            id: 'create-youtube-note',
            name: 'Create note from YouTube video',
            callback: () => {
                const modal = new TranscriptModal(this.app, this);
                modal.open();
            }
        });
    }

    async loadSettings() {
        this.settings = Object.assign({}, {
            youtube: {
                language: 'en',
                timeframeSeconds: 300
            },
            llm: {
                anthropicKey: '',
                summaryPrompt: DEFAULT_PROMPT,
                model: 'claude-3-sonnet-20240229'
            },
            debugMode: false
        }, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    onunload() {
        console.log('Unloading YouTube Knowledge plugin');
    }
}

class TranscriptModal extends obsidian.Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.createEl('h2', {text: 'Enter YouTube URL'});

        const inputEl = contentEl.createEl('input', {
            type: 'text',
            placeholder: 'https://www.youtube.com/watch?v=...'
        });

        const buttonEl = contentEl.createEl('button', {
            text: 'Process Video'
        });

        buttonEl.addEventListener('click', async () => {
            const url = inputEl.value.trim();
            if (!url) return;

            try {
                // Show loading state
                buttonEl.disabled = true;
                buttonEl.setText('Processing...');

                // Process URL and create note
                const processor = new URLProcessor(this.plugin);
                await processor.processUrl(url);

                this.close();
            } catch (error) {
                console.error('Error processing video:', error);
                new obsidian.Notice('Error processing video. Check console for details.');
            } finally {
                buttonEl.disabled = false;
                buttonEl.setText('Process Video');
            }
        });
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}

class SettingsTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const {containerEl} = this;
        containerEl.empty();

        // API Key Settings
        containerEl.createEl('h2', {text: 'API Settings'});
        new obsidian.Setting(containerEl)
            .setName('Anthropic API Key')
            .setDesc('Enter your Anthropic API key')
            .addText(text => text
                .setPlaceholder('Enter your API key')
                .setValue(this.plugin.settings.llm.anthropicKey)
                .onChange(async (value) => {
                    this.plugin.settings.llm.anthropicKey = value;
                    await this.plugin.saveSettings();
                }));

        // Model Settings
        containerEl.createEl('h2', {text: 'Model Settings'});
        new obsidian.Setting(containerEl)
            .setName('Claude Model')
            .setDesc('Select the Claude model to use')
            .addDropdown(dropdown => dropdown
                .addOptions({
                    'claude-3-opus-latest': 'Claude 3 Opus',
                    'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
                    'claude-3-haiku-20240307': 'Claude 3 Haiku'
                })
                .setValue(this.plugin.settings.llm.model)
                .onChange(async (value) => {
                    this.plugin.settings.llm.model = value;
                    await this.plugin.saveSettings();
                }));

        // YouTube Settings
        containerEl.createEl('h2', {text: 'YouTube Settings'});
        new obsidian.Setting(containerEl)
            .setName('Language')
            .setDesc('Preferred transcript language')
            .addText(text => text
                .setValue(this.plugin.settings.youtube.language)
                .onChange(async (value) => {
                    this.plugin.settings.youtube.language = value;
                    await this.plugin.saveSettings();
                }));

        // Debug Mode
        new obsidian.Setting(containerEl)
            .setName('Debug Mode')
            .setDesc('Enable debug logging')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.debugMode)
                .onChange(async (value) => {
                    this.plugin.settings.debugMode = value;
                    await this.plugin.saveSettings();
                }));
    }
}

const DEFAULT_PROMPT = `Please provide a comprehensive summary of this YouTube video transcript. Focus on:
1. Main topics and key points
2. Important details and examples
3. Conclusions or takeaways
4. Any actionable insights

Format the summary with clear headings and bullet points for easy reading.`;

module.exports = YouTubeKnowledgePlugin;
