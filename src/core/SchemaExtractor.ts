export class SchemaExtractor {
  static decodeEntities(text: string): string {
    if (!text) return "";
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    let decoded = textarea.value;
    if (decoded.includes("&quot;")) {
        textarea.innerHTML = decoded;
        decoded = textarea.value;
    }
    return decoded;
  }

  static extractJsonLd<T>(input: string): T | null {
    if (!input) return null;

    try {
      // Try to find <script type="application/ld+json"> content
      const scriptMatch = input.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
      let jsonContent = scriptMatch ? scriptMatch[1] : input;

      let decoded = this.decodeEntities(jsonContent);

      // Clean up comments and handle potential parsing issues
      const cleaned = decoded
        .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "$1")
        .trim();

      try {
        return JSON.parse(cleaned) as T;
      } catch (e) {
        // Fallback: try to find anything that looks like a JSON object
        const objectMatch = cleaned.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          return JSON.parse(objectMatch[0]) as T;
        }
        return null;
      }
    } catch (e) {
      console.error("Failed to extract JSON-LD", e);
      return null;
    }
  }
}
