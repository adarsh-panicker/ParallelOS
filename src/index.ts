import Resolver from '@forge/resolver';
import { kvs } from '@forge/kvs';
import { z } from 'zod';

// Define the entity schema for our demo storage test
const TestEntitySchema = z.object({
  id: z.string(),
  value: z.string(),
  timestamp: z.number(),
});

type TestEntity = z.infer<typeof TestEntitySchema>;

type CursorResult<T> = {
  results: T[];
  nextCursor: string | undefined;
};

const resolver = new Resolver();

// Health check resolver
resolver.define('healthCheck', () => {
  return { status: 'ok', timestamp: Date.now() };
});

// Write a test value to Custom Entity Store
resolver.define('writeTestValue', async (req) => {
  const { value } = req.payload as { value: string };
  
  const testEntity: TestEntity = {
    id: 'phase0-test',
    value,
    timestamp: Date.now(),
  };
  
  // Validate with Zod
  const parsed = TestEntitySchema.safeParse(testEntity);
  if (!parsed.success) {
    throw new Error(`Validation failed: ${parsed.error.message}`);
  }
  
  // Store in Custom Entity Store using entity API
  await kvs.entity('parallelos_test').set('phase0-test', parsed.data);
  
  return { success: true, entity: parsed.data };
});

// Read the test value from Custom Entity Store
resolver.define('readTestValue', async () => {
  const result = await kvs.entity('parallelos_test').get('phase0-test');
  
  if (!result) {
    return { success: false, error: 'Not found', entity: null };
  }
  
  // Validate on read
  const parsed = TestEntitySchema.safeParse(result);
  if (!parsed.success) {
    return { success: false, error: `Validation failed: ${parsed.error.message}`, entity: null };
  }
  
  return { success: true, entity: parsed.data };
});

// Get all test entities (for debugging)
resolver.define('listTestEntities', async () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const cursor = await kvs.entity('parallelos_test').query().limit(100).getMany();
  const typedCursor = cursor as CursorResult<TestEntity>;
  return { entities: typedCursor.results, nextCursor: typedCursor.nextCursor };
});

export const handler = resolver.getDefinitions();