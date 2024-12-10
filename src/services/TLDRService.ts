import { TFile, Notice, requestUrl, Plugin } from 'obsidian';
import { SettingsStore } from '../store/SettingsStore';
import { FileService } from './FileService';
import { DebugLogger } from '../utils/debug';
import type { Settings } from '../types/settings';
import { DEFAULT_PROMPT } from '../prompts/default_prompt';

interface AnthropicResponse {
    content: [{
        text: string;
    }];
    usage?: {
        input_tokens: number;
        output_tokens: number;
    };
}

interface AnthropicError {
    error: {
        type: string;
        message: string;
    };
}

export class TLDRService {
    private logger: DebugLogger;

    constructor(
        private settingsStore: SettingsStore,
        private fileService: FileService,
        plugin: Plugin & { settings: Settings }
    ) {
        this.logger = new DebugLogger(plugin);
    }

    /**
     * Processes a file to create a TLDR summary
     * @param file The file to process
     * @throws Error if file is invalid, settings are missing, or API fails
     */
    async processFile(file: unknown): Promise<void> {
        try {
            if (!(file instanceof TFile)) {
                this.logger.error('Invalid file object provided:', file);
                throw new Error('Invalid file object: Expected TFile instance');
            }

            this.logger.log('Starting TLDR generation for file:', file.path);
            new Notice('🤖 Starting TLDR generation...');

            // Validate settings
            const settings = this.settingsStore.getLLMSettings();
            if (!settings.anthropicKey) {
                this.logger.error('Anthropic API key not configured');
                throw new Error('Anthropic API key is not configured');
            }

            // Read file content
            const content = await file.vault.read(file);
            if (!content.trim()) {
                this.logger.error('Empty file content for:', file.path);
                throw new Error('File is empty');
            }

            this.logger.log('File content loaded, calling Anthropic API');

            // Call Anthropic API
            const { summary, cost } = await this.callAnthropicAPI(content, settings.anthropicKey, settings.model);

            // Create summary file path based on original file
            const summaryPath = `${file.path.replace('.md', '')}-summary.md`;
            this.logger.log('Creating summary file at:', summaryPath);
            
            // Get current date in YYYY-MM-DD format
            const currentDate = new Date().toISOString().split('T')[0];
            
            const summaryContent = `---
parent: [[${file.basename}]]
created: ${currentDate}
cost: ${cost}
---

# Summary of ${file.basename}

${summary}`;

            await this.fileService.createFile(summaryPath, summaryContent);
            this.logger.log('Summary created successfully', { path: summaryPath, cost });
            new Notice(`✅ Summary created successfully (Cost: $${cost.toFixed(4)})`);

        } catch (error) {
            if (error instanceof Error) {
                this.logger.error('Failed to create summary:', error);
                new Notice(`❌ Failed to create summary: ${error.message}`);
                throw error;
            }
            this.logger.error('Unknown error occurred');
            throw new Error('An unknown error occurred');
        }
    }

    /**
     * Calls the Anthropic API to generate a summary
     * @param content The content to summarize
     * @param apiKey The Anthropic API key
     * @param model The model to use
     * @returns The generated summary and estimated cost
     * @throws Error if API call fails
     */
    private async callAnthropicAPI(
        content: string, 
        apiKey: string,
        model: string
    ): Promise<{ summary: string; cost: number }> {
        try {
            this.logger.log('Calling Anthropic API with model:', model);

            const response = await requestUrl({
                url: 'https://api.anthropic.com/v1/messages',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: model,
                    max_tokens: 4000,
                    messages: [{
                        role: 'user',
                        content: `${DEFAULT_PROMPT}\n\nContent to summarize:\n${content}`
                    }],
                    temperature: 0.5
                }),
            });

            if (response.status !== 200) {
                const errorData = response.json as AnthropicError;
                this.logger.error('API error response:', errorData);
                throw new Error(`API error: ${errorData.error.message}`);
            }

            const data = response.json as AnthropicResponse;
            
            // Calculate approximate cost based on Claude 3 pricing
            // Sonnet: Input $15/M, Output $75/M
            // Haiku: Input $3/M, Output $15/M
            // Opus: Input $15/M, Output $75/M
            let inputRate = 0.000015; // Default to Sonnet/Opus rate
            let outputRate = 0.000075;
            
            if (model.includes('haiku')) {
                inputRate = 0.000003;
                outputRate = 0.000015;
            }

            const inputTokens = data.usage?.input_tokens || 0;
            const outputTokens = data.usage?.output_tokens || 0;
            const cost = (inputTokens * inputRate) + (outputTokens * outputRate);

            this.logger.log('API call successful', {
                model,
                inputTokens,
                outputTokens,
                cost
            });

            return {
                summary: data.content[0].text.trim(),
                cost
            };

        } catch (error) {
            if (error instanceof Error) {
                // Handle rate limits specifically
                if (error.message.includes('rate')) {
                    this.logger.error('Rate limit exceeded');
                    throw new Error('Rate limit exceeded. Please try again later.');
                }
                this.logger.error('API call failed:', error);
                throw error;
            }
            this.logger.error('Failed to connect to Anthropic API');
            throw new Error('Failed to connect to Anthropic API');
        }
    }
}
