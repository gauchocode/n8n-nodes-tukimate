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
| List | Get a list of conversations with optional filters |
| Get | Get a single conversation by ID |
| Create | Create a new conversation |
| Update | Update an existing conversation |
| Analyze | Trigger AI analysis on a conversation |
| Delete | Delete a conversation |

**List Filters:**
- **Search** - Text search in conversation content
- **External Meeting ID** - Filter by external meeting source ID (e.g., Zoom, Google Meet)
- **Team** - Filter by team
- **Client** - Filter by client
- **Project** - Filter by project
- **Contact** - Filter by contact ID
- **Participant** - Filter by participant name
- **Category** - Filter by category ID
- **Date From/To** - Filter by date range
- **Source** - Filter by source key
- **Type** - Filter by conversation type
- **Has Analyses** - Filter by analysis status
- **Sort By / Sort Order** - Sort results by supported fields
- **Limit/Offset** - Pagination

**Create/Update Fields:**
- Title, Description, Overview
- Date/Time, Duration
- Transcript
- Source Key, Source Conversation ID
- Conversation Type
- Language
- Tags
- Team, Client, Project
- Participants

### Contact
| Operation | Description |
|-----------|-------------|
| List | Get a list of contacts with optional filters |
| Get | Get a single contact by ID |
| Create | Create a new contact |
| Update | Update an existing contact |
| Delete | Delete a contact |

**List Filters:**
- **Search** - Search in name, email
- **Company** - Filter by company
- **Tags** - Filter by tags
- **Sort By / Sort Order** - Sort results by supported fields
- **Limit/Offset** - Pagination

**Create/Update Fields:**
- First Name, Last Name
- Email, Phone, Identifier
- Job Title, Department
- Company Name
- Tags

### Team
| Operation | Description |
|-----------|-------------|
| List | Get a list of teams |
| Get | Get a single team by ID |
| Create | Create a new team |
| Update | Update an existing team |
| Delete | Delete a team |

**List Filters:**
- **Sort By / Sort Order** - Sort results by supported fields

### Project
| Operation | Description |
|-----------|-------------|
| List | Get a list of projects with optional status filter |
| Get | Get a single project by ID |
| Create | Create a new project |
| Update | Update an existing project |
| Delete | Delete a project |

**List Filters:**
- **Status** - Filter by project status
- **Sort By / Sort Order** - Sort results by supported fields

### Client
| Operation | Description |
|-----------|-------------|
| List | Get a list of clients with optional filters |
| Get | Get a single client by ID |
| Create | Create a new client |
| Update | Update an existing client |
| Delete | Delete a client |

**List Filters:**
- **Type** - corporate, individual, partner
- **Status** - active, inactive, prospect
- **Sort By / Sort Order** - Sort results by supported fields
- **Limit/Offset** - Pagination

### Source
| Operation | Description |
|-----------|-------------|
| List | Get a list of sources |
| Get | Get a single source by ID |
| Create | Create a new source |
| Update | Update an existing source |

**List Filters:**
- **Sort By / Sort Order** - Sort results by supported fields

### Conversation Type
| Operation | Description |
|-----------|-------------|
| List | Get available conversation types (read-only) |

**List Filters:**
- **Sort By / Sort Order** - Sort results by supported fields

### Tag
| Operation | Description |
|-----------|-------------|
| List | Get a list of all available tags |
| Get | Get a single tag by ID |
| Get Conversation Tags | Get tags for a specific conversation |
| Search | Search tags by name |
| Delete | Delete a tag |

**List Filters:**
- **Sort By / Sort Order** - Sort results by supported fields

### Tag Definition
| Operation | Description |
|-----------|-------------|
| List | Get a list of tag definitions |
| Create | Create a new tag definition |

**List Filters:**
- **Category** - Filter by tag category
- **Sort By / Sort Order** - Sort results by supported fields

**Create Fields:**
- Name, Color, Description
- Category (type, role, status, custom)

### Category
| Operation | Description |
|-----------|-------------|
| List | Get a list of categories |
| Get | Get a single category by ID |
| Create | Create a new category |
| Update | Update an existing category |
| Delete | Delete a category |

**List Filters:**
- **Sort By / Sort Order** - Sort results by supported fields

### Analysis
| Operation | Description |
|-----------|-------------|
| List | Get a list of analyses with optional filters |
| Get | Get a single analysis by ID |

**List Filters:**
- **Conversation ID** - Filter by conversation
- **Status** - PENDING, PROCESSING, COMPLETED, FAILED
- **Sort By / Sort Order** - Sort results by supported fields
- **Limit/Offset** - Pagination

### Analysis Job
| Operation | Description |
|-----------|-------------|
| List | Get a list of analysis jobs with optional filters |
| Get | Get a single analysis job by ID |

**List Filters:**
- **Status** - QUEUED, PROCESSING, COMPLETED, FAILED
- **Search** - Search term
- **Page/Page Size** - Pagination

### Opportunity
| Operation | Description |
|-----------|-------------|
| List | Get a list of opportunities with optional filters |
| Get | Get a single opportunity by ID |
| Create | Create a new opportunity |
| Update | Update an existing opportunity |

**List Filters:**
- **Status** - pending, approved, rejected, converted
- **Conversation ID** - Filter by conversation
- **Sort By / Sort Order** - Sort results by supported fields
- **Limit/Offset** - Pagination

**Create/Update Fields:**
- Title, Description
- Type - upselling, nueva_venta, renovacion_retencion, cross_sell
- Status, Confidence
- Estimated Value, Currency
- Signals (comma-separated)
- Expected Close Date
- Conversation ID

### Usage
| Operation | Description |
|-----------|-------------|
| Get Stats | Get API usage statistics and subscription limits |

## Simplified Output

All List and Get operations include a **Simplified Output** option that returns only essential fields and excludes internal fields like `tenant_id`, `created_at`, `updated_at`, and `deleted_at`.

**Fields included in simplified output:**

| Resource | Fields |
|----------|--------|
| Conversation | id, title, description, date_time, duration_minutes, status, team_id, project_id, client_id, source_key, conversation_type_key, ai_context, sentiment |
| Contact | id, first_name, last_name, email, phone, company_name, job_title |
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
   - Tags
   - Language

### List Conversations with Filters

1. Add a **TukiMate** node
2. Select **Conversation** > **List**
3. Optionally filter by:
   - Search term
   - External Meeting ID
   - Team, Client, Project
   - Date range
   - Category
   - Contact
   - Limit/Offset for pagination
4. Enable **Simplified Output** for cleaner responses

### Find Conversation by External Meeting ID

1. Add a **TukiMate** node
2. Select **Conversation** > **List**
3. Enter the **External Meeting ID** (e.g., Zoom meeting ID)
4. Set **Limit** to 1

### Trigger AI Analysis

1. Add a **TukiMate** node
2. Select **Conversation** > **Analyze**
3. Enter the Conversation ID
4. Optionally specify analysis config IDs

### Get Usage Statistics

1. Add a **TukiMate** node
2. Select **Usage** > **Get Stats**
3. View your API usage and limits

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
