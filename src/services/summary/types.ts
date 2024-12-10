export interface ModelRates {
    inputRate: number;
    outputRate: number;
}

export interface APIResponse {
    summary: string;
    cost: number;
}

export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
}

export interface SummaryContent {
    basename: string;
    summary: string;
    cost: number;
}

export interface LLMSettings {
    anthropicKey: string;
    model: string;
}
