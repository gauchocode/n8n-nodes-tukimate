# n8n-nodes-tukimate

[n8n](https://n8n.io) community node for [TukiMate](https://tukimate.com) API.

## Installation

### In n8n Community Nodes

1. Go to **Settings** > **Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-tukimate`
4. Click **Install**

### Manual Installation

```bash
cd ~/.n8n/custom
npm install n8n-nodes-tukimate
```

## Credentials

To use this node, you need a TukiMate API key:

1. Log in to your TukiMate account
2. Go to **Settings** > **API Keys**
3. Create a new API key
4. Copy the key (starts with `tuki_`)

In n8n:
1. Go to **Credentials**
2. Click **Add Credential**
3. Search for "TukiMate API"
4. Paste your API key
5. Save

## AI Agent Support

This node can be used as a tool in n8n AI Agent workflows. Simply add it to your AI Agent's tools to enable the agent to interact with TukiMate resources.

## Supported Resources & Operations

### Conversation
| Operation | Description |
|-----------|-------------|
| List | Get a list of conversations with optional filters (search, external meeting ID, team, client, project) |
| Get | Get a single conversation by ID |
| Create | Create a new conversation |
| Update | Update an existing conversation |

**List Filters:**
- **Search** - Text search in conversation content
- **External Meeting ID** - Filter by external meeting source ID (e.g., Zoom, Google Meet)
- **Team** - Filter by team
- **Client** - Filter by client
- **Project** - Filter by project
- **Limit/Offset** - Pagination

### Contact
| Operation | Description |
|-----------|-------------|
| List | Get a list of contacts |
| Get | Get a single contact by ID |
| Create | Create a new contact |
| Update | Update an existing contact |

### Team
| Operation | Description |
|-----------|-------------|
| List | Get a list of teams |
| Get | Get a single team by ID |
| Create | Create a new team |
| Update | Update an existing team |

### Project
| Operation | Description |
|-----------|-------------|
| List | Get a list of projects |
| Get | Get a single project by ID |
| Create | Create a new project |
| Update | Update an existing project |

### Client
| Operation | Description |
|-----------|-------------|
| List | Get a list of clients |
| Get | Get a single client by ID |
| Create | Create a new client |
| Update | Update an existing client |

### Source
| Operation | Description |
|-----------|-------------|
| List | Get a list of sources |
| Get | Get a single source by ID |
| Create | Create a new source |
| Update | Update an existing source |

### Conversation Type
| Operation | Description |
|-----------|-------------|
| List | Get available conversation types (read-only) |

### Tag
| Operation | Description |
|-----------|-------------|
| List | Get all available tags |
| Get | Get tags for a specific conversation |

## Simplified Output

All List and Get operations include a **Simplified Output** option that returns only essential fields and excludes internal fields like `tenant_id`, `created_at`, `updated_at`, and `deleted_at`.

**Fields included in simplified output:**

| Resource | Fields |
|----------|--------|
| Conversation | id, title, description, dateTime, durationMinutes, status, team_id, project_id, client_id, sourceKey, conversationTypeKey, ai_context, sentiment |
| Contact | id, firstName, lastName, email, phone, company, job_title |
| Team | id, name, description, color |
| Project | id, name, description, status, client_id, ai_context |
| Client | id, name, code, type, status, industry, website |
| Source | id, key, label, active |

## Example Usage

### Create a Conversation

1. Add a **TukiMate** node to your workflow
2. Select **Conversation** as the resource
3. Select **Create** as the operation
4. Fill in the required fields:
   - Title
   - Date/Time
   - Transcript
   - Source (e.g., "api")
5. Optionally add:
   - Team
   - Project
   - Client
   - Participants

### List Conversations with Filters

1. Add a **TukiMate** node
2. Select **Conversation** > **List**
3. Optionally filter by:
   - Search term
   - External Meeting ID
   - Team
   - Client
   - Project
   - Limit/Offset for pagination
4. Enable **Simplified Output** for cleaner responses

### Find Conversation by External Meeting ID

1. Add a **TukiMate** node
2. Select **Conversation** > **List**
3. Enter the **External Meeting ID** (e.g., Zoom meeting ID)
4. Set **Limit** to 1

## Development

This project uses Docker for builds:

```bash
# Build
docker compose run build

# Publish
docker compose run publish
```

## License

MIT

## Support

- [TukiMate Documentation](https://app.tukimate.com/api-docs)
- [GitHub Issues](https://github.com/broobe/n8n-nodes-tukimate/issues)
