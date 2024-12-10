# Implementation Plan: Custom Prompting Feature

## Overview
Add functionality to export default prompt as .md file and allow using custom prompts from vault files.

## 1. Settings Updates

### Update src/types/settings.ts
- Add new fields to LLMSettings interface:
```typescript
/**
 * Path to custom prompt markdown file in vault
 * - Must point to a valid .md file
 * - Empty string uses built-in default prompt
 * - Relative to vault root
 */
customPromptPath: string;

/**
 * Controls whether to use custom prompt or default
 * - true: Use prompt from customPromptPath
 * - false: Use built-in default prompt
 * - Automatically falls back to default if custom prompt is invalid
 */
useCustomPrompt: boolean;
```
- Update DEFAULT_SETTINGS to include new fields:
```typescript
llm: {
    // ... existing settings ...
    customPromptPath: '',
    useCustomPrompt: false
}
```

## 2. File Service Enhancement

### Update src/services/FileService.ts
Add new methods:
```typescript
async exportDefaultPrompt(): Promise<TFile> {
    // Strip TypeScript export syntax and extract template string content
    const content = DEFAULT_PROMPT.replace(/^export const DEFAULT_PROMPT = `/, '')
        .replace(/`;$/, '');
    return await this.createFile(
        'prompts/default_prompt.md',
        content
    );
}

async readCustomPrompt(path: string): Promise<string> {
    // Validate file extension
    if (!path.endsWith('.md')) {
        throw new Error('Custom prompt must be a markdown file');
    }

    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) {
        throw new Error('Custom prompt file not found');
    }

    const content = await this.app.vault.read(file);
    if (!content.trim()) {
        throw new Error('Custom prompt file is empty');
    }

    return content;
}

private validatePromptPath(path: string): void {
    if (!path) {
        throw new Error('Prompt path cannot be empty');
    }
    if (!path.endsWith('.md')) {
        throw new Error('Prompt file must be a markdown file');
    }
}
```

## 3. Settings Store Updates

### Update src/store/SettingsStore.ts
Add new method:
```typescript
async updatePromptSettings(
    customPromptPath?: string,
    useCustomPrompt?: boolean
): Promise<void> {
    const settings = this.getSettings();
    if (customPromptPath !== undefined) {
        // Validate path before saving
        this.fileService.validatePromptPath(customPromptPath);
        settings.llm.customPromptPath = customPromptPath;
    }
    if (useCustomPrompt !== undefined) {
        // If enabling custom prompt, validate path exists
        if (useCustomPrompt && settings.llm.customPromptPath) {
            await this.fileService.readCustomPrompt(settings.llm.customPromptPath);
        }
        settings.llm.useCustomPrompt = useCustomPrompt;
    }
    await this.saveSettings(settings);
}
```

## 4. UI Updates

### Update src/ui/settings/components/GeneralSettings.ts
Add new settings after existing Model Prompt section:

```typescript
// Export Default Prompt Button
new Setting(containerEl)
    .setName('Export Default Prompt')
    .setDesc('Export the default prompt as a markdown file')
    .addButton(button => button
        .setButtonText('Export')
        .onClick(async () => {
            try {
                await this.fileService.exportDefaultPrompt();
                new Notice('Default prompt exported successfully');
            } catch (error) {
                new Notice(`Failed to export prompt: ${error.message}`);
                console.error('Export error:', error);
            }
        })
    );

// Custom Prompt File Setting
new Setting(containerEl)
    .setName('Custom Prompt File')
    .setDesc('Select a markdown file to use as custom prompt')
    .addText(text => text
        .setPlaceholder('Path to .md file')
        .setValue(settings.llm.customPromptPath)
        .onChange(async (value) => {
            try {
                await this.settingsStore.updatePromptSettings(value);
                new Notice('Custom prompt path updated');
            } catch (error) {
                new Notice(`Invalid prompt path: ${error.message}`);
            }
        })
    )
    .addButton(button => button
        .setButtonText('Browse')
        .onClick(() => {
            // Open file picker modal
            const modal = new FileSuggestModal(
                this.app,
                '.md',
                async (file) => {
                    await this.settingsStore.updatePromptSettings(file.path);
                    new Notice('Custom prompt file selected');
                }
            );
            modal.open();
        })
    );

// Use Custom Prompt Toggle
new Setting(containerEl)
    .setName('Use Custom Prompt')
    .setDesc('Toggle between default and custom prompt')
    .addToggle(toggle => toggle
        .setValue(settings.llm.useCustomPrompt)
        .onChange(async (value) => {
            try {
                await this.settingsStore.updatePromptSettings(undefined, value);
                new Notice(value ? 'Using custom prompt' : 'Using default prompt');
            } catch (error) {
                new Notice(`Failed to update prompt setting: ${error.message}`);
                toggle.setValue(!value); // Revert toggle on error
            }
        })
    );
```

## 5. Service Updates

### Update src/services/TLDRService.ts
Add new method and modify existing ones:
```typescript
/**
 * Gets the appropriate prompt based on settings
 * @returns The prompt to use for summarization
 * @throws Error if custom prompt is invalid
 */
private async getPrompt(): Promise<string> {
    const settings = this.settingsStore.getSettings();
    if (settings.llm.useCustomPrompt && settings.llm.customPromptPath) {
        try {
            this.logger.log('Using custom prompt from:', settings.llm.customPromptPath);
            return await this.fileService.readCustomPrompt(
                settings.llm.customPromptPath
            );
        } catch (error) {
            this.logger.error('Failed to read custom prompt:', error);
            new Notice(`Using default prompt: ${error.message}`);
            // Update settings to disable custom prompt due to error
            await this.settingsStore.updatePromptSettings(undefined, false);
            return DEFAULT_PROMPT;
        }
    }
    this.logger.log('Using default prompt');
    return DEFAULT_PROMPT;
}

// Update callAnthropicAPI method:
private async callAnthropicAPI(
    content: string, 
    apiKey: string,
    model: string
): Promise<{ summary: string; cost: number }> {
    try {
        this.logger.log('Calling Anthropic API with model:', model);
        
        // Get appropriate prompt
        const prompt = await this.getPrompt();
        this.logger.log('Prompt loaded successfully');

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

        // [Rest of method unchanged...]
    } catch (error) {
        if (error instanceof Error) {
            // Add prompt-specific error handling
            if (error.message.includes('prompt')) {
                this.logger.error('Prompt error:', error);
                throw new Error(`Prompt error: ${error.message}`);
            }
            // [Rest of error handling unchanged...]
        }
        throw error;
    }
}
```

## Implementation Order

1. Settings Types Update
   - Add new fields to interfaces with JSDoc comments
   - Update default settings
   - Add type safety checks

2. File Service Enhancement
   - Add exportDefaultPrompt method
   - Add readCustomPrompt method
   - Add validatePromptPath method
   - Add error handling for file operations

3. Settings Store Updates
   - Add updatePromptSettings method
   - Update types and method signatures
   - Add path validation
   - Add automatic disabling of custom prompt on errors

4. UI Components Update
   - Add export button
   - Add file picker for custom prompt
   - Add toggle for custom/default prompt
   - Add error handling and notifications
   - Implement user feedback through Notice
   - Add toggle state reversion on errors

5. Service Integration
   - Update prompt handling in TLDRService
   - Add getPrompt method with logging
   - Modify callAnthropicAPI to use dynamic prompts
   - Add fallback to default prompt
   - Add debug logging for prompt operations
   - Add automatic settings updates on errors
   - Add prompt-specific error handling

## Testing Plan

1. Settings Persistence
   - Verify new settings are saved correctly
   - Verify settings survive plugin reload
   - Test validation of prompt file paths
   - Verify JSDoc comments appear in IDE

2. File Operations
   - Test default prompt export
     * Verify content is properly formatted (no TS syntax)
     * Check file creation in correct location
   - Test custom prompt reading
     * Verify handling of invalid file paths
     * Test with empty files
     * Test with non-.md files
   - Verify file path validation
     * Test with various invalid paths
     * Test with non-existent files

3. UI Functionality
   - Test export button
     * Verify success notification
     * Verify error handling
   - Test file picker
     * Verify only .md files are shown
     * Test selection updates settings
   - Test toggle behavior
     * Verify state persistence
     * Check notifications
     * Verify toggle reverts on errors
   - Verify error notifications
     * Test all error scenarios
     * Verify messages are clear and helpful

4. Integration
   - Test prompt switching
     * Verify correct prompt is used
     * Check fallback behavior
     * Verify settings update on errors
     * Test prompt loading in API calls
   - Test with invalid file paths
     * Verify graceful fallback to default
     * Check error logging
     * Verify automatic disabling of custom prompt
   - Test notification system
     * Verify all user actions have feedback
     * Check error message clarity
   - Test type safety
     * Verify TypeScript compiler catches type errors
     * Check IDE autocompletion with JSDoc
   - Test API Integration
     * Verify prompt is correctly included in API requests
     * Check error handling for prompt-related API issues
     * Verify debug logging for API calls with custom prompts
   - Test Debug Logging
     * Verify all prompt-related operations are logged
     * Check error logging includes relevant context
     * Verify logging follows existing patterns

## Error Handling Strategy

1. Prompt Loading Errors
   - Invalid file path
   - Empty prompt file
   - File permission issues
   - Non-markdown files

2. Settings Update Errors
   - Invalid path validation
   - File access errors
   - Settings persistence issues

3. API Integration Errors
   - Prompt formatting issues
   - Token limit exceeded
   - API response errors

4. Recovery Mechanisms
   - Automatic fallback to default prompt
   - Settings reversion on errors
   - Clear user notifications
   - Detailed error logging

## Debug Logging Strategy

1. Prompt Operations
   - Log prompt source (default/custom)
   - Log prompt loading attempts
   - Log prompt validation results
   - Log prompt switching events

2. Settings Changes
   - Log settings updates
   - Log validation results
   - Log automatic settings reversions

3. API Integration
   - Log prompt usage in API calls
   - Log token usage with custom prompts
   - Log any prompt-related API issues

4. Error Scenarios
   - Log detailed error context
   - Log recovery actions
   - Log fallback operations
