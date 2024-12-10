import { Notice } from 'obsidian';
import { DebugLogger } from '../../utils/debug';

export class NotificationService {
    constructor(private logger: DebugLogger) {}

    logProgress(message: string, data?: unknown): void {
        this.logger.log(message, data);
    }

    showStartNotification(): void {
        new Notice('🤖 Starting TLDR generation...');
    }

    showSuccessNotification(cost: number): void {
        new Notice(`✅ Summary created successfully (Cost: $${cost.toFixed(4)})`);
    }

    showErrorNotification(error: Error): void {
        new Notice(`❌ Failed to create summary: ${error.message}`);
    }

    logError(error: Error, context: string): void {
        this.logger.error(`${context}:`, error);
    }

    logSuccess(message: string, data?: unknown): void {
        this.logger.log(message, data);
    }
}
