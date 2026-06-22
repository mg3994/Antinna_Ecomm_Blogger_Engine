# Antinna Engine Documentation Index

Welcome to the Antinna Engine technical documentation. This engine is designed to transform Blogger posts into a fully functional e-commerce or service provider platform using strictly-typed Schema.org JSON-LD.

## Table of Contents

### User & Integration
1.  **[Integration Guide](integration.md)**
    *   How to add the engine to your Blogger XML template (IIFE and ESM methods).
2.  **[Google Pay Integration](google-pay.md)**
    *   Setup for Google Pay UPI India (Tez) with VPA and MCC details.
3.  **[Blogger Pagination](pagination.md)**
    *   Using the Blogger Feed API for dynamic post loading and infinite scroll.

### Technical Reference
4.  **[API Reference](api-reference.md)**
    *   Detailed documentation for all classes, methods, and global helpers.
5.  **[Architecture & Design](architecture.md)**
    *   Details on Clean Architecture, SOLID principles, and project structure.
6.  **[State Management](state-management.md)**
    *   Explains the `AppState` and reactive data flow.
7.  **[UI Components](ui-components.md)**
    *   Details on rendering components and `UIManager` utilities.
8.  **[Schema.org Compliance](schema-compliance.md)**
    *   How we strictly follow the Schema.org specification for Products and Services.

### For Developers
9.  **[Development Guide](development-guide.md)**
    *   Build, test, and contribution workflows.

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
