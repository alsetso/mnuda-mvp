# MNUDA Homepage Branding Guideline

## Analysis: New vs Old Sections

### SIMILARITIES
- ✅ White backgrounds (`bg-white`)
- ✅ Gray borders (`border-gray-200`)
- ✅ Black text for headings (`text-black`)
- ✅ Gray text for body (`text-gray-600`, `text-gray-700`)
- ✅ Blue accent links (`text-blue-600`)
- ✅ Consistent padding structure (`px-6 sm:px-8 lg:px-12`)
- ✅ Grid-based layouts
- ✅ Hover states with transitions

### DIFFERENCES

#### Typography
| Element | New Sections (1-3) | Old Sections (4-7) |
|---------|-------------------|-------------------|
| Heading Font | `font-bold` (sans-serif) | `font-medium` + `font-libre-baskerville` |
| Heading Tracking | None | `tracking-[-0.03em]` |
| Heading Style | Bold, tight | Medium, italic (Libre Baskerville) |
| Body Text Size | `text-lg` | `text-lg sm:text-xl` or `text-base` |

#### Spacing
| Element | New Sections | Old Sections |
|---------|-------------|--------------|
| Section Padding | `py-16` | `py-20` |
| Container Width | `max-w-6xl` | `max-w-7xl` |
| Grid Gap | `gap-12` | `gap-12 lg:gap-16` or `gap-8` |

#### Components
| Element | New Sections | Old Sections |
|---------|-------------|--------------|
| Tag Buttons | `rounded-full`, `px-4 py-2` | N/A |
| Cards | N/A | `rounded-xl`, `p-6`, `bg-gray-50` |
| Primary Buttons | `rounded-lg`, `bg-blue-600` | Links with arrows |

#### Borders
| Element | New Sections | Old Sections |
|---------|-------------|--------------|
| Tag Borders | `border border-gray-300` | N/A |
| Card Borders | N/A | `border border-gray-200` |
| Section Borders | `border-t border-gray-200` | `border-t border-gray-200` |

---

## CONSOLIDATED BRANDING GUIDELINE

### Typography System

#### Headings
```css
/* Primary Headings (H1) */
font-bold
text-4xl sm:text-5xl lg:text-6xl
text-black
leading-tight

/* Secondary Headings (H2) */
font-medium
font-libre-baskerville
text-3xl sm:text-4xl lg:text-5xl
text-black
tracking-[-0.03em]
leading-tight

/* Tertiary Headings (H3) */
font-medium
text-xl
text-black
```

#### Body Text
```css
/* Large Body */
text-lg sm:text-xl
text-gray-700
font-light
leading-relaxed

/* Standard Body */
text-base
text-gray-600
leading-relaxed

/* Small Body */
text-sm
text-gray-600
leading-relaxed
```

### Spacing System

```css
/* Section Padding */
py-16 (for interactive sections)
py-20 (for content sections)

/* Container Widths */
max-w-6xl (for interactive/CTA sections)
max-w-7xl (for content sections)

/* Grid Gaps */
gap-12 (standard)
gap-8 (tight grids)
```

### Color System

```css
/* Primary Colors */
Background: bg-white
Text Primary: text-black
Text Secondary: text-gray-700
Text Tertiary: text-gray-600
Accent: text-blue-600
Accent Hover: text-blue-700

/* Borders */
Standard: border-gray-200
Interactive: border-gray-300
Hover: border-gray-400

/* Cards */
Background: bg-gray-50
Border: border-gray-200
Hover Background: bg-gray-100
Hover Border: border-gray-300
```

### Component Styles

#### Buttons
```css
/* Primary Button */
bg-blue-600
hover:bg-blue-700
text-white
font-medium
px-6 py-4
rounded-lg

/* Secondary Button */
bg-white
border-2 border-gray-300
hover:border-gray-400
text-black
font-medium
px-6 py-4
rounded-lg

/* Tag Button */
bg-white
border border-gray-300
hover:border-gray-400
hover:bg-gray-50
text-black
font-medium
px-4 py-2
rounded-full
text-sm
```

#### Cards
```css
/* Standard Card */
bg-gray-50
border border-gray-200
hover:bg-gray-100
hover:border-gray-300
p-6
rounded-xl
transition-all duration-300
```

#### Links
```css
/* Text Link */
text-blue-600
font-medium
hover:text-blue-700
inline-flex items-center
[arrow icon with ml-1.5]
```

### Border Radius
```css
/* Buttons */
rounded-lg (primary/secondary)
rounded-full (tags)

/* Cards */
rounded-xl
```

---

## IMPLEMENTATION RECOMMENDATIONS

1. **Standardize Heading Styles**: Use `font-libre-baskerville` with `tracking-[-0.03em]` for all H2 headings to maintain brand consistency
2. **Unify Spacing**: Use `py-20` for all content sections, `py-16` only for interactive/CTA sections
3. **Consistent Container Widths**: Use `max-w-7xl` for content sections, `max-w-6xl` for interactive sections
4. **Standardize Grid Gaps**: Use `gap-12` as default, `gap-8` for tight grids
5. **Unified Card Style**: Apply `rounded-xl` with `bg-gray-50` and `border-gray-200` consistently
6. **Consistent Link Style**: All links should use `text-blue-600` with arrow icon


