# Recommended Project Architecture

## Current Issues
- Components scattered between `components/` and `features/*/components/`
- Unclear separation between shared and feature-specific code
- Mixing presentation and business logic in app directory
- Hard to determine what belongs where

## Proposed Structure (Single Domain)

```
src/
├── app/                          # Next.js App Router (routes only, minimal logic)
│   ├── (auth)/                   # Route groups for auth-protected routes
│   │   ├── dashboard/
│   │   ├── account/
│   │   └── workspace/
│   ├── (public)/                 # Public routes
│   │   ├── about/
│   │   ├── login/
│   │   └── page.tsx              # Homepage
│   ├── api/                      # API routes only
│   ├── layout.tsx                # Root layout
│   └── globals.css
│
├── modules/                      # Feature modules (organized by feature)
│   ├── auth/
│   │   ├── components/          # Auth-specific components
│   │   ├── hooks/               # Auth-specific hooks
│   │   ├── services/            # Auth business logic
│   │   ├── contexts/            # Auth contexts
│   │   ├── types.ts             # Auth types
│   │   └── index.ts              # Public API exports
│   │
│   ├── map/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── search/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   └── [other-features]/
│
├── shared/                       # Shared across features
│   ├── components/               # Reusable UI components
│   │   ├── ui/                  # Primitive components (Button, Input, etc.)
│   │   ├── layout/              # Layout components (PageLayout, Header, Footer)
│   │   └── feedback/           # Feedback components (Toast, Modal, etc.)
│   │
│   ├── hooks/                   # Shared hooks
│   ├── lib/                     # Shared utilities
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   └── validators.ts
│   │
│   ├── types/                   # Shared types
│   │   ├── common.ts
│   │   └── supabase.ts
│   │
│   └── constants/               # Shared constants
│
└── infrastructure/               # External integrations & configs
    ├── supabase/
    │   ├── client.ts
    │   ├── server.ts
    │   └── types.ts
    ├── stripe/
    │   └── client.ts
    ├── email/
    │   └── resend.ts
    └── api/                      # External API clients
        ├── zillow.ts
        └── skipTrace.ts
```

## Key Principles

### 1. **App Directory = Routes Only**
- Contains only Next.js route handlers (`page.tsx`, `layout.tsx`, `route.ts`)
- Minimal logic - delegates to modules
- Use route groups `(auth)`, `(public)` for organization
- Extract client components to `modules/` or `shared/components/`

### 2. **Modules = Feature Logic**
- Each module is self-contained
- Follows pattern: `components/`, `hooks/`, `services/`, `contexts/`, `types.ts`, `index.ts`
- Modules can import from `shared/` and `infrastructure/`
- Modules can import from other modules (but prefer shared when possible)

### 3. **Shared = Reusable Across Modules**
- `shared/components/` - Generic UI components used by multiple modules
- `shared/lib/` - Pure utility functions
- `shared/types/` - Common type definitions
- If it's used by 2+ modules, consider moving to shared

### 4. **Infrastructure = External Dependencies**
- All external service clients
- Database connections
- Third-party API wrappers
- Configuration that doesn't belong in modules

## Folder Rules

### `/app` - Routes Only
```typescript
// ✅ Good - Route handler only
// app/(public)/login/page.tsx
import { LoginForm } from '@/modules/auth';

export default function LoginPage() {
  return <LoginForm />;
}

// ❌ Bad - Business logic in route
export default function LoginPage() {
  const [email, setEmail] = useState('');
  // ... 50 lines of logic
}
```

### `/modules` - Feature Code
```typescript
// modules/auth/index.ts - Public API
export { AuthProvider, useAuth } from './contexts/AuthContext';
export { LoginForm } from './components/LoginForm';
export { login, logout } from './services/authService';
export type { User } from './types';

// modules/auth/components/LoginForm.tsx
'use client';
import { useAuth } from '../hooks/useAuth';
// Component implementation

// modules/auth/services/authService.ts
export async function login(email: string, password: string) {
  // Business logic
}
```

### `/shared` - Reusable Code
```typescript
// shared/components/ui/Button.tsx
// Generic button component

// shared/components/layout/PageLayout.tsx
// Layout wrapper used across routes

// shared/lib/utils.ts
export function formatDate(date: Date) {
  // Utility function
}
```

### `/infrastructure` - External Services
```typescript
// infrastructure/supabase/client.ts
export const supabase = createClient(...);

// infrastructure/api/zillow.ts
export async function searchZillow(address: string) {
  // External API call
}
```

## Migration Strategy

### Phase 1: Create New Structure
1. Create `modules/`, `shared/`, `infrastructure/` directories
2. Move `features/*` → `modules/*`
3. Consolidate `components/` → `shared/components/` or appropriate module
4. Move `lib/` → `infrastructure/` or `shared/lib/` based on purpose

### Phase 2: Reorganize Components
- **Module-specific components** → `modules/{module}/components/`
- **Shared UI primitives** → `shared/components/ui/`
- **Layout components** → `shared/components/layout/`
- **Feedback components** → `shared/components/feedback/`

### Phase 3: Clean Up App Directory
- Extract client components from `app/` to appropriate modules
- Keep only route handlers in `app/`
- Use route groups for better organization

## Benefits

1. **Clear Ownership**: Easy to find where code belongs
2. **Separation of Concerns**: Routes vs logic vs UI
3. **Reusability**: Shared components clearly identified
4. **Maintainability**: Changes isolated to modules
5. **Type Safety**: Clear import paths
6. **Scalability**: Easy to add new features without touching existing code

## Decision Tree

**Where does this code go?**

1. **Is it a route/page?** → `app/`
2. **Is it feature-specific logic/UI?** → `modules/{feature}/`
3. **Is it used by multiple modules?** → `shared/`
4. **Is it an external service client?** → `infrastructure/`
5. **Is it a reusable UI component?** → `shared/components/ui/` or `modules/{feature}/components/` if feature-specific

## Example Module Structure

```
modules/auth/
├── components/
│   ├── LoginForm.tsx
│   └── SignupForm.tsx
├── hooks/
│   └── useAuth.ts
├── services/
│   ├── authService.ts
│   └── emailVerificationService.ts
├── contexts/
│   └── AuthContext.tsx
├── types.ts
└── index.ts              # Public API - only export what's needed
```

## Import Path Examples

```typescript
// From app route
import { LoginForm } from '@/modules/auth';
import { PageLayout } from '@/shared/components/layout/PageLayout';
import { supabase } from '@/infrastructure/supabase/client';

// From module
import { Button } from '@/shared/components/ui/Button';
import { formatDate } from '@/shared/lib/utils';
import { supabase } from '@/infrastructure/supabase/client';

// From shared component
import { Button } from './ui/Button';  // Relative within shared
import { supabase } from '@/infrastructure/supabase/client';
```
