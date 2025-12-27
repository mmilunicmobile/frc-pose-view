import * as vscode from 'vscode';
import { evaluateExpression } from '../parsers/expressionMatchParser.js';

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

function evaluateExpressionAtRange(document: vscode.TextDocument, range: vscode.Range): number | null {
    const fullExpressionRange = extractFullExpressionRange(document, range);
    const fullExpression = document.getText(fullExpressionRange);
    const parsed = evaluateExpression(fullExpression, (start, end) => {
        const range = new vscode.Range(
            fullExpressionRange.start.translate(0, start),
            fullExpressionRange.start.translate(0, end)
        );

        // get what could have assigned to this field
        // eg if the range is `x` and somewhere there is `int x = 1 + 2` 
        // we should return `1 + 2`
        // if it is never assigned to, return null

        const rightSideOfAssignment = ;

        return evaluateExpression(rightSideOfAssignment);
    });
    return parsed;
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

                    const parsed = evaluateExpressionAtRange(document, fullExpressionRange);

                    markdown.appendMarkdown(`\n\n\`\`\`javascript\n${parsed}\n\`\`\``);

                    markdown.appendMarkdown(`\n\n[Go to type definition](${result.uri})`);

                    return new vscode.Hover(markdown, fullExpressionRange);
                }
            }

            return undefined;
        });
    }
}
