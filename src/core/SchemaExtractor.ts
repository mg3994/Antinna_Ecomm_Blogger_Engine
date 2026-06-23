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
        // Fallback: search for multiple objects if JSON.parse fails (e.g. trailing characters)
        const objectMatch = cleaned.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          try { return JSON.parse(objectMatch[0]) as T; } catch(e2) {}
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

    let match = variants.find((v: any) =>
      Object.entries(selectedAttributes).every(([k, val]) => String(v[k]) === String(val))
    );

    if (!match && lastClickedAttr) {
      match = variants.find((v: any) => String(v[lastClickedAttr]) === String(selectedAttributes[lastClickedAttr]));
    }

    return match || variants[0];
  }

  static normalizeName(name: string): string {
      return (name || '').toLowerCase().trim().replace(/\s+/g, ' ');
  }

  static findMatchingServicePackage(parent: any, packageName: string): any {
      if (!parent?.hasOfferCatalog?.itemListElement) return null;
      const normalizedSearch = this.normalizeName(packageName);

      return parent.hasOfferCatalog.itemListElement.find((off: any) => {
          const item = off.itemOffered || off;
          const name = item.name || off.name;
          return this.normalizeName(name) === normalizedSearch;
      });
  }

  static extractPrice(offer: any): { price: string, currency: string } {
      if (!offer) return { price: "0", currency: "INR" };

      const price = offer.price || offer.itemOffered?.offers?.price || offer.offers?.price || "0";
      const currency = offer.priceCurrency || offer.itemOffered?.offers?.priceCurrency || offer.offers?.priceCurrency || "INR";

      return { price: String(price), currency: String(currency) };
  }

  static extractAvailability(offer: any): string {
      if (!offer) return "https://schema.org/InStock";
      const av = offer.availability || offer.itemOffered?.offers?.availability || offer.offers?.availability || "https://schema.org/InStock";
      return String(av);
  }
}
