// packages/engine/src/errors.ts

export class ParallelOSError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ParallelOSError';
  }
}

export class ValidationError extends ParallelOSError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ParallelOSError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', 404, { resource, id });
    this.name = 'NotFoundError';
  }
}

export class AuthorizationError extends ParallelOSError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class SimulationError extends ParallelOSError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'SIMULATION_ERROR', 500, details);
    this.name = 'SimulationError';
  }
}

export class AIProviderError extends ParallelOSError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'AI_PROVIDER_ERROR', 502, details);
    this.name = 'AIProviderError';
  }
}

export class AtlassianError extends ParallelOSError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'ATLASSIAN_ERROR', 502, details);
    this.name = 'AtlassianError';
  }
}

export function isParallelOSError(error: unknown): error is ParallelOSError {
  return error instanceof ParallelOSError;
}

export function formatError(error: unknown): { message: string; code: string; statusCode: number } {
  if (isParallelOSError(error)) {
    return { message: error.message, code: error.code, statusCode: error.statusCode };
  }
  if (error instanceof Error) {
    return { message: error.message, code: 'UNKNOWN_ERROR', statusCode: 500 };
  }
  return { message: String(error), code: 'UNKNOWN_ERROR', statusCode: 500 };
}