import { Plugin, TFile } from 'obsidian';
import { SettingsStore } from '../../store/SettingsStore';
import { DebugLogger } from '../../utils/debug';
import { Settings } from '../../types/settings';
import { AnthropicService } from './AnthropicService';
import { CostCalculationService } from './CostCalculationService';
import { NotificationService } from './NotificationService';
import { SettingsValidator } from './SettingsValidator';
import { SummaryFileProcessor } from './SummaryFileProcessor';

export class TLDRService {
    private anthropicService: AnthropicService;
    private costCalculator: CostCalculationService;
    private notificationService: NotificationService;
    private settingsValidator: SettingsValidator;
    private fileProcessor: SummaryFileProcessor;
    private logger: DebugLogger;

    constructor(
        private settingsStore: SettingsStore,
        plugin: Plugin & { settings: Settings }
    ) {
        this.logger = new DebugLogger(plugin);
        this.anthropicService = new AnthropicService(this.logger);
        this.costCalculator = new CostCalculationService(this.logger);
        this.notificationService = new NotificationService(this.logger);
        this.settingsValidator = new SettingsValidator(this.logger);
        this.fileProcessor = new SummaryFileProcessor(plugin.app, this.logger);
    }

    async processFile(file: unknown): Promise<void> {
        try {
            // Start notification
            this.notificationService.showStartNotification();

            // Validate settings
            const settings = this.settingsStore.getLLMSettings();
            this.settingsValidator.validateSettings(settings);

            // Process file
            const { content, basename } = await this.fileProcessor.validateAndReadFile(file);

            // Generate summary using all LLM settings
            const { summary, usage } = await this.anthropicService.generateSummary(
                content,
                settings.anthropicKey,
                settings
            );

            // Calculate cost
            const cost = this.costCalculator.calculateCost(usage, settings.model);

            // Generate summary path and content
            const summaryPath = this.fileProcessor.createSummaryPath((file as TFile).path);
            const summaryContent = this.fileProcessor.generateSummaryContent({
                basename,
                summary,
                cost
            });

            // Create summary file
            await this.fileProcessor.createSummaryFile(summaryPath, summaryContent);

            // Show success notification
            this.notificationService.showSuccessNotification(cost);
            this.notificationService.logSuccess('Summary created successfully', { path: summaryPath, cost });

        } catch (error) {
            if (error instanceof Error) {
                this.notificationService.showErrorNotification(error);
                this.notificationService.logError(error, 'Failed to create summary');
                throw error;
            }
            const unknownError = new Error('An unknown error occurred');
            this.notificationService.showErrorNotification(unknownError);
            this.notificationService.logError(unknownError, 'Unknown error');
            throw unknownError;
        }
    }
}
