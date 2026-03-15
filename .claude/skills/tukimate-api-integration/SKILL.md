---
name: tukimate-api-integration
description: |
  Guide for integrating external systems with the TukiMate API. Use this skill when the user wants to:
  - Send transcripts or conversations to TukiMate from external systems (Zoom, Fireflies, CRMs, etc.)
  - Query conversations, contacts, clients, projects, tags, sources, analyses, opportunities, teams, or categories
  - Trigger AI analysis on conversations or check analysis job status
  - Build integrations that consume the TukiMate REST API
  - Understand API authentication, endpoints, request/response formats

  Trigger phrases: "integrate with tukimate", "tukimate api", "send transcripts to tukimate", "query tukimate conversations", "tukimate integration", "connect to tukimate", "use tukimate api", "tukimate webhook", "analyze conversations with tukimate"
---

# TukiMate API Integration Guide

## Overview

TukiMate is a multi-tenant conversation management platform with AI analysis capabilities. This guide covers the REST API for external integrations.

**Base URL:** `https://app.tukimate.com/api`

## ⚠️ Important: Field Naming Convention

**All API request fields use `snake_case`.** This is the standard naming convention.

| Current (snake_case) | Legacy (deprecated) |
|---------------------|---------------------|
| `date_time` | `dateTime` |
| `duration_minutes` | `durationMinutes` |
| `source_key` | `sourceKey` |
| `source_meeting_id` | `sourceConversationId` |
| `conversation_type_key` | `conversationTypeKey` |
| `last_activity_at` | `lastActivityAt` |
| `action_items` | `actionItems` |
| `project_id` | `project` (removed) |

> **Note:** Legacy camelCase fields are deprecated but still accepted for backward compatibility. New integrations should use snake_case exclusively.

## Authentication

All API requests require authentication. Use one of these methods:

### Option 1: API Key (Recommended for integrations)

```bash
# Via Authorization header (Bearer token)
curl -H "Authorization: Bearer tuki_your_api_key_here" \
  https://app.tukimate.com/api/conversations

# Via x-api-key header
curl -H "x-api-key: tuki_your_api_key_here" \
  https://app.tukimate.com/api/conversations
```

**Getting an API Key:**
1. Log in to TukiMate
2. Go to Settings > API Keys
3. Create a new API key
4. Store securely - it won't be shown again

**API Key Format:** `tuki_` followed by 64 hexadecimal characters

### Option 2: JWT Session Token (For web apps)

```bash
curl -H "Authorization: Bearer your_jwt_token" \
  https://app.tukimate.com/api/conversations
```

## Common Headers

```bash
Content-Type: application/json
Authorization: Bearer tuki_your_api_key_here
```

## Error Responses

| Code | Meaning |
|------|---------|
| 401 | Unauthorized - Invalid or missing API key |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not found |
| 409 | Conflict - Duplicate resource |
| 422 | Validation failed |
| 429 | Rate limit exceeded |

**Error format:**
```json
{
  "error": "Validation failed",
  "details": { ... }
}
```

---

## Conversations

### List Conversations

```bash
GET /api/conversations
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Get single conversation by ID |
| `q` | string | Search in title and description |
| `participant` | string | Filter by participant name |
| `contactId` | UUID | Filter by contact ID |
| `team` | UUID | Filter by team ID |
| `dateFrom` | ISO date | Filter from date (inclusive) |
| `dateTo` | ISO date | Filter to date (inclusive) |
| `source_key` | string | Filter by source (e.g., "zoom", "manual") |
| `source_meeting_id` | string | Filter by external meeting ID |
| `project_id` | UUID | Filter by project ID |
| `category` | UUID | Filter by category ID |
| `conversation_type_key` | string | Conversation type (meeting, chat, email, etc.) |
| `hasAnalyses` | boolean | Filter by analysis status |
| `limit` | integer | Results per page (default: 100) |
| `offset` | integer | Pagination offset (default: 0) |
| `orderBy` | string | Field to order by |
| `order` | string | "asc" or "desc" |

**Example:**
```bash
curl -H "Authorization: Bearer tuki_xxx" \
  "https://app.tukimate.com/api/conversations?dateFrom=2025-01-01&limit=50"
```

**Response:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Weekly Team Standup",
      "date_time": "2025-01-08T10:00:00Z",
      "duration_minutes": 60,
      "source_key": "zoom",
      "conversation_type_key": "meeting",
      "participants": [
        {
          "id": "contact-uuid",
          "name": "John Doe",
          "email": "john@example.com"
        }
      ]
    }
  ],
  "count": 1,
  "limit": 50,
  "offset": 0
}
```

### Get Single Conversation

```bash
GET /api/conversations?id={conversation_id}
```

**Example:**
```bash
curl -H "Authorization: Bearer tuki_xxx" \
  "https://app.tukimate.com/api/conversations?id=550e8400-e29b-41d4-a716-446655440000"
```

### Create Conversation

```bash
POST /api/conversations
```

**Request Body:**

```json
{
  "date_time": "2025-01-08T10:00:00Z",
  "duration_minutes": 60,
  "title": "Client Discovery Call",
  "transcript": "Full meeting transcript here...",
  "description": "Optional description",
  "overview": "Optional overview",
  "source_key": "zoom",
  "source_meeting_id": "zoom-meeting-12345",
  "conversation_type_key": "meeting",
  "team_id": "team-uuid",
  "client_id": "client-uuid",
  "project_id": "project-uuid",
  "language": "en",
  "tags": ["sales", "discovery"],
  "participants": [
    {
      "name": "John Doe",
      "email": "john@client.com",
      "job_title": "CTO",
      "company_name": "Acme Corp"
    },
    {
      "name": "Jane Smith",
      "email": "jane@mycompany.com"
    }
  ]
}
```

**Required Fields:**
- `date_time` - ISO 8601 datetime
- `duration_minutes` - Duration in minutes (0 for chats/emails)
- `title` - Conversation title (1-300 chars)
- `transcript` - Full transcript content
- `source_key` - Source identifier (e.g., "zoom", "manual", "fireflies")
- `participants` - Array of participant objects

**Conversation Types:**

| Type | Time Field | Description |
|------|------------|-------------|
| `meeting` | duration_minutes | In-person or video meeting |
| `one_on_one` | duration_minutes | One-on-one meeting |
| `phone_call` | duration_minutes | Phone conversation |
| `video_call` | duration_minutes | Video call (Zoom, Teams, etc.) |
| `voice_message` | duration_minutes | Voice message/recording |
| `chat` | last_activity_at | Chat conversation |
| `email` | last_activity_at | Email thread |

**Participant Schema:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "identifier": "john.doe",
  "phone": "+1-555-0123",
  "contact_id": "existing-contact-uuid",
  "job_title": "Product Manager",
  "department": "Engineering",
  "company_name": "Acme Corp",
  "tags": [
    { "id": "tag-id", "tag": "VIP", "color": "#ff0000" }
  ],
  "upsert_contact": true
}
```

**Note:** Either `name` or `contact_id` is required for each participant.

**Example:**
```bash
curl -X POST https://app.tukimate.com/api/conversations \
  -H "Authorization: Bearer tuki_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "date_time": "2025-01-15T14:00:00Z",
    "duration_minutes": 45,
    "title": "Sales Call - Acme Corp",
    "transcript": "Full transcript...",
    "source_key": "zoom",
    "source_meeting_id": "zoom-12345",
    "conversation_type_key": "meeting",
    "participants": [
      {"name": "Alice Johnson", "email": "alice@acme.com"},
      {"name": "Bob Smith", "email": "bob@mycompany.com"}
    ]
  }'
```

**Response:** `201 Created`
```json
{
  "id": "new-conversation-uuid",
  "title": "Sales Call - Acme Corp",
  "date_time": "2025-01-15T14:00:00Z",
  "duration_minutes": 45,
  "participants": [...]
}
```

### Update Conversation

```bash
PATCH /api/conversations/{id}
```

**Request Body:** Same fields as POST, all optional

**Example:**
```bash
curl -X PATCH https://app.tukimate.com/api/conversations/conv-uuid \
  -H "Authorization: Bearer tuki_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "project_id": "new-project-uuid",
    "participants": [
      {"name": "Alice Johnson", "email": "alice@acme.com"}
    ]
  }'
```

### Bulk Delete Conversations

```bash
POST /api/conversations/bulk
```

**Request Body:**
```json
{
  "action": "delete",
  "ids": ["conv-1", "conv-2", "conv-3"]
}
```

---

## Contacts

### List Contacts

```bash
GET /api/contacts
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search in name, email |
| `company` | string | Filter by company |
| `is_active` | boolean | Filter by active status |
| `tags` | string | Comma-separated tags |
| `limit` | integer | Results per page |
| `offset` | integer | Pagination offset |

**Example:**
```bash
curl -H "Authorization: Bearer tuki_xxx" \
  "https://app.tukimate.com/api/contacts?search=john&limit=50"
```

**Response:**
```json
{
  "contacts": [
    {
      "id": "contact-uuid",
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+1-555-1234",
      "job_title": "CTO",
      "company_name": "Acme Corp",
      "tags": ["vip", "customer"]
    }
  ]
}
```

### Create Contact

```bash
POST /api/contacts
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1-555-1234",
  "jobTitle": "CTO",
  "companyName": "Acme Corp",
  "department": "Engineering",
  "tags": ["vip", "customer"]
}
```

**Required:** `firstName`, `lastName`, and at least one of `email`, `identifier`, or `phone`

**Example:**
```bash
curl -X POST https://app.tukimate.com/api/contacts \
  -H "Authorization: Bearer tuki_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@acme.com",
    "jobTitle": "CTO"
  }'
```

### Update Contact

```bash
PATCH /api/contacts/{id}
```

### Delete Contact

```bash
DELETE /api/contacts/{id}
```

---

## Clients (Companies)

### List Clients

```bash
GET /api/clients
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | corporate, individual, partner |
| `status` | string | active, inactive, prospect |
| `tier` | string | standard, premium, enterprise |
| `search` | string | Search in name |
| `orderBy` | string | Field to order by |
| `order` | string | asc or desc |

**Example:**
```bash
curl -H "Authorization: Bearer tuki_xxx" \
  "https://app.tukimate.com/api/clients?status=active"
```

**Response:**
```json
{
  "clients": [
    {
      "id": "client-uuid",
      "name": "Acme Corporation",
      "code": "ACME",
      "type": "corporate",
      "status": "active",
      "tier": "enterprise",
      "industry": "Technology",
      "website": "https://acme.com"
    }
  ]
}
```

### Create Client

```bash
POST /api/clients
```

**Request Body:**
```json
{
  "name": "Acme Corporation",
  "code": "ACME",
  "type": "corporate",
  "status": "active",
  "tier": "enterprise",
  "industry": "Technology",
  "website": "https://acme.com",
  "description": "Enterprise client",
  "color": "#3b82f6"
}
```

**Required:** `name`

**Example:**
```bash
curl -X POST https://app.tukimate.com/api/clients \
  -H "Authorization: Bearer tuki_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "code": "ACME",
    "type": "corporate"
  }'
```

### Update Client

```bash
PATCH /api/clients/{id}
```

### Delete Client

```bash
DELETE /api/clients/{id}
```

---

## Projects

### List Projects

```bash
GET /api/projects
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | active, archived, completed |

**Example:**
```bash
curl -H "Authorization: Bearer tuki_xxx" \
  "https://app.tukimate.com/api/projects?status=active"
```

**Response:**
```json
{
  "projects": [
    {
      "id": "project-uuid",
      "name": "Q1 Sales Initiative",
      "description": "Project description",
      "status": "active",
      "color": "#3b82f6",
      "conversationCount": 15,
      "lastActivityAt": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### Create Project

```bash
POST /api/projects
```

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description",
  "context": "Additional context for AI analysis",
  "color": "#3b82f6",
  "status": "active"
}
```

**Required:** `name`

**Example:**
```bash
curl -X POST https://app.tukimate.com/api/projects \
  -H "Authorization: Bearer tuki_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q1 Sales Initiative",
    "description": "Sales calls for Q1"
  }'
```

### Update Project

```bash
PATCH /api/projects/{id}
```

---

## Tag Definitions

### List Tag Definitions

```bash
GET /api/tag-definitions
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | type, role, status, custom |

**Example:**
```bash
curl -H "Authorization: Bearer tuki_xxx" \
  "https://app.tukimate.com/api/tag-definitions"
```

**Response:**
```json
{
  "tagDefinitions": [
    {
      "id": "tag-uuid",
      "name": "VIP",
      "color": "#ef4444",
      "category": "custom",
      "scope": ["contact", "conversation"]
    }
  ]
}
```

### Create Tag Definition

```bash
POST /api/tag-definitions
```

**Request Body:**
```json
{
  "name": "VIP Customer",
  "color": "#ef4444",
  "category": "custom",
  "description": "High-value customers",
  "scope": ["contact", "conversation"]
}
```

**Required:** `name`

**Example:**
```bash
curl -X POST https://app.tukimate.com/api/tag-definitions \
  -H "Authorization: Bearer tuki_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "VIP",
    "color": "#ef4444"
  }'
```

---

## Sources

Sources identify where conversations come from (Zoom, manual entry, integrations, etc.)

### List Sources

```bash
GET /api/sources
```

**Example:**
```bash
curl -H "Authorization: Bearer tuki_xxx" \
  "https://app.tukimate.com/api/sources"
```

**Response:**
```json
[
  { "key": "zoom", "label": "Zoom", "active": true },
  { "key": "manual", "label": "Manual Entry", "active": true },
  { "key": "fireflies", "label": "Fireflies.ai", "active": true }
]
```

### Create Source

```bash
POST /api/sources
```

**Request Body:**
```json
{
  "key": "custom_integration",
  "label": "Custom Integration",
  "description": "My custom integration",
  "active": true
}
```

**Note:** `key` must be lowercase alphanumeric with underscores only.

---

## Analyses

### List Analyses

```bash
GET /api/analyses
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `conversationId` | UUID | Filter by conversation |
| `jobId` | UUID | Filter by analysis job |
| `status` | string | PENDING, PROCESSING, COMPLETED, FAILED |
| `team` | UUID | Filter by team |
| `project` | UUID | Filter by project |
| `limit` | integer | Results per page (default: 50) |
| `offset` | integer | Pagination offset |

**Example:**
```bash
curl -H "Authorization: Bearer tuki_xxx" \
  "https://app.tukimate.com/api/analyses?status=COMPLETED&limit=20"
```

**Response:**
```json
{
  "data": [
    {
      "id": "analysis-uuid",
      "conversation_id": "conv-uuid",
      "status": "COMPLETED",
      "summary": "Meeting summary...",
      "sentiment": "positive",
      "topics": ["sales", "product"],
      "action_items": [
        { "title": "Send proposal", "assignee": "alice@example.com" }
      ],
      "created_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### Get Analysis by ID

```bash
GET /api/analyses/{id}
```

### Create Analysis (Manual)

```bash
POST /api/analyses
```

**Request Body:**
```json
{
  "conversation_id": "conv-uuid",
  "summary": "Manual summary",
  "sentiment": "positive",
  "topics": ["sales", "discovery"],
  "action_items": [
    { "title": "Follow up", "status": "pending" }
  ]
}
```

**Note:** Most analyses are created automatically via AI processing. This endpoint is for manual analysis results.

---

## Categories

Categories help organize conversations by type (e.g., "Sales", "Support", "Internal").

### List Categories

```bash
GET /api/categories
```

**Example:**
```bash
curl -H "Authorization: Bearer tuki_xxx" \
  "https://app.tukimate.com/api/categories"
```

**Response:**
```json
[
  { "id": "cat-uuid", "key": "sales", "label": "Sales", "active": true },
  { "id": "cat-uuid-2", "key": "support", "label": "Support", "active": true }
]
```

### Create Category

```bash
POST /api/categories
```

**Request Body:**
```json
{
  "key": "sales",
  "label": "Sales Calls",
  "active": true
}
```

**Required:** `key`, `label`

**Example:**
```bash
curl -X POST https://app.tukimate.com/api/categories \
  -H "Authorization: Bearer tuki_xxx" \
  -H "Content-Type: application/json" \
  -d '{"key": "sales", "label": "Sales Calls"}'
```

---

## Teams

Teams organize users and conversations within a tenant.

### List Teams

```bash
GET /api/teams
```

**Example:**
```bash
curl -H "Authorization: Bearer tuki_xxx" \
  "https://app.tukimate.com/api/teams"
```

**Response:**
```json
[
  {
    "id": "team_tenant_sales",
    "name": "Sales Team",
    "description": "Sales department",
    "color": "#6366f1",
    "member_count": 5,
    "conversation_count": 42
  }
]
```

### Create Team

```bash
POST /api/teams
```

**Request Body:**
```json
{
  "name": "Sales Team",
  "description": "Sales department team",
  "context": "Context for AI analysis",
  "color": "#6366f1"
}
```

**Required:** `name`

**Example:**
```bash
curl -X POST https://app.tukimate.com/api/teams \
  -H "Authorization: Bearer tuki_xxx" \
  -H "Content-Type: application/json" \
  -d '{"name": "Sales Team", "description": "Sales department"}'
```

---

## Opportunities (CRM)

Opportunities are sales/CRM opportunities detected from conversations or created manually.

### List Opportunities

```bash
GET /api/opportunities
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | pending, approved, rejected, converted |
| `type` | string | upselling, nueva_venta, renovacion_retencion, cross_sell |
| `owner_id` | UUID | Filter by owner |
| `team_id` | UUID | Filter by team |
| `conversation_id` | UUID | Filter by conversation |
| `include_relations` | boolean | Include related data |
| `limit` | integer | Results per page (default: 50) |
| `offset` | integer | Pagination offset |

**Example:**
```bash
curl -H "Authorization: Bearer tuki_xxx" \
  "https://app.tukimate.com/api/opportunities?status=pending"
```

**Response:**
```json
{
  "opportunities": [
    {
      "id": "opp-uuid",
      "title": "Enterprise Deal - Acme Corp",
      "type": "nueva_venta",
      "status": "pending",
      "confidence": 0.85,
      "estimated_value": 50000,
      "currency": "USD",
      "description": "Client interested in enterprise plan",
      "signals": ["Budget approved", "Decision maker engaged"]
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### Create Opportunity

```bash
POST /api/opportunities
```

**Request Body:**
```json
{
  "title": "Enterprise Deal - Acme Corp",
  "type": "nueva_venta",
  "status": "pending",
  "confidence": 0.85,
  "estimated_value": 50000,
  "currency": "USD",
  "description": "Client interested in enterprise plan",
  "signals": ["Budget approved", "Decision maker engaged"],
  "expected_close_date": "2025-03-31",
  "conversation_id": "conv-uuid"
}
```

**Opportunity Types:**
| Type | Description |
|------|-------------|
| `upselling` | Additional sale to existing customer |
| `nueva_venta` | New customer or business line |
| `renovacion_retencion` | Contract renewal or retention |
| `cross_sell` | Cross-selling complementary products |

**Example:**
```bash
curl -X POST https://app.tukimate.com/api/opportunities \
  -H "Authorization: Bearer tuki_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Deal",
    "type": "nueva_venta",
    "status": "pending",
    "confidence": 0.8,
    "signals": ["Client showed interest"]
  }'
```

---

## Analysis Jobs

Track the status of AI analysis jobs.

### List Analysis Jobs

```bash
GET /api/analysis-jobs
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | QUEUED, PROCESSING, COMPLETED, FAILED |
| `type` | string | SINGLE, BULK |
| `q` | string | Search term |
| `page` | integer | Page number (default: 1) |
| `pageSize` | integer | Results per page (default: 20, max: 100) |

**Example:**
```bash
curl -H "Authorization: Bearer tuki_xxx" \
  "https://app.tukimate.com/api/analysis-jobs?status=COMPLETED"
```

**Response:**
```json
{
  "data": [
    {
      "id": "job-uuid",
      "type": "SINGLE",
      "status": "COMPLETED",
      "conversation_ids": ["conv-uuid"],
      "created_at": "2025-01-15T10:00:00Z",
      "completed_at": "2025-01-15T10:05:00Z"
    }
  ],
  "count": 1,
  "page": 1,
  "pageSize": 20
}
```

### Get Analysis Job

```bash
GET /api/analysis-jobs/{id}
```

---

## Trigger Analysis

Request AI analysis for conversations.

### Analyze Single Conversation

```bash
POST /api/conversations/{id}/analyze
```

**Request Body:**
```json
{
  "analysisConfigs": [
    {
      "id": "config-uuid",
      "name": "Sales Analysis",
      "key": "sales_analysis",
      "system_prompt": "Analyze for opportunities...",
      "enabled": true,
      "is_custom": false
    }
  ],
  "idempotencyKey": "optional-unique-key",
  "force": false
}
```

**Alternative (legacy - with IDs only):**
```json
{
  "analysisConfigIds": ["config-uuid-1", "config-uuid-2"]
}
```

**Example:**
```bash
curl -X POST https://app.tukimate.com/api/conversations/conv-uuid/analyze \
  -H "Authorization: Bearer tuki_xxx" \
  -H "Content-Type: application/json" \
  -d '{"analysisConfigIds": ["config-uuid"]}'
```

**Response:** `202 Accepted`
```json
{
  "analysisId": "analysis-uuid",
  "jobId": "job-uuid",
  "status": "queued",
  "message": "Analysis job created successfully",
  "analysisConfigs": 1
}
```

### Bulk Analyze Conversations

```bash
POST /api/conversations/bulk-analyze
```

**Request Body:**
```json
{
  "conversationIds": ["conv-1", "conv-2", "conv-3"],
  "analysisConfigIds": ["config-uuid"],
  "mode": "individual",
  "title": "Optional title for contextual mode",
  "description": "Optional description"
}
```

**Modes:**
- `individual` - Creates separate analysis job for each conversation
- `contextual` - Creates one bulk job analyzing all conversations together (aggregate insights)

**Example (individual mode):**
```bash
curl -X POST https://app.tukimate.com/api/conversations/bulk-analyze \
  -H "Authorization: Bearer tuki_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationIds": ["conv-1", "conv-2"],
    "analysisConfigIds": ["config-uuid"],
    "mode": "individual"
  }'
```

**Response:** `201 Created`
```json
{
  "success": true,
  "mode": "individual",
  "totalJobs": 2,
  "totalConversations": 2,
  "jobIds": ["job-1", "job-2"],
  "message": "Created 2 individual analysis job(s) for 2 conversation(s)"
}
```

---

## Usage Stats

Check API usage and subscription limits.

### Get Usage Statistics

```bash
GET /api/usage/stats
```

**Example:**
```bash
curl -H "Authorization: Bearer tuki_xxx" \
  "https://app.tukimate.com/api/usage/stats"
```

**Response:**
```json
{
  "conversations": {
    "used": 45,
    "limit": 100,
    "remaining": 55
  },
  "analyses": {
    "used": 30,
    "limit": 50,
    "remaining": 20
  },
  "tokens": {
    "used": 150000,
    "limit": 500000,
    "remaining": 350000
  },
  "period": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  }
}
```

---

## Conversation Types

Get available conversation types and their configuration.

### List Conversation Types

```bash
GET /api/conversation-types
```

**Example:**
```bash
curl -H "Authorization: Bearer tuki_xxx" \
  "https://app.tukimate.com/api/conversation-types"
```

**Response:**
```json
[
  { "key": "meeting", "label": "Meeting", "requires_duration": true },
  { "key": "chat", "label": "Chat", "requires_duration": false },
  { "key": "email", "label": "Email", "requires_duration": false }
]
```

---

## Common Integration Patterns

### Pattern 1: Send Transcripts from External System

```bash
# Step 1: Get or create a source
curl -X POST https://app.tukimate.com/api/sources \
  -H "Authorization: Bearer tuki_xxx" \
  -H "Content-Type: application/json" \
  -d '{"key": "my_app", "label": "My App"}'

# Step 2: Send the transcript
curl -X POST https://app.tukimate.com/api/conversations \
  -H "Authorization: Bearer tuki_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "date_time": "2025-01-15T14:00:00Z",
    "duration_minutes": 45,
    "title": "Call with Acme Corp",
    "transcript": "Full transcript content...",
    "source_key": "my_app",
    "source_meeting_id": "unique-external-id-123",
    "conversation_type_key": "meeting",
    "participants": [
      {"name": "Contact Name", "email": "contact@acme.com"}
    ]
  }'
```

### Pattern 2: Sync with CRM

```bash
# Get recent conversations for a contact
curl -H "Authorization: Bearer tuki_xxx" \
  "https://app.tukimate.com/api/conversations?contactId=contact-uuid&dateFrom=2025-01-01"

# Get analyses for those conversations
curl -H "Authorization: Bearer tuki_xxx" \
  "https://app.tukimate.com/api/analyses?conversationId=conv-uuid"
```

### Pattern 3: Query by External ID

```bash
# Find conversation by external meeting ID (e.g., Zoom meeting ID)
curl -H "Authorization: Bearer tuki_xxx" \
  "https://app.tukimate.com/api/conversations?sourceMeetingId=zoom-meeting-12345"
```

### Pattern 4: Trigger Analysis After Upload

```bash
# Step 1: Upload the conversation
RESPONSE=$(curl -s -X POST https://app.tukimate.com/api/conversations \
  -H "Authorization: Bearer tuki_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "date_time": "2025-01-15T14:00:00Z",
    "duration_minutes": 45,
    "title": "Sales Call",
    "transcript": "...",
    "source_key": "my_app",
    "conversation_type_key": "meeting",
    "participants": [{"name": "John", "email": "john@example.com"}]
  }')

# Step 2: Extract conversation ID and trigger analysis
CONV_ID=$(echo $RESPONSE | jq -r '.id')

curl -X POST https://app.tukimate.com/api/conversations/$CONV_ID/analyze \
  -H "Authorization: Bearer tuki_xxx" \
  -H "Content-Type: application/json" \
  -d '{"analysisConfigIds": ["config-uuid"]}'

# Step 3: Poll for job status
curl -H "Authorization: Bearer tuki_xxx" \
  "https://app.tukimate.com/api/analysis-jobs?status=COMPLETED&page=1&pageSize=1"
```

### Pattern 5: Get Opportunities from Analyzed Conversations

```bash
# Step 1: Get completed analyses
curl -H "Authorization: Bearer tuki_xxx" \
  "https://app.tukimate.com/api/analyses?status=COMPLETED"

# Step 2: Get detected opportunities
curl -H "Authorization: Bearer tuki_xxx" \
  "https://app.tukimate.com/api/opportunities?status=pending"
```

### Pattern 6: Bulk Upload and Analyze

```bash
# Upload multiple conversations
for file in transcripts/*.json; do
  curl -X POST https://app.tukimate.com/api/conversations \
    -H "Authorization: Bearer tuki_xxx" \
    -H "Content-Type: application/json" \
    -d @$file
done

# Get all conversation IDs
CONV_IDS=$(curl -s -H "Authorization: Bearer tuki_xxx" \
  "https://app.tukimate.com/api/conversations?source_key=my_app&limit=100" | jq -r '.data[].id' | jq -s '.')

# Trigger bulk analysis
curl -X POST https://app.tukimate.com/api/conversations/bulk-analyze \
  -H "Authorization: Bearer tuki_xxx" \
  -H "Content-Type: application/json" \
  -d "{\"conversationIds\": $CONV_IDS, \"analysisConfigIds\": [\"config-uuid\"], \"mode\": \"individual\"}"
```

---

## Rate Limits

- API requests are rate-limited based on subscription plan
- Analysis operations consume tokens from monthly quota
- When limits are exceeded, API returns `429 Too Many Requests`
- Check usage: `GET /api/usage/stats`

---

## Best Practices

1. **Use snake_case field names** - All API fields use snake_case (e.g., `date_time`, `source_key`, `conversation_type_key`)
2. **Use source_meeting_id** - Store your external ID to prevent duplicates and enable lookups
3. **Handle 409 Conflict** - Indicates duplicate resource, check if it already exists
4. **Idempotency** - Use consistent source_meeting_id values for retry safety
5. **Batch operations** - Use bulk endpoints when processing multiple records
6. **Error handling** - Always check response status and handle errors appropriately
7. **Use project_id instead of project** - The `project` field is deprecated; always use `project_id` with UUIDs

---

## Support

- API Documentation: `https://app.tukimate.com/api/swagger`
- Contact: support@tukimate.com
