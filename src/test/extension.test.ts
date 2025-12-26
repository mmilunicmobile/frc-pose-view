import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { evaluateExpression } from '../parsers/expressionMatchParser';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('Expression test', () => {
		const result = evaluateExpression('2 + 3');
		assert.strictEqual(5, result);

		const result2 = evaluateExpression('2 + 3 * 4');
		assert.strictEqual(14, result2);

		const result3 = evaluateExpression('(2 + 3) * 4');
		assert.strictEqual(20, result3);
	});

});
