import { Pose2d, Rotation2d } from "./poses";
import { createToken, Lexer, CstParser } from "chevrotain";

const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /\s+/,
    group: Lexer.SKIPPED
});

const NumberLiteral = createToken({
    name: "NumberLiteral",
    pattern: /\d+(\.\d+)?/
});

const New = createToken({
    name: "New",
    pattern: /new/
});

const Identifier = createToken({
    name: "Identifier",
    pattern: /[a-zA-Z_]\w*/
});

const LParen = createToken({ name: "LParen", pattern: /\(/ });
const RParen = createToken({ name: "RParen", pattern: /\)/ });
const Comma = createToken({ name: "Comma", pattern: /,/ });

const Plus = createToken({ name: "Plus", pattern: /\+/ });
const Minus = createToken({ name: "Minus", pattern: /-/ });
const Mult = createToken({ name: "Mult", pattern: /\*/ });
const Div = createToken({ name: "Div", pattern: /\// });

const allTokens = [
    WhiteSpace,
    New,
    NumberLiteral,
    Identifier,
    LParen,
    RParen,
    Comma,
    Plus,
    Minus,
    Mult,
    Div
];

const JavaLexer = new Lexer(allTokens);

class JavaExprParser extends CstParser {
    // Declare rule methods for TypeScript
    expression = this.RULE("expression", () => { });
    addition = this.RULE("addition", () => { });
    multiplication = this.RULE("multiplication", () => { });
    unary = this.RULE("unary", () => { });
    primary = this.RULE("primary", () => { });
    methodCall = this.RULE("methodCall", () => { });
    constructorCall = this.RULE("constructorCall", () => { });

    constructor() {
        super(allTokens);
        const $ = this;

        $.RULE("expression", () => {
            $.SUBRULE($.addition);
        });

        $.RULE("addition", () => {
            $.SUBRULE($.multiplication);
            $.MANY(() => {
                $.OR([
                    { ALT: () => $.CONSUME(Plus) },
                    { ALT: () => $.CONSUME(Minus) }
                ]);
                $.SUBRULE2($.multiplication);
            });
        });

        $.RULE("multiplication", () => {
            $.SUBRULE($.unary);
            $.MANY(() => {
                $.OR([
                    { ALT: () => $.CONSUME(Mult) },
                    { ALT: () => $.CONSUME(Div) }
                ]);
                $.SUBRULE2($.unary);
            });
        });

        $.RULE("unary", () => {
            $.OR([
                {
                    ALT: () => {
                        $.OR2([
                            { ALT: () => $.CONSUME(Plus) },
                            { ALT: () => $.CONSUME(Minus) }
                        ]);
                        $.SUBRULE($.unary);
                    }
                },
                { ALT: () => $.SUBRULE($.primary) }
            ]);
        });

        $.RULE("primary", () => {
            $.OR([
                { ALT: () => $.CONSUME(NumberLiteral) },
                { ALT: () => $.SUBRULE($.methodCall) },
                { ALT: () => $.SUBRULE($.constructorCall) },
                { ALT: () => $.CONSUME(Identifier) },
                {
                    ALT: () => {
                        $.CONSUME(LParen);
                        $.SUBRULE($.expression);
                        $.CONSUME(RParen);
                    }
                }
            ]);
        });

        $.RULE("methodCall", () => {
            $.CONSUME(Identifier);
            $.CONSUME(LParen);
            $.OPTION(() => {
                $.SUBRULE($.expression);
                $.MANY(() => {
                    $.CONSUME(Comma);
                    $.SUBRULE2($.expression);
                });
            });
            $.CONSUME(RParen);
        });

        $.RULE("constructorCall", () => {
            $.CONSUME(New);
            $.CONSUME(Identifier);
            $.CONSUME(LParen);
            $.OPTION(() => {
                $.SUBRULE($.expression);
                $.MANY(() => {
                    $.CONSUME(Comma);
                    $.SUBRULE2($.expression);
                });
            });
            $.CONSUME(RParen);
        });

        // Diagram of the grammar
        // expression
        //   : addition
        //
        // addition
        //   : multiplication (( '+' | '-' ) multiplication)*
        //
        // multiplication
        //   : unary (( '*' | '/' ) unary)*
        //
        // unary
        //   : '+' unary
        //   | '-' unary
        //   | primary
        //
        // primary
        //   : NumberLiteral
        //   | methodCall
        //   | constructorCall
        //   | Identifier
        //   | '(' expression ')'
        //
        // methodCall
        //   : Identifier '(' ( expression ( ',' expression )* )? ')'
        //
        // constructorCall
        //   : New Identifier '(' ( expression ( ',' expression )* )? ')'

        this.performSelfAnalysis();
    }
}

const BaseVisitor = JavaExprParser.getBaseCstVisitorConstructor();

class JavaExprVisitor extends BaseVisitor {
    constructor() {
        super();
        this.validateVisitor();
    }

    expression(ctx: any): number | null {
        return this.visit(ctx.addition);
    }

    addition(ctx: any): number | null {
        // Start with the first multiplication term
        let result = this.visit(ctx.multiplication[0]);
        if (result === null) return null;

        // Process each subsequent operation
        for (let i = 1; i < ctx.multiplication.length; i++) {
            const nextValue = this.visit(ctx.multiplication[i]);
            if (nextValue === null) return null;

            // Check which operator was used
            if (ctx.Plus && ctx.Plus[i - 1]) {
                result += nextValue;
            } else if (ctx.Minus && ctx.Minus[i - 1]) {
                result -= nextValue;
            }
        }

        return result;
    }

    multiplication(ctx: any): number | null {
        // Start with the first unary term
        let result = this.visit(ctx.unary[0]);
        if (result === null) return null;

        // Process each subsequent operation
        for (let i = 1; i < ctx.unary.length; i++) {
            const nextValue = this.visit(ctx.unary[i]);
            if (nextValue === null) return null;

            // Check which operator was used
            if (ctx.Mult && ctx.Mult[i - 1]) {
                result *= nextValue;
            } else if (ctx.Div && ctx.Div[i - 1]) {
                result /= nextValue;
            }
        }

        return result;
    }

    unary(ctx: any): number | null {
        // Check if there's a unary operator
        if (ctx.unary) {
            // Recursive unary case
            const value = this.visit(ctx.unary);
            if (value === null) return null;

            if (ctx.Plus) {
                return +value;
            } else if (ctx.Minus) {
                return -value;
            }
        }

        // No unary operator, visit primary
        return this.visit(ctx.primary);
    }

    primary(ctx: any): number | null {
        // Number literal
        if (ctx.NumberLiteral) {
            return parseFloat(ctx.NumberLiteral[0].image);
        }

        // Parenthesized expression
        if (ctx.expression) {
            return this.visit(ctx.expression);
        }

        // Method calls, constructor calls, and identifiers are not literals
        // Return null to indicate we can't evaluate this as a constant
        return null;
    }
}

const parser = new JavaExprParser();
const visitor = new JavaExprVisitor();

export function evaluateExpression(expression: string): number | null {
    const cst = parser.parse(expression);
    return visitor.visit(cst);
}