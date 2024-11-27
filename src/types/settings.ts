export interface YouTubeSettings {
    language: string;
    timeframeSeconds: number;
}

export type AnthropicModel = 
    | 'claude-3-5-sonnet-latest'
    | 'claude-3-5-haiku-latest'
    | 'claude-3-opus-latest'
    | 'claude-3-sonnet-20240229'
    | 'claude-3-haiku-20240307';

export interface LLMSettings {
    anthropicKey: string;
    summaryPrompt: string;
    model: AnthropicModel;
}

export interface Settings {
    youtube: YouTubeSettings;
    llm: LLMSettings;
    debugMode: boolean; // Add debug mode setting
}

export const DEFAULT_PROMPT = `Please provide a comprehensive summary of this YouTube video transcript. Focus on:
1. Main topics and key points
2. Important details and examples
3. Any conclusions or takeaways

Format the summary with clear sections and bullet points where appropriate.`;

export const DEFAULT_SETTINGS: Settings = {
    youtube: {
        language: 'en',
        timeframeSeconds: 60
    },
    llm: {
        anthropicKey: '',
        summaryPrompt: DEFAULT_PROMPT,
        model: 'claude-3-5-sonnet-latest'
    },
    debugMode: false // Default to false
};

export const MODEL_OPTIONS: { [key: string]: AnthropicModel } = {
    'Claude 3.5 Sonnet': 'claude-3-5-sonnet-latest',
    'Claude 3.5 Haiku': 'claude-3-5-haiku-latest',
    'Claude 3 Opus': 'claude-3-opus-latest',
    'Claude 3 Sonnet': 'claude-3-sonnet-20240229',
    'Claude 3 Haiku': 'claude-3-haiku-20240307'
};
