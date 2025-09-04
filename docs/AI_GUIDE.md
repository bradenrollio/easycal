# AI Development Guide for EasyCal

This document provides comprehensive guidance for AI agents working with the EasyCal codebase. It includes architecture overview, common patterns, and step-by-step workflows for typical development tasks.

## 🏗️ Architecture Overview

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │ Cloudflare      │    │  GoHighLevel    │
│   (Frontend)    │◄──►│ Functions       │◄──►│     API         │
│                 │    │ (Backend)       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Cloudflare    │    │   Cloudflare    │
│      D1         │    │      KV         │
│   (Database)    │    │   (Sessions)    │
└─────────────────┘    └─────────────────┘
```

### Technology Stack
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Cloudflare Pages Functions (serverless)
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Sessions**: Cloudflare KV
- **Jobs**: Cloudflare Queues
- **API Integration**: GoHighLevel API via official SDK

### Directory Structure
```
src/
├── app/                     # Next.js App Router pages
│   ├── (app)/              # Protected routes requiring auth
│   │   ├── calendars/      # Calendar management
│   │   ├── import/         # CSV import workflow
│   │   ├── settings/       # Brand/location settings
│   │   └── layout.tsx      # App layout with TopBar
│   ├── auth/               # Authentication routes
│   │   ├── install/        # OAuth initiation
│   │   └── callback/       # OAuth callback
│   └── layout.tsx          # Root layout
├── components/             # Reusable UI components
│   ├── ui/                 # Base UI components
│   ├── BrandConfig.tsx     # Brand configuration
│   ├── FieldMapper.tsx     # CSV field mapping
│   └── UploadDropzone.tsx  # File upload
├── lib/                    # Utilities and business logic
│   ├── auth/               # Authentication helpers
│   ├── db/                 # Database client and schema
│   ├── jobs/               # Background job processing
│   └── sdk/                # GoHighLevel API client
├── types/                  # TypeScript type definitions
└── functions/              # Cloudflare Functions (API routes)
    ├── api/                # API endpoints
    └── auth/               # OAuth handlers
```

## 🔑 Key Concepts

### 1. Multi-Tenant Architecture
- **Tenants**: Installing companies/agencies
- **Locations**: Sub-accounts within tenants
- **Tokens**: OAuth tokens stored per location (encrypted)

### 2. OAuth Flow
- Agency-level or location-level installation
- Token encryption using WebCrypto API
- Automatic token refresh handling

### 3. Calendar Management
- Bulk CSV import with field mapping
- Brand-aware calendar creation
- Schedule block parsing (e.g., "Mon 09:00-10:00; Wed 14:30-15:30")
- Slug generation with conflict resolution

### 4. Error Handling Pattern
```typescript
interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

## 🛠️ Common Development Tasks

### Adding a New API Endpoint

**Location**: `functions/api/[endpoint-name].js`

**Template**:
```javascript
/**
 * @fileoverview [Endpoint description]
 * @author AI Assistant
 */

/**
 * Main request handler for [endpoint purpose]
 * @param {Object} context - Cloudflare context
 * @param {Request} context.request - HTTP request
 * @param {Object} context.env - Environment variables
 * @returns {Promise<Response>} JSON response
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Extract parameters
    const locationId = url.searchParams.get('locationId');
    if (!locationId) {
      return createErrorResponse('Missing locationId parameter', 400, corsHeaders);
    }
    
    // Get authentication token
    const tokenData = await getLocationToken(locationId, env);
    if (!tokenData) {
      return createErrorResponse('Authentication required', 401, corsHeaders);
    }
    
    // Route by HTTP method
    switch (request.method) {
      case 'GET':
        return handleGet(request, tokenData, corsHeaders);
      case 'POST':
        return handlePost(request, tokenData, corsHeaders);
      default:
        return createErrorResponse('Method not allowed', 405, corsHeaders);
    }
  } catch (error) {
    console.error('[Endpoint] Error:', error);
    return createErrorResponse('Internal server error', 500, corsHeaders);
  }
}

/**
 * Create standardized error response
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {Object} headers - CORS headers
 * @returns {Response} Error response
 */
function createErrorResponse(message, status, headers) {
  return new Response(JSON.stringify({
    success: false,
    error: { message }
  }), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}
```

### Adding a New React Component

**Location**: `src/components/[ComponentName].tsx`

**Template**:
```typescript
/**
 * @fileoverview [Component description]
 * @author AI Assistant
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * Props for [ComponentName] component
 */
interface ComponentNameProps {
  /** Brief description of prop */
  propName: string;
  /** Optional prop with default */
  optionalProp?: boolean;
  /** Callback function */
  onAction?: (data: unknown) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * [Component description and purpose]
 * 
 * @param props - Component props
 * @returns JSX element
 * 
 * @example
 * ```tsx
 * <ComponentName 
 *   propName="value"
 *   onAction={(data) => console.log(data)}
 * />
 * ```
 */
export function ComponentName({
  propName,
  optionalProp = false,
  onAction,
  className
}: ComponentNameProps): JSX.Element {
  // State management
  const [state, setState] = useState<string>('');
  
  // Effects
  useEffect(() => {
    // Effect logic with cleanup
    return () => {
      // Cleanup
    };
  }, [propName]);
  
  // Event handlers
  const handleAction = (): void => {
    try {
      // Handle action
      onAction?.(state);
    } catch (error) {
      console.error('ComponentName action error:', error);
    }
  };
  
  return (
    <div className={cn('base-classes', className)}>
      {/* Component JSX */}
    </div>
  );
}
```

### Adding Database Operations

**Location**: `src/lib/db/operations/[entity].ts`

**Template**:
```typescript
/**
 * @fileoverview Database operations for [Entity]
 * @author AI Assistant
 */

import { eq, and, desc } from 'drizzle-orm';
import type { Database } from '@/lib/db/client';
import { entityTable, type Entity, type NewEntity } from '@/lib/db/schema';

/**
 * Create a new entity
 * @param db - Database client
 * @param data - Entity data
 * @returns Created entity
 */
export async function createEntity(
  db: Database, 
  data: NewEntity
): Promise<Entity> {
  try {
    const [entity] = await db
      .insert(entityTable)
      .values(data)
      .returning();
      
    if (!entity) {
      throw new Error('Failed to create entity');
    }
    
    return entity;
  } catch (error) {
    console.error('Database error creating entity:', error);
    throw error;
  }
}

/**
 * Get entity by ID
 * @param db - Database client
 * @param id - Entity ID
 * @returns Entity or null if not found
 */
export async function getEntityById(
  db: Database, 
  id: string
): Promise<Entity | null> {
  try {
    const [entity] = await db
      .select()
      .from(entityTable)
      .where(eq(entityTable.id, id))
      .limit(1);
      
    return entity ?? null;
  } catch (error) {
    console.error('Database error getting entity:', error);
    throw error;
  }
}
```

### Adding Type Definitions

**Location**: `src/types/[domain].ts`

**Template**:
```typescript
/**
 * @fileoverview Type definitions for [Domain]
 * @author AI Assistant
 */

/**
 * Base interface for [Entity]
 */
export interface BaseEntity {
  /** Unique identifier */
  id: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * [Entity] with all properties
 */
export interface Entity extends BaseEntity {
  /** Entity name */
  name: string;
  /** Entity description */
  description?: string;
  /** Whether entity is active */
  isActive: boolean;
}

/**
 * Data for creating new [Entity]
 */
export type NewEntity = Omit<Entity, keyof BaseEntity>;

/**
 * Data for updating [Entity]
 */
export type UpdateEntity = Partial<Omit<Entity, 'id' | 'createdAt'>>;

/**
 * API response wrapper
 */
export interface APIResponse<T = unknown> {
  /** Whether request succeeded */
  success: boolean;
  /** Response data (if successful) */
  data?: T;
  /** Error information (if failed) */
  error?: {
    /** Error code */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Additional error details */
    details?: unknown;
  };
}
```

## 🔍 Debugging and Troubleshooting

### Common Issues

1. **OAuth Token Issues**
   - Check token expiration in database
   - Verify encryption/decryption
   - Ensure correct scopes

2. **Database Connection Issues**
   - Verify D1 binding in wrangler.toml
   - Check schema migrations
   - Validate query syntax

3. **API Integration Issues**
   - Check GoHighLevel API version (2021-07-28)
   - Verify endpoint URLs
   - Check rate limiting

### Debugging Tools

1. **Console Logging Pattern**:
```typescript
console.log(`[${context}] ${message}:`, data);
```

2. **Error Context**:
```typescript
catch (error) {
  console.error(`[${functionName}] Error:`, {
    error: error.message,
    stack: error.stack,
    context: relevantContext
  });
  throw error;
}
```

## 🚀 Performance Best Practices

### 1. Database Queries
- Use indexes for frequently queried columns
- Limit result sets with `.limit()`
- Use prepared statements for repeated queries

### 2. API Calls
- Implement rate limiting (using Bottleneck)
- Use connection pooling
- Cache responses when appropriate

### 3. Frontend Performance
- Use React.memo for expensive components
- Implement lazy loading
- Optimize bundle size with dynamic imports

## 🧪 Testing Patterns

### Unit Test Template
```typescript
/**
 * @fileoverview Tests for [Module]
 */

import { describe, it, expect, vi } from 'vitest';
import { functionToTest } from './module';

describe('functionToTest', () => {
  it('should handle valid input correctly', () => {
    // Arrange
    const input = 'valid-input';
    const expected = 'expected-output';
    
    // Act
    const result = functionToTest(input);
    
    // Assert
    expect(result).toBe(expected);
  });
  
  it('should throw error for invalid input', () => {
    // Arrange
    const invalidInput = null;
    
    // Act & Assert
    expect(() => functionToTest(invalidInput)).toThrow();
  });
});
```

## 📝 Code Style Guidelines

### 1. Naming Conventions
- **Files**: kebab-case (`user-service.ts`)
- **Functions**: camelCase (`getUserById`)
- **Types/Interfaces**: PascalCase (`UserData`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)

### 2. Comment Style
- Use JSDoc for all public functions
- Include AI-OPTIMIZE comments for performance hints
- Add TODO comments with context

### 3. Import Organization
```typescript
// 1. Node.js built-ins
import { readFile } from 'fs/promises';

// 2. External libraries
import { drizzle } from 'drizzle-orm';

// 3. Internal modules
import { createDbClient } from '@/lib/db/client';
import type { User } from '@/types/user';
```

## 🔧 Environment Setup

### Required Environment Variables
```bash
# GoHighLevel API
HL_CLIENT_ID=your_client_id
HL_CLIENT_SECRET=your_client_secret
HL_PIT=your_private_integration_token

# App Configuration
APP_BASE_URL=https://your-domain.pages.dev
SESSION_SECRET=your_session_secret

# Cloudflare Bindings
D1_BINDING=DB
KV_BINDING=EASYCAL_SESSIONS
QUEUE_BINDING=EASYCAL_JOBS

# Encryption
ENCRYPTION_KEY=your_32_byte_base64_key
```

### Development Commands
```bash
# Development server
npm run dev

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Testing
npm test

# Database operations
npx drizzle-kit push    # Push schema changes
npx drizzle-kit studio  # Database GUI
```

---

## 🤖 AI-Specific Notes

### When Working with This Codebase:

1. **Always check types first** - This codebase uses strict TypeScript
2. **Follow the error handling patterns** - Use the APIResponse interface
3. **Respect the multi-tenant architecture** - Always validate locationId
4. **Use the existing utilities** - Check `/lib` before creating new functions
5. **Maintain JSDoc comments** - Essential for AI understanding
6. **Test database changes** - Use Drizzle Studio for verification

### AI-OPTIMIZE Comments:
Look for these throughout the codebase for performance improvement opportunities:
- `// AI-OPTIMIZE: Consider caching this result`
- `// AI-OPTIMIZE: Potential for parallel processing`
- `// AI-OPTIMIZE: Review query performance`

### Quick Reference:
- Database operations: `src/lib/db/`
- API endpoints: `functions/api/`
- Type definitions: `src/types/`
- UI components: `src/components/`
- Business logic: `src/lib/`
