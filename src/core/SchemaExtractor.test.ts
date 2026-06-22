import { describe, it, expect } from 'vitest';
import { SchemaExtractor } from '../core/SchemaExtractor';

describe('SchemaExtractor', () => {
  it('should extract JSON-LD from script tag', () => {
    const html = '<script type="application/ld+json">{"@type": "Product", "name": "Test"}</script>';
    const result = SchemaExtractor.extractJsonLd<any>(html);
    expect(result?.name).toBe('Test');
  });

  it('should extract raw JSON-LD', () => {
    const raw = '{"@type": "Service", "name": "Clean"}';
    const result = SchemaExtractor.extractJsonLd<any>(raw);
    expect(result?.name).toBe('Clean');
  });

  it('should decode HTML entities', () => {
    const raw = '{"name": "Price &amp; Quality"}';
    const result = SchemaExtractor.extractJsonLd<any>(raw);
    expect(result?.name).toBe('Price & Quality');
  });
});
