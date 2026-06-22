import { SchemaExtractor } from '../core/SchemaExtractor';

export class BloggerDataService {
  async fetchFeedData(maxResults: number = 50): Promise<any[]> {
    const feedUrl = `/feeds/posts/default?alt=json&max-results=${maxResults}`;
    try {
      const res = await fetch(feedUrl);
      const data = await res.json();
      return data.feed.entry || [];
    } catch (e) {
      console.error("Failed to fetch Blogger feed", e);
      return [];
    }
  }

  extractSchemaFromEntry(entry: any): any | null {
    const content = entry.content?.$t || "";
    return SchemaExtractor.extractJsonLd(content);
  }
}
