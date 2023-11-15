/* eslint-disable no-use-before-define */
type AtomToken = {
  kind: 'Atom';
  value: string;
};

type OpToken = {
  kind: 'Op';
  value: string;
};

type EofToken = {
  kind: 'Eof';
};

type Token = AtomToken | OpToken | EofToken;

class Lexer {
  private tokens: Token[];

  constructor(input: string) {
    this.tokens = [];
    for (const char of input) {
      if (/\s/.test(char)) continue;
      if (/[0-9a-zA-Z]/.test(char)) {
        this.tokens.push({ kind: 'Atom', value: char });
      } else {
        this.tokens.push({ kind: 'Op', value: char });
      }
    }
  }

  next(): Token {
    return this.tokens.shift() ?? { kind: 'Eof' };
  }

  peek(): Token {
    return this.tokens[0] ?? { kind: 'Eof' };
  }
}

type AtomS = {
  kind: 'Atom';
  value: string;
};

type ConsS = {
  kind: 'Cons';
  car: string;
  cdr: S[];
};

type S = AtomS | ConsS;

function StoString(s: S): string {
  switch (s.kind) {
    case 'Atom':
      return s.value;
    case 'Cons':
      return `(${s.car} ${s.cdr.map(StoString).join(' ')})`;
  }
}

function expr(input: string): S {
  const lexer = new Lexer(input);
  return exprBp(lexer, 0);
}

function infixBindingPower(op: string): [number, number] | undefined {
  switch (op) {
    case '=':
      return [2, 1];
    case '?':
      return [4, 3];
    case '+':
    case '-':
      return [5, 6];
    case '*':
    case '/':
      return [7, 8];
    case '.':
      return [14, 13];
    default:
      return undefined;
  }
}

function prefixBindingPower(op: string): [undefined, number] {
  switch (op) {
    case '+':
    case '-':
      return [undefined, 9];
    default:
      throw new Error(`Bad op: ${op}`);
  }
}

function postfixBindingPower(op: string): [number, undefined] | undefined {
  switch (op) {
    case '!':
    case '[':
      return [11, undefined];
    default:
      return undefined;
  }
}

function exprBp(lexer: Lexer, minBp: number): S {
  const token = lexer.next();
  let lhs: S;
  switch (token.kind) {
    case 'Atom':
      lhs = token;
      break;
    case 'Op': {
      if (token.value === '(') {
        const expr = exprBp(lexer, 0);
        const next = lexer.next();
        if (next.kind !== 'Op' || next.value !== ')') {
          throw new Error(`Unexpected ${next.kind} token`);
        }
        lhs = expr;
        break;
      }
      const [, rightBp] = prefixBindingPower(token.value);
      lhs = {
        kind: 'Cons',
        car: token.value,
        cdr: [exprBp(lexer, rightBp)],
      };
      break;
    }
    default:
      throw new Error(`Unexpected ${token.kind} token`);
  }
  let doesContinue = true;
  while (doesContinue) {
    const op = lexer.peek();
    switch (op.kind) {
      case 'Op': {
        const bp = postfixBindingPower(op.value);
        if (bp === undefined) {
          const bp = infixBindingPower(op.value);
          if (bp === undefined) {
            doesContinue = false;
            break;
          }
          const [leftBp, rightBp] = bp;
          if (leftBp < minBp) {
            doesContinue = false;
            break;
          }
          lexer.next();
          if (op.value === '?') {
            const mhs = exprBp(lexer, 0);
            const next = lexer.next();
            if (next.kind !== 'Op' || next.value !== ':') {
              throw new Error(`Unexpected ${next.kind} Token`);
            }
            const rhs = exprBp(lexer, rightBp);
            lhs = {
              kind: 'Cons',
              car: '?:',
              cdr: [lhs, mhs, rhs],
            };
            continue;
          }
          const rhs = exprBp(lexer, rightBp);
          lhs = {
            kind: 'Cons',
            car: op.value,
            cdr: [lhs, rhs],
          };
          continue;
        }
        const [leftBp] = bp;
        if (leftBp < minBp) {
          doesContinue = false;
          break;
        }
        lexer.next();
        if (op.value === '[') {
          const index = exprBp(lexer, 0);
          const next = lexer.next();
          if (next.kind !== 'Op' || next.value !== ']') {
            throw new Error(`Unexpected ${next.kind} Token`);
          }
          lhs = {
            kind: 'Cons',
            car: '[]',
            cdr: [lhs, index],
          };
          break;
        }
        lhs = {
          kind: 'Cons',
          car: op.value,
          cdr: [lhs],
        };
        break;
      }
      case 'Eof': {
        doesContinue = false;
        break;
      }
      case 'Atom': {
        throw new Error('Unexpected Atom token');
      }
    }
  }
  return lhs;
}

export { Lexer, expr, StoString };
