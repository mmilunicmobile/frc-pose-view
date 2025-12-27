#!/usr/bin/env node

import { evaluateExpression } from "./parsers/expressionMatchParser.js";

function printUsage() {
    console.log(`
Usage: frc-eval <expression>

Evaluates a mathematical expression and prints the result.

Examples:
  frc-eval "2 + 2"
  frc-eval "(5 + 3) * 2"
  frc-eval "100 / (2 + 3)"
  frc-eval "-5 + 3"

Supported operators: +, -, *, /
Supports: parentheses, unary operators, number literals
  `);
}

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error("Error: No expression provided");
        printUsage();
        process.exit(1);
    }

    if (args[0] === "--help" || args[0] === "-h") {
        printUsage();
        process.exit(0);
    }

    // Join all arguments to support expressions with spaces
    const expression = args.join(" ");

    try {
        const result = evaluateExpression(expression);

        console.log(result);
    } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}

main();
