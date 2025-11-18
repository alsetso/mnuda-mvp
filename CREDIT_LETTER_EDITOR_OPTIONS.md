# Credit Letter Editor - Rich Text Editor Options Review

## Current State

- **Database**: `content TEXT` column in `credit_letters` table
- **Current UI**: Plain textarea in modal
- **Storage**: Plain text only
- **Limitations**: No formatting, no rich content support

## Rich Text Editor Options

### 1. **TipTap** (Recommended ⭐)

**Pros:**
- Modern, headless, framework-agnostic
- Built on ProseMirror (battle-tested)
- Excellent TypeScript support
- Highly extensible with plugins
- Great documentation
- Active community
- Can output HTML, JSON, Markdown, or plain text
- Collaborative editing support available
- Mobile-friendly

**Cons:**
- Learning curve for advanced features
- Bundle size can grow with many plugins

**Installation:**
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
```

**Storage Format:** HTML or JSON (recommend JSON for better structure)

**Best For:** Production-ready, feature-rich editor with good balance

---

### 2. **Lexical** (Facebook/Meta)

**Pros:**
- Modern, performant
- Built by Facebook/Meta
- Excellent accessibility
- Strong TypeScript support
- Modular architecture
- Good for complex documents

**Cons:**
- Newer, smaller community
- Less documentation/examples
- Steeper learning curve
- More setup required

**Installation:**
```bash
npm install lexical @lexical/react @lexical/rich-text
```

**Storage Format:** JSON (structured)

**Best For:** Complex documents, when you need maximum control

---

### 3. **Slate**

**Pros:**
- Mature, stable
- Highly customizable
- Good plugin ecosystem
- JSON-based storage

**Cons:**
- Older architecture
- More boilerplate code
- Less active development
- Steeper learning curve

**Installation:**
```bash
npm install slate slate-react
```

**Storage Format:** JSON

**Best For:** When you need maximum customization

---

### 4. **Quill**

**Pros:**
- Easy to use
- Good documentation
- Many plugins available
- Simple API

**Cons:**
- Less modern architecture
- Limited customization
- Delta format (proprietary)
- Less TypeScript support

**Installation:**
```bash
npm install react-quill
```

**Storage Format:** Delta (proprietary) or HTML

**Best For:** Quick implementation, simple use cases

---

### 5. **BlockNote** (Notion-style)

**Pros:**
- Notion-like block editor
- Modern React hooks API
- Built-in collaboration
- Good TypeScript support

**Cons:**
- Newer, smaller community
- Less flexible than TipTap/Lexical
- May be overkill for simple letters

**Installation:**
```bash
npm install @blocknote/core @blocknote/react
```

**Storage Format:** JSON (block-based)

**Best For:** Notion-style block editing experience

---

## Recommendation: **TipTap**

**Why TipTap:**
1. Best balance of features, ease of use, and community support
2. Excellent for document editing (letters, reports, etc.)
3. Can output clean HTML or structured JSON
4. Easy to extend with plugins (tables, images, etc.)
5. Good mobile support
6. Can add collaboration later if needed

---

## Backend Changes Required

### Option A: Store as HTML (Simpler)

**Migration:**
```sql
-- No migration needed - TEXT column can store HTML
-- Just update comment
COMMENT ON COLUMN public.credit_letters.content IS 'Rich text content stored as HTML';
```

**Pros:**
- No schema changes
- Easy to render (just use `dangerouslySetInnerHTML` or sanitize)
- Works with existing TEXT column

**Cons:**
- Harder to query/manipulate
- Less structured
- Potential XSS risks (need sanitization)

---

### Option B: Store as JSONB (Recommended)

**Migration:**
```sql
-- Add new column for rich content
ALTER TABLE public.credit_letters 
ADD COLUMN IF NOT EXISTS content_json JSONB;

-- Migrate existing content
UPDATE public.credit_letters 
SET content_json = jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
  jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(
    jsonb_build_object('type', 'text', 'text', content)
  ))
))
WHERE content IS NOT NULL AND content_json IS NULL;

-- Make content nullable (keep for backward compatibility)
ALTER TABLE public.credit_letters 
ALTER COLUMN content DROP NOT NULL;

-- Add index for JSON queries
CREATE INDEX IF NOT EXISTS idx_credit_letters_content_json 
ON public.credit_letters USING GIN (content_json);
```

**Pros:**
- Structured data
- Can query/manipulate JSON
- Better for versioning/history
- Can store metadata (formatting, etc.)
- More flexible

**Cons:**
- Requires migration
- Need to convert JSON to HTML for display
- Slightly more complex

---

### Option C: Dual Storage (Best of Both)

**Migration:**
```sql
-- Keep content TEXT for HTML rendering
-- Add content_json JSONB for structured data
ALTER TABLE public.credit_letters 
ADD COLUMN IF NOT EXISTS content_json JSONB;

-- Keep both: content (HTML) for display, content_json (JSON) for editing
```

**Pros:**
- HTML for quick rendering
- JSON for editing and structure
- Backward compatible
- Can sync both

**Cons:**
- More storage
- Need to keep both in sync

---

## Recommended Implementation Plan

### Phase 1: Basic Rich Text Editor
1. Install TipTap with starter kit
2. Store as HTML in existing `content` column
3. Add HTML sanitization (use `DOMPurify`)
4. Create `/credit/app/letters/new` page

### Phase 2: Enhanced Features
1. Add JSONB column for structured storage
2. Add plugins: tables, lists, links, images
3. Add export to PDF/Word
4. Add auto-save functionality

### Phase 3: Advanced Features
1. Version history
2. Templates
3. Collaboration (if needed)
4. Rich formatting toolbar

---

## Required Dependencies

```json
{
  "@tiptap/react": "^2.1.0",
  "@tiptap/starter-kit": "^2.1.0",
  "@tiptap/extension-placeholder": "^2.1.0",
  "@tiptap/extension-link": "^2.1.0",
  "@tiptap/extension-image": "^2.1.0",
  "@tiptap/extension-table": "^2.1.0",
  "dompurify": "^3.0.0",
  "@types/dompurify": "^3.0.0"
}
```

---

## Database Schema Update (Recommended)

```sql
-- Add JSONB column for structured content
ALTER TABLE public.credit_letters 
ADD COLUMN IF NOT EXISTS content_json JSONB;

-- Add index for JSON queries
CREATE INDEX IF NOT EXISTS idx_credit_letters_content_json 
ON public.credit_letters USING GIN (content_json);

-- Update comment
COMMENT ON COLUMN public.credit_letters.content IS 'HTML content for rendering (legacy/compatibility)';
COMMENT ON COLUMN public.credit_letters.content_json IS 'Structured JSON content from rich text editor';
```

---

## Security Considerations

1. **HTML Sanitization**: Always sanitize HTML before storing/rendering
   - Use `DOMPurify` or similar
   - Whitelist allowed tags/attributes

2. **Content Size Limits**: 
   - Add check constraint: `CHECK (char_length(content) <= 50000)` or similar
   - Consider TEXT vs VARCHAR limits

3. **XSS Prevention**: 
   - Never render unsanitized HTML
   - Use React's built-in escaping or DOMPurify

---

## Next Steps

1. **Choose editor**: TipTap (recommended)
2. **Choose storage**: Start with HTML, migrate to JSONB later
3. **Create new page**: `/credit/app/letters/new`
4. **Add sanitization**: Install and configure DOMPurify
5. **Update service**: Modify `CreditRestorationService` to handle HTML/JSON
6. **Update display**: Render HTML in letter list/detail views


