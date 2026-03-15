---
name: api-review
description: Review API endpoints, routes, and request handlers for security, performance, error handling, and best practices. Use when reviewing API code, creating new endpoints, checking authentication, or auditing API security. Covers Next.js API routes and Supabase integration.
allowed-tools: Read, Grep, Glob
---

# API Review

Comprehensive review of API endpoints and request handlers.

## Instructions

### Review Checklist

When reviewing API code, systematically check:

1. **Authentication & Authorization**
2. **Input Validation**
3. **Error Handling**
4. **Security**
5. **Performance**
6. **Response Format**
7. **Documentation**

### 1. Authentication & Authorization

**Check for**:
- Authentication verification at start of handler
- Proper session/token validation
- Authorization checks (user permissions)
- Protected routes implementation

**Good Patterns**:
```typescript
// Next.js API Route
export async function POST(request: Request) {
  // Verify authentication first
  const supabase = createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify authorization
  if (!hasPermission(user, 'resource:write')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Process request...
}
```

**Red Flags**:
- Missing authentication checks
- Hardcoded credentials
- Admin endpoints without proper guards
- Client-side only security

### 2. Input Validation

**Check for**:
- All inputs validated before use
- Type checking and sanitization
- Schema validation (Zod, Yup, etc.)
- SQL injection protection
- XSS prevention

**Good Patterns**:
```typescript
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  age: z.number().min(0).max(120),
  name: z.string().min(1).max(100)
})

export async function POST(request: Request) {
  const body = await request.json()

  // Validate input
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: result.error },
      { status: 400 }
    )
  }

  // Use validated data
  const { email, age, name } = result.data
}
```

**Red Flags**:
- Direct use of user input without validation
- Type coercion without checking
- Missing length/range checks
- No sanitization of HTML/SQL

### 3. Error Handling

**Check for**:
- Try-catch blocks around risky operations
- Proper error messages (no stack traces to client)
- Appropriate HTTP status codes
- Error logging for debugging

**Good Patterns**:
```typescript
export async function GET(request: Request) {
  try {
    const data = await fetchData()
    return NextResponse.json(data)
  } catch (error) {
    // Log full error server-side
    console.error('API Error:', error)

    // Return safe error to client
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Red Flags**:
- Unhandled promise rejections
- Exposing stack traces to client
- Generic error messages without logging
- Wrong HTTP status codes

### 4. Security

**Check for**:
- CORS configuration
- Rate limiting
- SQL injection prevention (use parameterized queries)
- XSS protection
- CSRF tokens where needed
- Sensitive data in logs

**Good Patterns**:
```typescript
// Use Supabase client (prevents SQL injection)
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId) // Parameterized

// Rate limiting
export const config = {
  runtime: 'edge',
  maxDuration: 5
}

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}
```

**Red Flags**:
- String concatenation in SQL queries
- Credentials in code or logs
- Missing rate limiting on public endpoints
- Wide-open CORS (`*`)
- Sensitive data in response without need

### 5. Performance

**Check for**:
- Efficient database queries
- Proper indexing usage
- Caching where appropriate
- Pagination for large datasets
- N+1 query problems

**Good Patterns**:
```typescript
// Pagination
const limit = 20
const offset = page * limit

const { data } = await supabase
  .from('posts')
  .select('*')
  .range(offset, offset + limit - 1)

// Select only needed fields
const { data } = await supabase
  .from('users')
  .select('id, name, email') // Not SELECT *

// Use indexes
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('user_id', userId) // Should have index on user_id
```

**Red Flags**:
- SELECT * on large tables
- No pagination
- Queries in loops (N+1)
- Missing database indexes
- Synchronous operations blocking

### 6. Response Format

**Check for**:
- Consistent response structure
- Appropriate status codes
- Proper content-type headers
- No sensitive data leakage

**Good Patterns**:
```typescript
// Success response
return NextResponse.json({
  data: result,
  meta: { page, total }
}, { status: 200 })

// Error response
return NextResponse.json({
  error: 'Resource not found',
  code: 'NOT_FOUND'
}, { status: 404 })

// Use proper status codes
200 - OK
201 - Created
400 - Bad Request
401 - Unauthorized
403 - Forbidden
404 - Not Found
500 - Internal Server Error
```

**Red Flags**:
- Inconsistent response format
- Always returning 200
- Exposing internal IDs
- Missing pagination metadata

### 7. Documentation

**Check for**:
- JSDoc comments on handlers
- API documentation (OpenAPI/Swagger)
- Request/response examples
- Required permissions noted

**Good Patterns**:
```typescript
/**
 * Create a new post
 *
 * @route POST /api/posts
 * @auth Required
 * @permissions post:create
 *
 * @body {string} title - Post title (max 200 chars)
 * @body {string} content - Post content
 *
 * @returns {Object} Created post with ID
 * @throws {401} If not authenticated
 * @throws {400} If validation fails
 */
export async function POST(request: Request) {
  // ...
}
```

## Review Process

1. **Read the endpoint code**
   - Use Read tool to examine handler
   - Note dependencies and imports

2. **Check against checklist**
   - Go through each security/quality item
   - Flag issues with severity (Critical/High/Medium/Low)

3. **Suggest improvements**
   - Provide specific code examples
   - Explain why change is needed
   - Consider backward compatibility

4. **Verify tests exist**
   - Check for unit/integration tests
   - Suggest test cases if missing

## Common Issues by Framework

### Next.js API Routes

**Check**:
- Using `NextResponse` for responses
- Proper route file naming (route.ts)
- Edge runtime for performance-critical routes
- Middleware for common logic

### Supabase Integration

**Check**:
- Using server client (not anon client)
- RLS policies enabled on tables
- Proper auth context passed
- Connection pooling configured

## Examples

**User asks**: "Review this API endpoint"

I will:
1. Read the endpoint code
2. Check all 7 review categories
3. Identify security issues (priority)
4. Note performance concerns
5. Suggest specific improvements with code examples
6. Flag missing tests
7. Provide severity ratings for issues

**User asks**: "Is this endpoint secure?"

I will:
1. Focus on security checklist items
2. Check auth/authorization
3. Review input validation
4. Look for injection vulnerabilities
5. Verify error handling doesn't leak info
6. Check for common OWASP issues
7. Provide actionable security recommendations

## Red Flag Keywords

When scanning code, watch for:
- `eval()`
- String concatenation in SQL
- `dangerouslySetInnerHTML`
- Hardcoded secrets/keys
- `SELECT *`
- Missing `try-catch`
- `any` types everywhere
- No input validation
- CORS: `*`
- Admin checks on client side only
