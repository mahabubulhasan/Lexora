# Lexora E-Book Reader - AI Coding Instructions

## Architecture Overview

Lexora is a modular e-book rendering library forked from foliate-js. The architecture follows a **loader-renderer-view** pattern:

- **Loaders** (`epub.js`, `mobi.js`, `fb2.js`, `comic-book.js`, `pdf.js`) - Parse formats and implement the "book" interface
- **Renderers** (`paginator.js`, `fixed-layout.js`) - Handle pagination and implement the "renderer" interface
- **View** (`view.js`) - Main orchestrator custom element `<foliate-view>` that coordinates loaders and renderers
- **Reader** (`reader.js`, `reader.html`) - High-level UI application using the library

## Key Patterns

### File Format Detection & Loading
File type detection uses magic bytes in `view.js`:
```javascript
const isZip = async file => {
    const arr = new Uint8Array(await file.slice(0, 4).arrayBuffer())
    return arr[0] === 0x50 && arr[1] === 0x4b && arr[2] === 0x03 && arr[3] === 0x04
}
```

### Book Interface Contract
All format loaders must implement:
- `.sections[]` with `.load()`, `.createDocument()`, `.size` properties
- `.metadata`, `.toc`, `.dir` for book navigation
- `.resolveHref()` and optional `.resolveCFI()` for internal linking

### Custom Element Pattern
Main entry point is `<foliate-view>` custom element defined in `view.js`:
```javascript
const view = document.createElement('foliate-view')
await view.open('example.epub')
view.addEventListener('relocate', e => console.log(e.detail))
```

### Zip-based Formats
EPUB/CBZ use loader interface with `zip.js`:
```javascript
const loader = { loadText, loadBlob, getSize, entries }
// Loaders expect this interface, implemented in makeZipLoader()
```

### Event-Driven Architecture
Critical events: `'load'`, `'relocate'`, `'create-overlay'`, `'draw-annotation'`
Custom event pattern: `this.dispatchEvent(new CustomEvent('relocate', { detail }))`

## Development Workflow

### Build System
- **Development**: Serve files directly (no build step needed - native ES modules)
- **Production**: `npm run build` (Rollup bundles vendor dependencies only)
- **Dependencies**: Vendors `zip.js`, `fflate`, and PDF.js into `/vendor/`

### Testing
- Basic test runner: Open `/tests/tests.html` in browser
- Primary test coverage in `tests/epubcfi-tests.js`
- No automated test runner - manual browser testing required

### Local Storage Patterns
Recent history uses specific key pattern:
```javascript
localStorage.getItem('lexora-recent-books') // Array of book metadata
```

## UI/Styling Conventions

### CSS Organization
- Inline styles in `index.html` with CSS custom properties for theming
- Responsive breakpoints in `@media (max-width: 600px)`
- Glass-morphism pattern: `background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(10px)`

### DOM Selection Pattern
Consistent use of: `const $ = document.querySelector.bind(document)`

### Event Delegation
Always use `e.stopPropagation()` for nested clickable elements:
```javascript
item.addEventListener('click', (e) => {
    if (e.target.closest('.delete-btn')) return
    // handle main click
})
```

## Critical Dependencies

- **zip.js**: Random access zip reading (required for EPUB/CBZ)
- **fflate**: Font decompression (required for KF8/MOBI fonts)
- **PDF.js**: PDF rendering support (optional)

## Security Considerations

CSP is **mandatory** - EPUB files can contain scripts. Default CSP in `index.html`:
```
script-src 'self'; style-src 'self' blob: 'unsafe-inline'
```

Never trust e-book content - all user content should be sandboxed in iframes with restricted permissions.

## Navigation Patterns

CFI (Canonical Fragment Identifier) is the primary navigation system:
- Import CFI utilities: `import * as CFI from './epubcfi.js'`
- Use `book.resolveCFI(cfi)` and `book.resolveHref(href)` for navigation
- Progress tracking through `TOCProgress` and `SectionProgress` classes

## Common Gotchas

- File objects vs URL strings require different handling in history system
- Blob URLs must be revoked to prevent memory leaks: `URL.revokeObjectURL()`
- Format detection should happen before assuming loader interface
- Mobile Safari requires touch event handling for overlay interactions

## Use live preview for ui testing
which is running at http://127.0.0.1:3000/