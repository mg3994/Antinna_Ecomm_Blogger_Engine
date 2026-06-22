# Antinna Engine Documentation Index

Welcome to the Antinna Engine technical documentation. This engine is designed to transform Blogger posts into a fully functional e-commerce or service provider platform using strictly-typed Schema.org JSON-LD.

## Table of Contents

1.  **[Integration Guide](integration.md)**
    *   How to add the engine to your Blogger XML template (IIFE and ESM methods).
2.  **[Architecture & Design](architecture.md)**
    *   Details on Clean Architecture, SOLID principles, and project structure.
3.  **[Schema.org Compliance](schema-compliance.md)**
    *   How we strictly follow the Schema.org specification for Products and Services.
4.  **[Google Pay Integration](google-pay.md)**
    *   Setup for Google Pay UPI India (Tez) with VPA and MCC details.
5.  **[Blogger Pagination](pagination.md)**
    *   Using the Blogger Feed API for dynamic post loading and infinite scroll.

---

## Quick Start for Developers

To build the project locally:

```bash
# Install dependencies
npm install

# Build production bundles (dist/)
npm run build

# Run unit tests
npm run test
```
