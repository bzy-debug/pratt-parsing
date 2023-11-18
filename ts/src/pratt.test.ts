import { test, expect } from 'vitest';
import { add } from './pratt';

test('add', () => {
  expect(add(1, 2)).toMatchInlineSnapshot('3');
});
