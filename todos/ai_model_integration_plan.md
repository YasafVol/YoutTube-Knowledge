# AI Model Integration and API Restructuring Plan

## Overview
Add support for additional AI models (Deepseek, Gemini, OpenAI) and restructure the API architecture for better scalability. Implement persistent API key storage and optional cost tracking.

## 1. API Architecture Restructure

### New Directory Structure
```
src/apis/
  ├── BaseAPI.ts          # Abstract base class
  ├── AnthropicAPI.ts     # Existing Anthropic implementation
  ├── DeepseekAPI.ts      # New Deepseek implementation
  ├── GeminiAPI.ts        # New Gemini implementation
  ├── OpenAIAPI.ts        # New OpenAI implementation
  └── index.ts            # Exports and factory
```

### BaseAPI Abstract Class
```typescript
abstract class BaseAPI {
  protected apiKey: string;
  protected costTrackingEnabled: boolean;
  
  constructor(apiKey: string, costTrackingEnabled: boolean = false) {
    this.apiKey = apiKey;
    this.costTrackingEnabled = costTrackingEnabled;
  }

  abstract callAPI(content: string): Promise<{ summary: string; cost?: number }>;
  abstract getModelList(): string[];
  abstract getCostEstimate(content: string): number | null;
}
```

### Example Implementation (DeepseekAPI.ts)
```typescript
class DeepseekAPI extends BaseAPI {
  private static readonly BASE_URL = 'https://api.deepseek.com/v1';
  
  async callAPI(content: string): Promise<{ summary: string; cost?: number }> {
    const response = await requestUrl({
      url: `${DeepseekAPI.BASE_URL}/summarize`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        content,
        cost_tracking: this.costTrackingEnabled
      })
    });

    return {
      summary: response.data.summary,
      cost: this.costTrackingEnabled ? response.data.cost : undefined
    };
  }

  getModelList(): string[] {
    return ['deepseek-7b', 'deepseek-13b', 'deepseek-33b'];
  }

  getCostEstimate(content: string): number | null {
    if (!this.costTrackingEnabled) return null;
    return content.length * 0.00002; // Example cost calculation
  }
}
```

## 2. Settings Updates

### Update src/types/settings.ts
```typescript
interface ModelSettings {
  apiKey: string;
  costTrackingEnabled: boolean;
  selectedModel: string;
}

interface PluginSettings {
  // Existing settings...
  models: {
    anthropic: ModelSettings;
    deepseek: ModelSettings;
    gemini: ModelSettings;
    openai: ModelSettings;
  };
}
```

### Update DEFAULT_SETTINGS
```typescript
models: {
  anthropic: {
    apiKey: '',
    costTrackingEnabled: false,
    selectedModel: 'claude-2.1'
  },
  deepseek: {
    apiKey: '',
    costTrackingEnabled: false,
    selectedModel: 'deepseek-7b'
  },
  gemini: {
    apiKey: '',
    costTrackingEnabled: false,
    selectedModel: 'gemini-pro'
  },
  openai: {
    apiKey: '',
    costTrackingEnabled: false,
    selectedModel: 'gpt-4'
  }
}
```

## 3. API Factory Implementation

### src/apis/index.ts
```typescript
import { PluginSettings } from '../types/settings';
import { BaseAPI } from './BaseAPI';
import { AnthropicAPI } from './AnthropicAPI';
import { DeepseekAPI } from './DeepseekAPI';
import { GeminiAPI } from './GeminiAPI';
import { OpenAIAPI } from './OpenAIAPI';

export function createAPI(settings: PluginSettings, modelType: string): BaseAPI {
  switch(modelType) {
    case 'anthropic':
      return new AnthropicAPI(
        settings.models.anthropic.apiKey,
        settings.models.anthropic.costTrackingEnabled
      );
    case 'deepseek':
      return new DeepseekAPI(
        settings.models.deepseek.apiKey,
        settings.models.deepseek.costTrackingEnabled
      );
    case 'gemini':
      return new GeminiAPI(
        settings.models.gemini.apiKey,
        settings.models.gemini.costTrackingEnabled
      );
    case 'openai':
      return new OpenAIAPI(
        settings.models.openai.apiKey,
        settings.models.openai.costTrackingEnabled
      );
    default:
      throw new Error(`Unknown model type: ${modelType}`);
  }
}
```

## 4. UI Updates

### Update Settings UI
```typescript
// Model Selection Dropdown
new Setting(containerEl)
  .setName('Select Model')
  .setDesc('Choose which AI model to use')
  .addDropdown(dropdown => dropdown
    .addOption('anthropic', 'Anthropic')
    .addOption('deepseek', 'Deepseek')
    .addOption('gemini', 'Gemini')
    .addOption('openai', 'OpenAI')
    .setValue(settings.selectedModel)
    .onChange(async (value) => {
      await settingsStore.updateSettings({
        selectedModel: value
      });
    })
  );

// API Key Input
new Setting(containerEl)
  .setName('API Key')
  .setDesc('Enter your API key for the selected model')
  .addText(text => text
    .setPlaceholder('Enter API key')
    .setValue(settings.models[settings.selectedModel].apiKey)
    .onChange(async (value) => {
      await settingsStore.updateSettings({
        models: {
          ...settings.models,
          [settings.selectedModel]: {
            ...settings.models[settings.selectedModel],
            apiKey: value
          }
        }
      });
    })
  );

// Cost Tracking Toggle
new Setting(containerEl)
  .setName('Enable Cost Tracking')
  .setDesc('Track API usage costs')
  .addToggle(toggle => toggle
    .setValue(settings.models[settings.selectedModel].costTrackingEnabled)
    .onChange(async (value) => {
      await settingsStore.updateSettings({
        models: {
          ...settings.models,
          [settings.selectedModel]: {
            ...settings.models[settings.selectedModel],
            costTrackingEnabled: value
          }
        }
      });
    })
  );
```

## 5. Persistent Storage Implementation

### Update SettingsStore.ts
```typescript
class SettingsStore {
  // Existing methods...
  
  async updateModelSettings(
    modelType: string,
    settings: Partial<ModelSettings>
  ): Promise<void> {
    const currentSettings = this.getSettings();
    await this.saveSettings({
      ...currentSettings,
      models: {
        ...currentSettings.models,
        [modelType]: {
          ...currentSettings.models[modelType],
          ...settings
        }
      }
    });
  }
}
```

## Task Breakdown and Execution Strategy

### Single Task Feasibility Analysis
1. Total Estimated Tokens: ~10,500
2. Token Limits:
   - Single API Call: ~4000 tokens
   - Context Window: ~8000 tokens
3. Conclusion: Task must be broken into smaller chunks

### Recommended Execution Approach
1. Use the phased implementation plan as a roadmap
2. Focus on one phase at a time
3. Complete each phase as a separate task
4. Maintain context between tasks using the plan
5. Use the ripple effect considerations to track dependencies

### Phase Execution Order
1. Core API Restructure (First Priority)
2. Model Integration
3. Settings & UI
4. Security & Performance
5. Documentation & Testing

## Implementation Phases

### Phase 1: Core API Restructure (Estimated Tokens: 3500)
1. Create new API directory structure
2. Implement BaseAPI abstract class
3. Implement API factory
4. Update existing services to use new architecture
5. Refactor dependent services (TLDRService, FileService, etc.)
6. Update test files for core API changes

### Phase 2: Model Integration (Estimated Tokens: 2500)
1. Add Anthropic API implementation
2. Add Deepseek API implementation
3. Add Gemini API implementation
4. Add OpenAI API implementation
5. Update service integration points
6. Add model-specific tests
7. Update documentation for new models

### Phase 3: Settings & UI (Estimated Tokens: 2000)
1. Update settings types and defaults
2. Update UI components
3. Add persistent storage handling
4. Modify settings validation
5. Update settings tests
6. Add UI tests for new components

### Phase 4: Security & Performance (Estimated Tokens: 1500)
1. Implement API key encryption
2. Add rate limiting
3. Implement connection pooling
4. Add caching strategies
5. Update security tests
6. Add performance benchmarks
7. Modify error handling for security features

### Phase 5: Documentation & Testing (Estimated Tokens: 1000)
1. Create API key management guide
2. Document cost calculation methodology
3. Implement comprehensive testing
4. Create troubleshooting guide
5. Update developer documentation
6. Add integration tests
7. Update user documentation

## Ripple Effect Considerations
1. Dependent service modifications
2. Test file updates
3. Documentation updates
4. UI component changes
5. Configuration file adjustments
6. Build process modifications

## Token Management Strategy
1. Monitor token usage during implementation
2. Break down large tasks into smaller chunks
3. Use efficient coding patterns
4. Implement pagination for large responses
5. Optimize prompt engineering

## Testing Plan
1. API Implementation Tests
2. Settings Persistence Tests
3. UI Component Tests
4. Integration Tests
5. Error Handling Tests

## Error Handling Strategy
1. API Key Validation
2. Network Error Handling
3. Cost Tracking Errors
4. Model Selection Validation
5. Rate Limiting and Throttling
6. Model Switching During Operations
7. API Response Validation
8. Error Recovery Mechanisms

## Security Considerations
1. API Key Encryption in Storage
2. Secure Transmission of API Keys
3. Key Rotation Support
4. Access Control for Settings

## Performance Considerations
1. Rate Limiting Implementation
2. Connection Pooling
3. Caching Strategies
4. Load Testing Requirements

## Documentation Requirements
1. API Key Management Guide
2. Cost Calculation Methodology
3. Model Comparison Matrix
4. Troubleshooting Guide

## Future Enhancements
1. Add more AI models
2. Implement cost tracking dashboard
3. Add model performance metrics
4. Create model comparison feature
