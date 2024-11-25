# YouTube Knowledge Plugin for Obsidian

This plugin enhances your note-taking experience in Obsidian by automatically saving YouTube video transcripts and generating AI-powered summaries using the Anthropic Claude API.

## Features

- **Transcript Extraction**: Automatically saves YouTube video transcripts to your vault
- **AI-Powered Summaries**: Generates comprehensive summaries of video content using Anthropic's Claude AI
- **Multiple Video Format Support**: Works with various YouTube URL formats:
  - Standard YouTube URLs
  - YouTube Shorts
  - Embedded videos
  - Mobile URLs

## Requirements

- Obsidian v0.1.0 or higher
- An Anthropic API key
- Desktop installation of Obsidian (mobile not supported)

## Installation

1. Open Obsidian Settings
2. Navigate to Community Plugins and disable Safe Mode
3. Click Browse and search for "YouTube Knowledge"
4. Install the plugin
5. Enable the plugin in your list of installed plugins

## Configuration

### YouTube Settings
- **Language**: Set your preferred transcript language (default: 'en')
- **Timeframe**: Set the timeframe in seconds for transcript segmentation (default: 60)

### LLM Settings
- **Anthropic API Key**: Your Claude API key (required)
- **Summary Prompt**: Customize the prompt used for generating summaries
- **Model Selection**: Choose from available Claude models:
  - Claude 3.5 Sonnet (default)
  - Claude 3.5 Haiku
  - Claude 3 Opus
  - Claude 3 Sonnet
  - Claude 3 Haiku

## Usage

1. Copy a YouTube video URL
2. Use the plugin command in Obsidian
3. The plugin will:
   - Extract the video transcript
   - Save it as a markdown file in your vault
   - Generate an AI summary in a separate file
   - Link the summary to the transcript using Obsidian's wiki-links

## Cost Information

The plugin uses Anthropic's Claude API for generating summaries. Costs vary by model:

- **Claude 3.5 Sonnet/Opus**:
  - Input: $0.015 per 1K tokens
  - Output: $0.075 per 1K tokens
- **Claude 3.5 Haiku**:
  - Input: $0.003 per 1K tokens
  - Output: $0.015 per 1K tokens

The exact cost per summary will depend on the length of the video transcript and the generated summary.

## Support

For bug reports and feature requests, please visit the [GitHub repository](https://github.com/YasafVol/Youtube-knowledge).

## Credits

Created by [YasafVol](https://github.com/YasafVol)

## License

This project is licensed under the MIT License.
