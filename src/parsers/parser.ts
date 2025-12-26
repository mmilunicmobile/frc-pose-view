const { parse } = require("java-parser");

export class Parser {

    parseText(text: string): any {
        return this.parseCst(parse(text));
    }

    parseCst(cst: any): number | null {
        // Navigate through the CST to find expressions
        if (!cst || !cst.children) {
            return null;
        }

        // Try to parse as an expression directly
        if (cst.name === 'expression') {
            return this.parseExpression(cst);
        }

        if (cst.name === 'binaryExpression') {
            return this.parseBinaryExpression(cst);
        }

        if (cst.name === 'unaryExpression') {
            return this.parseUnaryExpression(cst);
        }

        // Recursively search for expressions in children
        for (const key in cst.children) {
            const children = cst.children[key];
            if (Array.isArray(children)) {
                for (const child of children) {
                    const result = this.parseCst(child);
                    if (result !== null) {
                        return result;
                    }
                }
            }
        }

        return null;
    }

    private parseExpression(node: any): number | null {
        if (!node || !node.children) {
            return null;
        }

        // expression -> conditionalExpression
        if (node.children.conditionalExpression) {
            return this.parseConditionalExpression(node.children.conditionalExpression[0]);
        }

        return null;
    }

    private parseConditionalExpression(node: any): number | null {
        if (!node || !node.children) {
            return null;
        }

        // conditionalExpression -> binaryExpression
        if (node.children.binaryExpression) {
            return this.parseBinaryExpression(node.children.binaryExpression[0]);
        }

        return null;
    }

    private parseBinaryExpression(node: any): number | null {
        if (!node || !node.children) {
            return null;
        }

        const unaryExpressions = node.children.unaryExpression || [];
        const operators = node.children.BinaryOperator || [];

        if (unaryExpressions.length === 0) {
            return null;
        }

        // Parse all operands first
        const operands: number[] = [];
        for (const unaryExpr of unaryExpressions) {
            const value = this.parseUnaryExpression(unaryExpr);
            if (value === null) {
                return null;
            }
            operands.push(value);
        }

        if (operands.length === 1) {
            return operands[0];
        }

        // Get operator strings
        const ops: string[] = operators.map((op: any) => op.image);

        // Evaluate with proper precedence
        // First pass: *, /, %
        let i = 0;
        while (i < ops.length) {
            const op = ops[i];
            if (op === '*' || op === '/' || op === '%') {
                const left = operands[i];
                const right = operands[i + 1];
                let result: number;

                switch (op) {
                    case '*':
                        result = left * right;
                        break;
                    case '/':
                        result = left / right;
                        break;
                    case '%':
                        result = left % right;
                        break;
                    default:
                        result = 0;
                }

                // Replace the two operands with the result
                operands.splice(i, 2, result);
                ops.splice(i, 1);
                // Don't increment i, check the same position again
            } else {
                i++;
            }
        }

        // Second pass: +, -
        i = 0;
        while (i < ops.length) {
            const op = ops[i];
            if (op === '+' || op === '-') {
                const left = operands[i];
                const right = operands[i + 1];
                const result = op === '+' ? left + right : left - right;

                // Replace the two operands with the result
                operands.splice(i, 2, result);
                ops.splice(i, 1);
                // Don't increment i, check the same position again
            } else {
                i++;
            }
        }

        return operands[0];
    }

    private parseUnaryExpression(node: any): number | null {
        if (!node || !node.children) {
            return null;
        }

        // Check for unary operators
        const hasMinus = node.children.Minus && node.children.Minus.length > 0;
        const hasPlus = node.children.Plus && node.children.Plus.length > 0;

        // Get the primary value
        if (node.children.primary) {
            const value = this.parsePrimary(node.children.primary[0]);
            if (value === null) return null;

            if (hasMinus) {
                return -value;
            }
            return value;
        }

        // Recursively handle nested unary expressions
        if (node.children.unaryExpression) {
            const value = this.parseUnaryExpression(node.children.unaryExpression[0]);
            if (value === null) return null;

            if (hasMinus) {
                return -value;
            }
            return value;
        }

        return null;
    }

    private parsePrimary(node: any): number | null {
        if (!node || !node.children) {
            return null;
        }

        // primary -> primaryPrefix
        if (node.children.primaryPrefix) {
            return this.parsePrimaryPrefix(node.children.primaryPrefix[0]);
        }

        return null;
    }

    private parsePrimaryPrefix(node: any): number | null {
        if (!node || !node.children) {
            return null;
        }

        // Handle literals
        if (node.children.literal) {
            return this.parseLiteral(node.children.literal[0]);
        }

        // Handle parenthesized expressions
        if (node.children.parenthesisExpression) {
            const parenExpr = node.children.parenthesisExpression[0];
            if (parenExpr.children && parenExpr.children.expression) {
                return this.parseExpression(parenExpr.children.expression[0]);
            }
        }

        // Check for fqnOrRefType (for parenthesized expressions)
        if (node.children.fqnOrRefType) {
            // This might be a cast or parenthesized expression
            // Look for LBrace in the parent or siblings
        }

        return null;
    }

    private parseLiteral(node: any): number | null {
        if (!node || !node.children) {
            return null;
        }

        // Handle integer literals
        if (node.children.integerLiteral) {
            const intNode = node.children.integerLiteral[0];
            if (intNode.children) {
                const decimalLiteral = intNode.children.DecimalLiteral?.[0];
                if (decimalLiteral && decimalLiteral.image) {
                    return parseInt(decimalLiteral.image, 10);
                }
            }
        }

        // Handle floating point literals
        if (node.children.floatLiteral) {
            const floatNode = node.children.floatLiteral[0];
            if (floatNode.children) {
                const floatingPointLiteral = floatNode.children.FloatingPointLiteral?.[0];
                if (floatingPointLiteral && floatingPointLiteral.image) {
                    return parseFloat(floatingPointLiteral.image);
                }
            }
        }

        return null;
    }

    // Helper method to parse a simple expression string
    parseExpressionString(expressionString: string): number | null {
        try {
            // Wrap in a minimal Java context for parsing
            const javaCode = `class Temp { int x = ${expressionString}; }`;
            const cst = parse(javaCode);
            return this.parseCst(cst);
        } catch (error) {
            console.error('Failed to parse expression:', error);
            return null;
        }
    }
}