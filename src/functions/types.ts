// src/functions/types.ts
// Standard Forge function and trigger types

export interface ForgeRequest {
  json?: () => Promise<any>;
  body?: any;
  payload?: any;
  context?: any;
  headers?: Record<string, string[]>;
  method?: string;
  queryParams?: Record<string, string[]>;
}

export interface ForgeResponse {
  status?: number;
  statusCode?: number;
  body: any;
  headers?: Record<string, string[]>;
}

export async function parseRequestBody(req: any): Promise<any> {
  if (req && typeof req.json === 'function') {
    return await req.json();
  }
  if (req && req.payload) {
    return req.payload;
  }
  if (req && req.body) {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body);
      } catch {
        return req.body;
      }
    }
    return req.body;
  }
  return req || {};
}
