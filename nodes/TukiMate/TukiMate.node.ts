import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	INodeParameterResourceLocator,
} from 'n8n-workflow';

const BASE_URL = 'https://app.tukimate.com/api';

// Helper to extract value from resourceLocator parameter
function getResourceLocatorValue(param: INodeParameterResourceLocator | string | undefined): string {
	if (!param) return '';
	if (typeof param === 'string') return param;
	return param.value as string || '';
}

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
	TAG_DEFINITION: 'tagDefinition',
	CATEGORY: 'category',
	ANALYSIS: 'analysis',
	OPPORTUNITY: 'opportunity',
	USAGE: 'usage',
};

// Operation definitions
const OPERATIONS = {
	LIST: 'list',
	GET: 'get',
	CREATE: 'create',
	UPDATE: 'update',
	DELETE: 'delete',
	ANALYZE: 'analyze',
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
	try {
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

		// Handle both array response and nested data (API may use 'teams' key)
		const teams = Array.isArray(response) ? response : (response?.teams || response?.data || []);
		return teams.map((team: any) => ({
			name: team.name,
			value: team.id,
		}));
	} catch (error) {
		console.error('Error loading team options:', error);
		return [];
	}
}

async function getProjectOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	try {
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

		// Handle both array response and nested data (API uses 'projects' key)
		const projects = Array.isArray(response) ? response : (response?.projects || response?.data || []);
		return projects.map((project: any) => ({
			name: project.name,
			value: project.id,
		}));
	} catch (error) {
		console.error('Error loading project options:', error);
		return [];
	}
}

async function getClientOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	try {
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

		// Handle both array response and nested data (API uses 'clients' key)
		const clients = Array.isArray(response) ? response : (response?.clients || response?.data || []);
		return clients.map((client: any) => ({
			name: client.name,
			value: client.id,
		}));
	} catch (error) {
		console.error('Error loading client options:', error);
		return [];
	}
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

// Fields to keep for simplified output per resource (using API field names - snake_case)
const SIMPLIFIED_FIELDS: Record<string, string[]> = {
		conversation: ['id', 'title', 'description', 'date_time', 'duration_minutes', 'team_id', 'project_id', 'client_id', 'source_key', 'source_meeting_id', 'conversation_type_key', 'has_analyses'],

	contact: ['id', 'first_name', 'last_name', 'email', 'phone', 'company_name', 'job_title'],
	team: ['id', 'name', 'description'],
	project: ['id', 'name', 'description', 'status', 'client_id', 'ai_context'],
	client: ['id', 'name', 'code', 'type', 'status', 'industry', 'website'],
	source: ['id', 'key', 'label', 'active'],
	tag: ['id', 'tag'],
	tagDefinition: ['id', 'name', 'category'],
	category: ['id', 'key', 'label', 'active'],
	opportunity: ['id', 'title', 'type', 'status', 'confidence', 'estimated_value', 'currency', 'description', 'expected_close_date', 'conversation_id'],
	analysis: ['id', 'conversation_id', 'status', 'type', 'result'],
};

// Response wrapper keys for list endpoints
const RESPONSE_WRAPPERS: Record<string, string> = {
	conversation: 'data',
	contact: 'contacts',
	project: 'projects',
	client: 'clients',
	category: 'categories',
	opportunity: 'opportunities',
	analysis: 'analyses',
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
					{ name: 'Tag', value: RESOURCES.TAG_DEFINITION },
					{ name: 'Category', value: RESOURCES.CATEGORY },
					{ name: 'Analysis', value: RESOURCES.ANALYSIS },
					{ name: 'Usage', value: RESOURCES.USAGE },
					{ name: 'Opportunity', value: RESOURCES.OPPORTUNITY },
				],
				default: RESOURCES.CONVERSATION,
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
					{ name: 'List', value: OPERATIONS.LIST, description: 'Get a list of conversations', action: 'List conversations' },
					{ name: 'Get', value: OPERATIONS.GET, description: 'Get a single conversation', action: 'Get a conversation' },
					{ name: 'Create', value: OPERATIONS.CREATE, description: 'Create a new conversation', action: 'Create a conversation' },
					{ name: 'Update', value: OPERATIONS.UPDATE, description: 'Update a conversation', action: 'Update a conversation' },
					{ name: 'Analyze', value: OPERATIONS.ANALYZE, description: 'Trigger AI analysis on a conversation', action: 'Analyze a conversation' },
				],
				default: OPERATIONS.LIST,
			},

			// Conversation: Team/Client/Project for CREATE and UPDATE
			{
				displayName: 'Team',
				name: 'teamId',
				type: 'resourceLocator',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: { mode: 'list', value: '' },
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'getTeams',
						},
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						placeholder: 'Enter team ID',
					},
				],
				description: 'Set by team',
			},
			{
				displayName: 'Client',
				name: 'clientId',
				type: 'resourceLocator',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: { mode: 'list', value: '' },
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'getClients',
						},
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						placeholder: 'Enter client ID',
					},
				],
				description: 'Set by client',
			},
			{
				displayName: 'Project',
				name: 'projectId',
				type: 'resourceLocator',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: { mode: 'list', value: '' },
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'getProjects',
						},
					},
					{
						displayName: 'By ID',
						name: 'id',
						type: 'string',
						placeholder: 'Enter project ID',
					},
				],
				description: 'Set by project',
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

			// Conversation List - Additional Options (hidden by default)
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.LIST],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						default: 10,
						description: 'Max number of results to return',
					},
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
									searchListMethod: 'getTeams',
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
					},
					{
						displayName: 'Client',
						name: 'clientId',
						type: 'resourceLocator',
						default: { mode: 'list', value: '' },
						modes: [
							{
								displayName: 'From List',
								name: 'list',
								type: 'list',
								typeOptions: {
									searchListMethod: 'getClients',
								},
							},
							{
								displayName: 'By ID',
								name: 'id',
								type: 'string',
								placeholder: 'Enter client ID',
							},
						],
						description: 'Filter by client',
					},
					{
						displayName: 'Project',
						name: 'projectId',
						type: 'resourceLocator',
						default: { mode: 'list', value: '' },
						modes: [
							{
								displayName: 'From List',
								name: 'list',
								type: 'list',
								typeOptions: {
									searchListMethod: 'getProjects',
								},
							},
							{
								displayName: 'By ID',
								name: 'id',
								type: 'string',
								placeholder: 'Enter project ID',
							},
						],
						description: 'Filter by project',
					},
					{
						displayName: 'External Meeting ID',
						name: 'externalMeetingId',
						type: 'string',
						default: '',
						description: 'Filter by external meeting source ID (e.g., Zoom meeting ID)',
					},
					{
						displayName: 'Offset',
						name: 'offset',
						type: 'number',
						default: 0,
						description: 'Number of results to skip',
					},
					{
						displayName: 'Date From',
						name: 'dateFrom',
						type: 'dateTime',
						default: '',
						description: 'Filter conversations from this date',
					},
					{
						displayName: 'Date To',
						name: 'dateTo',
						type: 'dateTime',
						default: '',
						description: 'Filter conversations to this date',
					},
					{
						displayName: 'Participant',
						name: 'participant',
						type: 'string',
						default: '',
						description: 'Filter by participant name',
					},
					{
						displayName: 'Contact ID',
						name: 'contactIdFilter',
						type: 'string',
						default: '',
						description: 'Filter by contact ID',
					},
					{
						displayName: 'Category',
						name: 'category',
						type: 'string',
						default: '',
						description: 'Filter by category ID',
					},
					{
						displayName: 'Type',
						name: 'conversationTypeFilter',
						type: 'string',
						default: '',
						description: 'Filter by conversation type key',
					},
					{
						displayName: 'Has Analyses',
						name: 'hasAnalyses',
						type: 'boolean',
						default: false,
						description: 'Filter by whether conversation has analyses',
					},
					{
						displayName: 'Source Key',
						name: 'sourceKeyFilter',
						type: 'string',
						default: '',
						description: 'Filter by source key',
					},
					{
						displayName: 'Order By',
						name: 'orderBy',
						type: 'options',
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
						options: [
							{ name: 'Descending', value: 'desc' },
							{ name: 'Ascending', value: 'asc' },
						],
						default: 'desc',
						description: 'Sort order',
					},
				],
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
						operation: [OPERATIONS.GET, OPERATIONS.UPDATE, OPERATIONS.ANALYZE],
					},
				},
				default: '',
				description: 'The ID of the conversation',
			},
			{
				displayName: 'Analysis Config IDs',
				name: 'analysisConfigIds',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.ANALYZE],
					},
				},
				default: '',
				description: 'Comma-separated analysis config IDs to trigger',
			},
			{
				displayName: 'Force',
				name: 'forceAnalyze',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.ANALYZE],
					},
				},
				default: false,
				description: 'Force re-analysis even if already analyzed',
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
				displayName: 'Language',
				name: 'language',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: 'en',
				description: 'Language code (e.g., en, es, pt)',
			},
			{
				displayName: 'Tags',
				name: 'conversationTags',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Comma-separated tags',
			},
			{
				displayName: 'Overview',
				name: 'overview',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Overview or summary of the conversation',
				typeOptions: {
					rows: 4,
				},
			},
			{
				displayName: 'Source',
				name: 'sourceKey',
				type: 'resourceLocator',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: { mode: 'list', value: '' },
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'getSources',
						},
					},
					{
						displayName: 'By Key',
						name: 'key',
						type: 'string',
						placeholder: 'Enter source key',
					},
				],
				description: 'Source of the conversation',
			},
			{
				displayName: 'Conversation Type',
				name: 'conversationTypeKey',
				type: 'resourceLocator',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: { mode: 'list', value: 'meeting' },
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						typeOptions: {
							searchListMethod: 'getConversationTypes',
						},
					},
					{
						displayName: 'By Key',
						name: 'key',
						type: 'string',
						placeholder: 'Enter conversation type key',
					},
				],
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
					{ name: 'List', value: OPERATIONS.LIST, description: 'Get a list of contacts', action: 'List contacts' },
					{ name: 'Get', value: OPERATIONS.GET, description: 'Get a single contact', action: 'Get a contact' },
					{ name: 'Create', value: OPERATIONS.CREATE, description: 'Create a new contact', action: 'Create a contact' },
					{ name: 'Update', value: OPERATIONS.UPDATE, description: 'Update a contact', action: 'Update a contact' },
					{ name: 'Delete', value: OPERATIONS.DELETE, description: 'Delete a contact', action: 'Delete a contact' },
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
						operation: [OPERATIONS.GET, OPERATIONS.UPDATE, OPERATIONS.DELETE],
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
			// Contact CREATE/UPDATE - Additional Options
			{
				displayName: 'Additional Options',
				name: 'contactAdditionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONTACT],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Phone',
						name: 'phone',
						type: 'string',
						default: '',
						description: 'Phone number',
					},
					{
						displayName: 'Company',
						name: 'company',
						type: 'string',
						default: '',
						description: 'Company name',
					},
					{
						displayName: 'Job Title',
						name: 'jobTitle',
						type: 'string',
						default: '',
						description: 'Job title',
					},
					{
						displayName: 'Identifier',
						name: 'identifier',
						type: 'string',
						default: '',
						description: 'Unique identifier for the contact',
					},
					{
						displayName: 'Department',
						name: 'department',
						type: 'string',
						default: '',
						description: 'Department name',
					},
					{
						displayName: 'Tags',
						name: 'contactTags',
						type: 'string',
						default: '',
						description: 'Comma-separated tags',
					},
				],
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
			// Contact LIST - Additional Options
			{
				displayName: 'Additional Options',
				name: 'contactListAdditionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONTACT],
						operation: [OPERATIONS.LIST],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Company',
						name: 'companyFilter',
						type: 'string',
						default: '',
						description: 'Filter by company name',
					},
					{
						displayName: 'Is Active',
						name: 'isActive',
						type: 'boolean',
						default: true,
						description: 'Filter by active status',
					},
					{
						displayName: 'Tags',
						name: 'tagsFilter',
						type: 'string',
						default: '',
						description: 'Filter by comma-separated tags',
					},
					{
						displayName: 'Offset',
						name: 'contactOffset',
						type: 'number',
						default: 0,
						description: 'Number of results to skip',
					},
				],
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
					{ name: 'List', value: OPERATIONS.LIST, description: 'Get a list of teams', action: 'List teams' },
					{ name: 'Get', value: OPERATIONS.GET, description: 'Get a single team', action: 'Get a team' },
					{ name: 'Create', value: OPERATIONS.CREATE, description: 'Create a new team', action: 'Create a team' },
					{ name: 'Update', value: OPERATIONS.UPDATE, description: 'Update a team', action: 'Update a team' },
					{ name: 'Delete', value: OPERATIONS.DELETE, description: 'Delete a team', action: 'Delete a team' },
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
						operation: [OPERATIONS.GET, OPERATIONS.UPDATE, OPERATIONS.DELETE],
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
			// Team CREATE/UPDATE - Additional Options
			{
				displayName: 'Additional Options',
				name: 'teamAdditionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				displayOptions: {
					show: {
						resource: [RESOURCES.TEAM],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						default: '',
						description: 'Description of the team',
					},
					{
						displayName: 'Color',
						name: 'color',
						type: 'string',
						default: '#3b82f6',
						description: 'Color hex code (e.g., #3b82f6)',
					},
				],
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
					{ name: 'List', value: OPERATIONS.LIST, description: 'Get a list of projects', action: 'List projects' },
					{ name: 'Get', value: OPERATIONS.GET, description: 'Get a single project', action: 'Get a project' },
					{ name: 'Create', value: OPERATIONS.CREATE, description: 'Create a new project', action: 'Create a project' },
					{ name: 'Update', value: OPERATIONS.UPDATE, description: 'Update a project', action: 'Update a project' },
					{ name: 'Delete', value: OPERATIONS.DELETE, description: 'Delete a project', action: 'Delete a project' },
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
						operation: [OPERATIONS.GET, OPERATIONS.UPDATE, OPERATIONS.DELETE],
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
					{ name: 'List', value: OPERATIONS.LIST, description: 'Get a list of clients', action: 'List clients' },
					{ name: 'Get', value: OPERATIONS.GET, description: 'Get a single client', action: 'Get a client' },
					{ name: 'Create', value: OPERATIONS.CREATE, description: 'Create a new client', action: 'Create a client' },
					{ name: 'Update', value: OPERATIONS.UPDATE, description: 'Update a client', action: 'Update a client' },
					{ name: 'Delete', value: OPERATIONS.DELETE, description: 'Delete a client', action: 'Delete a client' },
				],
				default: OPERATIONS.LIST,
			},
			// Client List Filters
			// Type Filter with List/Id mode
			{
				displayName: 'Type Filter Mode',
				name: 'clientTypeFilterMode',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.LIST],
					},
				},
				options: [
					{ name: 'From List', value: 'list' },
					{ name: 'Manual', value: 'manual' },
				],
				default: 'list',
				description: 'Choose how to specify the type filter',
			},
			{
				displayName: 'Type Filter',
				name: 'clientTypeFilter',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.LIST],
						clientTypeFilterMode: ['list'],
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
				displayName: 'Type Filter',
				name: 'clientTypeFilterManual',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.LIST],
						clientTypeFilterMode: ['manual'],
					},
				},
				default: '',
				description: 'Filter by client type (corporate, individual, partner, or empty for all)',
			},
			// Status Filter with List/Id mode
			{
				displayName: 'Status Filter Mode',
				name: 'clientStatusFilterMode',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.LIST],
					},
				},
				options: [
					{ name: 'From List', value: 'list' },
					{ name: 'Manual', value: 'manual' },
				],
				default: 'list',
				description: 'Choose how to specify the status filter',
			},
			{
				displayName: 'Status Filter',
				name: 'clientStatusFilter',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.LIST],
						clientStatusFilterMode: ['list'],
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
				displayName: 'Status Filter',
				name: 'clientStatusFilterManual',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.LIST],
						clientStatusFilterMode: ['manual'],
					},
				},
				default: '',
				description: 'Filter by client status (active, inactive, prospect, or empty for all)',
			},
			// Tier Filter with List/Id mode
			{
				displayName: 'Tier Filter Mode',
				name: 'clientTierFilterMode',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.LIST],
					},
				},
				options: [
					{ name: 'From List', value: 'list' },
					{ name: 'Manual', value: 'manual' },
				],
				default: 'list',
				description: 'Choose how to specify the tier filter',
			},
			{
				displayName: 'Tier Filter',
				name: 'clientTierFilter',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.LIST],
						clientTierFilterMode: ['list'],
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
				displayName: 'Tier Filter',
				name: 'clientTierFilterManual',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.LIST],
						clientTierFilterMode: ['manual'],
					},
				},
				default: '',
				description: 'Filter by client tier (standard, premium, enterprise, or empty for all)',
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
			// Order By with List/Manual mode
			{
				displayName: 'Order By Mode',
				name: 'clientOrderByMode',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.LIST],
					},
				},
				options: [
					{ name: 'From List', value: 'list' },
					{ name: 'Manual', value: 'manual' },
				],
				default: 'list',
				description: 'Choose how to specify the order by field',
			},
			{
				displayName: 'Order By',
				name: 'clientOrderBy',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.LIST],
						clientOrderByMode: ['list'],
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
				displayName: 'Order By',
				name: 'clientOrderByManual',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.LIST],
						clientOrderByMode: ['manual'],
					},
				},
				default: 'name',
				description: 'Field to order by (name, created_at)',
			},
			// Order with List/Manual mode
			{
				displayName: 'Order Mode',
				name: 'clientOrderMode',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.LIST],
					},
				},
				options: [
					{ name: 'From List', value: 'list' },
					{ name: 'Manual', value: 'manual' },
				],
				default: 'list',
				description: 'Choose how to specify the sort order',
			},
			{
				displayName: 'Order',
				name: 'clientOrder',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.LIST],
						clientOrderMode: ['list'],
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
				displayName: 'Order',
				name: 'clientOrderManual',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.LIST],
						clientOrderMode: ['manual'],
					},
				},
				default: 'asc',
				description: 'Sort order (asc, desc)',
			},
			{
				displayName: 'Client ID',
				name: 'clientId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.CLIENT],
						operation: [OPERATIONS.GET, OPERATIONS.UPDATE, OPERATIONS.DELETE],
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
					{ name: 'List', value: OPERATIONS.LIST, description: 'Get a list of sources', action: 'List sources' },
					{ name: 'Get', value: OPERATIONS.GET, description: 'Get a single source', action: 'Get a source' },
					{ name: 'Create', value: OPERATIONS.CREATE, description: 'Create a new source', action: 'Create a source' },
					{ name: 'Update', value: OPERATIONS.UPDATE, description: 'Update a source', action: 'Update a source' },
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
					{ name: 'List', value: OPERATIONS.LIST, description: 'Get a list of conversation types', action: 'List conversation types' },
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
					{ name: 'List', value: OPERATIONS.LIST, description: 'Get a list of all available tags', action: 'List tags' },
					{ name: 'Get', value: OPERATIONS.GET, description: 'Get a single tag by ID', action: 'Get a tag' },
					{ name: 'Get Conversation Tags', value: 'getConversationTags', description: 'Get tags for a specific conversation', action: 'Get conversation tags' },
					{ name: 'Delete', value: OPERATIONS.DELETE, description: 'Delete a tag', action: 'Delete a tag' },
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
						operation: [OPERATIONS.GET, OPERATIONS.DELETE],
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

			// ==================== TAG DEFINITION ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.TAG_DEFINITION],
					},
				},
				options: [
					{ name: 'List', value: OPERATIONS.LIST, description: 'Get a list of tag definitions', action: 'List tag definitions' },
					{ name: 'Create', value: OPERATIONS.CREATE, description: 'Create a new tag definition', action: 'Create a tag definition' },
				],
				default: OPERATIONS.LIST,
			},
			{
				displayName: 'Category Filter',
				name: 'tagDefCategory',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.TAG_DEFINITION],
						operation: [OPERATIONS.LIST],
					},
				},
				options: [
					{ name: 'All', value: '' },
					{ name: 'Type', value: 'type' },
					{ name: 'Role', value: 'role' },
					{ name: 'Status', value: 'status' },
					{ name: 'Custom', value: 'custom' },
				],
				default: '',
				description: 'Filter by tag category',
			},
			{
				displayName: 'Name',
				name: 'tagDefName',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.TAG_DEFINITION],
						operation: [OPERATIONS.CREATE],
					},
				},
				default: '',
				description: 'Name of the tag',
			},
			{
				displayName: 'Color',
				name: 'tagDefColor',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.TAG_DEFINITION],
						operation: [OPERATIONS.CREATE],
					},
				},
				default: '#3b82f6',
				description: 'Color hex code',
			},
			{
				displayName: 'Category',
				name: 'tagDefCategoryCreate',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.TAG_DEFINITION],
						operation: [OPERATIONS.CREATE],
					},
				},
				options: [
					{ name: 'Type', value: 'type' },
					{ name: 'Role', value: 'role' },
					{ name: 'Status', value: 'status' },
					{ name: 'Custom', value: 'custom' },
				],
				default: 'custom',
				description: 'Category of the tag',
			},
			{
				displayName: 'Description',
				name: 'tagDefDescription',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.TAG_DEFINITION],
						operation: [OPERATIONS.CREATE],
					},
				},
				default: '',
				description: 'Description of the tag',
			},

			// ==================== CATEGORY ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.CATEGORY],
					},
				},
				options: [
					{ name: 'List', value: OPERATIONS.LIST, description: 'Get a list of categories', action: 'List categories' },
					{ name: 'Get', value: OPERATIONS.GET, description: 'Get a single category', action: 'Get a category' },
					{ name: 'Create', value: OPERATIONS.CREATE, description: 'Create a new category', action: 'Create a category' },
					{ name: 'Update', value: OPERATIONS.UPDATE, description: 'Update a category', action: 'Update a category' },
					{ name: 'Delete', value: OPERATIONS.DELETE, description: 'Delete a category', action: 'Delete a category' },
				],
				default: OPERATIONS.LIST,
			},
			{
				displayName: 'Category ID',
				name: 'categoryId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.CATEGORY],
						operation: [OPERATIONS.GET, OPERATIONS.UPDATE, OPERATIONS.DELETE],
					},
				},
				default: '',
				description: 'The ID of the category',
			},
			{
				displayName: 'Key',
				name: 'categoryKey',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CATEGORY],
						operation: [OPERATIONS.CREATE],
					},
				},
				default: '',
				description: 'Unique key for the category (lowercase alphanumeric)',
			},
			{
				displayName: 'Label',
				name: 'categoryLabel',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.CATEGORY],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Display label for the category',
			},
			{
				displayName: 'Active',
				name: 'categoryActive',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: [RESOURCES.CATEGORY],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: true,
				description: 'Whether the category is active',
			},

			// ==================== ANALYSIS ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.ANALYSIS],
					},
				},
				options: [
					{ name: 'List', value: OPERATIONS.LIST, description: 'Get a list of analyses', action: 'List analyses' },
					{ name: 'Get', value: OPERATIONS.GET, description: 'Get a single analysis', action: 'Get an analysis' },
				],
				default: OPERATIONS.LIST,
			},
			{
				displayName: 'Analysis ID',
				name: 'analysisId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.ANALYSIS],
						operation: [OPERATIONS.GET],
					},
				},
				default: '',
				description: 'The ID of the analysis',
			},
			{
				displayName: 'Conversation ID Filter',
				name: 'analysisConversationId',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.ANALYSIS],
						operation: [OPERATIONS.LIST],
					},
				},
				default: '',
				description: 'Filter by conversation ID',
			},
			{
				displayName: 'Status Filter',
				name: 'analysisStatus',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.ANALYSIS],
						operation: [OPERATIONS.LIST],
					},
				},
				options: [
					{ name: 'All', value: '' },
					{ name: 'Pending', value: 'PENDING' },
					{ name: 'Processing', value: 'PROCESSING' },
					{ name: 'Completed', value: 'COMPLETED' },
					{ name: 'Failed', value: 'FAILED' },
				],
				default: '',
				description: 'Filter by analysis status',
			},
			{
				displayName: 'Limit',
				name: 'analysisLimit',
				type: 'number',
				displayOptions: {
					show: {
						resource: [RESOURCES.ANALYSIS],
						operation: [OPERATIONS.LIST],
					},
				},
				default: 50,
				description: 'Max number of results',
			},
			{
				displayName: 'Offset',
				name: 'analysisOffset',
				type: 'number',
				displayOptions: {
					show: {
						resource: [RESOURCES.ANALYSIS],
						operation: [OPERATIONS.LIST],
					},
				},
				default: 0,
				description: 'Number of results to skip',
			},

			// ==================== USAGE ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.USAGE],
					},
				},
				options: [
					{ name: 'Get Stats', value: 'getStats', description: 'Get usage statistics' },
				],
				default: 'getStats',
			},

			// ==================== OPPORTUNITY ====================
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.OPPORTUNITY],
					},
				},
				options: [
					{ name: 'List', value: OPERATIONS.LIST, description: 'Get a list of opportunities', action: 'List opportunities' },
					{ name: 'Get', value: OPERATIONS.GET, description: 'Get a single opportunity', action: 'Get an opportunity' },
					{ name: 'Create', value: OPERATIONS.CREATE, description: 'Create a new opportunity', action: 'Create an opportunity' },
					{ name: 'Update', value: OPERATIONS.UPDATE, description: 'Update an opportunity', action: 'Update an opportunity' },
				],
				default: OPERATIONS.LIST,
			},
			{
				displayName: 'Opportunity ID',
				name: 'opportunityId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: [RESOURCES.OPPORTUNITY],
						operation: [OPERATIONS.GET, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'The ID of the opportunity',
			},
			{
				displayName: 'Title',
				name: 'opportunityTitle',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.OPPORTUNITY],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Title of the opportunity',
			},
			{
				displayName: 'Type',
				name: 'opportunityType',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.OPPORTUNITY],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				options: [
					{ name: 'New Sale', value: 'nueva_venta' },
					{ name: 'Upselling', value: 'upselling' },
					{ name: 'Renewal/Retention', value: 'renovacion_retencion' },
					{ name: 'Cross Sell', value: 'cross_sell' },
				],
				default: 'nueva_venta',
				description: 'Type of opportunity',
			},
			{
				displayName: 'Status',
				name: 'opportunityStatus',
				type: 'options',
				displayOptions: {
					show: {
						resource: [RESOURCES.OPPORTUNITY],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE, OPERATIONS.LIST],
					},
				},
				options: [
					{ name: 'All', value: '' },
					{ name: 'Pending', value: 'pending' },
					{ name: 'Approved', value: 'approved' },
					{ name: 'Rejected', value: 'rejected' },
					{ name: 'Converted', value: 'converted' },
				],
				default: '',
				description: 'Status of the opportunity',
			},
			{
				displayName: 'Confidence',
				name: 'opportunityConfidence',
				type: 'number',
				displayOptions: {
					show: {
						resource: [RESOURCES.OPPORTUNITY],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: 0.5,
				description: 'Confidence score (0-1)',
			},
			{
				displayName: 'Estimated Value',
				name: 'opportunityValue',
				type: 'number',
				displayOptions: {
					show: {
						resource: [RESOURCES.OPPORTUNITY],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: 0,
				description: 'Estimated value of the opportunity',
			},
			{
				displayName: 'Currency',
				name: 'opportunityCurrency',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.OPPORTUNITY],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: 'USD',
				description: 'Currency code (e.g., USD, EUR)',
			},
			{
				displayName: 'Description',
				name: 'opportunityDescription',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.OPPORTUNITY],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Description of the opportunity',
				typeOptions: {
					rows: 4,
				},
			},
			{
				displayName: 'Signals',
				name: 'opportunitySignals',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.OPPORTUNITY],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Comma-separated signals/indicators',
			},
			{
				displayName: 'Expected Close Date',
				name: 'opportunityCloseDate',
				type: 'dateTime',
				displayOptions: {
					show: {
						resource: [RESOURCES.OPPORTUNITY],
						operation: [OPERATIONS.CREATE, OPERATIONS.UPDATE],
					},
				},
				default: '',
				description: 'Expected close date',
			},
			{
				displayName: 'Conversation ID',
				name: 'opportunityConversationId',
				type: 'string',
				displayOptions: {
					show: {
						resource: [RESOURCES.OPPORTUNITY],
						operation: [OPERATIONS.CREATE, OPERATIONS.LIST],
					},
				},
				default: '',
				description: 'Related conversation ID',
			},
			{
				displayName: 'Limit',
				name: 'opportunityLimit',
				type: 'number',
				displayOptions: {
					show: {
						resource: [RESOURCES.OPPORTUNITY],
						operation: [OPERATIONS.LIST],
					},
				},
				default: 50,
				description: 'Max number of results',
			},
			{
				displayName: 'Offset',
				name: 'opportunityOffset',
				type: 'number',
				displayOptions: {
					show: {
						resource: [RESOURCES.OPPORTUNITY],
						operation: [OPERATIONS.LIST],
					},
				},
				default: 0,
				description: 'Number of results to skip',
			},

			// ==================== SIMPLIFIED OUTPUT (common option) ====================
			{
				displayName: 'Simplified Output',
				name: 'simplifiedOutput',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: [RESOURCES.CONVERSATION, RESOURCES.CONTACT, RESOURCES.TEAM, RESOURCES.PROJECT, RESOURCES.CLIENT, RESOURCES.SOURCE, RESOURCES.TAG, RESOURCES.TAG_DEFINITION],
						operation: [OPERATIONS.LIST, OPERATIONS.GET],
					},
				},
				default: false,
				description: 'Return only essential fields and exclude internal fields like tenant_id, created_at, etc.',
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

						// Additional options (includes Limit, Team, Client, Project filters)
						const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as {
							limit?: number;
							teamId?: INodeParameterResourceLocator;
							clientId?: INodeParameterResourceLocator;
							projectId?: INodeParameterResourceLocator;
							externalMeetingId?: string;
							offset?: number;
							dateFrom?: string;
							dateTo?: string;
							participant?: string;
							contactIdFilter?: string;
							category?: string;
							conversationTypeFilter?: string;
							hasAnalyses?: boolean;
							sourceKeyFilter?: string;
							orderBy?: string;
							order?: string;
						};

						const query: Record<string, string | number | boolean> = {};
						if (search) query.q = search;
						query.limit = additionalOptions.limit ?? 10;
						// Filters from additional options
						const teamIdValue = getResourceLocatorValue(additionalOptions.teamId);
						const clientIdValue = getResourceLocatorValue(additionalOptions.clientId);
						const projectIdValue = getResourceLocatorValue(additionalOptions.projectId);
						if (teamIdValue) query.team = teamIdValue;
						if (clientIdValue) query.client = clientIdValue;
						if (projectIdValue) query.project = projectIdValue;
						if (additionalOptions.externalMeetingId) query.sourceMeetingId = additionalOptions.externalMeetingId;
						if (additionalOptions.offset !== undefined) query.offset = additionalOptions.offset;
						if (additionalOptions.dateFrom) query.dateFrom = additionalOptions.dateFrom;
						if (additionalOptions.dateTo) query.dateTo = additionalOptions.dateTo;
						if (additionalOptions.participant) query.participant = additionalOptions.participant;
						if (additionalOptions.contactIdFilter) query.contactId = additionalOptions.contactIdFilter;
						if (additionalOptions.category) query.category = additionalOptions.category;
						if (additionalOptions.conversationTypeFilter) query.conversation_type_key = additionalOptions.conversationTypeFilter;
						if (additionalOptions.hasAnalyses) query.hasAnalyses = additionalOptions.hasAnalyses;
						if (additionalOptions.sourceKeyFilter) query.source_key = additionalOptions.sourceKeyFilter;
						if (additionalOptions.orderBy) query.orderBy = additionalOptions.orderBy;
						if (additionalOptions.order) query.order = additionalOptions.order;

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
						const sourceKeyParam = this.getNodeParameter('sourceKey', i, { mode: 'list', value: '' }) as INodeParameterResourceLocator;
						const conversationTypeKeyParam = this.getNodeParameter('conversationTypeKey', i, { mode: 'list', value: 'meeting' }) as INodeParameterResourceLocator;
						const teamIdParam = this.getNodeParameter('teamId', i, { mode: 'list', value: '' }) as INodeParameterResourceLocator;
						const projectIdParam = this.getNodeParameter('projectId', i, { mode: 'list', value: '' }) as INodeParameterResourceLocator;
						const clientIdParam = this.getNodeParameter('clientId', i, { mode: 'list', value: '' }) as INodeParameterResourceLocator;
						const sourceKey = getResourceLocatorValue(sourceKeyParam);
						const conversationTypeKey = getResourceLocatorValue(conversationTypeKeyParam) || 'meeting';
						const teamId = getResourceLocatorValue(teamIdParam);
						const projectId = getResourceLocatorValue(projectIdParam);
						const clientId = getResourceLocatorValue(clientIdParam);
						const description = this.getNodeParameter('description', i, '') as string;
						const participantsData = this.getNodeParameter('participants', i, {}) as any;
						const language = this.getNodeParameter('language', i, 'en') as string;
						const conversationTags = this.getNodeParameter('conversationTags', i, '') as string;
						const overview = this.getNodeParameter('overview', i, '') as string;

						const body: any = {
							title,
							date_time: dateTime,
							duration_minutes: durationMinutes,
							transcript,
							source_key: sourceKey || 'api',
							conversation_type_key: conversationTypeKey,
						};

						if (sourceConversationId) body.source_meeting_id = sourceConversationId;
						if (teamId) body.team_id = teamId;
						if (projectId) body.project_id = projectId;
						if (clientId) body.client_id = clientId;
						if (description) body.description = description;
						if (participantsData.participant) {
							body.participants = participantsData.participant;
						}
						if (language) body.language = language;
						if (conversationTags) body.tags = conversationTags.split(',').map(t => t.trim());
						if (overview) body.overview = overview;

						responseData = await tukiMateRequest.call(this, 'POST', '/conversations', body);
					}
					else if (operation === OPERATIONS.UPDATE) {
						const conversationId = this.getNodeParameter('conversationId', i) as string;
						const title = this.getNodeParameter('title', i, '') as string;
						const durationMinutes = this.getNodeParameter('durationMinutes', i, undefined) as number | undefined;
						const transcript = this.getNodeParameter('transcript', i, '') as string;
						const sourceConversationId = this.getNodeParameter('sourceConversationId', i, '') as string;
						const sourceKeyParam = this.getNodeParameter('sourceKey', i, { mode: 'list', value: '' }) as INodeParameterResourceLocator;
						const conversationTypeKeyParam = this.getNodeParameter('conversationTypeKey', i, { mode: 'list', value: '' }) as INodeParameterResourceLocator;
						const teamIdParam = this.getNodeParameter('teamId', i, { mode: 'list', value: '' }) as INodeParameterResourceLocator;
						const projectIdParam = this.getNodeParameter('projectId', i, { mode: 'list', value: '' }) as INodeParameterResourceLocator;
						const clientIdParam = this.getNodeParameter('clientId', i, { mode: 'list', value: '' }) as INodeParameterResourceLocator;
						const sourceKey = getResourceLocatorValue(sourceKeyParam);
						const conversationTypeKey = getResourceLocatorValue(conversationTypeKeyParam);
						const teamId = getResourceLocatorValue(teamIdParam);
						const projectId = getResourceLocatorValue(projectIdParam);
						const clientId = getResourceLocatorValue(clientIdParam);
						const description = this.getNodeParameter('description', i, '') as string;
						const participantsData = this.getNodeParameter('participants', i, {}) as any;
						const language = this.getNodeParameter('language', i, 'en') as string;
						const conversationTags = this.getNodeParameter('conversationTags', i, '') as string;
						const overview = this.getNodeParameter('overview', i, '') as string;

						const body: any = {};
						if (title) body.title = title;
						if (durationMinutes !== undefined) body.duration_minutes = durationMinutes;
						if (transcript) body.transcript = transcript;
						if (sourceConversationId) body.source_meeting_id = sourceConversationId;
						if (sourceKey) body.source_key = sourceKey;
						if (conversationTypeKey) body.conversation_type_key = conversationTypeKey;
						if (teamId) body.team_id = teamId;
						if (projectId) body.project_id = projectId;
						if (clientId) body.client_id = clientId;
						if (description) body.description = description;
						if (participantsData.participant) {
							body.participants = participantsData.participant;
						}
						if (language) body.language = language;
						if (conversationTags) body.tags = conversationTags.split(',').map(t => t.trim());
						if (overview) body.overview = overview;

						responseData = await tukiMateRequest.call(this, 'PATCH', `/conversations/${conversationId}`, body);
					}
					else if (operation === OPERATIONS.ANALYZE) {
						const conversationId = this.getNodeParameter('conversationId', i) as string;
						const analysisConfigIds = this.getNodeParameter('analysisConfigIds', i, '') as string;
						const forceAnalyze = this.getNodeParameter('forceAnalyze', i, false) as boolean;

						const body: any = {};
						if (analysisConfigIds) {
							body.analysisConfigIds = analysisConfigIds.split(',').map(id => id.trim());
						}
						if (forceAnalyze) {
							body.force = true;
						}

						responseData = await tukiMateRequest.call(this, 'POST', `/conversations/${conversationId}/analyze`, body);
					}
				}

				// ==================== CONTACT ====================
				else if (resource === RESOURCES.CONTACT) {
					if (operation === OPERATIONS.LIST) {
						const contactSearch = this.getNodeParameter('contactSearch', i, '') as string;
						const contactLimit = this.getNodeParameter('contactLimit', i, 100) as number;

						// Additional options
						const additionalOptions = this.getNodeParameter('contactListAdditionalOptions', i, {}) as {
							companyFilter?: string;
							isActive?: boolean;
							tagsFilter?: string;
							contactOffset?: number;
						};

						const query: Record<string, string | number | boolean> = { limit: contactLimit };
						if (contactSearch) query.search = contactSearch;
						if (additionalOptions.companyFilter) query.company = additionalOptions.companyFilter;
						if (additionalOptions.isActive !== undefined) query.is_active = additionalOptions.isActive;
						if (additionalOptions.tagsFilter) query.tags = additionalOptions.tagsFilter;
						if (additionalOptions.contactOffset !== undefined) query.offset = additionalOptions.contactOffset;

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

						// Additional options
						const additionalOptions = this.getNodeParameter('contactAdditionalOptions', i, {}) as {
							phone?: string;
							company?: string;
							jobTitle?: string;
							identifier?: string;
							department?: string;
							contactTags?: string;
						};

						const body: any = { first_name: firstName, last_name: lastName };
						if (email) body.email = email;
						if (additionalOptions.phone) body.phone = additionalOptions.phone;
						if (additionalOptions.company) body.company_name = additionalOptions.company;
						if (additionalOptions.jobTitle) body.job_title = additionalOptions.jobTitle;
						if (additionalOptions.identifier) body.identifier = additionalOptions.identifier;
						if (additionalOptions.department) body.department = additionalOptions.department;
						if (additionalOptions.contactTags) body.tags = additionalOptions.contactTags.split(',').map((t: string) => t.trim());

						responseData = await tukiMateRequest.call(this, 'POST', '/contacts', body);
					}
					else if (operation === OPERATIONS.UPDATE) {
						const contactId = this.getNodeParameter('contactId', i) as string;
						const firstName = this.getNodeParameter('firstName', i, '') as string;
						const lastName = this.getNodeParameter('lastName', i, '') as string;
						const email = this.getNodeParameter('email', i, '') as string;

						// Additional options
						const additionalOptions = this.getNodeParameter('contactAdditionalOptions', i, {}) as {
							phone?: string;
							company?: string;
							jobTitle?: string;
							identifier?: string;
							department?: string;
							contactTags?: string;
						};

						const body: any = {};
						if (firstName) body.first_name = firstName;
						if (lastName) body.last_name = lastName;
						if (email) body.email = email;
						if (additionalOptions.phone) body.phone = additionalOptions.phone;
						if (additionalOptions.company) body.company_name = additionalOptions.company;
						if (additionalOptions.jobTitle) body.job_title = additionalOptions.jobTitle;
						if (additionalOptions.identifier) body.identifier = additionalOptions.identifier;
						if (additionalOptions.department) body.department = additionalOptions.department;
						if (additionalOptions.contactTags) body.tags = additionalOptions.contactTags.split(',').map((t: string) => t.trim());

						responseData = await tukiMateRequest.call(this, 'PATCH', `/contacts/${contactId}`, body);
					}
					else if (operation === OPERATIONS.DELETE) {
						const contactId = this.getNodeParameter('contactId', i) as string;
						responseData = await tukiMateRequest.call(this, 'DELETE', `/contacts/${contactId}`);
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

						// Additional options
						const additionalOptions = this.getNodeParameter('teamAdditionalOptions', i, {}) as {
							description?: string;
							color?: string;
						};

						const body: any = { name };
						if (additionalOptions.description) body.description = additionalOptions.description;
						if (additionalOptions.color) body.color = additionalOptions.color;

						responseData = await tukiMateRequest.call(this, 'POST', '/teams', body);
					}
					else if (operation === OPERATIONS.UPDATE) {
						const teamId = this.getNodeParameter('teamId', i) as string;
						const name = this.getNodeParameter('name', i, '') as string;

						// Additional options
						const additionalOptions = this.getNodeParameter('teamAdditionalOptions', i, {}) as {
							description?: string;
							color?: string;
						};

						const body: any = {};
						if (name) body.name = name;
						if (additionalOptions.description) body.description = additionalOptions.description;
						if (additionalOptions.color) body.color = additionalOptions.color;

						responseData = await tukiMateRequest.call(this, 'PATCH', `/teams/${teamId}`, body);
					}
					else if (operation === OPERATIONS.DELETE) {
						const teamId = this.getNodeParameter('teamId', i) as string;
						responseData = await tukiMateRequest.call(this, 'DELETE', `/teams/${teamId}`);
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
					else if (operation === OPERATIONS.DELETE) {
						const projectId = this.getNodeParameter('projectId', i) as string;
						responseData = await tukiMateRequest.call(this, 'DELETE', `/projects/${projectId}`);
					}
				}

				// ==================== CLIENT ====================
				else if (resource === RESOURCES.CLIENT) {
					if (operation === OPERATIONS.LIST) {
						// Get filter values based on mode
						const clientTypeFilterMode = this.getNodeParameter('clientTypeFilterMode', i, 'list') as string;
						const clientStatusFilterMode = this.getNodeParameter('clientStatusFilterMode', i, 'list') as string;
						const clientTierFilterMode = this.getNodeParameter('clientTierFilterMode', i, 'list') as string;

						const clientTypeFilter = clientTypeFilterMode === 'manual'
							? this.getNodeParameter('clientTypeFilterManual', i, '') as string
							: this.getNodeParameter('clientTypeFilter', i, '') as string;
						const clientStatusFilter = clientStatusFilterMode === 'manual'
							? this.getNodeParameter('clientStatusFilterManual', i, '') as string
							: this.getNodeParameter('clientStatusFilter', i, '') as string;
						const clientTierFilter = clientTierFilterMode === 'manual'
							? this.getNodeParameter('clientTierFilterManual', i, '') as string
							: this.getNodeParameter('clientTierFilter', i, '') as string;

						const clientSearch = this.getNodeParameter('clientSearch', i, '') as string;

						// Order By and Order modes
						const clientOrderByMode = this.getNodeParameter('clientOrderByMode', i, 'list') as string;
						const clientOrderMode = this.getNodeParameter('clientOrderMode', i, 'list') as string;
						const clientOrderBy = clientOrderByMode === 'manual'
							? this.getNodeParameter('clientOrderByManual', i, 'name') as string
							: this.getNodeParameter('clientOrderBy', i, 'name') as string;
						const clientOrder = clientOrderMode === 'manual'
							? this.getNodeParameter('clientOrderManual', i, 'asc') as string
							: this.getNodeParameter('clientOrder', i, 'asc') as string;

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
					else if (operation === OPERATIONS.DELETE) {
						const clientId = this.getNodeParameter('clientId', i) as string;
						responseData = await tukiMateRequest.call(this, 'DELETE', `/clients/${clientId}`);
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
					else if (operation === OPERATIONS.DELETE) {
						const tagId = this.getNodeParameter('tagId', i) as string;
						responseData = await tukiMateRequest.call(this, 'DELETE', `/tags/${tagId}`);
					}
				}

				// ==================== TAG DEFINITION ====================
				else if (resource === RESOURCES.TAG_DEFINITION) {
					if (operation === OPERATIONS.LIST) {
						const tagDefCategory = this.getNodeParameter('tagDefCategory', i, '') as string;
						const query: Record<string, string> = {};
						if (tagDefCategory) query.category = tagDefCategory;

						responseData = await tukiMateRequest.call(this, 'GET', '/tag-definitions', undefined, query);
					}
					else if (operation === OPERATIONS.CREATE) {
						const tagDefName = this.getNodeParameter('tagDefName', i) as string;
						const tagDefColor = this.getNodeParameter('tagDefColor', i, '#3b82f6') as string;
						const tagDefCategoryCreate = this.getNodeParameter('tagDefCategoryCreate', i, 'custom') as string;
						const tagDefDescription = this.getNodeParameter('tagDefDescription', i, '') as string;

						const body: any = { name: tagDefName, color: tagDefColor, category: tagDefCategoryCreate };
						if (tagDefDescription) body.description = tagDefDescription;

						responseData = await tukiMateRequest.call(this, 'POST', '/tag-definitions', body);
					}
				}

				// ==================== CATEGORY ====================
				else if (resource === RESOURCES.CATEGORY) {
					if (operation === OPERATIONS.LIST) {
						responseData = await tukiMateRequest.call(this, 'GET', '/categories');
					}
					else if (operation === OPERATIONS.GET) {
						const categoryId = this.getNodeParameter('categoryId', i) as string;
						responseData = await tukiMateRequest.call(this, 'GET', `/categories/${categoryId}`);
					}
					else if (operation === OPERATIONS.CREATE) {
						const categoryKey = this.getNodeParameter('categoryKey', i) as string;
						const categoryLabel = this.getNodeParameter('categoryLabel', i) as string;
						const categoryActive = this.getNodeParameter('categoryActive', i, true) as boolean;

						const body: any = { key: categoryKey, label: categoryLabel, active: categoryActive };
						responseData = await tukiMateRequest.call(this, 'POST', '/categories', body);
					}
					else if (operation === OPERATIONS.UPDATE) {
						const categoryId = this.getNodeParameter('categoryId', i) as string;
						const categoryLabel = this.getNodeParameter('categoryLabel', i, '') as string;
						const categoryActive = this.getNodeParameter('categoryActive', i, undefined) as boolean | undefined;

						const body: any = {};
						if (categoryLabel) body.label = categoryLabel;
						if (categoryActive !== undefined) body.active = categoryActive;

						responseData = await tukiMateRequest.call(this, 'PATCH', `/categories/${categoryId}`, body);
					}
					else if (operation === OPERATIONS.DELETE) {
						const categoryId = this.getNodeParameter('categoryId', i) as string;
						responseData = await tukiMateRequest.call(this, 'DELETE', `/categories/${categoryId}`);
					}
				}

				// ==================== USAGE ====================
				else if (resource === RESOURCES.USAGE) {
					if (operation === 'getStats') {
						responseData = await tukiMateRequest.call(this, 'GET', '/usage/stats');
					}
				}

				// ==================== ANALYSIS ====================
				else if (resource === RESOURCES.ANALYSIS) {
					if (operation === OPERATIONS.LIST) {
						const analysisConversationId = this.getNodeParameter('analysisConversationId', i, '') as string;
						const analysisStatus = this.getNodeParameter('analysisStatus', i, '') as string;
						const analysisLimit = this.getNodeParameter('analysisLimit', i, 50) as number;
						const analysisOffset = this.getNodeParameter('analysisOffset', i, 0) as number;

						const query: Record<string, string | number> = { limit: analysisLimit, offset: analysisOffset };
						if (analysisConversationId) query.conversationId = analysisConversationId;
						if (analysisStatus) query.status = analysisStatus;

						responseData = await tukiMateRequest.call(this, 'GET', '/analyses', undefined, query);
					}
					else if (operation === OPERATIONS.GET) {
						const analysisId = this.getNodeParameter('analysisId', i) as string;
						responseData = await tukiMateRequest.call(this, 'GET', `/analyses/${analysisId}`);
					}
				}

				// ==================== OPPORTUNITY ====================
				else if (resource === RESOURCES.OPPORTUNITY) {
					if (operation === OPERATIONS.LIST) {
						const opportunityStatus = this.getNodeParameter('opportunityStatus', i, '') as string;
						const opportunityConversationId = this.getNodeParameter('opportunityConversationId', i, '') as string;
						const opportunityLimit = this.getNodeParameter('opportunityLimit', i, 50) as number;
						const opportunityOffset = this.getNodeParameter('opportunityOffset', i, 0) as number;

						const query: Record<string, string | number> = { limit: opportunityLimit, offset: opportunityOffset };
						if (opportunityStatus) query.status = opportunityStatus;
						if (opportunityConversationId) query.conversationId = opportunityConversationId;

						responseData = await tukiMateRequest.call(this, 'GET', '/opportunities', undefined, query);
					}
					else if (operation === OPERATIONS.GET) {
						const opportunityId = this.getNodeParameter('opportunityId', i) as string;
						responseData = await tukiMateRequest.call(this, 'GET', `/opportunities/${opportunityId}`);
					}
					else if (operation === OPERATIONS.CREATE) {
						const opportunityTitle = this.getNodeParameter('opportunityTitle', i) as string;
						const opportunityType = this.getNodeParameter('opportunityType', i, 'nueva_venta') as string;
						const opportunityStatus = this.getNodeParameter('opportunityStatus', i, 'pending') as string;
						const opportunityConfidence = this.getNodeParameter('opportunityConfidence', i, 0.5) as number;
						const opportunityValue = this.getNodeParameter('opportunityValue', i, 0) as number;
						const opportunityCurrency = this.getNodeParameter('opportunityCurrency', i, 'USD') as string;
						const opportunityDescription = this.getNodeParameter('opportunityDescription', i, '') as string;
						const opportunitySignals = this.getNodeParameter('opportunitySignals', i, '') as string;
						const opportunityCloseDate = this.getNodeParameter('opportunityCloseDate', i, '') as string;
						const opportunityConversationId = this.getNodeParameter('opportunityConversationId', i, '') as string;

						const body: any = {
							title: opportunityTitle,
							type: opportunityType,
							status: opportunityStatus || 'pending',
							confidence: opportunityConfidence,
							estimated_value: opportunityValue,
							currency: opportunityCurrency,
						};
						if (opportunityDescription) body.description = opportunityDescription;
						if (opportunitySignals) body.signals = opportunitySignals.split(',').map(s => s.trim());
						if (opportunityCloseDate) body.expected_close_date = opportunityCloseDate;
						if (opportunityConversationId) body.conversation_id = opportunityConversationId;

						responseData = await tukiMateRequest.call(this, 'POST', '/opportunities', body);
					}
					else if (operation === OPERATIONS.UPDATE) {
						const opportunityId = this.getNodeParameter('opportunityId', i) as string;
						const opportunityTitle = this.getNodeParameter('opportunityTitle', i, '') as string;
						const opportunityType = this.getNodeParameter('opportunityType', i, '') as string;
						const opportunityStatus = this.getNodeParameter('opportunityStatus', i, '') as string;
						const opportunityConfidence = this.getNodeParameter('opportunityConfidence', i, undefined) as number | undefined;
						const opportunityValue = this.getNodeParameter('opportunityValue', i, undefined) as number | undefined;
						const opportunityCurrency = this.getNodeParameter('opportunityCurrency', i, '') as string;
						const opportunityDescription = this.getNodeParameter('opportunityDescription', i, '') as string;
						const opportunitySignals = this.getNodeParameter('opportunitySignals', i, '') as string;
						const opportunityCloseDate = this.getNodeParameter('opportunityCloseDate', i, '') as string;

						const body: any = {};
						if (opportunityTitle) body.title = opportunityTitle;
						if (opportunityType) body.type = opportunityType;
						if (opportunityStatus) body.status = opportunityStatus;
						if (opportunityConfidence !== undefined) body.confidence = opportunityConfidence;
						if (opportunityValue !== undefined) body.estimated_value = opportunityValue;
						if (opportunityCurrency) body.currency = opportunityCurrency;
						if (opportunityDescription) body.description = opportunityDescription;
						if (opportunitySignals) body.signals = opportunitySignals.split(',').map(s => s.trim());
						if (opportunityCloseDate) body.expected_close_date = opportunityCloseDate;

						responseData = await tukiMateRequest.call(this, 'PATCH', `/opportunities/${opportunityId}`, body);
					}
				}

				// Handle response data
				if (responseData) {
					// Extract array from wrapper key if present (e.g., { contacts: [...] } -> [...])
					const wrapperKey = RESPONSE_WRAPPERS[resource];
					if (wrapperKey && responseData[wrapperKey] && Array.isArray(responseData[wrapperKey])) {
						responseData = responseData[wrapperKey];
					}

					// Check if simplified output is requested
					const simplifiedOutput = this.getNodeParameter('simplifiedOutput', i, false) as boolean;
					if (simplifiedOutput && resource !== RESOURCES.CONVERSATION_TYPE) {
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
