import { Plugin, request } from "obsidian";
import { DebugLogger } from "../utils/debug";
import type { Settings } from "../types/settings";

export interface TranscriptLine {
    text: string;
    duration: number;
    offset: number;
}

export interface TranscriptResponse {
    title: string;
    lines: TranscriptLine[];
}

interface CaptionTrack {
    baseUrl: string;
    languageCode: string;
}

export class YouTubeService {
    private readonly INTERVAL_SECONDS = 30;
    private readonly LANGUAGE_CODE = 'en';
    private logger: DebugLogger;

    constructor(plugin: Plugin & { settings: Settings }) {
        this.logger = new DebugLogger(plugin);
    }

    /**
     * Fetches transcript from YouTube and processes it into 30-second intervals
     * @param cleanURL - The validated YouTube URL
     * @returns Formatted transcript text
     */
    public async fetchTranscript(cleanURL: string): Promise<string> {
        try {
            this.logger.log('Fetching transcript for URL:', cleanURL);
            const response = await this.getTranscriptData(cleanURL);
            const formattedTranscript = this.formatTranscript(response.lines);
            this.logger.log('Successfully fetched transcript:', {
                title: response.title,
                transcript: formattedTranscript
            });
            return formattedTranscript;
        } catch (error) {
            const errorMessage = `Failed to fetch transcript: ${error.message}`;
            this.logger.error('Error:', errorMessage);
            throw new Error(errorMessage);
        }
    }

    private async getTranscriptData(url: string): Promise<TranscriptResponse> {
        const videoPageBody = await request(url);
        const parser = new DOMParser();
        const doc = parser.parseFromString(videoPageBody, 'text/html');

        const scripts = Array.from(doc.getElementsByTagName("script"));
        const playerScript = scripts.find((script: HTMLScriptElement) =>
            script.textContent?.includes("var ytInitialPlayerResponse = {")
        );

        if (!playerScript?.textContent) {
            this.logger.error('Could not find YouTube player data');
            throw new Error("Could not find YouTube player data");
        }

        const dataString = playerScript.textContent
            .split("var ytInitialPlayerResponse = ")[1]
            ?.split("};")[0] + "}";

        const data = JSON.parse(dataString.trim());
        const captionTracks: CaptionTrack[] = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
        
        this.logger.log('Available caption tracks:', captionTracks);
        
        const englishTrack = captionTracks.find((track) => 
            track.languageCode.includes(this.LANGUAGE_CODE)
        ) ?? captionTracks[0];

        if (!englishTrack) {
            this.logger.error('No English captions available');
            throw new Error("No English captions available");
        }

        this.logger.log('Selected caption track:', englishTrack);

        const captionsUrl = englishTrack.baseUrl.startsWith("https://")
            ? englishTrack.baseUrl
            : "https://www.youtube.com" + englishTrack.baseUrl;

        const captionsResponse = await request(captionsUrl);
        const captionsDoc = parser.parseFromString(captionsResponse, 'text/xml');
        const textElements = captionsDoc.getElementsByTagName("text");

        const title = this.extractTitle(doc);
        this.logger.log('Extracted video title:', title);

        return {
            title,
            lines: Array.from(textElements).map(this.parseTranscriptLine)
        };
    }

    private extractTitle(doc: Document): string {
        const titleMeta = doc.querySelector('meta[name="title"]');
        return titleMeta?.getAttribute("content") || "";
    }

    private parseTranscriptLine(element: Element): TranscriptLine {
        const text = (element.textContent || "")
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">");

        return {
            text,
            duration: parseFloat(element.getAttribute("dur") || "0") * 1000,
            offset: parseFloat(element.getAttribute("start") || "0") * 1000
        };
    }

    private formatTranscript(lines: TranscriptLine[]): string {
        const intervals: { [key: number]: string[] } = {};
        
        // Group lines by 30-second intervals
        lines.forEach(line => {
            const intervalIndex = Math.floor(line.offset / (this.INTERVAL_SECONDS * 1000));
            if (!intervals[intervalIndex]) {
                intervals[intervalIndex] = [];
            }
            intervals[intervalIndex].push(line.text);
        });

        // Format the transcript with timestamps
        return Object.entries(intervals)
            .map(([interval, texts]) => {
                const timestamp = this.formatTimestamp(parseInt(interval) * this.INTERVAL_SECONDS);
                return `[${timestamp}]\n${texts.join(" ")}\n`;
            })
            .join("\n");
    }

    private formatTimestamp(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    }
}
