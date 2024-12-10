import { TFile, App } from 'obsidian';
import { DebugLogger } from '../../utils/debug';
import { SummaryContent } from './types';

export class SummaryFileProcessor {
    constructor(
        private app: App,
        private logger: DebugLogger
    ) {}

    async validateAndReadFile(file: unknown): Promise<{ content: string; basename: string }> {
        if (!(file instanceof TFile)) {
            this.logger.error('Invalid file object provided:', file);
            throw new Error('Invalid file object: Expected TFile instance');
        }

        const content = await this.readFileContent(file);
        if (!content.trim()) {
            this.logger.error('Empty file content for:', file.path);
            throw new Error('File is empty');
        }

        return {
            content,
            basename: file.basename
        };
    }

    private async readFileContent(file: TFile): Promise<string> {
        return await file.vault.read(file);
    }

    createSummaryPath(originalPath: string): string {
        return `${originalPath.replace('.md', '')}-summary.md`;
    }

    generateSummaryContent(content: SummaryContent): string {
        const currentDate = new Date().toISOString().split('T')[0];
        
        return `---
parent: [[${content.basename}]]
created: ${currentDate}
cost: ${content.cost}
---

# Summary of ${content.basename}

${content.summary}`;
    }

    async createSummaryFile(path: string, content: string): Promise<void> {
        try {
            await this.app.vault.create(path, content);
            this.logger.log('Summary file created successfully at:', path);
        } catch (error) {
            this.logger.error('Failed to create summary file:', error);
            throw new Error(`Failed to create summary file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
