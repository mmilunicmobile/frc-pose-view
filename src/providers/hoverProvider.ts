import * as vscode from 'vscode';
import { evaluateExpression, getIdentifiers } from '../parsers/expressionMatchParser.js';

// Types that should show pose visualization hovers
const POSE_TYPES = [
    'Pose2d',
    'Rotation2d'
];

/**
 * Extracts the full expression at the given position.
 * Handles:
 * - Simple variables: `pose`
 * - Static fields: `Pose2d.kZero`
 * - Constructor calls: `new Pose2d(0, 0, Rotation2d.kZero)`
 * - Method calls: `Rotation2d.fromDegrees(90)`
 */
function extractFullExpressionRange(document: vscode.TextDocument, range: vscode.Range): vscode.Range {
    const line = document.lineAt(range.start.line);
    const text = line.text;
    let start = range.start.character;
    let end = range.end.character;

    // Assume we are completely at the left. Fault constructors missing the new are accounted for

    // Expand to the right to find the end of the expression
    // Need to handle balanced parentheses
    let parenDepth = 0;
    end--;
    while (end < text.length) {
        end++;
        const char = text[end];

        if (char === '(') {
            parenDepth++;
        } else if (char === ')') {
            parenDepth--;
            if (parenDepth < 0) {
                break;
            }
        } else if (parenDepth === 0 && !(/[\.\w\s/]/.test(char))) {
            break;
        }
    }

    // Extract and clean up the expression
    let expression = text.substring(start, end).trim();

    let rangeOut = new vscode.Range(
        new vscode.Position(range.start.line, start),
        new vscode.Position(range.start.line, start + expression.length)
    );

    return rangeOut;
}

const RECURSION_LIMIT = 5;

async function evaluateRecursive(document: vscode.TextDocument, range: vscode.Range, depth: number): Promise<number | null> {
    if (depth <= 0) {
        return null;
    }

    const expressionText = document.getText(range);
    const identifiers = getIdentifiers(expressionText);
    const resolvedValues = new Map<number, number>();

    for (const identifier of identifiers) {
        const identifierRange = new vscode.Range(
            range.start.translate(0, identifier.startOffset),
            range.start.translate(0, identifier.endOffset)
        );

        const definitionLocation = await vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeDefinitionProvider',
            document.uri,
            identifierRange.end.translate(0, -1)
        );

        if (definitionLocation && definitionLocation.length > 0) {
            const definition = definitionLocation[0];
            const definitionDocument = await vscode.workspace.openTextDocument(definition.uri);
            const line = definitionDocument.lineAt(definition.range.start.line);
            const text = line.text;

            // Extract right hand side of assignment
            // Looks for " = " and takes everything after it until ";" or end of line.
            const assignmentMatch = text.match(/=\s*([^;]+)/);
            if (assignmentMatch && assignmentMatch.index !== undefined) {
                const rightSide = assignmentMatch[1].trim();
                const equalsIndex = assignmentMatch.index;
                const parensIndex = assignmentMatch[0].indexOf(assignmentMatch[1]);

                // Calculate start column of the RHS
                const rhsStartCol = equalsIndex + parensIndex;
                const rhsEndCol = rhsStartCol + rightSide.length;

                const rhsRange = new vscode.Range(
                    new vscode.Position(definition.range.start.line, rhsStartCol),
                    new vscode.Position(definition.range.start.line, rhsEndCol)
                );

                const evaluated = await evaluateRecursive(definitionDocument, rhsRange, depth - 1);
                if (evaluated !== null) {
                    resolvedValues.set(identifier.startOffset, evaluated);
                }
            }
        }
    }

    const parsed = evaluateExpression(expressionText, (start, end) => {
        if (resolvedValues.has(start)) {
            return resolvedValues.get(start);
        }
        return undefined;
    });
    return parsed;
}

async function evaluateExpressionAtRange(document: vscode.TextDocument, range: vscode.Range): Promise<number | null> {
    const fullExpressionRange = extractFullExpressionRange(document, range);
    return evaluateRecursive(document, fullExpressionRange, RECURSION_LIMIT);
}

export class PoseHoverProvider implements vscode.HoverProvider {
    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range);

        if (!word) {
            return undefined;
        }

        // Get type definition information directly
        return vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeTypeDefinitionProvider',
            document.uri,
            position
        ).then(typeResults => {
            if (!typeResults || typeResults.length === 0) {
                return undefined;
            }

            // Check if definition matches any of our types
            for (const result of typeResults) {
                const typePath = result.uri.path;
                // Get filename without extension
                const typeName = typePath.split('/').pop()?.replace(/\.[^/.]+$/, '');

                if (range && typeName && POSE_TYPES.includes(typeName)) {
                    const markdown = new vscode.MarkdownString();
                    markdown.appendCodeblock(`${word}: ${typeName}`, 'java');

                    // Get full expression that is being hovered
                    const fullExpressionRange = extractFullExpressionRange(document, range);

                    const fullExpression = document.getText(fullExpressionRange);

                    markdown.appendMarkdown(`\n\n**Pose Variable: \`${word}\`**`);
                    markdown.appendMarkdown(`\n\n*This is a ${typeName} - pose visualization coming soon!*`);
                    markdown.appendCodeblock(`\n${fullExpression}`, 'java');

                    // Return the promise directly which resolves to the hover
                    return evaluateExpressionAtRange(document, range).then(parsed => {
                        markdown.appendMarkdown(`\n\n\`\`\`javascript\n${parsed}\n\`\`\``);
                        markdown.appendMarkdown(`\n\n[Go to type definition](${result.uri})`);
                        return new vscode.Hover(markdown, fullExpressionRange);
                    });
                }
            }

            return undefined;
        });
    }
}
