import { SchemaExtractor } from '../core/SchemaExtractor';

export class BloggerDataService {
  async fetchFeedData(maxResults: number = 50, startIndex: number = 1): Promise<{ entries: any[], totalResults: number }> {
    const feedUrl = `/feeds/posts/default?alt=json&max-results=${maxResults}&start-index=${startIndex}`;
    try {
      const res = await fetch(feedUrl);
      const data = await res.json();
      return {
        entries: data.feed.entry || [],
        totalResults: parseInt(data.feed.openSearch$totalResults?.$t || "0")
      };
    } catch (e) {
      console.error("Failed to fetch Blogger feed", e);
      return { entries: [], totalResults: 0 };
    }
  }

  extractSchemaFromEntry(entry: any): any | null {
    const content = entry.content?.$t || "";
    return SchemaExtractor.extractJsonLd(content);
  }
}
