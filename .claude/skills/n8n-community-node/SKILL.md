---
name: n8n-community-node
description: Use when creating custom n8n community nodes for APIs, especially with many endpoints, verbose responses, or when the node should work as an AI Agent tool. Includes standards for verified community nodes and code architecture patterns.
---

# n8n Community Node Development

## Overview

Pattern for creating n8n community nodes with clean UX, simplified output, AI Agent compatibility, and npm publishing. Covers both personal nodes and **verified community nodes** (published to npm registry).

**Important distinction:**
- **Personal/Local nodes**: For internal use, can use runtime dependencies
- **Verified Community nodes**: Published to npm, must follow strict technical constraints (no runtime dependencies, security requirements)

## Prerequisites

- **Node.js**: v18.17.0 or higher (v20+ recommended)
- **npm**: v9+ or pnpm
- **git**: For version control
- **n8n-node CLI**: Official scaffolding tool

## Project Setup (Official Method)

Use the official n8n CLI to ensure compliance with verification standards:

```bash
npx n8n-node create
# Follow interactive prompts:
# - Package name: n8n-nodes-myapi
# - Description: Your description
# - Author: Your name
# - License: MIT (recommended)
```

This generates:
- TypeScript configuration
- ESLint setup with n8n rules
- Testing environment
- Correct folder structure

**Legacy method** (only if you need custom setup):
```bash
git clone https://github.com/n8n-io/n8n-nodes-starter.git n8n-nodes-myapi
cd n8n-nodes-myapi
rm -rf .git && git init  # Clean history
```

## Project Structure

```
n8n-nodes-myapi/
├── package.json                    # Package config with n8n metadata
├── tsconfig.json                   # TypeScript config
├── .eslintrc.js                    # Linting rules (auto-generated)
├── .npmignore                      # Files to exclude from npm package
├── .gitignore
├── nodes/
│   └── MyApi/
│       ├── MyApi.node.ts           # Main node implementation
│       ├── MyApi.node.json         # Metadata (codex) - REQUIRED for verification
│       └── myapi.svg               # Node icon
├── credentials/
│   └── MyApiApi.credentials.ts     # Auth configuration
└── dist/                           # Compiled output (gitignored)
```

## ⚠️ CRITICAL: Verification Standards

To publish as a **verified community node** (appears in n8n's community node repository), you **MUST** follow these constraints:

### Technical Constraints
- **NO runtime dependencies**: Only `devDependencies` allowed in package.json. All code must be bundled or use n8n's internal libraries.
- **NO file system access**: Do not use `fs`, `path`, or `os` modules.
- **NO environment variables**: Do not access `process.env`.
- **NO child processes**: Do not spawn subprocesses.
- **NO network servers**: Do not create HTTP servers or listen on ports.

### Package Requirements
- Name must start with `n8n-nodes-` or `@scope/n8n-nodes-`
- **MUST include keyword**: `"n8n-community-node-package"` (CRITICAL: Without this, your node will not appear in the community registry)
- Must include `n8n` object in package.json linking to compiled files
- Must pass official linter: `npx @n8n/scan-community-package n8n-nodes-myapi`

## package.json Configuration

```json
{
  "name": "n8n-nodes-myapi",
  "version": "1.0.0",
  "description": "n8n community node for MyApi",
  "keywords": ["n8n", "n8n-community-node-package", "myapi", "integration"],
  "license": "MIT",
  "homepage": "https://github.com/yourusername/n8n-nodes-myapi",
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/yourusername/n8n-nodes-myapi.git"
  },
  "main": "index.js",
  "scripts": {
    "build": "tsc && cp nodes/MyApi/myapi.svg dist/nodes/MyApi/",
    "dev": "tsc --watch",
    "lint": "eslint nodes/ credentials/ --quiet",
    "clean": "rm -rf dist"
  },
  "files": ["dist"],
  "n8n": {
    "n8nNodesApiVersion": 1,
    "credentials": ["dist/credentials/MyApiApi.credentials.js"],
    "nodes": ["dist/nodes/MyApi/MyApi.node.js"]
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "n8n-workflow": "^1.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0"
  },
  "peerDependencies": {
    "n8n-workflow": ">=1.0.0"
  }
}
```

**Note**: `dependencies` section is intentionally omitted for verified nodes. The keyword `"n8n-community-node-package"` is **mandatory** for the node to appear in n8n's community node registry.

## Node Metadata (Codex File)

**File**: `nodes/MyApi/MyApi.node.json`

Required for verification. Defines categories and documentation links.

```json
{
  "node": "n8n-nodes-myapi.MyApi",
  "nodeVersion": "1.0",
  "codexVersion": "1.0",
  "categories": ["Communication", "Productivity", "Development"],
  "resources": {
    "credentialDocumentation": [
      {
        "url": "https://docs.myapi.com/authentication"
      }
    ],
    "primaryDocumentation": [
      {
        "url": "https://github.com/yourusername/n8n-nodes-myapi/blob/main/README.md"
      }
    ]
  }
}
```

**Categories must be from n8n's allowed list**:
- Communication, Data & Storage, Development, Finance, HR, Marketing, Operations, Productivity, Sales, Security, Utility

## Icon Configuration (SVG)

**Requirements:**
- Format: SVG (vector, scales well)
- Size: 60x60 pixels viewBox
- Style: Simple, recognizable at small size
- Colors: Use brand colors, avoid gradients
- Background: Transparent or solid

**Location:**
```
nodes/MyApi/myapi.svg
```

**Build script must copy icon:**
```json
{
  "scripts": {
    "build": "tsc && cp nodes/MyApi/myapi.svg dist/nodes/MyApi/"
  }
}
```

**Icon property in node description:**
```typescript
icon: 'file:myapi.svg',  // Relative to node file location
```

**Creating a simple SVG:**
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60">
  <rect width="60" height="60" rx="8" fill="#3B82F6"/>
  <text x="30" y="40" text-anchor="middle" fill="white" font-size="24" font-weight="bold">MA</text>
</svg>
```

## Code Organization & Architecture

The file structure depends on node complexity. n8n recommends: **"Unless your node is very simple, it's a best practice to split it out."**

### Decision Matrix

| Complexity | Structure | When to Use |
|------------|-----------|-------------|
| **Simple** | **Monolithic** - Single file | 1-2 resources, <5 operations, no complex logic |
| **Medium** | **Semi-Modular** - Base file + helpers | 3-5 resources, CRUD operations, some shared logic |
| **Complex** | **Full Modular** - Directory structure | 5+ resources, multiple versions, complex API |

### Pattern 1: Monolithic (Simple Nodes)

**Best for**: Webhooks, simple APIs with 1-2 resources, prototyping

**Structure:**
```
nodes/MyApi/
├── MyApi.node.ts       # Everything in one file
├── MyApi.node.json
└── myapi.svg
```

**Example:**
```typescript
import { IExecuteFunctions, INodeExecutionData, INodeParameterResourceLocator, INodeType, INodeTypeDescription } from 'n8n-workflow';

export class MyApi implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'MyApi',
    name: 'myApi',
    icon: 'file:myapi.svg',
    group: ['transform'],
    version: 1,
    usableAsTool: true,
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'myApiApi', required: true }],
    properties: [
      // Resources and operations defined inline
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          { name: 'List', value: 'list', action: 'List items' },
          { name: 'Create', value: 'create', action: 'Create item' },
        ],
        default: 'list',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        let response;

        // Inline operation logic
        if (operation === 'list') {
          response = await this.helpers.httpRequestWithAuthentication.call(
            this, 'myApiApi', { method: 'GET', url: 'https://api.myapi.com/items', json: true }
          );
        } else if (operation === 'create') {
          const name = this.getNodeParameter('name', i) as string;
          response = await this.helpers.httpRequestWithAuthentication.call(
            this, 'myApiApi', { method: 'POST', url: 'https://api.myapi.com/items', body: { name }, json: true }
          );
        }

        const executionData = this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray(response),
          { itemData: { item: i } }
        );
        returnData.push(...executionData);

      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({ json: { error: error.message } });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
```

### Pattern 2: Semi-Modular (Medium Complexity)

**Best for**: 3-5 resources, shared logic between operations, need for helper functions

**Structure:**
```
nodes/MyApi/
├── MyApi.node.ts              # Entry point, description, routing
├── operations/                # Operation implementations
│   ├── index.ts              # Export all
│   ├── list.operation.ts     # List operation
│   ├── create.operation.ts   # Create operation
│   └── utils.ts              # Shared helpers
├── methods/
│   └── loadOptions.ts        # Dynamic dropdowns
├── MyApi.node.json
└── myapi.svg
```

**Example:**

```typescript
// operations/list.operation.ts
import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

export const listDescription = {
  displayName: 'List',
  name: 'list',
  type: 'options',
  action: 'List conversations',
  // ... other properties
};

export async function executeList(
  this: IExecuteFunctions,
  itemIndex: number
): Promise<INodeExecutionData[]> {
  const qs: Record<string, any> = {};
  const filters = this.getNodeParameter('filters', itemIndex, {}) as IDataObject;

  if (filters.status) qs.status = filters.status;
  if (filters.limit) qs.limit = filters.limit;

  const response = await this.helpers.httpRequestWithAuthentication.call(
    this,
    'myApiApi',
    {
      method: 'GET',
      url: 'https://api.myapi.com/conversations',
      qs,
      json: true,
    }
  );

  return this.helpers.returnJsonArray(response.data || response);
}

// MyApi.node.ts
import { executeList, listDescription } from './operations/list.operation';
import { executeCreate, createDescription } from './operations/create.operation';

export class MyApi implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'MyApi',
    name: 'myApi',
    icon: 'file:myapi.svg',
    usableAsTool: true,
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'myApiApi', required: true }],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        options: [
          { name: 'Conversation', value: 'conversation' },
        ],
        default: 'conversation',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        displayOptions: { show: { resource: ['conversation'] } },
        options: [listDescription, createDescription],
        default: 'list',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        let results: INodeExecutionData[];

        // Route to specific operation
        switch(operation) {
          case 'list':
            results = await executeList.call(this, i);
            break;
          case 'create':
            results = await executeCreate.call(this, i);
            break;
          default:
            throw new NodeOperationError(this.getNode(), `Operation ${operation} not supported`);
        }

        const executionData = this.helpers.constructExecutionMetaData(
          results,
          { itemData: { item: i } }
        );
        returnData.push(...executionData);

      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({ json: { error: error.message } });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
```

### Pattern 3: Full Modular (Complex Nodes)

**Best for**: 5+ resources, multiple node versions, complex APIs (like Airtable, Microsoft Outlook)

**Structure:**
```
nodes/MyApi/
├── MyApi.node.ts              # Entry point only
├── V1/                        # Version 1 (optional)
│   └── MyApiV1.node.ts
├── actions/                   # Resources directory
│   ├── conversation/
│   │   ├── index.ts          # Resource index
│   │   ├── list.operation.ts
│   │   ├── create.operation.ts
│   │   └── types.ts          # Resource-specific types
│   ├── contact/
│   │   ├── index.ts
│   │   └── ...
│   └── index.ts              # Export all resources
├── methods/
│   ├── loadOptions.ts
│   └── searchFilters.ts
├── transport/                 # HTTP client abstraction
│   ├── index.ts
│   ├── types.ts
│   └── utils.ts
├── utils/                     # Shared utilities
│   ├── extractItems.ts
│   └── simplifyOutput.ts
├── MyApi.node.json
└── myapi.svg
```

**Example:**

```typescript
// actions/conversation/index.ts
import { listOperation, listDescription } from './list.operation';
import { createOperation, createDescription } from './create.operation';

export const conversationResource = {
  name: 'conversation',
  value: 'conversation',
  operations: [listDescription, createDescription],
};

export const conversationHandlers: Record<string, Function> = {
  list: listOperation,
  create: createOperation,
};

// actions/conversation/list.operation.ts
import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

export const listDescription = {
  displayName: 'List',
  name: 'list',
  action: 'List conversations',
  // ... full description
};

export async function listOperation(
  this: IExecuteFunctions,
  itemIndex: number
): Promise<INodeExecutionData[]> {
  // Implementation using transport layer
  const client = await getClient.call(this);
  const filters = this.getNodeParameter('filters', itemIndex, {}) as IDataObject;

  const response = await client.get('/conversations', { params: filters });
  return this.helpers.returnJsonArray(response.data);
}

// transport/index.ts
import { IExecuteFunctions } from 'n8n-workflow';

export class MyApiClient {
  private baseURL: string;
  private credentials: ICredentialDataDecryptedObject;

  constructor(private executeFunctions: IExecuteFunctions) {}

  async init() {
    this.credentials = await this.executeFunctions.getCredentials('myApiApi');
    this.baseURL = (this.credentials.baseUrl as string) || 'https://api.myapi.com';
  }

  async get(path: string, options?: any) {
    return this.executeFunctions.helpers.httpRequestWithAuthentication.call(
      this.executeFunctions,
      'myApiApi',
      {
        method: 'GET',
        url: `${this.baseURL}${path}`,
        ...options,
      }
    );
  }

  async post(path: string, body: any) {
    // Similar implementation
  }
}

export async function getClient(
  this: IExecuteFunctions
): Promise<MyApiClient> {
  const client = new MyApiClient(this);
  await client.init();
  return client;
}

// MyApi.node.ts - Clean entry point
import { conversationResource, conversationHandlers } from './actions/conversation';
import { contactResource, contactHandlers } from './actions/contact';

const RESOURCES = [conversationResource, contactResource];
const HANDLERS: Record<string, Record<string, Function>> = {
  conversation: conversationHandlers,
  contact: contactHandlers,
};

export class MyApi implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'MyApi',
    name: 'myApi',
    icon: 'file:myapi.svg',
    usableAsTool: true,
    inputs: ['main'],
    outputs: ['main'],
    credentials: [{ name: 'myApiApi', required: true }],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: RESOURCES.map(r => ({ name: r.name, value: r.value })),
        default: 'conversation',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: { resource: RESOURCES.map(r => r.value) },
        },
        options: RESOURCES.flatMap(r => r.operations),
        default: 'list',
      },
      // ... other shared properties
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    const handler = HANDLERS[resource]?.[operation];
    if (!handler) {
      throw new NodeOperationError(this.getNode(), `Unknown operation: ${resource}.${operation}`);
    }

    for (let i = 0; i < items.length; i++) {
      try {
        const results = await handler.call(this, i);
        const executionData = this.helpers.constructExecutionMetaData(
          results,
          { itemData: { item: i } }
        );
        returnData.push(...executionData);
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({ json: { error: error.message } });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
```

## Architectural Best Practices

### 1. Keep `execute` as an Orchestrator

The `execute` method should route to operations, not contain business logic:

```typescript
// ❌ Bad: Business logic in execute
async execute() {
  const response = await this.helpers.httpRequest(...);
  const transformed = response.map(item => {
    // 20 lines of transformation logic
  });
  const validated = transformed.filter(item => {
    // 10 lines of validation
  });
  return [validated];
}

// ✅ Good: Execute orchestrates, operations implement
async execute() {
  const handler = getHandler(resource, operation);
  const raw = await handler.fetch.call(this, itemIndex);
  const transformed = transformResponse(raw, resource);
  return [formatOutput(transformed)];
}
```

### 2. Handle Response Wrappers Consistently

Create a utility for extracting items from various API response formats:

```typescript
// utils/extractItems.ts
export function extractItems(response: any, resource: string): any[] {
  const wrappers: Record<string, string> = {
    conversation: 'data',
    contact: 'contacts',
    team: 'teams',
  };

  const key = wrappers[resource];
  if (key && response?.[key]) {
    return Array.isArray(response[key]) ? response[key] : [response[key]];
  }
  if (Array.isArray(response)) return response;
  return [response];
}
```

### 3. Use TypeScript Types

Define interfaces for API responses:

```typescript
// types.ts
export interface IConversation {
  id: string;
  title: string;
  status: 'open' | 'closed' | 'pending';
  team_id: string;
  created_at: string;
}

export interface IApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
  };
}
```

### 4. Error Handling Strategy

Centralize error handling:

```typescript
// utils/handleErrors.ts
import { NodeApiError, NodeOperationError, IExecuteFunctions } from 'n8n-workflow';

export function handleApiError(
  error: any,
  executeFunctions: IExecuteFunctions,
  itemIndex: number
): never {
  if (error.statusCode === 429) {
    throw new NodeApiError(executeFunctions.getNode(), error, {
      message: 'Rate limit exceeded',
      description: 'Please wait before retrying',
      itemIndex,
    });
  }
  if (error.statusCode === 401) {
    throw new NodeApiError(executeFunctions.getNode(), error, {
      message: 'Authentication failed',
      description: 'Check your API credentials',
      itemIndex,
    });
  }
  throw new NodeApiError(executeFunctions.getNode(), error, { itemIndex });
}
```

## Credential Definition

**Location:** `credentials/MyApi.credentials.ts`

```typescript
import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class MyApiApi implements ICredentialType {
	name = 'myApiApi';
	displayName = 'MyApi API';
	documentationUrl = 'https://docs.myapi.com/authentication';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,  // Masks input
			},
			default: '',
			required: true,
			description: 'Your MyApi API key from the dashboard',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.myapi.com',
			description: 'Override the default API URL (optional)',
		},
	];

	// Test button configuration - validates credentials work
	test: ICredentialTestRequest = {
		request: {
			baseURL: '= {{ $credentials.baseUrl }}',
			url: '/me',  // Lightweight endpoint that requires auth
			method: 'GET',
		},
	};

	// Automatic authentication injection
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};
}
```

**Common authentication patterns:**

| Auth Type | Header Format |
|-----------|---------------|
| Bearer token | `Authorization: Bearer <token>` |
| API key header | `X-API-Key: {{$credentials.apiKey}}` |
| Basic auth | `Authorization: Basic {{ Buffer.from($credentials.user + ':' + $credentials.pass).toString('base64') }}` |
| Query parameter | `?api_key={{$credentials.apiKey}}` |

## UX Guidelines & Text Conventions

### Text Casing
- **Title Case** (Every Word Capitalized): Use for parameter `displayName`, dropdown options, button labels, section headers
  - Examples: "API Key", "First Name", "Additional Options", "Create Conversation"

- **Sentence case** (First word capitalized): Use for descriptions, tooltips, placeholder text, error messages
  - Examples: "The email address to use", "Maximum number of results to return", "Select the team to assign"

### AI Agent Tool Support

Two properties work together for AI Agent compatibility:

1. **`usableAsTool: true`** (Node level) - **REQUIRED**
   - Enables the node to be used as a tool by AI Agents
   - Must be set in the node description

2. **`action` property** (Operation level) - **Recommended**
   - Provides a human-readable description of what the operation does
   - Appears in the UI and helps AI Agents understand the operation's purpose
   - Not strictly required technically, but improves UX significantly

```typescript
description: INodeTypeDescription = {
  displayName: 'MyApi',
  usableAsTool: true,  // REQUIRED for AI Agent support
  // ...
  properties: [{
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    options: [
      {
        name: 'List',
        value: 'list',
        action: 'List conversations',  // UX description
        description: 'Retrieve a list of conversations'  // Tooltip
      },
    ],
  }],
};
```

### ResourceLocator Fields (AI Agent Compatible Dropdowns)

**For AI Agent compatibility, use `resourceLocator` type instead of `options` for filter/reference fields.** This provides a mode selector ("From List" / "By ID") that enables "Let the model define this parameter" for AI Agents.

**Why use resourceLocator:**
- Standard `type: 'options'` does NOT support "Let the model define" for AI Agents
- `resourceLocator` provides native n8n UI with mode selector (same pattern as Apify node)
- Allows AI Agents to pass IDs/keys directly without needing the dropdown

**Property definition:**
```typescript
import {
	INodeParameterResourceLocator,  // Add this import
} from 'n8n-workflow';

// Property with resourceLocator type
{
	displayName: 'Team',
	name: 'teamId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			typeOptions: {
				searchListMethod: 'getTeams',  // Uses same loadOptions method
			},
		},
		{
			displayName: 'By ID',
			name: 'id',
			type: 'string',
			placeholder: 'Enter team ID',
		},
	],
	description: 'Filter by team',
}
```

**Helper function to extract value:**
```typescript
// Add at top of file after imports
function getResourceLocatorValue(param: INodeParameterResourceLocator | string | undefined): string {
	if (!param) return '';
	if (typeof param === 'string') return param;
	return param.value as string || '';
}
```

**Usage in execute method:**
```typescript
// For fields inside additionalOptions collection
const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as {
	teamId?: INodeParameterResourceLocator;
	clientId?: INodeParameterResourceLocator;
	limit?: number;
};

const teamIdValue = getResourceLocatorValue(additionalOptions.teamId);
if (teamIdValue) query.team = teamIdValue;

// For direct fields (not in collection)
const teamIdParam = this.getNodeParameter('teamId', i, { mode: 'list', value: '' }) as INodeParameterResourceLocator;
const teamId = getResourceLocatorValue(teamIdParam);
```

**When to use resourceLocator vs options:**

| Field Type | Use When |
|------------|----------|
| `resourceLocator` | Filter/reference fields that AI Agents might need to populate |
| `options` | Static options (status, type enums) that don't need AI Agent input |

### Standard Operations
For each resource, try to implement standard CRUD operations:
- **List** (with pagination/filters in Additional Options)
- **Get** (by ID)
- **Create**
- **Update** (by ID)
- **Delete** (by ID)

### Field Organization
1. **Required fields**: Always visible at the top
2. **Resource/Operation selectors**: Always first properties
3. **Additional Options**: Use `type: 'collection'` for optional filters
4. **ID fields**: Show only for Get/Update/Delete operations using `displayOptions`

## Security Best Practices

1. **Never log credentials**:
```typescript
// BAD
console.log('Using API key:', credentials.apiKey);

// GOOD
console.log('Making request to:', url); // Only log non-sensitive data
```

2. **Validate and sanitize inputs**:
```typescript
// Validate IDs
const id = this.getNodeParameter('id', i) as string;
if (!id.match(/^[a-zA-Z0-9-_]+$/)) {
  throw new NodeOperationError(this.getNode(), 'Invalid ID format', { itemIndex: i });
}
```

3. **Use parameterized queries** (if your API supports SQL-like queries):
Never concatenate user input directly into query strings.

4. **Handle sensitive data**:
Mark sensitive fields with `typeOptions: { password: true }` in credentials.

5. **Rate limiting awareness**:
Implement exponential backoff if API returns 429 errors.

## Local Testing

### Method 1: npm link (Recommended for development)
```bash
# In your node directory
npm run build
npm link

# In n8n installation directory
cd ~/.n8n/custom
npm link n8n-nodes-myapi

# Restart n8n
n8n start
```

### Method 2: Dev mode (Hot reload)
```bash
npm run dev
# Keeps TypeScript compiler watching for changes
```

### Method 3: Docker (Isolated)
Create `docker-compose.yml`:
```yaml
services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    volumes:
      - ~/.n8n:/home/node/.n8n
      - ./dist:/home/node/.n8n/custom/n8n-nodes-myapi
```

## Pre-Publication Verification

Before publishing, you **MUST** run the official n8n scanner:

```bash
# Install scanner globally (one time)
npm install -g @n8n/scan-community-package

# Run check on your built package
npx @n8n/scan-community-package ./dist

# Or scan by package name
npx @n8n/scan-community-package n8n-nodes-myapi
```

**What it checks:**
- No runtime dependencies in package.json
- No forbidden imports (fs, path, os, child_process)
- Correct file structure
- Valid credential and node definitions
- Security violations

**Fix all errors before submitting for verification.**

## Publishing to npm

### Step 1: Create npm Account
1. Create account at https://www.npmjs.com
2. Generate Access Token: Profile → Access Tokens → Generate New Token (Classic)
3. Copy token (starts with `npm_`)

### Step 2: Configure Authentication

**Local .npmrc (simple):**
```bash
echo "//registry.npmjs.org/:_authToken=npm_YOUR_TOKEN_HERE" > .npmrc
echo ".npmrc" >> .gitignore
```

### Step 3: Build & Publish

```bash
# Clean previous builds
rm -rf dist

# Install dependencies
pnpm install

# Build
pnpm build

# Verify package contents
npm pack --dry-run

# Publish (public access required for scoped packages)
npm publish --access public
```

### Step 4: Verify Installation

```bash
# Check package exists
npm view n8n-nodes-myapi

# Install in n8n via UI:
# Go to n8n → Settings → Community Nodes → Install
# Enter: n8n-nodes-myapi
```

## Version Management

Follow semantic versioning:
- **Patch** (1.0.0 → 1.0.1): Bug fixes
- **Minor** (1.0.0 → 1.1.0): New features (backward compatible)
- **Major** (1.0.0 → 2.0.0): Breaking changes

```bash
npm version patch  # or minor/major
npm publish
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Node not appearing in n8n | Check `package.json` `n8n.nodes` path matches compiled file location |
| Icon not showing | Ensure SVG is copied to `dist/` during build; check `icon: 'file:myapi.svg'` path |
| Dropdown empty | API wraps response: check `response.data`, `response.items`, etc. |
| Auth not working | Verify `authenticate` block in credentials; check header format |
| Linting fails | Run `npm run lint` and fix all errors; ensure no `any` types |
| "Module not found" | Delete `node_modules` and `pnpm install`; check imports use `n8n-workflow` |
| Continue on fail not working | Wrap only the API call in try-catch, not the entire iteration |
| Item linking broken | Use `constructExecutionMetaData` with correct `itemData: { item: i }` |
| Scanner fails | Ensure no `dependencies` in package.json (only `devDependencies`) |

## Complete File Structure Examples

### Simple Node (Monolithic)
```
n8n-nodes-myapi/
├── package.json
├── tsconfig.json
├── nodes/
│   └── MyApi/
│       ├── MyApi.node.ts       # Everything here
│       ├── MyApi.node.json
│       └── myapi.svg
└── credentials/
    └── MyApiApi.credentials.ts
```

### Medium Node (Semi-Modular)
```
n8n-nodes-myapi/
├── package.json
├── tsconfig.json
├── nodes/
│   └── MyApi/
│       ├── MyApi.node.ts
│       ├── MyApi.node.json
│       ├── myapi.svg
│       ├── operations/
│       │   ├── index.ts
│       │   ├── list.operation.ts
│       │   └── create.operation.ts
│       └── methods/
│           └── loadOptions.ts
└── credentials/
    └── MyApiApi.credentials.ts
```

### Complex Node (Full Modular)
```
n8n-nodes-myapi/
├── package.json
├── tsconfig.json
├── nodes/
│   └── MyApi/
│       ├── MyApi.node.ts
│       ├── MyApi.node.json
│       ├── myapi.svg
│       ├── actions/
│       │   ├── index.ts
│       │   ├── conversation/
│       │   │   ├── index.ts
│       │   │   ├── list.operation.ts
│       │   │   └── types.ts
│       │   └── contact/
│       │       └── ...
│       ├── methods/
│       │   └── loadOptions.ts
│       ├── transport/
│       │   ├── index.ts
│       │   └── types.ts
│       └── utils/
│           ├── extractItems.ts
│           └── simplifyOutput.ts
└── credentials/
    └── MyApiApi.credentials.ts
```

## Quick Reference Checklist

Before publishing:
- [ ] `n8n-node create` used or structure matches official template
- [ ] `MyApi.node.json` codex file exists with categories
- [ ] `usableAsTool: true` set for AI Agent support
- [ ] `action` property added to operation options (UX improvement)
- [ ] `resourceLocator` type used for filter fields (AI Agent compatible dropdowns)
- [ ] No runtime dependencies in package.json (only devDependencies)
- [ ] Keyword `"n8n-community-node-package"` included in package.json
- [ ] `httpRequestWithAuthentication` used instead of manual header injection
- [ ] Error handling uses `NodeApiError` for HTTP errors, `NodeOperationError` for user errors
- [ ] Item linking implemented with `constructExecutionMetaData`
- [ ] Simplified output option for resources with many fields
- [ ] Load options methods handle API wrappers correctly
- [ ] Credentials include `test` configuration
- [ ] ESLint passes with no errors
- [ ] `@n8n/scan-community-package` passes without errors
- [ ] README.md with installation and usage instructions
- [ ] Code organized appropriately (monolithic vs modular based on complexity)

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Missing `n8n-community-node-package` keyword | Add to package.json keywords - **CRITICAL** for registry visibility |
| Runtime dependencies in package.json | Remove from `dependencies`, only use `devDependencies` |
| Missing `usableAsTool: true` | Add to node description for AI Agent support |
| Missing `action` property on operations | Add `action: 'List items'` to each operation option |
| **AI Agent can't set filter fields** | **Use `resourceLocator` type instead of `options` for filter/reference fields** |
| Dropdown options empty | Check API wrapper: `response.data`, `response.items`, etc. |
| No simplified output | Add for APIs with 30+ fields in responses |
| Publishing without building | Always `pnpm build` before `npm publish` |
| Using `fs`, `path`, `process.env` | NOT ALLOWED in verified community nodes |
| Missing codex file | Create `MyApi.node.json` with categories |
