# Summary Mode Implementation Plan

## Overview
Add functionality to trigger summary mode from existing notes in Obsidian, allowing users to generate summaries based on note references and tags.

## Core Interfaces

```typescript
interface SummaryModeSettings {
  maxReferenceDepth: number;
  includeFrontmatter: boolean;
  tagFilters: {
    include: string[];
    exclude: string[];
  };
  summaryFormat: 'concise' | 'detailed';
  referenceProperty: string;
  maxTokensPerNote: number;
  preserveFormatting: boolean;
}

interface ReferenceChain {
  path: string[];
  depth: number;
  totalTokens: number;
}

interface TagProcessingResult {
  matchedNotes: string[];
  excludedNotes: string[];
  hierarchyMap: Map<string, string[]>;
}
```

## Implementation Tasks

### 1. Command Palette Integration
- [ ] Add new command to `main.ts`:
  ```typescript
  this.addCommand({
    id: 'trigger-summary-mode',
    name: 'Generate Summary from References and Tags',
    callback: () => this.triggerSummaryMode()
  });
  ```
- [ ] Create command handler in `src/services/summary/TLDRService.ts`:
  ```typescript
  async triggerSummaryMode(note: TFile) {
    const references = await this.referenceProcessor.processNote(note);
    const tags = await this.tagProcessor.processNote(note);
    return this.generateSummary(references, tags);
  }
  ```
- [ ] Add error handling for invalid note contexts
- [ ] Implement progress notification system using NotificationService

### 2. Property-Based Note References
- [ ] Create new service `src/services/summary/ReferenceProcessor.ts`:
  ```typescript
  class ReferenceProcessor {
    private visitedNotes: Set<string>;
    private referenceChains: Map<string, ReferenceChain>;
    
    async processNote(note: TFile, depth: number = 0): Promise<ProcessedReference[]>;
    private validateReferenceChain(chain: ReferenceChain): boolean;
    private extractReferences(frontmatter: any): string[];
  }
  ```
- [ ] Implement reference resolution methods:
  - parseNoteProperties(note: TFile): Promise<Record<string, any>>
  - resolveReference(ref: string): Promise<TFile | null>
  - validateDepth(chain: ReferenceChain): boolean
- [ ] Add circular reference detection:
  ```typescript
  private detectCircular(chain: ReferenceChain): boolean {
    const noteSet = new Set(chain.path);
    return noteSet.size !== chain.path.length;
  }
  ```
- [ ] Implement depth tracking and limiting mechanism

### 3. Tag-Based Processing
- [ ] Create new service `src/services/summary/TagProcessor.ts`:
  ```typescript
  class TagProcessor {
    private tagCache: Map<string, Set<string>>;
    
    async processNoteTags(note: TFile): Promise<string[]>;
    buildTagHierarchy(tags: string[]): Map<string, string[]>;
    filterNotesByTags(notes: TFile[], includeTags: string[], excludeTags: string[]): TFile[];
  }
  ```
- [ ] Implement tag extraction methods:
  - extractInlineTags(content: string): string[]
  - extractFrontmatterTags(frontmatter: any): string[]
  - mergeTagSets(inlineTags: string[], frontmatterTags: string[]): string[]
- [ ] Add tag hierarchy processing:
  ```typescript
  private buildHierarchy(tag: string): string[] {
    return tag.split('/').reduce((acc, part, i, arr) => {
      acc.push(arr.slice(0, i + 1).join('/'));
      return acc;
    }, [] as string[]);
  }
  ```

### 4. Settings Integration
- [ ] Update `src/types/settings.ts`:
  ```typescript
  interface PluginSettings extends SummaryModeSettings {
    // Existing settings...
    summaryMode: {
      enabled: boolean;
      defaultDepth: number;
      referenceProperty: string;
      tagProcessing: {
        enabled: boolean;
        includeHierarchy: boolean;
      };
    };
  }
  ```
- [ ] Add settings validation in `SettingsValidator.ts`:
  ```typescript
  validateSummarySettings(settings: SummaryModeSettings): ValidationResult {
    return {
      valid: boolean;
      errors: string[];
      warnings: string[];
    };
  }
  ```
- [ ] Create new settings component `src/ui/settings/components/SummaryModeSettings.ts`
- [ ] Add migration logic for existing settings

### 5. Summary Generation Enhancement
- [ ] Update `TLDRService.ts` with new methods:
  ```typescript
  class TLDRService {
    async generateCompositeSummary(notes: TFile[]): Promise<string>;
    private aggregateContent(notes: TFile[]): Promise<string>;
    private optimizeTokenUsage(content: string): string;
    private handleReferenceContext(refs: ProcessedReference[]): string;
  }
  ```
- [ ] Enhance prompt templates:
  ```typescript
  const SUMMARY_MODE_PROMPT = `
    Context: Processing multiple interconnected notes
    Reference Depth: {{depth}}
    Tag Context: {{tags}}
    
    Instructions:
    1. Analyze relationships between referenced notes
    2. Identify key themes and connections
    3. Generate coherent summary preserving critical details
    4. Maintain context from reference hierarchy
    
    Source Content:
    {{content}}
  `;
  ```
- [ ] Implement progress tracking:
  ```typescript
  class ProgressTracker {
    private total: number;
    private current: number;
    private statusBar: StatusBar;
    
    updateProgress(message: string): void;
    complete(): void;
  }
  ```

### 6. Testing
- [ ] Add unit tests for ReferenceProcessor:
  ```typescript
  describe('ReferenceProcessor', () => {
    test('handles circular references', async () => {});
    test('respects depth limits', async () => {});
    test('validates reference chains', async () => {});
  });
  ```
- [ ] Add integration tests:
  ```typescript
  describe('Summary Mode Integration', () => {
    test('processes complex note hierarchies', async () => {});
    test('handles tag filtering with references', async () => {});
    test('maintains performance with large datasets', async () => {});
  });
  ```
- [ ] Add performance benchmarks
- [ ] Create test fixtures for common note structures

### 7. Error Handling and Recovery
- [ ] Implement robust error handling:
  ```typescript
  class SummaryError extends Error {
    constructor(
      message: string,
      public readonly type: 'reference' | 'tag' | 'processing',
      public readonly context: any
    ) {
      super(message);
    }
  }
  ```
- [ ] Add recovery strategies:
  - Partial summary generation on reference failures
  - Fallback tag processing
  - Automatic depth reduction on timeout
- [ ] Implement logging system for debugging

### 8. Documentation
- [ ] Create technical documentation:
  - API references
  - Integration examples
  - Performance considerations
- [ ] Add user documentation:
  - Setup guide
  - Configuration examples
  - Best practices
- [ ] Create troubleshooting guide

## Technical Considerations
- Memory Management:
  ```typescript
  class ContentBuffer {
    private buffer: string[] = [];
    private currentSize: number = 0;
    
    append(content: string): void {
      // Implement efficient buffering
    }
    
    flush(): string {
      // Implement memory-efficient processing
    }
  }
  ```
- Performance Optimization:
  - Implement caching for frequently accessed notes
  - Use incremental processing for large reference chains
  - Optimize tag hierarchy calculations
- Error Boundaries:
  - Implement timeout mechanisms
  - Add memory usage monitoring
  - Create fallback processing options

## Dependencies
- Existing Services:
  - TLDRService: Content summarization
  - CostCalculationService: Token usage tracking
  - NotificationService: User feedback
  - AnthropicService: AI processing
- External Dependencies:
  - Obsidian API
  - Markdown processing
  - YAML frontmatter parsing

## Future Enhancements
- Implement caching system:
  ```typescript
  interface CacheEntry {
    summary: string;
    timestamp: number;
    dependencies: string[];
    invalidationRules: InvalidationRule[];
  }
  ```
- Add batch processing capabilities
- Create summary templates system
- Implement export functionality
- Add visualization for reference chains
- Create summary history tracking

## Performance Metrics
- Target processing times:
  - Single note: < 2s
  - Reference chain (depth 3): < 5s
  - Tag processing: < 1s
- Memory usage limits:
  - Peak: < 200MB
  - Sustained: < 100MB
- Token optimization targets:
  - 20% reduction in token usage
  - 90% context preservation

## Rollout Strategy
1. Alpha testing with limited reference depth
2. Beta testing with full feature set
3. Gradual increase in processing limits
4. Full release with monitoring
