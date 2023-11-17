use std::vec;

pub fn answer() -> u32 {
    42
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Token {
    Atom(char),
    Op(char),
    Eof,
}

#[derive(Clone, Debug)]
struct Lexer {
    tokens: Vec<Token>,
}

impl Lexer {
    fn new(input: &str) -> Lexer {
        let mut tokens = input
            .chars()
            .filter(|c| !c.is_whitespace())
            .map(|c| match c {
                '0'..='9' | 'a'..='z' | 'A'..='Z' => Token::Atom(c),
                _ => Token::Op(c),
            })
            .collect::<Vec<_>>();
        tokens.reverse();
        Lexer { tokens }
    }

    fn next(&mut self) -> Token {
        self.tokens.pop().unwrap_or(Token::Eof)
    }

    fn peek(&self) -> Token {
        self.tokens.last().copied().unwrap_or(Token::Eof)
    }
}

impl ToString for Lexer {
    fn to_string(&self) -> String {
        format!("{:?}", self)
    }
}

pub enum S {
    Atom(char),
    Cons(char, Vec<S>),
}

impl ToString for S {
    fn to_string(&self) -> String {
        match self {
            S::Atom(c) => c.to_string(),
            S::Cons(c, ss) => format!(
                "({} {})",
                c,
                ss.iter()
                    .map(|s| s.to_string())
                    .collect::<Vec<_>>()
                    .join(" ")
            ),
        }
    }
}

fn prefix_bp(op: char) -> ((), u32) {
    match op {
        '+' | '-' => ((), 5),
        _ => panic!("unexpected op {}", op),
    }
}

fn infix_bp(op: char) -> (u32, u32) {
    match op {
        '+' | '-' => (1, 2),
        '*' | '/' => (3, 4),
        '.' => (8, 7),
        '?' => (10, 9),
        _ => panic!("unexpected op {}", op),
    }
}

fn postfix_bp(op: char) -> Option<(u32, ())> {
    match op {
        '[' => Some((6, ())),
        '!' => Some((6, ())),
        _ => None,
    }
}

pub fn expr(input: &str) -> S {
    let mut lexer = Lexer::new(input);
    expr_bp(&mut lexer, 0)
}

fn expr_bp(lexer: &mut Lexer, min_bp: u32) -> S {
    let mut lhs = match lexer.next() {
        Token::Atom(c) => S::Atom(c),
        Token::Op('(') => {
            let expr = expr_bp(lexer, 0);
            assert_eq!(lexer.next(), Token::Op(')'));
            expr
        }
        Token::Op(op) => {
            let ((), r_bp) = prefix_bp(op);
            S::Cons(op, vec![expr_bp(lexer, r_bp)])
        }
        t => panic!("unexpected token {:?}", t),
    };

    loop {
        let op = match lexer.peek() {
            Token::Op(op) => op,
            Token::Eof => break,
            t => panic!("unexpected token {:?}", t),
        };

        if op == ')' || op == ']' || op == ':' {
            break;
        }

        if let Some((l_bp, ())) = postfix_bp(op) {
            if l_bp < min_bp {
                break;
            }
            lexer.next();
            if op == '[' {
                let index_expr = expr_bp(lexer, 0);
                assert_eq!(lexer.next(), Token::Op(']'));
                lhs = S::Cons(op, vec![lhs, index_expr]);
            } else {
                lhs = S::Cons(op, vec![lhs]);
            }
            continue;
        }
        let (l_bp, r_bp) = infix_bp(op);
        if l_bp < min_bp {
            break;
        }
        lexer.next();
        if op == '?' {
            let mhs = expr_bp(lexer, 0);
            assert_eq!(lexer.next(), Token::Op(':'));
            let rhs = expr_bp(lexer, r_bp);
            lhs = S::Cons(op, vec![lhs, mhs, rhs]);
        } else {
            let rhs = expr_bp(lexer, r_bp);
            lhs = S::Cons(op, vec![lhs, rhs]);
        }
    }

    lhs
}

#[cfg(test)]
mod test {
    use crate::{answer, expr, Lexer};
    use expect_test::{expect, Expect};

    fn check(actual: impl ToString, expect: Expect) {
        expect.assert_eq(&actual.to_string());
    }

    #[test]
    fn test_answer() {
        check(answer(), expect!["42"])
    }

    #[test]
    fn create_lexer() {
        check(
            Lexer::new("1 + 2 + 3"),
            expect!["Lexer { tokens: [Atom('3'), Op('+'), Atom('2'), Op('+'), Atom('1')] }"],
        )
    }

    #[test]
    fn test_plus() {
        check(expr("1 + 2 + 3"), expect!["(+ (+ 1 2) 3)"])
    }

    #[test]
    fn test_mul_plus() {
        check(expr("1 * 2 + 3"), expect!["(+ (* 1 2) 3)"])
    }

    #[test]
    fn test_fn_compose() {
        check(expr("f . g . h"), expect!["(. f (. g h))"])
    }

    #[test]
    fn test_prefix() {
        check(expr("- - 3 + 2 * 7"), expect!["(+ (- (- 3)) (* 2 7))"])
    }

    #[test]
    fn test_prefix_compose() {
        check(expr("- f . g . h"), expect!["(- (. f (. g h)))"])
    }

    #[test]
    fn test_postfix() {
        check(expr("1 ! !"), expect!["(! (! 1))"])
    }

    #[test]
    fn test_postfix_infix() {
        check(expr("- 1 ! ! * 3 !"), expect!["(* (- (! (! 1))) (! 3))"])
    }

    #[test]
    fn test_paren() {
        check(expr("(1 + 2) * (3 + 4)"), expect!["(* (+ 1 2) (+ 3 4))"])
    }

    #[test]
    fn test_paren_postfix() {
        check(expr("(- 1)!"), expect!["(! (- 1))"])
    }

    #[test]
    fn test_bracket() {
        check(expr("a[1]"), expect!["([ a 1)"])
    }

    #[test]
    fn test_bracket_complex() {
        check(
            expr("-a[(1 + 2) * 3]!"),
            expect!["(- (! ([ a (* (+ 1 2) 3))))"],
        )
    }

    #[test]
    fn test_ternary() {
        check(expr("a ? b : c ? d : e"), expect!["(? a b (? c d e))"])
    }

    #[test]
    fn test_ternary_complex() {
        check(expr("1 + a ? b ! : c + d"), expect!["(+ (+ 1 (? a (! b) c)) d)"])
    }
}
