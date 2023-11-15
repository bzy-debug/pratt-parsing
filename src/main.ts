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
    case '+':
    case '-':
      return [1, 2];
    case '*':
    case '/':
      return [3, 4];
    case '.':
      return [8, 7];
    default:
      return undefined;
  }
}

function prefixBindingPower(op: string): [undefined, number] {
  switch (op) {
    case '+':
    case '-':
      return [undefined, 5];
    default:
      throw new Error(`Bad op: ${op}`);
  }
}

function postfixBindingPower(op: string): [number, undefined] | undefined {
  switch (op) {
    case '!':
      return [7, undefined];
    default:
      return undefined;
  }
}

function exprBp(lexer: Lexer, minBp: number): S {
  const next = lexer.next();
  let lhs: S;
  switch (next.kind) {
    case 'Atom':
      lhs = next;
      break;
    case 'Op': {
      const [, rightBp] = prefixBindingPower(next.value);
      lhs = {
        kind: 'Cons',
        car: next.value,
        cdr: [exprBp(lexer, rightBp)],
      };
      break;
    }
    default:
      throw new Error(`Unexpected ${next.kind} token`);
  }
  let doesContinue = true;
  while (doesContinue) {
    const op = lexer.peek();
    switch (op.kind) {
      case 'Op': {
        const bp = postfixBindingPower(op.value);
        if (bp === undefined) {
          const bp = infixBindingPower(op.value);
          if (bp === undefined) throw new Error(`Bad op ${op.value}`);
          const [leftBp, rightBp] = bp;
          if (leftBp < minBp) {
            doesContinue = false;
            break;
          }
          lexer.next();
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
