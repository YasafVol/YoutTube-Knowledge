import { LLMSettings, AnthropicModel } from '../../types/settings';
import { DebugLogger } from '../../utils/debug';

export class SettingsValidator {
    constructor(private logger: DebugLogger) {}

    validateSettings(settings: LLMSettings): void {
        this.validateAPIKey(settings.anthropicKey);
        this.validateModel(settings.model);
        this.validateTemperature(settings.temperature);
        this.validateMaxTokens(settings.maxTokens);
        this.validateTopP(settings.topP);
        this.validateTopK(settings.topK);
    }

    private validateAPIKey(key: string): void {
        if (!key) {
            this.logger.error('Anthropic API key not configured');
            throw new Error('Anthropic API key is not configured');
        }
    }

    private validateModel(model: AnthropicModel): void {
        const validModels = [
            'claude-3-5-sonnet-latest',
            'claude-3-5-haiku-latest',
            'claude-3-opus-latest',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307'
        ];

        if (!validModels.includes(model)) {
            this.logger.error('Invalid model specified:', model);
            throw new Error(`Invalid model. Must be one of: ${validModels.join(', ')}`);
        }
    }

    private validateTemperature(temperature: number): void {
        if (temperature < 0 || temperature > 1) {
            this.logger.error('Invalid temperature value:', temperature);
            throw new Error('Temperature must be between 0 and 1');
        }
    }

    private validateMaxTokens(maxTokens: number): void {
        if (maxTokens <= 0) {
            this.logger.error('Invalid max tokens value:', maxTokens);
            throw new Error('Max tokens must be greater than 0');
        }
        // Claude has a max context window, typically around 100k tokens
        if (maxTokens > 100000) {
            this.logger.error('Max tokens exceeds limit:', maxTokens);
            throw new Error('Max tokens cannot exceed 100,000');
        }
    }

    private validateTopP(topP: number): void {
        if (topP < 0 || topP > 1) {
            this.logger.error('Invalid top P value:', topP);
            throw new Error('Top P must be between 0 and 1');
        }
    }

    private validateTopK(topK: number): void {
        if (topK <= 0) {
            this.logger.error('Invalid top K value:', topK);
            throw new Error('Top K must be greater than 0');
        }
        // Set a reasonable upper limit for top K
        if (topK > 1000) {
            this.logger.error('Top K exceeds reasonable limit:', topK);
            throw new Error('Top K cannot exceed 1,000');
        }
    }
}
