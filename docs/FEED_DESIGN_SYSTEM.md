# Feed Design System: Compact Government-Style Minimalism

The feed pages employ a hyper-compact, flat design aesthetic inspired by minimalist government websites—prioritizing information density and functional clarity over visual flourish. Every element is reduced to its essential form: small typography, tight spacing, flat borders, and minimal visual hierarchy create a utilitarian interface that maximizes content visibility while maintaining readability. This design philosophy treats whitespace as a structural element rather than decoration, using consistent micro-spacing (3px gaps, 10px padding) to create rhythm without waste. The result is a dense, scannable interface that feels authoritative and efficient—like a well-organized municipal website where every pixel serves a purpose.

## Core Design Principles

• **Micro-spacing**: Use `gap-2` (8px) or `gap-3` (12px) for element spacing, `p-[10px]` for card padding, and `space-y-3` (12px) for vertical stacks—never exceed these values unless absolutely necessary for touch targets

• **Minimal typography scale**: Primary text uses `text-xs` (12px), headings use `text-sm` (14px) with `font-semibold` or `font-medium`—avoid larger sizes except for page titles or critical CTAs

• **Flat borders and backgrounds**: Cards use `border border-gray-200` with `rounded-md` (6px radius), white backgrounds (`bg-white`), and subtle hover states (`hover:bg-gray-50`)—no shadows, gradients, or depth effects

• **Compact icons**: Icons are sized `w-3 h-3` (12px) or `w-4 h-4` (16px) maximum, with `text-gray-500` that transitions to `text-gray-700` on hover—maintain consistent icon-to-text spacing with `gap-1.5` or `gap-2`

• **Tight vertical rhythm**: Use `space-y-0.5` (2px) for tightly related elements, `space-y-1.5` (6px) for grouped items, and `space-y-3` (12px) for card sections—avoid larger vertical spacing that breaks the compact feel

• **Functional color palette**: Limit to `gray-50`, `gray-100`, `gray-200`, `gray-500`, `gray-600`, `gray-700`, `gray-900` with minimal accent colors—use `text-gray-600` for body text, `text-gray-900` for headings, and `text-gray-500` for metadata

• **Minimal interactive states**: Hover effects are subtle (`hover:bg-gray-50`, `hover:text-gray-900`) with `transition-colors`—no transforms, scale effects, or animations beyond color changes

