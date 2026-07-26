export interface MockoonHeader {
  key: string;
  value: string;
  [field: string]: unknown;
}

export interface MockoonDataBucket {
  uuid: string;
  id: string;
  name: string;
  value: string;
  [field: string]: unknown;
}

export interface MockoonResponse {
  uuid: string;
  body: string;
  latency: number;
  statusCode: number;
  label: string;
  headers: MockoonHeader[];
  bodyType: string;
  filePath: string;
  databucketID: string;
  sendFileAsBody: boolean;
  rules: unknown[];
  rulesOperator: string;
  disableTemplating: boolean;
  fallbackTo404: boolean;
  default: boolean;
  crudKey: string;
  callbacks: unknown[];
  [field: string]: unknown;
}

export interface MockoonRoute {
  uuid: string;
  type: string;
  documentation?: string;
  method: string;
  endpoint: string;
  responses: MockoonResponse[];
  [field: string]: unknown;
}

export interface MockoonEnvironment {
  uuid?: string;
  name?: string;
  latency: number;
  port: number;
  data?: MockoonDataBucket[];
  routes: MockoonRoute[];
  [field: string]: unknown;
}

export type ParseResult =
  | { ok: true; environment: MockoonEnvironment }
  | { ok: false; error: string };
