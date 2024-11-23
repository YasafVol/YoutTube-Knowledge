import { request } from "obsidian";

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
    private static readonly INTERVAL_SECONDS = 30;
    private static readonly LANGUAGE_CODE = 'en';

    /**
     * Fetches transcript from YouTube and processes it into 30-second intervals
     * @param cleanURL - The validated YouTube URL
     * @returns Formatted transcript text
     */
    public static async fetchTranscript(cleanURL: string): Promise<string> {
        try {
            console.log('YouTubeService: Fetching transcript for URL:', cleanURL);
            const response = await this.getTranscriptData(cleanURL);
            const formattedTranscript = this.formatTranscript(response.lines);
            console.log('YouTubeService: Successfully fetched transcript:', {
                title: response.title,
                transcript: formattedTranscript
            });
            return formattedTranscript;
        } catch (error) {
            const errorMessage = `Failed to fetch transcript: ${error.message}`;
            console.error('YouTubeService Error:', errorMessage);
            throw new Error(errorMessage);
        }
    }

    private static async getTranscriptData(url: string): Promise<TranscriptResponse> {
        const videoPageBody = await request(url);
        const parser = new DOMParser();
        const doc = parser.parseFromString(videoPageBody, 'text/html');

        const scripts = Array.from(doc.getElementsByTagName("script"));
        const playerScript = scripts.find((script: HTMLScriptElement) =>
            script.textContent?.includes("var ytInitialPlayerResponse = {")
        );

        if (!playerScript?.textContent) {
            console.error('YouTubeService: Could not find YouTube player data');
            throw new Error("Could not find YouTube player data");
        }

        const dataString = playerScript.textContent
            .split("var ytInitialPlayerResponse = ")[1]
            ?.split("};")[0] + "}";

        const data = JSON.parse(dataString.trim());
        const captionTracks: CaptionTrack[] = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
        
        console.log('YouTubeService: Available caption tracks:', captionTracks);
        
        const englishTrack = captionTracks.find((track) => 
            track.languageCode.includes(this.LANGUAGE_CODE)
        ) ?? captionTracks[0];

        if (!englishTrack) {
            console.error('YouTubeService: No English captions available');
            throw new Error("No English captions available");
        }

        console.log('YouTubeService: Selected caption track:', englishTrack);

        const captionsUrl = englishTrack.baseUrl.startsWith("https://")
            ? englishTrack.baseUrl
            : "https://www.youtube.com" + englishTrack.baseUrl;

        const captionsResponse = await request(captionsUrl);
        const captionsDoc = parser.parseFromString(captionsResponse, 'text/xml');
        const textElements = captionsDoc.getElementsByTagName("text");

        const title = this.extractTitle(doc);
        console.log('YouTubeService: Extracted video title:', title);

        return {
            title,
            lines: Array.from(textElements).map(this.parseTranscriptLine)
        };
    }

    private static extractTitle(doc: Document): string {
        const titleMeta = doc.querySelector('meta[name="title"]');
        return titleMeta?.getAttribute("content") || "";
    }

    private static parseTranscriptLine(element: Element): TranscriptLine {
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

    private static formatTranscript(lines: TranscriptLine[]): string {
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

    private static formatTimestamp(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
    }
}
