# n8n Node for TukiMate

## Status
- **Phase**: Implementation
- **Last Updated**: 2026-03-06

## Final Scope

| Resource | List | Get | Create | Update |
|----------|------|-----|--------|--------|
| Conversations | ✅ | ✅ | ✅ | ✅ |
| Contacts | ✅ | ✅ | ✅ | ✅ |
| Teams | ✅ | ✅ | ✅ | ✅ |
| Projects | ✅ | ✅ | ✅ | ✅ |
| Clients | ✅ | ✅ | ✅ | ✅ |
| Sources | ✅ | ✅ | ✅ | ✅ |
| Conversation Types | ✅ | - | - | - |

**Not included (for now):**
- Bulk operations
- Delete operations

**Base URL**: `https://app.tukimate.com/api` (fixed)

## Authentication

- API Key via header `Authorization: Bearer tuki_xxx`
- Configured in n8n credentials

## Project Structure

```
n8n-nodes-tukimate/
├── package.json
├── tsconfig.json
├── nodes/
│   └── TukiMate/
│       └── TukiMate.node.ts
├── credentials/
│   └── TukiMateApi.credentials.ts
└── README.md
```
