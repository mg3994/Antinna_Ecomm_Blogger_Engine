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
      const scriptMatch = input.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
      let jsonContent = scriptMatch ? scriptMatch[1] : input;

      let decoded = this.decodeEntities(jsonContent);

      const cleaned = decoded
        .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "$1")
        .trim();

      try {
        return JSON.parse(cleaned) as T;
      } catch (e) {
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

  static findMatchingVariant(parent: any, selectedAttributes: Record<string, string>, lastClickedAttr: string | null = null): any {
    if (!parent) return null;
    const variants = parent.hasVariant || [parent];

    // 1. Try exact match for all selected attributes
    let match = variants.find((v: any) =>
      Object.entries(selectedAttributes).every(([k, val]) => String(v[k]) === String(val))
    );

    // 2. Fallback: Match based on the last clicked attribute if no exact match for all
    if (!match && lastClickedAttr) {
      match = variants.find((v: any) => String(v[lastClickedAttr]) === String(selectedAttributes[lastClickedAttr]));
    }

    // 3. Last fallback: return the first variant
    return match || variants[0];
  }

  static findMatchingServicePackage(parent: any, packageName: string): any {
      if (!parent?.hasOfferCatalog?.itemListElement) return null;
      return parent.hasOfferCatalog.itemListElement.find((off: any) => {
          const name = off.itemOffered?.name || off.name;
          return String(name) === String(packageName);
      });
  }
}
