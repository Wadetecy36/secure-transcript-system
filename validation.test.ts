import { test } from 'node:test';
import assert from 'node:assert';
import { config } from './backend/config.ts';

test('Environment Configuration', async (t) => {
  await t.test('should have default PORT if not provided', () => {
    assert.strictEqual(typeof config.PORT, 'number');
  });

  await t.test('should have a valid NODE_ENV', () => {
    assert.ok(['development', 'production', 'test'].includes(config.NODE_ENV));
  });
});
