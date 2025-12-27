import { Pose2d, Rotation2d } from "./poses.js";
import { createToken, Lexer, CstParser, CstNode, ICstVisitor, IToken, ParserMethod } from "chevrotain";

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
    pattern: /new /
});

const Identifier = createToken({
    name: "Identifier",
    pattern: /[a-zA-Z_]\w*(\.[a-zA-Z_]\w*)*/
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
    expression: ParserMethod<[], CstNode>;
    addition: ParserMethod<[], CstNode>;
    multiplication: ParserMethod<[], CstNode>;
    unary: ParserMethod<[], CstNode>;
    primary: ParserMethod<[], CstNode>;
    methodCall: ParserMethod<[], CstNode>;
    constructorCall: ParserMethod<[], CstNode>;

    constructor() {
        super(allTokens);
        const $ = this;

        this.expression = $.RULE("expression", () => {
            $.SUBRULE($.addition);
        });

        this.addition = $.RULE("addition", () => {
            $.SUBRULE($.multiplication);
            $.MANY(() => {
                $.OR([
                    { ALT: () => $.CONSUME(Plus) },
                    { ALT: () => $.CONSUME(Minus) }
                ]);
                $.SUBRULE2($.multiplication);
            });
        });

        this.multiplication = $.RULE("multiplication", () => {
            $.SUBRULE($.unary);
            $.MANY(() => {
                $.OR([
                    { ALT: () => $.CONSUME(Mult) },
                    { ALT: () => $.CONSUME(Div) }
                ]);
                $.SUBRULE2($.unary);
            });
        });

        this.unary = $.RULE("unary", () => {
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

        this.primary = $.RULE("primary", () => {
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

        this.methodCall = $.RULE("methodCall", () => {
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

        this.constructorCall = $.RULE("constructorCall", () => {
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

const parserInstance = new JavaExprParser();
const BaseJavaExprVisitor = parserInstance.getBaseCstVisitorConstructor();

const allMethods: Record<string, (args: any) => any> = {
    "new Pose2d 3": (args: any) => {
        return new Pose2d(args[0], args[1], args[2]);
    },
    "new Rotation2d 1": (args: any) => {
        return new Rotation2d(args[0]);
    },
    "Pose2d 3": (args: any) => {
        return new Pose2d(args[0], args[1], args[2]);
    },
    "Rotation2d 1": (args: any) => {
        return new Rotation2d(args[0]);
    },
    "Rotation2d.fromRadians 1": (args: any) => {
        return new Rotation2d(args[0]);
    },
    "Rotation2d.fromDegrees 1": (args: any) => {
        return new Rotation2d(args[0] * Math.PI / 180);
    },
    "Rotation2d.fromRotations 1": (args: any) => {
        return new Rotation2d(args[0] * 2 * Math.PI);
    }
}

const defaultFields: Record<string, any> = {
    "Rotation2d.kZero": new Rotation2d(0),
    "Rotation2d.kCW_Pi_2": new Rotation2d(-Math.PI / 2),
    "Rotation2d.kCW_90deg": new Rotation2d(-Math.PI / 2),
    "Rotation2d.kCCW_Pi_2": new Rotation2d(Math.PI / 2),
    "Rotation2d.kCCW_90deg": new Rotation2d(Math.PI / 2),
    "Rotation2d.kPi": new Rotation2d(Math.PI),
    "Rotation2d.k180deg": new Rotation2d(Math.PI),
    "Pose2d.kZero": new Pose2d(0, 0, new Rotation2d(0)),
    "Math.PI": Math.PI,
    "Math.TAU": Math.PI * 2,
    "PI": Math.PI,
    "TAU": Math.PI * 2,
}

const fetchField = (ctx: any) => {
    const fieldName = ctx.image;
    const start = ctx.startOffset;
    const end = ctx.endOffset;

    if (defaultFields[fieldName]) return defaultFields[fieldName];

    if (fieldCallback) {
        const result = fieldCallback(start, end + 1);
        if (result) return result;
    }

    return "unknown field: " + fieldName;
}

let fieldCallback: ((start: number, end: number) => any) | undefined;

class JavaExprVisitor extends BaseJavaExprVisitor {
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

        if (ctx.methodCall) {
            return this.visit(ctx.methodCall);
        }

        if (ctx.constructorCall) {
            return this.visit(ctx.constructorCall);
        }

        if (ctx.Identifier) {
            return fetchField(ctx.Identifier[0]);

        }

        return null;
    }

    methodCall(ctx: any): number | null {
        const methodName: string = ctx.Identifier[0].image + " " + ctx.expression.length;

        if (!allMethods[methodName]) return null;

        let args = [];

        if (ctx.expression) {
            args = ctx.expression.map((expr: any) => this.visit(expr));
        }

        return allMethods[methodName](args);
    }

    constructorCall(ctx: any): number | null {
        const methodName: string = "new " + ctx.Identifier[0].image + " " + ctx.expression.length;

        if (!allMethods[methodName]) return null;

        let args = [];

        if (ctx.expression) {
            args = ctx.expression.map((expr: any) => this.visit(expr));
        }

        return allMethods[methodName](args);
    }
}

const parserInstanceNew = new JavaExprParser();
const visitor = new JavaExprVisitor();

export function evaluateExpression(expression: string, fc?: (start: number, end: number) => any): number | null {
    const lexResult = JavaLexer.tokenize(expression);
    if (lexResult.errors.length > 0) {
        console.error('Lexical errors:', lexResult.errors);
        return null;
    }

    fieldCallback = fc;
    parserInstanceNew.input = lexResult.tokens;

    const cst = parserInstanceNew.expression();
    if (cst === null) {
        console.error('Parsing failed');
        return null;
    }

    return visitor.visit(cst);
}

export function getIdentifiers(expression: string): any[] {
    const lexResult = JavaLexer.tokenize(expression);
    if (lexResult.errors.length > 0) {
        return [];
    }
    return lexResult.tokens.filter(t => t.tokenType.name === 'Identifier');
}