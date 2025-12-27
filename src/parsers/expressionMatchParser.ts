import { Pose2d, Rotation2d, Translation2d } from "./poses.js";
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
    pattern: /[a-zA-Z_]\w*/
});

const Dot = createToken({ name: "Dot", pattern: /\./ });
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
    Dot,
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
    atomic: ParserMethod<[], CstNode>;
    chainLink: ParserMethod<[], CstNode>;
    // methodCall property removed
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
            $.SUBRULE($.atomic);
            $.MANY(() => {
                $.SUBRULE($.chainLink);
            });
        });

        this.chainLink = $.RULE("chainLink", () => {
            $.CONSUME(Dot);
            $.CONSUME(Identifier);
            $.OPTION(() => {
                $.CONSUME(LParen);
                $.OPTION2(() => {
                    $.SUBRULE($.expression);
                    $.MANY(() => {
                        $.CONSUME(Comma);
                        $.SUBRULE2($.expression);
                    });
                });
                $.CONSUME(RParen);
            });
        });

        this.atomic = $.RULE("atomic", () => {
            $.OR([
                { ALT: () => $.CONSUME(NumberLiteral) },
                { ALT: () => $.SUBRULE($.constructorCall) },
                {
                    ALT: () => {
                        $.CONSUME(Identifier);
                        $.OPTION(() => {
                            $.CONSUME(LParen);
                            $.OPTION2(() => {
                                $.SUBRULE($.expression);
                                $.MANY(() => {
                                    $.CONSUME(Comma);
                                    $.SUBRULE2($.expression);
                                });
                            });
                            $.CONSUME(RParen);
                        });
                    }
                },
                {
                    ALT: () => {
                        $.CONSUME2(LParen);
                        $.SUBRULE3($.expression);
                        $.CONSUME2(RParen);
                    }
                }
            ]);
        });

        // Note: methodCall and constructorCall now handle optional chains in the identifier for static calls
        // methodCall rule removed


        this.constructorCall = $.RULE("constructorCall", () => {
            $.CONSUME(New);
            $.CONSUME(Identifier);
            $.MANY(() => {
                $.CONSUME(Dot);
                $.CONSUME2(Identifier);
            });
            $.CONSUME(LParen);
            $.OPTION(() => {
                $.SUBRULE($.expression);
                $.MANY2(() => {
                    $.CONSUME(Comma);
                    $.SUBRULE2($.expression);
                });
            });
            $.CONSUME(RParen);
        });

        this.performSelfAnalysis();
    }
}

const parserInstance = new JavaExprParser();
const BaseJavaExprVisitor = parserInstance.getBaseCstVisitorConstructor();

const allMethods: Record<string, (args: any) => any> = {
    "new Pose2d 3": (args: any) => {
        return new Pose2d(args[0], args[1], args[2]);
    },
    "new Pose2d 2": (args: any) => {
        return new Pose2d(args[0], args[1]);
    },
    "new Translation2d 2": (args: any) => {
        return new Translation2d(args[0], args[1]);
    },
    "new Rotation2d 1": (args: any) => {
        return new Rotation2d(args[0]);
    },
    "new Rotation2d 2": (args: any) => {
        return new Rotation2d(args[0], args[1]);
    },
    "Pose2d 3": (args: any) => {
        return new Pose2d(args[0], args[1], args[2]);
    },
    "Pose2d 2": (args: any) => {
        return new Pose2d(args[0], args[1]);
    },
    "Translation2d 2": (args: any) => {
        return new Translation2d(args[0], args[1]);
    },
    "Rotation2d 1": (args: any) => {
        return new Rotation2d(args[0]);
    },
    "Rotation2d 2": (args: any) => {
        return new Rotation2d(args[0], args[1]);
    },
    "Rotation2d.fromRadians 1": (args: any) => {
        return Rotation2d.fromRadians(args[0]);
    },
    "Rotation2d.fromDegrees 1": (args: any) => {
        return Rotation2d.fromDegrees(args[0]);
    },
    "Rotation2d.fromRotations 1": (args: any) => {
        return Rotation2d.fromRotations(args[0]);
    },
    "new Pose2d 0": (args: any) => {
        return new Pose2d(0, 0, new Rotation2d(0));
    },
    "new Translation2d 0": (args: any) => {
        return new Translation2d(0, 0);
    },
    "new Rotation2d 0": (args: any) => {
        return new Rotation2d(0);
    },
    "Pose2d 0": (args: any) => {
        return new Pose2d(0, 0, new Rotation2d(0));
    },
    "Translation2d 0": (args: any) => {
        return new Translation2d(0, 0);
    },
    "Rotation2d 0": (args: any) => {
        return new Rotation2d(0);
    }
}

const defaultFields: Record<string, any> = {
    "Rotation2d.kZero": Rotation2d.kZero,
    "Rotation2d.kCW_Pi_2": Rotation2d.kCW_Pi_2,
    "Rotation2d.kCW_90deg": Rotation2d.kCW_90deg,
    "Rotation2d.kCCW_Pi_2": Rotation2d.kCCW_Pi_2,
    "Rotation2d.kCCW_90deg": Rotation2d.kCCW_90deg,
    "Rotation2d.kPi": Rotation2d.kPi,
    "Rotation2d.k180deg": Rotation2d.k180deg,
    "Translation2d.kZero": Translation2d.kZero,
    "Pose2d.kZero": Pose2d.kZero,
    "Math.PI": Math.PI,
    "Math.TAU": Math.PI * 2,
    "PI": Math.PI,
    "TAU": Math.PI * 2,
}

const allowedMethods = new Set([
    "getX", "getY", "getRotation", "getTranslation",
    "getDegrees", "getRadians", "getSin", "getCos", "getTan", "getRotations",
    "getDistance", "getSquaredDistance", "getNorm", "getSquaredNorm", "getAngle",
    "dot", "cross",
    "plus", "minus", "unaryMinus", "times", "div",
    "rotateBy", "rotateAround"
]);

const fetchField = (ctx: any) => {
    // Basic field fetching from single identifier
    const fieldName = ctx.image;
    const start = ctx.startOffset;
    const end = ctx.endOffset;

    if (defaultFields[fieldName]) return defaultFields[fieldName];

    if (fieldCallback) {
        const result = fieldCallback(start, end + 1);
        if (result) return result;
    }

    // Return the name if unknown, to see if it's part of a static chain handled later?
    // Currently no logic for static chain property access like "Rotation2d.kZero" via property access format.
    // "Rotation2d.kZero" must be accessed via fetchField with the full string, but now Identifier doesn't have dots.
    // So "Rotation2d.kZero" is "Rotation2d" (atomic) . "kZero" (chain).
    // fetchField("Rotation2d") -> unknown or undefined?
    // If we want to support defaults:
    // We should expose the class objects in defaultFields or fieldCallback as well?
    // Only "Posed2d.kZero" is in defaultFields. "Pose2d" is NOT.
    // So "Pose2d" returns "unknown field: Pose2d".
    // Then .kZero tries to access property on string "unknown...".

    // To fix this without major rework:
    // If the atomic part returns a string that looks like a field name, 
    // AND the chain link adds to it, we could try to reconstruct the name?
    // But primary calls visit(atomic) which returns final value.

    // For now, I will return the string fieldName if not found.
    return fieldName;
}

let fieldCallback: ((start: number, end: number) => any) | undefined;

class JavaExprVisitor extends BaseJavaExprVisitor {
    constructor() {
        super();
        this.validateVisitor();
    }

    expression(ctx: any): any {
        return this.visit(ctx.addition);
    }

    addition(ctx: any): any {
        let result = this.visit(ctx.multiplication[0]);
        for (let i = 1; i < ctx.multiplication.length; i++) {
            const nextValue = this.visit(ctx.multiplication[i]);
            if (ctx.Plus && ctx.Plus[i - 1]) {
                result += nextValue;
            } else if (ctx.Minus && ctx.Minus[i - 1]) {
                result -= nextValue;
            }
        }
        return result;
    }

    multiplication(ctx: any): any {
        let result = this.visit(ctx.unary[0]);
        for (let i = 1; i < ctx.unary.length; i++) {
            const nextValue = this.visit(ctx.unary[i]);
            if (ctx.Mult && ctx.Mult[i - 1]) {
                result *= nextValue;
            } else if (ctx.Div && ctx.Div[i - 1]) {
                result /= nextValue;
            }
        }
        return result;
    }

    unary(ctx: any): any {
        if (ctx.unary) {
            const value = this.visit(ctx.unary);
            if (ctx.Plus) return +value;
            if (ctx.Minus) return -value;
        }
        return this.visit(ctx.primary);
    }

    primary(ctx: any): any {
        let result = this.visit(ctx.atomic);

        if (ctx.chainLink) {
            for (const link of ctx.chainLink) {
                result = this.visit(link, result);
            }
        }

        if (typeof result === 'string' && result.startsWith("unknown field")) {
            return null;
        }

        return result;
    }

    chainLink(ctx: any, param: any): any {
        let result = param;
        const memberName = ctx.Identifier[0].image;

        // Check if we are building up a static field name string
        if (typeof result === 'string') {
            if (fieldCallback) {
                const idToken = ctx.Identifier[0];
                const val = fieldCallback(idToken.startOffset, idToken.endOffset + 1);
                if (val !== undefined) {
                    return val;
                }
            }
            const compositeName = result + "." + memberName;

            // Check if it is a known field
            if (defaultFields[compositeName]) {
                result = defaultFields[compositeName];
            }
            // Check if it's a known method call (e.g. Rotation2d.fromDegrees(...))
            else if (ctx.LParen) {
                // logic handled below in call section
                // We keep result as string to construct method name
                result = compositeName;
            }
            else {
                result = compositeName;
            }
        }

        // If we have a call
        if (ctx.LParen) {
            let args = [];
            if (ctx.expression) {
                args = ctx.expression.map((expr: any) => this.visit(expr));
            }

            // 1. Check for static method in allMethods (if result is string)
            if (typeof result === 'string') {
                const methodName = result + " " + args.length;
                if (allMethods[methodName]) {
                    result = allMethods[methodName](args);
                    return result;
                }
            }

            // 2. Check for instance method
            if (typeof result !== 'string' && result && typeof result[memberName] === 'function') {
                if (!allowedMethods.has(memberName)) return null;
                result = result[memberName](...args);
            } else if (typeof result !== 'string') {
                // Error
                return null;
            }
        } else {
            // Field access on object (if we didn't already resolve static)
            if (typeof result !== 'string' && result && result[memberName] !== undefined) {
                result = result[memberName];
            }
        }

        return result;
    }

    atomic(ctx: any): any {
        if (ctx.NumberLiteral) {
            return parseFloat(ctx.NumberLiteral[0].image);
        }
        if (ctx.expression) {
            return this.visit(ctx.expression);
        }
        if (ctx.constructorCall) {
            return this.visit(ctx.constructorCall);
        }
        if (ctx.Identifier) {
            const name = ctx.Identifier[0].image;

            if (ctx.LParen) { // It's a call like methods(...)
                let args = [];
                if (ctx.expression) {
                    args = ctx.expression.map((expr: any) => this.visit(expr));
                }
                const methodName = name + " " + args.length;
                if (allMethods[methodName]) {
                    return allMethods[methodName](args);
                }
                return null;
            } else {
                return fetchField(ctx.Identifier[0]);
            }
        }
        return null;
    }

    // methodCall visitor removed as the rule is removed and logic merged.

    constructorCall(ctx: any): any {
        const nameParts = ctx.Identifier.map((t: any) => t.image);
        const methodNamePrefix = "new " + nameParts.join(".");

        let argCount = 0;
        if (ctx.expression) {
            argCount = ctx.expression.length;
        }
        const methodName = methodNamePrefix + " " + argCount;

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
        return null; // Return null on error
    }

    fieldCallback = fc;
    parserInstanceNew.input = lexResult.tokens;

    const cst = parserInstanceNew.expression();
    if (parserInstanceNew.errors.length > 0) {
        console.error('Parsing errors:', parserInstanceNew.errors);
        return null;
    }

    const result = visitor.visit(cst);
    if (typeof result === 'number') return result;
    // If result is object, extract value? 
    // Usually we expect number at the end, but maybe object if just 'new Pose2d(...)'
    // The original parser returns 'number | null'.
    // Here we can return whatever. Poses.toString handles print.
    return result;
}

export function getIdentifiers(expression: string): any[] {
    const lexResult = JavaLexer.tokenize(expression);
    if (lexResult.errors.length > 0) {
        return [];
    }
    return lexResult.tokens.filter(t => t.tokenType.name === 'Identifier');
}