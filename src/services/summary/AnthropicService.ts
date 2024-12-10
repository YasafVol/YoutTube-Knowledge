import { requestUrl, RequestUrlResponse } from 'obsidian';
import { APIResponse, TokenUsage } from './types';
import { DebugLogger } from '../../utils/debug';
import { LLMSettings } from '../../types/settings';
import { DEFAULT_PROMPT } from '../../prompts/default_prompt';

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

export class AnthropicService {
    constructor(private logger: DebugLogger) {}

    async generateSummary(
        content: string,
        apiKey: string,
        settings: LLMSettings
    ): Promise<APIResponse & { usage: TokenUsage }> {
        try {
            this.logger.log('Calling Anthropic API with model:', settings.model);
            this.logger.log('Using temperature:', settings.temperature);
            this.logger.log('Using maxTokens:', settings.maxTokens);

            const response = await this.makeAPIRequest(content, apiKey, settings);
            const data = await this.handleResponse(response);
            
            const usage = {
                inputTokens: data.usage?.input_tokens || 0,
                outputTokens: data.usage?.output_tokens || 0
            };

            return {
                summary: data.content[0].text.trim(),
                usage,
                cost: 0 // Will be calculated by CostCalculationService
            };

        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    private async makeAPIRequest(
        content: string, 
        apiKey: string,
        settings: LLMSettings
    ): Promise<RequestUrlResponse> {
        return await requestUrl({
            url: 'https://api.anthropic.com/v1/messages',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: settings.model,
                max_tokens: settings.maxTokens,
                messages: [{
                    role: 'user',
                    content: `${DEFAULT_PROMPT}\n\nContent to summarize:\n${content}`
                }],
                temperature: settings.temperature,
                top_p: settings.topP,
                top_k: settings.topK
            }),
        });
    }

    private async handleResponse(response: RequestUrlResponse): Promise<AnthropicResponse> {
        if (response.status !== 200) {
            const errorData = response.json as unknown as AnthropicError;
            this.logger.error('API error response:', errorData);
            throw new Error(`API error: ${errorData.error.message}`);
        }
        return response.json as unknown as AnthropicResponse;
    }

    private handleError(error: unknown): never {
        if (error instanceof Error) {
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
