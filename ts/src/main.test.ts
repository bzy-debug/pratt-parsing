import { test, expect } from 'vitest';
import { Lexer, expr, StoString } from './main';

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

test('1 + 2 + 3', () => {
  expect(StoString(expr('1 + 2 + 3'))).toMatchInlineSnapshot('"(+ (+ 1 2) 3)"');
});

test('- 3 - 2 - 1', () => {
  expect(StoString(expr('- 3 - 2 - 1'))).toMatchInlineSnapshot(
    '"(- (- (- 3) 2) 1)"',
  );
});

test('1 * 2 + 3', () => {
  expect(StoString(expr('1 * 2 + 3'))).toMatchInlineSnapshot('"(+ (* 1 2) 3)"');
});

test('a + b * c * d + e', () => {
  expect(StoString(expr('a + b * c * d + e'))).toMatchInlineSnapshot(
    '"(+ (+ a (* (* b c) d)) e)"',
  );
});

test('f . g . h', () => {
  expect(StoString(expr('f . g . h'))).toMatchInlineSnapshot('"(. f (. g h))"');
});

test('-1', () => {
  expect(StoString(expr('-1'))).toMatchInlineSnapshot('"(- 1)"');
});

test('--1 * 2', () => {
  expect(StoString(expr('--1 * 2'))).toMatchInlineSnapshot('"(* (- (- 1)) 2)"');
});

test('--f . g', () => {
  expect(StoString(expr('--f . g'))).toMatchInlineSnapshot('"(- (- (. f g)))"');
});

test('- 2 !', () => {
  expect(StoString(expr('- 2 !'))).toMatchInlineSnapshot('"(- (! 2))"');
});

test('1 ! + 2 ! !', () => {
  expect(StoString(expr('1 ! + 2 ! !'))).toMatchInlineSnapshot(
    '"(+ (! 1) (! (! 2)))"',
  );
});

test('(0)', () => {
  expect(StoString(expr('(0)'))).toMatchInlineSnapshot('"0"');
});

test('(((0)))', () => {
  expect(StoString(expr('(((0)))'))).toMatchInlineSnapshot('"0"');
});

test('(1 + 2) * 3', () => {
  expect(StoString(expr('(1 + 2) * 3'))).toMatchInlineSnapshot(
    '"(* (+ 1 2) 3)"',
  );
});

test('x[0][1]', () => {
  expect(StoString(expr('x[0][1]'))).toMatchInlineSnapshot('"([] ([] x 0) 1)"');
});

test('1 ? 2 : 3', () => {
  expect(StoString(expr('1 ? 2 : 3'))).toMatchInlineSnapshot('"(?: 1 2 3)"');
});

test('a ? b : c ? d : e', () => {
  expect(StoString(expr('a ? b : c ? d : e'))).toMatchInlineSnapshot(
    '"(?: a b (?: c d e))"',
  );
});

test('a = 0 ? b : c = d', () => {
  expect(StoString(expr('a = 0 ? b : c = d'))).toMatchInlineSnapshot(
    '"(= a (= (?: 0 b c) d))"',
  );
});
