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

class S {
  private _S: AtomS | ConsS;
  constructor(s: AtomS | ConsS) {
    this._S = s;
  }

  toString(): string {
    switch (this._S.kind) {
      case 'Atom':
        return this._S.value;
      case 'Cons':
        return `(${this._S.car} ${this._S.cdr
          .map((s) => s.toString())
          .join(' ')})`;
    }
  }
}

function expr(input: string): S {
  const lexer = new Lexer(input);
  return exprBp(lexer, 0);
}

function infixBindingPower(op: string): [number, number] {
  switch (op) {
    case '+':
    case '-':
      return [1, 2];
    case '*':
    case '/':
      return [3, 4];
    default:
      throw new Error(`Bad op: ${op}`);
  }
}

// exprBp
//    = Atom
//    | exprBp op exprBp
function exprBp(lexer: Lexer, minBp: number): S {
  const next = lexer.next();
  let lhs: S;
  if (next.kind === 'Atom') {
    lhs = new S(next);
  } else {
    throw new Error(`Unexpected ${next.kind} token`);
  }
  let doesContinue = true;
  while (doesContinue) {
    const op = lexer.peek();
    switch (op.kind) {
      case 'Op': {
        const [leftBp, rightBp] = infixBindingPower(op.value);
        if (leftBp < minBp) {
          doesContinue = false;
          break;
        }
        lexer.next();
        const rhs = exprBp(lexer, rightBp);
        lhs = new S({
          kind: 'Cons',
          car: op.value,
          cdr: [lhs, rhs],
        });
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

export { Lexer, expr };
