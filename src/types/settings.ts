import { DEFAULT_PROMPT } from '../prompts/default_prompt';

export interface YouTubeSettings {
    language: string;
    timeframeSeconds: number;
    clippingsFolder: string; // Added clippings folder path
}

export type AnthropicModel = 
    | 'claude-3-5-sonnet-latest'
    | 'claude-3-5-haiku-latest'
    | 'claude-3-opus-latest'
    | 'claude-3-sonnet-20240229'
    | 'claude-3-haiku-20240307';

export interface LLMSettings {
    anthropicKey: string;
    model: AnthropicModel;
    /**
     * Controls randomness in the model's output (0.0 to 1.0)
     * - Lower values (e.g. 0.2) = More focused, deterministic responses
     * - Higher values (e.g. 0.8) = More creative, varied responses
     * - Default: 0.5 for balanced output
     */
    temperature: number;

    /**
     * Maximum number of tokens (words/characters) to generate
     * - Higher values allow longer responses but cost more
     * - Lower values help keep responses concise
     * - Default: 4000 tokens (~3000 words)
     */
    maxTokens: number;

    /**
     * Nucleus sampling threshold (0.0 to 1.0)
     * - Controls diversity by limiting cumulative probability of considered tokens
     * - Lower values (e.g. 0.1) = More focused on likely tokens
     * - Higher values (e.g. 0.9) = Consider more diverse token options
     * - Default: 1.0 for full token distribution
     */
    topP: number;

    /**
     * Number of highest probability tokens to consider
     * - Lower values (e.g. 10) = More focused word choice
     * - Higher values (e.g. 100) = More diverse vocabulary
     * - Default: 40 for balanced vocabulary selection
     */
    topK: number;
}

export interface Settings {
    youtube: YouTubeSettings;
    llm: LLMSettings;
    debugMode: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
    youtube: {
        language: 'en',
        timeframeSeconds: 60,
        clippingsFolder: 'YouTube Clippings'
    },
    llm: {
        anthropicKey: '',
        model: 'claude-3-5-sonnet-latest',
        temperature: 0.5,    // Balanced between creativity and focus
        maxTokens: 4000,     // Good for detailed summaries
        topP: 1.0,          // Consider full token distribution
        topK: 40            // Balanced vocabulary diversity
    },
    debugMode: false
};

/**
 * Available Claude models with their characteristics:
 * - Claude 3.5 Sonnet: Latest balanced model for most tasks
 * - Claude 3.5 Haiku: Faster, more efficient model
 * - Claude 3 Opus: Most capable model for complex tasks
 * - Claude 3 Sonnet: Previous generation balanced model
 * - Claude 3 Haiku: Previous generation efficient model
 */
export const MODEL_OPTIONS: { [key: string]: AnthropicModel } = {
    'Claude 3.5 Sonnet': 'claude-3-5-sonnet-latest',
    'Claude 3.5 Haiku': 'claude-3-5-haiku-latest',
    'Claude 3 Opus': 'claude-3-opus-latest',
    'Claude 3 Sonnet': 'claude-3-sonnet-20240229',
    'Claude 3 Haiku': 'claude-3-haiku-20240307'
};
