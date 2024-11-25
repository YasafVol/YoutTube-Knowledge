import { TFile, Notice, requestUrl } from 'obsidian';
import { SettingsStore } from '../store/SettingsStore';
import { FileService } from './FileService';

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
    constructor(
        private settingsStore: SettingsStore,
        private fileService: FileService
    ) {}

    /**
     * Processes a file to create a TLDR summary
     * @param file The file to process
     * @throws Error if settings are missing or API fails
     */
    async processFile(file: TFile): Promise<void> {
        try {
            new Notice('🤖 Starting TLDR generation...');

            // Validate settings
            const settings = this.settingsStore.getLLMSettings();
            if (!settings.anthropicKey) {
                throw new Error('Anthropic API key is not configured');
            }
            if (!settings.summaryPrompt) {
                throw new Error('Summary prompt is not configured');
            }

            // Read file content
            const content = await file.vault.read(file);
            if (!content.trim()) {
                throw new Error('File is empty');
            }

            // Call Anthropic API
            const { summary, cost } = await this.callAnthropicAPI(content, settings.anthropicKey, settings.summaryPrompt, settings.model);

            // Create summary file path based on original file
            const summaryPath = `${file.path.replace('.md', '')}-summary.md`;
            
            const summaryContent = `---
parent: [[${file.basename}]]
cost: ${cost}
---

# Summary of ${file.basename}

${summary}`;

            await this.fileService.createFile(summaryPath, summaryContent);
            new Notice(`✅ Summary created successfully (Cost: $${cost.toFixed(4)})`);

        } catch (error) {
            if (error instanceof Error) {
                new Notice(`❌ Failed to create summary: ${error.message}`);
                throw error;
            }
            throw new Error('An unknown error occurred');
        }
    }

    /**
     * Calls the Anthropic API to generate a summary
     * @param content The content to summarize
     * @param apiKey The Anthropic API key
     * @param prompt The summary prompt
     * @param model The model to use
     * @returns The generated summary and estimated cost
     * @throws Error if API call fails
     */
    private async callAnthropicAPI(
        content: string, 
        apiKey: string, 
        prompt: string,
        model: string
    ): Promise<{ summary: string; cost: number }> {
        try {
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
                        content: `${prompt}\n\nContent to summarize:\n${content}`
                    }],
                    temperature: 0.5
                }),
            });

            if (response.status !== 200) {
                const errorData = response.json as AnthropicError;
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

            return {
                summary: data.content[0].text.trim(),
                cost
            };

        } catch (error) {
            if (error instanceof Error) {
                // Handle rate limits specifically
                if (error.message.includes('rate')) {
                    throw new Error('Rate limit exceeded. Please try again later.');
                }
                throw error;
            }
            throw new Error('Failed to connect to Anthropic API');
        }
    }
}
