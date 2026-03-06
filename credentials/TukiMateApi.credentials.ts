import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TukiMateApi implements ICredentialType {
	name = 'tukiMateApi';
	displayName = 'TukiMate API';
	documentationUrl = 'https://app.tukimate.com/api-docs';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your TukiMate API key (starts with tuki_)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://app.tukimate.com/api',
			url: '/conversation-types',
			method: 'GET',
		},
	};
}
