import { test, expect } from 'vitest';
import { Lexer, expr } from './main';

test('lexer', () => {
  expect(new Lexer('1 + 2')).toMatchInlineSnapshot(`
    Lexer {
      "tokens": [
        {
          "kind": "Atom",
          "value": "1",
        },
        {
          "kind": "Op",
          "value": "+",
        },
        {
          "kind": "Atom",
          "value": "2",
        },
      ],
    }
  `);
});

test('1 + 2', () => {
  expect(expr('1 + 2').toString()).toMatchInlineSnapshot('"(+ 1 2)"');
});

test('1 * 2 + 3', () => {
  expect(expr('1 * 2 + 3').toString()).toMatchInlineSnapshot('"(+ (* 1 2) 3)"');
});

test('a + b * c * d + e', () => {
  expect(expr('a + b * c * d + e').toString()).toMatchInlineSnapshot(
    '"(+ (+ a (* (* b c) d)) e)"',
  );
});
