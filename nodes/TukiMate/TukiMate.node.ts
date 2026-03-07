import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	ILoadOptionsFunctions,
	INodePropertyOptions,
} from 'n8n-workflow';

const BASE_URL = 'https://app.tukimate.com/api';

// Resource definitions
const RESOURCES = {
	CONVERSATION: 'conversation',
	CONTACT: 'contact',
	TEAM: 'team',
	PROJECT: 'project',
	CLIENT: 'client',
	SOURCE: 'source',
	CONVERSATION_TYPE: 'conversationType',
	TAG: 'tag',
};

// Operation definitions
const OPERATIONS = {
	LIST: 'list',
	GET: 'get',
	CREATE: 'create',
	UPDATE: 'update',
};

// Helper to make API requests
async function tukiMateRequest(
	this: IExecuteFunctions,
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
	endpoint: string,
	body?: object,
	query?: Record<string, string | number | boolean>,
): Promise<any> {
	const credentials = await this.getCredentials('tukiMateApi');
	const apiKey = credentials.apiKey as string;

	const url = new URL(`${BASE_URL}${endpoint}`);
	
	if (query) {
		Object.entries(query).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== '') {
				url.searchParams.append(key, String(value));
			}
		});
	}

	const options: any = {
		method,
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
	};

	if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
		options.body = JSON.stringify(body);
	}

	const response = await this.helpers.request(url.toString(), options);
	
	// Handle JSON response
	if (typeof response === 'string') {
		try {
			return JSON.parse(response);
		} catch {
			return response;
		}
	}
	return response;
}

// Load options helpers
async function getTeamOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const credentials = await this.getCredentials('tukiMateApi');
	const apiKey = credentials.apiKey as string;

	const response = await this.helpers.request({
		method: 'GET',
		url: `${BASE_URL}/teams`,
		headers: {
			'Authorization': `Bearer ${apiKey}`,
		},
		json: true,
	});

	const teams = Array.isArray(response) ? response : [];
	return teams.map((team: any) => ({
		name: team.name,
		value: team.id,
	}));
}

async function getProjectOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const credentials = await this.getCredentials('tukiMateApi');
	const apiKey = credentials.apiKey as string;

	const response = await this.helpers.request({
		method: 'GET',
		url: `${BASE_URL}/projects`,
		headers: {
			'Authorization': `Bearer ${apiKey}`,
		},
		json: true,
	});

	// Handle both array response and nested data
	const projects = Array.isArray(response) ? response : (response?.data || []);
	return projects.map((project: any) => ({
		name: project.name,
		value: project.id,
	}));
}

async function getClientOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const credentials = await this.getCredentials('tukiMateApi');
	const apiKey = credentials.apiKey as string;

	const response = await this.helpers.request({
		method: 'GET',
		url: `${BASE_URL}/clients`,
		headers: {
			'Authorization': `Bearer ${apiKey}`,
		},
		json: true,
	});

	// Handle both array response and nested data
	const clients = Array.isArray(response) ? response : (response?.data || []);
	return clients.map((client: any) => ({
		name: client.name,
		value: client.id,
	}));
}

async function getSourceOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const credentials = await this.getCredentials('tukiMateApi');
	const apiKey = credentials.apiKey as string;

	const response = await this.helpers.request({
		method: 'GET',
		url: `${BASE_URL}/sources`,
		headers: {
			'Authorization': `Bearer ${apiKey}`,
		},
		json: true,
	});

	const sources = Array.isArray(response) ? response : [];
	return sources.map((source: any) => ({
		name: source.label || source.key,
		value: source.key,
	}));
}

async function getConversationTypeOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const credentials = await this.getCredentials('tukiMateApi');
	const apiKey = credentials.apiKey as string;

	const response = await this.helpers.request({
		method: 'GET',
		url: `${BASE_URL}/conversation-types`,
		headers: {
			'Authorization': `Bearer ${apiKey}`,
		},
		json: true,
	});

	const types = Array.isArray(response) ? response : [];
	return types.map((type: any) => ({
		name: type.label || type.key,
		value: type.key,
	}));
}

// Fields to keep for simplified output per resource
const SIMPLIFIED_FIELDS: Record<string, string[]> = {
	conversation: ['id', 'title', 'description', 'dateTime', 'durationMinutes', 'status', 'team_id', 'project_id', 'client_id', 'sourceKey', 'conversationTypeKey', 'ai_context', 'sentiment'],
	contact: ['id', 'firstName', 'lastName', 'email', 'phone', 'company', 'job_title'],
	team: ['id', 'name', 'description', 'color'],
	project: ['id', 'name', 'description', 'status', 'client_id', 'ai_context'],
	client: ['id', 'name', 'code', 'type', 'status', 'industry', 'website'],
	source: ['id', 'key', 'label', 'active'],
};

// Fields to always exclude
const EXCLUDED_FIELDS = ['tenant_id', 'created_at', 'updated_at', 'deleted_at'];

function simplifyResponse(data: any, resource: string): any {
	const allowedFields = SIMPLIFIED_FIELDS[resource] || [];

	const filterObject = (obj: any): any => {
		if (!obj || typeof obj !== 'object') return obj;
		const filtered: any = {};
		for (const key of Object.keys(obj)) {
			if (EXCLUDED_FIELDS.includes(key)) continue;
			if (allowedFields.length === 0 || allowedFields.includes(key)) {
				filtered[key] = obj[key];
			}
		}
		return filtered;
	};

	if (Array.isArray(data)) {
		return data.map(filterObject);
	}
	return filterObject(data);
}

export class TukiMate implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TukiMate',
		name: 'tukiMate',
		icon: 'file:tukimate.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with TukiMate API (conversations, contacts, teams, projects, clients, sources)',
		defaults: {
			name: 'TukiMate',
		},
		inputs: ['main'],
		outputs: ['main'],
		usableAsTool: true,
		credentials: [
			{
				name: 'tukiMateApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: BASE_URL,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			// Resource selector
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Conversation', value: RESOURCES.CONVERSATION },
					{ name: 'Contact', value: RESOURCES.CONTACT },
					{ name: 'Team', value: RESOURCES.TEAM },
					{ name: 'Project', value: RESOURCES.PROJECT },
					{ name: 'Client', value: RESOURCES.CLIENT },
					{ name: 'Source', value: RESOURCES.SOURCE },
					{ name: 'Conversation Type', value: RESOURCES.CONVERSATION_TYPE },
					{ name: 'Tag', value: RESOURCES.TAG },
				],
				default: RESOURCES.CONVERSATION,
			},

			// Simplified output option
			{
				displayName: 'Simplified Output',
				name: 'simplifiedOutput',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION, RESOURCES.CONTACT, RESOURCES.TEAM, RESOURCES.PROJECT, RESOURCES.CLIENT, RESOURCES.SOURCE],
						operation: [OPERATIONS.LIST, OPERATIONS.GET],
					},
				},
				default: false,
				description: 'Return only essential fields (id, name, description, etc.) and exclude internal fields like tenant_id',
			},

			// ==================== CONVERSATION ====================
			// Operation selector for Conversation
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
					},
				},
				options: [
					{ name: 'List', value: OPERATIONS.LIST, description: 'Get a list of conversations' },
					{ name: 'Get', value: OPERATIONS.GET, description: 'Get a single conversation' },
					{ name: 'Create', value: OPERATIONS.CREATE, description: 'Create a new conversation' },
					{ name: 'Update', value: OPERATIONS.UPDATE, description: 'Update a conversation' },
				],
				default: OPERATIONS.LIST,
			},

			// Conversation: List filters
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.LIST],
					},
				},
				default: '',
				description: 'Search term to filter conversations',
			},
			{
				displayName: 'External Meeting ID',
				name: 'externalMeetingId',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.LIST],
					},
				},
				default: '',
				description: 'Filter by external meeting source ID (e.g., Zoom meeting ID, Google Meet ID)',
			},
			{
				displayName: 'Team',
				name: 'teamId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getTeams',
				},
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.LIST, OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Filter or set by team',
			},
			{
				displayName: 'Client',
				name: 'clientId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getClients',
				},
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.LIST, OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Filter or set by client',
			},
			{
				displayName: 'Project',
				name: 'projectId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getProjects',
				},
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.LIST, OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Filter or set by project',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.LIST],
					},
				},
				default: 10,
				description: 'Max number of results',
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.LIST],
					},
				},
				default: 0,
				description: 'Number of results to skip',
			},

			// Conversation List - New Filters
			{
				displayName: 'Date From',
				name: 'dateFrom',
				type: 'dateTime',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.LIST],
					},
				},
				default: '',
				description: 'Filter conversations from this date',
			},
			{
				displayName: 'Date To',
				name: 'dateTo',
				type: 'dateTime',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.LIST],
					},
				},
				default: '',
				description: 'Filter conversations to this date',
			},
			{
				displayName: 'Participant',
				name: 'participant',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.LIST],
					},
				},
				default: '',
				description: 'Filter by participant name',
			},
			{
				displayName: 'Contact ID',
				name: 'contactIdFilter',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.LIST],
					},
				},
				default: '',
				description: 'Filter by contact ID',
			},
			{
				displayName: 'Category',
				name: 'category',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.LIST],
					},
				},
				default: '',
				description: 'Filter by category ID',
			},
			{
				displayName: 'Type',
				name: 'conversationTypeFilter',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.LIST],
					},
				},
				default: '',
				description: 'Filter by conversation type key',
			},
			{
				displayName: 'Has Analyses',
				name: 'hasAnalyses',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.LIST],
					},
				},
				default: false,
				description: 'Filter by whether conversation has analyses',
			},
			{
				displayName: 'Source Key',
				name: 'sourceKeyFilter',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.LIST],
					},
				},
				default: '',
				description: 'Filter by source key',
			},
			{
				displayName: 'Order By',
				name: 'orderBy',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.LIST],
					},
				},
				options: [
					{ name: 'Date Time', value: 'date_time' },
					{ name: 'Title', value: 'title' },
					{ name: 'Created At', value: 'created_at' },
				],
				default: 'date_time',
				description: 'Field to order results by',
			},
			{
				displayName: 'Order',
				name: 'order',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.LIST],
					},
				},
				options: [
					{ name: 'Descending', value: 'desc' },
					{ name: 'Ascending', value: 'asc' },
				],
				default: 'desc',
				description: 'Sort order',
			},

			// Conversation: Get by ID
			{
				displayName: 'Conversation ID',
				name: 'conversationId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.GET, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'The ID of the conversation',
			},

			// Conversation: Create/Update fields
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.CREATE],
					},
				},
				default: '',
				description: 'Title of the conversation',
			},
			{
				displayName: 'Date Time',
				name: 'dateTime',
				type: 'dateTime',
				required: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.CREATE],
					},
				},
				default: '',
				description: 'Date and time of the conversation',
			},
			{
				displayName: 'Duration (Minutes)',
				name: 'durationMinutes',
				type: 'number',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: 0,
				description: 'Duration of the conversation in minutes',
			},
			{
				displayName: 'Transcript',
				name: 'transcript',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.CREATE],
					},
				},
				default: '',
				description: 'Full transcript of the conversation',
				typeOptions: {
					rows: 10,
				},
			},
			{
				displayName: 'Source Conversation ID',
				name: 'sourceConversationId',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'External conversation ID for deduplication (e.g., Zoom meeting ID)',
			},
			{
				displayName: 'Source',
				name: 'sourceKey',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getSources',
				},
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Source of the conversation',
			},
			{
				displayName: 'Conversation Type',
				name: 'conversationTypeKey',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getConversationTypes',
				},
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: 'meeting',
				description: 'Type of conversation',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Description of the conversation',
				typeOptions: {
					rows: 4,
				},
			},
			{
				displayName: 'Participants',
				name: 'participants',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: {},
				options: [
					{
						name: 'participant',
						displayName: 'Participant',
						values: [
							{ displayName: 'Name', name: 'name', type: 'string', default: '' },
							{ displayName: 'Email', name: 'email', type: 'string', default: '' },
							{ displayName: 'Contact ID', name: 'contact_id', type: 'string', default: '' },
						],
					},
				],
				description: 'Participants in the conversation',
			},

			// ==================== CONTACT ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.CONTACT],
					},
				},
				options: [
					{ name: 'List', value: OPERATIONS.LIST, description: 'Get a list of contacts' },
					{ name: 'Get', value: OPERATIONS.GET, description: 'Get a single contact' },
					{ name: 'Create', value: OPERATIONS.CREATE, description: 'Create a new contact' },
					{ name: 'Update', value: OPERATIONS.UPDATE, description: 'Update a contact' },
				],
				default: OPERATIONS.LIST,
			},
			{
				displayName: 'Contact ID',
				name: 'contactId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.CONTACT],
						operation: [OPERATIONS.GET, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'The ID of the contact',
			},
			{
				displayName: 'First Name',
				name: 'firstName',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONTACT],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'First name of the contact',
			},
			{
				displayName: 'Last Name',
				name: 'lastName',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONTACT],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Last name of the contact',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONTACT],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Email address',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONTACT],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Phone number',
			},
			{
				displayName: 'Company',
				name: 'company',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONTACT],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Company name',
			},
			{
				displayName: 'Job Title',
				name: 'jobTitle',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONTACT],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Job title',
			},

			// Contact List Filters
			{
				displayName: 'Search',
				name: 'contactSearch',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONTACT],
						operation: [OPERATIONS.LIST],
					},
				},
				default: '',
				description: 'Search in name and email',
			},
			{
				displayName: 'Company',
				name: 'companyFilter',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONTACT],
						operation: [OPERATIONS.LIST],
					},
				},
				default: '',
				description: 'Filter by company name',
			},
			{
				displayName: 'Is Active',
				name: 'isActive',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONTACT],
						operation: [OPERATIONS.LIST],
					},
				},
				default: true,
				description: 'Filter by active status',
			},
			{
				displayName: 'Tags',
				name: 'tagsFilter',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONTACT],
						operation: [OPERATIONS.LIST],
					},
				},
				default: '',
				description: 'Filter by comma-separated tags',
			},
			{
				displayName: 'Limit',
				name: 'contactLimit',
				type: 'number',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONTACT],
						operation: [OPERATIONS.LIST],
					},
				},
				default: 100,
				description: 'Max number of results',
			},
			{
				displayName: 'Offset',
				name: 'contactOffset',
				type: 'number',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONTACT],
						operation: [OPERATIONS.LIST],
					},
				},
				default: 0,
				description: 'Number of results to skip',
			},

			// ==================== TEAM ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.TEAM],
					},
				},
				options: [
					{ name: 'List', value: OPERATIONS.LIST, description: 'Get a list of teams' },
					{ name: 'Get', value: OPERATIONS.GET, description: 'Get a single team' },
					{ name: 'Create', value: OPERATIONS.CREATE, description: 'Create a new team' },
					{ name: 'Update', value: OPERATIONS.UPDATE, description: 'Update a team' },
				],
				default: OPERATIONS.LIST,
			},
			{
				displayName: 'Team ID',
				name: 'teamId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.TEAM],
						operation: [OPERATIONS.GET, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'The ID of the team',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.TEAM],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Name of the team',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.TEAM],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Description of the team',
			},
			{
				displayName: 'Color',
				name: 'color',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.TEAM],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '#3b82f6',
				description: 'Color hex code (e.g., #3b82f6)',
			},

			// ==================== PROJECT ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.PROJECT],
					},
				},
				options: [
					{ name: 'List', value: OPERATIONS.LIST, description: 'Get a list of projects' },
					{ name: 'Get', value: OPERATIONS.GET, description: 'Get a single project' },
					{ name: 'Create', value: OPERATIONS.CREATE, description: 'Create a new project' },
					{ name: 'Update', value: OPERATIONS.UPDATE, description: 'Update a project' },
				],
				default: OPERATIONS.LIST,
			},
			{
				displayName: 'Status Filter',
				name: 'projectStatusFilter',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.PROJECT],
						operation: [OPERATIONS.LIST],
					},
				},
				options: [
					{ name: 'All', value: '' },
					{ name: 'Active', value: 'active' },
					{ name: 'Archived', value: 'archived' },
					{ name: 'Completed', value: 'completed' },
				],
				default: '',
				description: 'Filter by project status',
			},
			{
				displayName: 'Project ID',
				name: 'projectId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.PROJECT],
						operation: [OPERATIONS.GET, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'The ID of the project',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.PROJECT],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Name of the project',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.PROJECT],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Description of the project',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.PROJECT],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				options: [
					{ name: 'Active', value: 'active' },
					{ name: 'Archived', value: 'archived' },
					{ name: 'Completed', value: 'completed' },
				],
				default: 'active',
				description: 'Status of the project',
			},

			// ==================== CLIENT ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
					},
				},
				options: [
					{ name: 'List', value: OPERATIONS.LIST, description: 'Get a list of clients' },
					{ name: 'Get', value: OPERATIONS.GET, description: 'Get a single client' },
					{ name: 'Create', value: OPERATIONS.CREATE, description: 'Create a new client' },
					{ name: 'Update', value: OPERATIONS.UPDATE, description: 'Update a client' },
				],
				default: OPERATIONS.LIST,
			},
			// Client List Filters
			{
				displayName: 'Type Filter',
				name: 'clientTypeFilter',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.LIST],
					},
				},
				options: [
					{ name: 'All', value: '' },
					{ name: 'Corporate', value: 'corporate' },
					{ name: 'Individual', value: 'individual' },
					{ name: 'Partner', value: 'partner' },
				],
				default: '',
				description: 'Filter by client type',
			},
			{
				displayName: 'Status Filter',
				name: 'clientStatusFilter',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.LIST],
					},
				},
				options: [
					{ name: 'All', value: '' },
					{ name: 'Active', value: 'active' },
					{ name: 'Inactive', value: 'inactive' },
					{ name: 'Prospect', value: 'prospect' },
				],
				default: '',
				description: 'Filter by client status',
			},
			{
				displayName: 'Tier Filter',
				name: 'clientTierFilter',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.LIST],
					},
				},
				options: [
					{ name: 'All', value: '' },
					{ name: 'Standard', value: 'standard' },
					{ name: 'Premium', value: 'premium' },
					{ name: 'Enterprise', value: 'enterprise' },
				],
				default: '',
				description: 'Filter by client tier',
			},
			{
				displayName: 'Search',
				name: 'clientSearch',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.LIST],
					},
				},
				default: '',
				description: 'Search in client name',
			},
			{
				displayName: 'Order By',
				name: 'clientOrderBy',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.LIST],
					},
				},
				options: [
					{ name: 'Name', value: 'name' },
					{ name: 'Created At', value: 'created_at' },
				],
				default: 'name',
				description: 'Field to order by',
			},
			{
				displayName: 'Order',
				name: 'clientOrder',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.LIST],
					},
				},
				options: [
					{ name: 'Ascending', value: 'asc' },
					{ name: 'Descending', value: 'desc' },
				],
				default: 'asc',
				description: 'Sort order',
			},
			{
				displayName: 'Client ID',
				name: 'clientId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.GET, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'The ID of the client',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Name of the client',
			},
			{
				displayName: 'Code',
				name: 'code',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Unique client code (uppercase alphanumeric)',
			},
			{
				displayName: 'Industry',
				name: 'industry',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Industry of the client',
			},
			{
				displayName: 'Website',
				name: 'website',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Website URL',
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				options: [
					{ name: 'Corporate', value: 'corporate' },
					{ name: 'Individual', value: 'individual' },
					{ name: 'Partner', value: 'partner' },
				],
				default: 'corporate',
				description: 'Type of client',
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				options: [
					{ name: 'Active', value: 'active' },
					{ name: 'Inactive', value: 'inactive' },
					{ name: 'Prospect', value: 'prospect' },
				],
				default: 'active',
				description: 'Status of the client',
			},

			// ==================== SOURCE ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.SOURCE],
					},
				},
				options: [
					{ name: 'List', value: OPERATIONS.LIST, description: 'Get a list of sources' },
					{ name: 'Get', value: OPERATIONS.GET, description: 'Get a single source' },
					{ name: 'Create', value: OPERATIONS.CREATE, description: 'Create a new source' },
					{ name: 'Update', value: OPERATIONS.UPDATE, description: 'Update a source' },
				],
				default: OPERATIONS.LIST,
			},
			{
				displayName: 'Source ID',
				name: 'sourceId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.SOURCE],
						operation: [OPERATIONS.GET, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'The ID of the source',
			},
			{
				displayName: 'Key',
				name: 'key',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.SOURCE],
						operation: [OPERATIONS.CREATE],
					},
				},
				default: '',
				description: 'Unique key for the source (lowercase alphanumeric with underscores)',
			},
			{
				displayName: 'Label',
				name: 'label',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.SOURCE],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Display label for the source',
			},
			{
				displayName: 'Active',
				name: 'active',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: [RESOURCES.SOURCE],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: true,
				description: 'Whether the source is active',
			},

			// ==================== CONVERSATION TYPE ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION_TYPE],
					},
				},
				options: [
					{ name: 'List', value: OPERATIONS.LIST, description: 'Get a list of conversation types' },
				],
				default: OPERATIONS.LIST,
			},

			// ==================== TAG ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.TAG],
					},
				},
				options: [
					{ name: 'List', value: OPERATIONS.LIST, description: 'Get a list of all available tags' },
					{ name: 'Get', value: OPERATIONS.GET, description: 'Get a single tag by ID' },
					{ name: 'Get Conversation Tags', value: 'getConversationTags', description: 'Get tags for a specific conversation' },
				],
				default: OPERATIONS.LIST,
			},
			{
				displayName: 'Tag ID',
				name: 'tagId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.TAG],
						operation: [OPERATIONS.GET],
					},
				},
				default: '',
				description: 'The ID of the tag to retrieve',
			},
			{
				displayName: 'Conversation ID',
				name: 'conversationId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.TAG],
						operation: ['getConversationTags'],
					},
				},
				default: '',
				description: 'The ID of the conversation to get tags from',
			},
		],
	};

	methods = {
		loadOptions: {
			getTeams: getTeamOptions,
			getProjects: getProjectOptions,
			getClients: getClientOptions,
			getSources: getSourceOptions,
			getConversationTypes: getConversationTypeOptions,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;

			let responseData: any;

			try {
				// ==================== CONVERSATION ====================
				if (resource === RESOURCES.CONVERSATION) {
					if (operation === OPERATIONS.LIST) {
						const search = this.getNodeParameter('search', i, '') as string;
						const externalMeetingId = this.getNodeParameter('externalMeetingId', i, '') as string;
						const teamId = this.getNodeParameter('teamId', i, '') as string;
						const projectId = this.getNodeParameter('projectId', i, '') as string;
						const clientId = this.getNodeParameter('clientId', i, '') as string;
						const limit = this.getNodeParameter('limit', i, 10) as number;
						const offset = this.getNodeParameter('offset', i, 0) as number;
						// NEW FILTERS
						const dateFrom = this.getNodeParameter('dateFrom', i, '') as string;
						const dateTo = this.getNodeParameter('dateTo', i, '') as string;
						const participant = this.getNodeParameter('participant', i, '') as string;
						const contactIdFilter = this.getNodeParameter('contactIdFilter', i, '') as string;
						const category = this.getNodeParameter('category', i, '') as string;
						const conversationTypeFilter = this.getNodeParameter('conversationTypeFilter', i, '') as string;
						const hasAnalyses = this.getNodeParameter('hasAnalyses', i, false) as boolean;
						const sourceKeyFilter = this.getNodeParameter('sourceKeyFilter', i, '') as string;
						const orderBy = this.getNodeParameter('orderBy', i, 'date_time') as string;
						const order = this.getNodeParameter('order', i, 'desc') as string;

						const query: Record<string, string | number | boolean> = { limit, offset };
						if (search) query.q = search;
						if (externalMeetingId) query.external_meeting_id = externalMeetingId;
						if (teamId) query.team = teamId;
						if (projectId) query.project = projectId;
						if (clientId) query.client = clientId;
						// NEW FILTERS
						if (dateFrom) query.dateFrom = dateFrom;
						if (dateTo) query.dateTo = dateTo;
						if (participant) query.participant = participant;
						if (contactIdFilter) query.contactId = contactIdFilter;
						if (category) query.category = category;
						if (conversationTypeFilter) query.type = conversationTypeFilter;
						if (hasAnalyses) query.hasAnalyses = hasAnalyses;
						if (sourceKeyFilter) query.sourceKey = sourceKeyFilter;
						if (orderBy) query.orderBy = orderBy;
						if (order) query.order = order;

						responseData = await tukiMateRequest.call(this, 'GET', '/conversations', undefined, query);
					}
					else if (operation === OPERATIONS.GET) {
						const conversationId = this.getNodeParameter('conversationId', i) as string;
						responseData = await tukiMateRequest.call(this, 'GET', `/conversations/${conversationId}`);
					}
					else if (operation === OPERATIONS.CREATE) {
						const title = this.getNodeParameter('title', i) as string;
						const dateTime = this.getNodeParameter('dateTime', i) as string;
						const durationMinutes = this.getNodeParameter('durationMinutes', i, 0) as number;
						const transcript = this.getNodeParameter('transcript', i) as string;
						const sourceConversationId = this.getNodeParameter('sourceConversationId', i, '') as string;
						const sourceKey = this.getNodeParameter('sourceKey', i, '') as string;
						const conversationTypeKey = this.getNodeParameter('conversationTypeKey', i, 'meeting') as string;
						const teamId = this.getNodeParameter('teamId', i, '') as string;
						const projectId = this.getNodeParameter('projectId', i, '') as string;
						const clientId = this.getNodeParameter('clientId', i, '') as string;
						const description = this.getNodeParameter('description', i, '') as string;
						const participantsData = this.getNodeParameter('participants', i, {}) as any;

						const body: any = {
							title,
							dateTime,
							durationMinutes,
							transcript,
							sourceKey: sourceKey || 'api',
							conversationTypeKey,
						};

						if (sourceConversationId) body.sourceConversationId = sourceConversationId;
						if (teamId) body.team_id = teamId;
						if (projectId) body.project_id = projectId;
						if (clientId) body.client_id = clientId;
						if (description) body.description = description;
						if (participantsData.participant) {
							body.participants = participantsData.participant;
						}

						responseData = await tukiMateRequest.call(this, 'POST', '/conversations', body);
					}
					else if (operation === OPERATIONS.UPDATE) {
						const conversationId = this.getNodeParameter('conversationId', i) as string;
						const title = this.getNodeParameter('title', i, '') as string;
						const durationMinutes = this.getNodeParameter('durationMinutes', i, undefined) as number | undefined;
						const transcript = this.getNodeParameter('transcript', i, '') as string;
						const sourceConversationId = this.getNodeParameter('sourceConversationId', i, '') as string;
						const sourceKey = this.getNodeParameter('sourceKey', i, '') as string;
						const conversationTypeKey = this.getNodeParameter('conversationTypeKey', i, '') as string;
						const teamId = this.getNodeParameter('teamId', i, '') as string;
						const projectId = this.getNodeParameter('projectId', i, '') as string;
						const clientId = this.getNodeParameter('clientId', i, '') as string;
						const description = this.getNodeParameter('description', i, '') as string;
						const participantsData = this.getNodeParameter('participants', i, {}) as any;

						const body: any = {};
						if (title) body.title = title;
						if (durationMinutes !== undefined) body.durationMinutes = durationMinutes;
						if (transcript) body.transcript = transcript;
						if (sourceConversationId) body.sourceConversationId = sourceConversationId;
						if (sourceKey) body.sourceKey = sourceKey;
						if (conversationTypeKey) body.conversationTypeKey = conversationTypeKey;
						if (teamId) body.team_id = teamId;
						if (projectId) body.project_id = projectId;
						if (clientId) body.client_id = clientId;
						if (description) body.description = description;
						if (participantsData.participant) {
							body.participants = participantsData.participant;
						}

						responseData = await tukiMateRequest.call(this, 'PATCH', `/conversations/${conversationId}`, body);
					}
				}

				// ==================== CONTACT ====================
				else if (resource === RESOURCES.CONTACT) {
					if (operation === OPERATIONS.LIST) {
						const contactSearch = this.getNodeParameter('contactSearch', i, '') as string;
						const companyFilter = this.getNodeParameter('companyFilter', i, '') as string;
						const isActive = this.getNodeParameter('isActive', i, true) as boolean;
						const tagsFilter = this.getNodeParameter('tagsFilter', i, '') as string;
						const contactLimit = this.getNodeParameter('contactLimit', i, 100) as number;
						const contactOffset = this.getNodeParameter('contactOffset', i, 0) as number;

						const query: Record<string, string | number | boolean> = { limit: contactLimit, offset: contactOffset };
						if (contactSearch) query.search = contactSearch;
						if (companyFilter) query.company = companyFilter;
						if (isActive !== undefined) query.is_active = isActive;
						if (tagsFilter) query.tags = tagsFilter;

						responseData = await tukiMateRequest.call(this, 'GET', '/contacts', undefined, query);
					}
					else if (operation === OPERATIONS.GET) {
						const contactId = this.getNodeParameter('contactId', i) as string;
						responseData = await tukiMateRequest.call(this, 'GET', `/contacts/${contactId}`);
					}
					else if (operation === OPERATIONS.CREATE) {
						const firstName = this.getNodeParameter('firstName', i) as string;
						const lastName = this.getNodeParameter('lastName', i) as string;
						const email = this.getNodeParameter('email', i, '') as string;
						const phone = this.getNodeParameter('phone', i, '') as string;
						const company = this.getNodeParameter('company', i, '') as string;
						const jobTitle = this.getNodeParameter('jobTitle', i, '') as string;

						const body: any = { firstName, lastName };
						if (email) body.email = email;
						if (phone) body.phone = phone;
						if (company) body.companyName = company;
						if (jobTitle) body.job_title = jobTitle;

						responseData = await tukiMateRequest.call(this, 'POST', '/contacts', body);
					}
					else if (operation === OPERATIONS.UPDATE) {
						const contactId = this.getNodeParameter('contactId', i) as string;
						const firstName = this.getNodeParameter('firstName', i, '') as string;
						const lastName = this.getNodeParameter('lastName', i, '') as string;
						const email = this.getNodeParameter('email', i, '') as string;
						const phone = this.getNodeParameter('phone', i, '') as string;
						const company = this.getNodeParameter('company', i, '') as string;
						const jobTitle = this.getNodeParameter('jobTitle', i, '') as string;

						const body: any = {};
						if (firstName) body.firstName = firstName;
						if (lastName) body.lastName = lastName;
						if (email) body.email = email;
						if (phone) body.phone = phone;
						if (company) body.companyName = company;
						if (jobTitle) body.job_title = jobTitle;

						responseData = await tukiMateRequest.call(this, 'PATCH', `/contacts/${contactId}`, body);
					}
				}

				// ==================== TEAM ====================
				else if (resource === RESOURCES.TEAM) {
					if (operation === OPERATIONS.LIST) {
						responseData = await tukiMateRequest.call(this, 'GET', '/teams');
					}
					else if (operation === OPERATIONS.GET) {
						const teamId = this.getNodeParameter('teamId', i) as string;
						responseData = await tukiMateRequest.call(this, 'GET', `/teams/${teamId}`);
					}
					else if (operation === OPERATIONS.CREATE) {
						const name = this.getNodeParameter('name', i) as string;
						const description = this.getNodeParameter('description', i, '') as string;
						const color = this.getNodeParameter('color', i, '#3b82f6') as string;

						const body: any = { name };
						if (description) body.description = description;
						if (color) body.color = color;

						responseData = await tukiMateRequest.call(this, 'POST', '/teams', body);
					}
					else if (operation === OPERATIONS.UPDATE) {
						const teamId = this.getNodeParameter('teamId', i) as string;
						const name = this.getNodeParameter('name', i, '') as string;
						const description = this.getNodeParameter('description', i, '') as string;
						const color = this.getNodeParameter('color', i, '') as string;

						const body: any = {};
						if (name) body.name = name;
						if (description) body.description = description;
						if (color) body.color = color;

						responseData = await tukiMateRequest.call(this, 'PATCH', `/teams/${teamId}`, body);
					}
				}

				// ==================== PROJECT ====================
				else if (resource === RESOURCES.PROJECT) {
					if (operation === OPERATIONS.LIST) {
						const projectStatusFilter = this.getNodeParameter('projectStatusFilter', i, '') as string;

						const query: Record<string, string> = {};
						if (projectStatusFilter) query.status = projectStatusFilter;

						responseData = await tukiMateRequest.call(this, 'GET', '/projects', undefined, query);
					}
					else if (operation === OPERATIONS.GET) {
						const projectId = this.getNodeParameter('projectId', i) as string;
						responseData = await tukiMateRequest.call(this, 'GET', `/projects/${projectId}`);
					}
					else if (operation === OPERATIONS.CREATE) {
						const name = this.getNodeParameter('name', i) as string;
						const description = this.getNodeParameter('description', i, '') as string;
						const status = this.getNodeParameter('status', i, 'active') as string;

						const body: any = { name };
						if (description) body.description = description;
						if (status) body.status = status;

						responseData = await tukiMateRequest.call(this, 'POST', '/projects', body);
					}
					else if (operation === OPERATIONS.UPDATE) {
						const projectId = this.getNodeParameter('projectId', i) as string;
						const name = this.getNodeParameter('name', i, '') as string;
						const description = this.getNodeParameter('description', i, '') as string;
						const status = this.getNodeParameter('status', i, '') as string;

						const body: any = {};
						if (name) body.name = name;
						if (description) body.description = description;
						if (status) body.status = status;

						responseData = await tukiMateRequest.call(this, 'PATCH', `/projects/${projectId}`, body);
					}
				}

				// ==================== CLIENT ====================
				else if (resource === RESOURCES.CLIENT) {
					if (operation === OPERATIONS.LIST) {
						const clientTypeFilter = this.getNodeParameter('clientTypeFilter', i, '') as string;
						const clientStatusFilter = this.getNodeParameter('clientStatusFilter', i, '') as string;
						const clientTierFilter = this.getNodeParameter('clientTierFilter', i, '') as string;
						const clientSearch = this.getNodeParameter('clientSearch', i, '') as string;
						const clientOrderBy = this.getNodeParameter('clientOrderBy', i, 'name') as string;
						const clientOrder = this.getNodeParameter('clientOrder', i, 'asc') as string;

						const query: Record<string, string> = {};
						if (clientTypeFilter) query.type = clientTypeFilter;
						if (clientStatusFilter) query.status = clientStatusFilter;
						if (clientTierFilter) query.tier = clientTierFilter;
						if (clientSearch) query.search = clientSearch;
						if (clientOrderBy) query.orderBy = clientOrderBy;
						if (clientOrder) query.order = clientOrder;

						responseData = await tukiMateRequest.call(this, 'GET', '/clients', undefined, query);
					}
					else if (operation === OPERATIONS.GET) {
						const clientId = this.getNodeParameter('clientId', i) as string;
						responseData = await tukiMateRequest.call(this, 'GET', `/clients/${clientId}`);
					}
					else if (operation === OPERATIONS.CREATE) {
						const name = this.getNodeParameter('name', i) as string;
						const code = this.getNodeParameter('code', i, '') as string;
						const industry = this.getNodeParameter('industry', i, '') as string;
						const website = this.getNodeParameter('website', i, '') as string;
						const type = this.getNodeParameter('type', i, 'corporate') as string;
						const status = this.getNodeParameter('status', i, 'active') as string;

						const body: any = { name };
						if (code) body.code = code;
						if (industry) body.industry = industry;
						if (website) body.website = website;
						if (type) body.type = type;
						if (status) body.status = status;

						responseData = await tukiMateRequest.call(this, 'POST', '/clients', body);
					}
					else if (operation === OPERATIONS.UPDATE) {
						const clientId = this.getNodeParameter('clientId', i) as string;
						const name = this.getNodeParameter('name', i, '') as string;
						const code = this.getNodeParameter('code', i, '') as string;
						const industry = this.getNodeParameter('industry', i, '') as string;
						const website = this.getNodeParameter('website', i, '') as string;
						const type = this.getNodeParameter('type', i, '') as string;
						const status = this.getNodeParameter('status', i, '') as string;

						const body: any = {};
						if (name) body.name = name;
						if (code) body.code = code;
						if (industry) body.industry = industry;
						if (website) body.website = website;
						if (type) body.type = type;
						if (status) body.status = status;

						responseData = await tukiMateRequest.call(this, 'PATCH', `/clients/${clientId}`, body);
					}
				}

				// ==================== SOURCE ====================
				else if (resource === RESOURCES.SOURCE) {
					if (operation === OPERATIONS.LIST) {
						responseData = await tukiMateRequest.call(this, 'GET', '/sources');
					}
					else if (operation === OPERATIONS.GET) {
						const sourceId = this.getNodeParameter('sourceId', i) as string;
						responseData = await tukiMateRequest.call(this, 'GET', `/sources/${sourceId}`);
					}
					else if (operation === OPERATIONS.CREATE) {
						const key = this.getNodeParameter('key', i) as string;
						const label = this.getNodeParameter('label', i) as string;
						const active = this.getNodeParameter('active', i, true) as boolean;

						const body: any = { key, label, active };

						responseData = await tukiMateRequest.call(this, 'POST', '/sources', body);
					}
					else if (operation === OPERATIONS.UPDATE) {
						const sourceId = this.getNodeParameter('sourceId', i) as string;
						const label = this.getNodeParameter('label', i, '') as string;
						const active = this.getNodeParameter('active', i, undefined) as boolean | undefined;

						const body: any = {};
						if (label) body.label = label;
						if (active !== undefined) body.active = active;

						responseData = await tukiMateRequest.call(this, 'PATCH', `/sources/${sourceId}`, body);
					}
				}

				// ==================== CONVERSATION TYPE ====================
				else if (resource === RESOURCES.CONVERSATION_TYPE) {
					if (operation === OPERATIONS.LIST) {
						responseData = await tukiMateRequest.call(this, 'GET', '/conversation-types');
					}
				}

				// ==================== TAG ====================
				else if (resource === RESOURCES.TAG) {
					if (operation === OPERATIONS.LIST) {
						responseData = await tukiMateRequest.call(this, 'GET', '/tags');
					}
					else if (operation === OPERATIONS.GET) {
						const tagId = this.getNodeParameter('tagId', i) as string;
						responseData = await tukiMateRequest.call(this, 'GET', `/tags/${tagId}`);
					}
					else if (operation === 'getConversationTags') {
						const conversationId = this.getNodeParameter('conversationId', i) as string;
						responseData = await tukiMateRequest.call(this, 'GET', `/conversations/${conversationId}/tags`);
					}
				}

				// Handle response data
				if (responseData) {
					// Check if simplified output is requested
					const simplifiedOutput = this.getNodeParameter('simplifiedOutput', i, false) as boolean;
					if (simplifiedOutput && resource !== RESOURCES.CONVERSATION_TYPE && resource !== RESOURCES.TAG) {
						responseData = simplifyResponse(responseData, resource);
					}

					if (Array.isArray(responseData)) {
						returnData.push(...responseData.map((item) => ({ json: item })));
					} else {
						returnData.push({ json: responseData });
					}
				}
			} catch (error: any) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error.message, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
