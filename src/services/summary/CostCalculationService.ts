import { ModelRates, TokenUsage } from './types';
import { DebugLogger } from '../../utils/debug';

export class CostCalculationService {
    constructor(private logger: DebugLogger) {}

    calculateCost(usage: TokenUsage, model: string): number {
        const rates = this.getModelRates(model);
        const cost = this.calculateTotalCost(usage, rates);

        this.logger.log('Cost calculation', {
            model,
            usage,
            rates,
            totalCost: cost
        });

        return cost;
    }

    private getModelRates(model: string): ModelRates {
        // Default to Sonnet/Opus rates
        let rates: ModelRates = {
            inputRate: 0.000015, // $15/M tokens
            outputRate: 0.000075 // $75/M tokens
        };

        // Adjust rates for Haiku
        if (model.includes('haiku')) {
            rates = {
                inputRate: 0.000003, // $3/M tokens
                outputRate: 0.000015 // $15/M tokens
            };
        }

        return rates;
    }

    private calculateTotalCost(usage: TokenUsage, rates: ModelRates): number {
        const inputCost = usage.inputTokens * rates.inputRate;
        const outputCost = usage.outputTokens * rates.outputRate;
        return inputCost + outputCost;
    }
}
