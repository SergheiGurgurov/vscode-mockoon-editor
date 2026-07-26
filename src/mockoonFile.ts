import { MockoonEnvironment, MockoonResponse, ParseResult } from './types';

export function parseMockoonEnvironment(text: string): ParseResult {
  let value: unknown;

  try {
    value = JSON.parse(text);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'The file is not valid JSON.'
    };
  }

  if (!isObject(value)) {
    return { ok: false, error: 'The Mockoon environment must be a JSON object.' };
  }

  if (!Array.isArray(value.routes)) {
    return { ok: false, error: 'The Mockoon environment must contain a routes array.' };
  }

  if (typeof value.port !== 'number') {
    return { ok: false, error: 'The Mockoon environment must contain a numeric port.' };
  }

  if (typeof value.latency !== 'number') {
    return { ok: false, error: 'The Mockoon environment must contain a numeric latency.' };
  }

  return { ok: true, environment: value as MockoonEnvironment };
}

export function stringifyEnvironment(environment: MockoonEnvironment): string {
  return `${JSON.stringify(environment, null, 2)}\n`;
}

export function createResponse(routeResponses: MockoonResponse[]): MockoonResponse {
  const template = routeResponses[0];

  return {
    uuid: randomId(),
    body: '',
    latency: 0,
    statusCode: 200,
    label: 'new response',
    headers: template?.headers ? structuredClone(template.headers) : [{ key: 'Content-Type', value: 'application/json' }],
    bodyType: 'INLINE',
    filePath: '',
    databucketID: '',
    sendFileAsBody: false,
    rules: [],
    rulesOperator: 'OR',
    disableTemplating: false,
    fallbackTo404: false,
    default: routeResponses.length === 0,
    crudKey: 'id',
    callbacks: []
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const value = Math.floor(Math.random() * 16);
    const replacement = character === 'x' ? value : (value & 0x3) | 0x8;
    return replacement.toString(16);
  });
}
