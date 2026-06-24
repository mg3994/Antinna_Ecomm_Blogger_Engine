import { SchemaExtractor } from '../core/SchemaExtractor';

export class BloggerDataService {
  async fetchFeedData(maxResults: number = 50, startIndex: number = 1, labels: string | string[] = '', searchQuery: string = ''): Promise<{ entries: any[], totalResults: number }> {
    let labelPath = '';

    if (labels) {
        const labelsArray = Array.isArray(labels) ? labels : [labels];
        const filteredLabels = labelsArray.filter(l => l.trim() !== '');
        if (filteredLabels.length > 0) {
            const encodedLabels = filteredLabels.map(l => encodeURIComponent(l.trim())).join(',');
            labelPath = `/-/${encodedLabels}`;
        }
    }

    let feedUrl = `/feeds/posts/default${labelPath}?alt=json&max-results=${maxResults}&start-index=${startIndex}`;

    if (searchQuery) {
        feedUrl += `&q=${encodeURIComponent(searchQuery)}`;
    }

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
