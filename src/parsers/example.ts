// Example usage of the Parser class
// This demonstrates parsing numerical expressions from Java code

import { Parser } from './parser.js';

const parser = new Parser();

// Test cases
console.log('Testing expression parser:');
console.log('=========================\n');

// Simple arithmetic
console.log('5 + 3 =', parser.parseExpressionString('5 + 3'));           // 8
console.log('10 - 4 =', parser.parseExpressionString('10 - 4'));         // 6
console.log('6 * 7 =', parser.parseExpressionString('6 * 7'));           // 42
console.log('20 / 4 =', parser.parseExpressionString('20 / 4'));         // 5
console.log('17 % 5 =', parser.parseExpressionString('17 % 5'));         // 2

// Order of operations
console.log('\nOrder of operations:');
console.log('2 + 3 * 4 =', parser.parseExpressionString('2 + 3 * 4'));   // 14
console.log('10 - 6 / 2 =', parser.parseExpressionString('10 - 6 / 2')); // 7
console.log('15 % 4 + 2 =', parser.parseExpressionString('15 % 4 + 2')); // 5

// Parentheses
console.log('\nWith parentheses:');
console.log('(2 + 3) * 4 =', parser.parseExpressionString('(2 + 3) * 4'));       // 20
console.log('10 / (2 + 3) =', parser.parseExpressionString('10 / (2 + 3)'));     // 2

// Negative numbers
console.log('\nNegative numbers:');
console.log('-5 + 3 =', parser.parseExpressionString('-5 + 3'));         // -2
console.log('10 * -2 =', parser.parseExpressionString('10 * -2'));       // -20

// Complex expressions
console.log('\nComplex expressions:');
console.log('(10 + 5) * 2 - 8 / 4 =', parser.parseExpressionString('(10 + 5) * 2 - 8 / 4')); // 28
