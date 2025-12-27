import * as vscode from 'vscode';
import { evaluateExpression, getIdentifiers } from '../parsers/expressionMatchParser.js';

// Types that should show pose visualization hovers
const POSE_TYPES = [
    'Pose2d',
    'Rotation2d',
    'Translation2d'
];

/**
 * Finds the expression at the given position, expanding left to capture the full chain
 * and right to capture arguments, but NOT evaluating further method chains to the right.
 * 
 * Logic:
 * 1. Find the word under the cursor.
 * 2. Expand RIGHT: If followed by '(', consume until matching ')'. Stop there.
 * 3. Expand LEFT: Consume '.' + identifier + optional '(...)'. Handle 'new'.
 */
function findExpressionAtPosition(document: vscode.TextDocument, position: vscode.Position): vscode.Range | null {
    // 1. Get the word range at the cursor
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) return null;

    let start = wordRange.start;
    let end = wordRange.end;

    // --- RIGHT EXPANSION ---
    // Check if the current word is followed by '(' (possibly across lines/whitespace)
    const textStart = document.getText(new vscode.Range(start, document.lineAt(document.lineCount - 1).range.end));
    // We need to look relative to the original document, not just the word

    // Helper to get character at absolute position
    const getCharAt = (pos: vscode.Position): string => {
        if (pos.line >= document.lineCount) return '';
        const line = document.lineAt(pos.line).text;
        if (pos.character >= line.length) return '\n'; // Treat EOL as newline
        return line.charAt(pos.character);
    };

    // Helper to advance position
    const advance = (pos: vscode.Position): vscode.Position => {
        const line = document.lineAt(pos.line).text;
        if (pos.character + 1 < line.length) {
            return new vscode.Position(pos.line, pos.character + 1);
        } else {
            return new vscode.Position(pos.line + 1, 0);
        }
    };

    const retreat = (pos: vscode.Position): vscode.Position => {
        if (pos.character > 0) {
            return new vscode.Position(pos.line, pos.character - 1);
        } else {
            if (pos.line > 0) {
                const prevLine = document.lineAt(pos.line - 1).text;
                return new vscode.Position(pos.line - 1, prevLine.length);
            } else {
                return new vscode.Position(0, 0);
            }
        }
    };

    let cursor = end;
    // Skip whitespace
    while (/\s/.test(getCharAt(cursor))) {
        cursor = advance(cursor);
        if (cursor.line >= document.lineCount) break;
    }

    if (getCharAt(cursor) === '(') {
        // Find matching closing parenthesis
        let parenDepth = 0;
        let scanPos = cursor;

        // Safety limit for scanning
        let checks = 0;
        const limit = 5000;

        while (checks < limit) {
            const char = getCharAt(scanPos);
            if (char === '(') parenDepth++;
            else if (char === ')') parenDepth--;

            scanPos = advance(scanPos);
            checks++;

            if (parenDepth === 0) {
                end = scanPos; // Include the closing ')'
                break;
            }
            if (scanPos.line >= document.lineCount) break;
        }
    }

    // --- LEFT EXPANSION ---
    // Scan backwards from `start`
    // We want to consume:
    // - "."
    // - identifiers
    // - balanced "(...)" groups (representing method calls or constructor args previous in the chain)
    // - "new" keyword (if at the start)

    cursor = start;
    let scanning = true;

    while (scanning) {
        let prev = retreat(cursor);
        // If we didn't move, we are at start of doc
        if (prev.isEqual(cursor)) break;

        // Skip whitespace going back
        let wsCheck = prev;
        while (/\s/.test(getCharAt(wsCheck)) && !wsCheck.isEqual(new vscode.Position(0, 0))) {
            wsCheck = retreat(wsCheck);
        }

        const char = getCharAt(wsCheck);

        if (char === '.') {
            // It's a dot, so we expect an identifier/member before this
            cursor = wsCheck; // Update cursor to the dot (skipping ws)

            // Now scan back over the identifier/paren-group before the dot
            // Move back one more to check what's before the dot
            cursor = retreat(cursor);
            // Skip whitespace again
            while (/\s/.test(getCharAt(cursor)) && !cursor.isEqual(new vscode.Position(0, 0))) {
                cursor = retreat(cursor);
            }

            if (getCharAt(cursor) === ')') {
                // Balanced group backwards
                let parenDepth = 0;
                let scanPos = cursor;
                let checks = 0;
                const limit = 5000;

                // We are at ')', scanning back to '('
                // Scan back until depth 0
                while (checks < limit) {
                    const c = getCharAt(scanPos);
                    if (c === ')') parenDepth++;
                    else if (c === '(') parenDepth--;

                    if (parenDepth === 0) {
                        // Found matching '(', scanPos is at '('
                        // Now we usually have an identifier before the '(' (method name or 'new Type')
                        cursor = scanPos;
                        break;
                    }

                    if (scanPos.isEqual(new vscode.Position(0, 0))) break;
                    scanPos = retreat(scanPos);
                    checks++;
                }

                // After consuming the paren group, we need to consume the identifier before it
                // e.g. "method(" -> cursor is at '(', retreat to 'd'
                cursor = retreat(cursor);

            }

            // Consume identifier characters
            while (/\w/.test(getCharAt(cursor))) {
                // Scan back until non-word char
                if (cursor.character === 0 && cursor.line === 0) {
                    break; // BOF
                }
                const prevCharPos = retreat(cursor);
                if (!/\w/.test(getCharAt(prevCharPos))) {
                    // Start of identifier
                    break;
                }
                cursor = retreat(cursor);
            }

            // We are now at the start of an identifier. 
            // Loop continues to check for another dot before this identifier.

        } else if (/\w/.test(char) && document.getText(new vscode.Range(wsCheck, advance(wsCheck))) === 'w') {
            // Check for 'new '
            // We are at 'w', check 'e', 'n'
            // This is a bit hacky, let's just check the word at wsCheck position
            const testRange = document.getWordRangeAtPosition(wsCheck);
            if (testRange && document.getText(testRange) === 'new') {
                cursor = testRange.start;
                scanning = false; // "new" checks out, we are done
            } else {
                // Non-dot, non-'new' character found (e.g. ',' or ';'), stop scanning
                scanning = false;
            }
        } else {
            // Hit a stop character (e.g. ',' or '(' of a parent call, or ';')
            // But wait, if we are just starting (cursor == start of original word), we haven't consumed anything.
            // If we already consumed a chain, we stop.
            scanning = false;
        }

        start = cursor;
    }

    return new vscode.Range(start, end);
}

const RECURSION_LIMIT = 20;

async function evaluateRecursive(document: vscode.TextDocument, range: vscode.Range, depth: number): Promise<any | null> {
    if (depth <= 0) {
        return null;
    }

    const expressionText = document.getText(range);
    const identifiers = getIdentifiers(expressionText);
    const resolvedValues = new Map<number, any>();

    const rangeStartOffset = document.offsetAt(range.start);

    for (const identifier of identifiers) {
        const identifierStart = document.positionAt(rangeStartOffset + identifier.startOffset);
        const identifierEnd = document.positionAt(rangeStartOffset + identifier.endOffset);

        const identifierRange = new vscode.Range(identifierStart, identifierEnd);

        const definitionLocation = await vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeDefinitionProvider',
            document.uri,
            identifierRange.end.translate(0, -1)
        );

        if (definitionLocation && definitionLocation.length > 0) {
            const definition = definitionLocation[0];
            const definitionDocument = await vscode.workspace.openTextDocument(definition.uri);
            const startPos = definition.range.start;

            // Search forward for assignment "="
            // Stop if we hit ";", "{", "}", "(" which imply end of definition or start of block/method
            let currentLineIdx = startPos.line;
            let currentLineText = definitionDocument.lineAt(currentLineIdx).text.substring(startPos.character);

            let equalsFound = false;
            let equalsPos: vscode.Position | null = null;
            let checks = 0;
            const limit = 50;

            while (checks < limit && currentLineIdx < definitionDocument.lineCount) {
                const candidates = [
                    { char: '=', idx: currentLineText.indexOf('=') },
                    { char: ';', idx: currentLineText.indexOf(';') },
                    { char: '{', idx: currentLineText.indexOf('{') },
                    { char: '}', idx: currentLineText.indexOf('}') },
                    { char: '(', idx: currentLineText.indexOf('(') }
                ].filter(c => c.idx !== -1).sort((a, b) => a.idx - b.idx);

                if (candidates.length > 0) {
                    const match = candidates[0];
                    if (match.char === '=') {
                        equalsFound = true;
                        const charOffset = (currentLineIdx === startPos.line) ? startPos.character + match.idx : match.idx;
                        equalsPos = new vscode.Position(currentLineIdx, charOffset);
                    }
                    // If we found '=', we succeeded. 
                    // If we found ';', '{', '}', '(', we failed to find an assignment for THIS symbol.
                    break;
                }

                currentLineIdx++;
                if (currentLineIdx < definitionDocument.lineCount) {
                    currentLineText = definitionDocument.lineAt(currentLineIdx).text;
                }
                checks++;
            }

            if (equalsFound && equalsPos) {
                // 2. Scan for semicolon from after the equals
                let semicolFound = false;
                let endPos: vscode.Position | null = null;

                let scanPos = equalsPos.translate(0, 1); // Start after '='
                let scanChecks = 0;
                // Scan for semicolon termination
                while (scanChecks < limit && scanPos.line < definitionDocument.lineCount) {
                    const lineText = definitionDocument.lineAt(scanPos.line).text;
                    const semiIndex = lineText.indexOf(';', (scanPos.line === equalsPos.line) ? scanPos.character : 0);

                    if (semiIndex !== -1) {
                        semicolFound = true;
                        endPos = new vscode.Position(scanPos.line, semiIndex);
                        break;
                    }

                    scanPos = new vscode.Position(scanPos.line + 1, 0);
                    scanChecks++;
                }

                if (semicolFound && endPos) {
                    // Extract the RHS range
                    const rhsRange = new vscode.Range(equalsPos.translate(0, 1), endPos);

                    // Evaluate
                    const evaluated = await evaluateRecursive(definitionDocument, rhsRange, depth - 1);
                    if (evaluated !== null) {
                        resolvedValues.set(identifier.startOffset, evaluated);
                    }
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
    // The range passed here is just the word range, so we need to find the full expression
    // using the start/end logic?
    // Actually, provideHover passes the word range.
    // But we want to evaluate the *full* expression we found.
    // The caller (provideHover) calls findExpressionAtPosition.
    // So this function should probably take the full expression range directly
    // Or we just use evaluateRecursive directly in provideHover.
    return evaluateRecursive(document, range, RECURSION_LIMIT);
}

export class PoseHoverProvider implements vscode.HoverProvider {
    async provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | undefined> {
        const range = document.getWordRangeAtPosition(position);
        const word = document.getText(range);

        if (!word) {
            return undefined;
        }

        // 1. Try to find a match from type definitions (covers variables: bob -> Pose2d)
        const typeResults = await vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeTypeDefinitionProvider',
            document.uri,
            position
        );

        if (typeResults && typeResults.length > 0) {
            for (const result of typeResults) {
                const typePath = result.uri.path;
                const typeName = typePath.split('/').pop()?.replace(/\.[^/.]+$/, '');
                if (range && typeName && POSE_TYPES.includes(typeName)) {
                    return this.generateHover(document, position, word, typeName, result.uri);
                }
            }
        }

        // 2. Try to find a match from definitions (covers members: getX -> defined in Pose2d.java)
        const defResults = await vscode.commands.executeCommand<vscode.Location[]>(
            'vscode.executeDefinitionProvider',
            document.uri,
            position
        );

        if (defResults && defResults.length > 0) {
            for (const result of defResults) {
                const typePath = result.uri.path;
                const typeName = typePath.split('/').pop()?.replace(/\.[^/.]+$/, '');
                if (range && typeName && POSE_TYPES.includes(typeName)) {
                    return this.generateHover(document, position, word, typeName, result.uri);
                }
            }
        }

        // 3. Fallback: Check if the expression itself looks like a Pose Type usage (covers statics: Rotation2d.fromDegrees)
        const fullExpressionRange = findExpressionAtPosition(document, position);
        if (fullExpressionRange) {
            const fullExpression = document.getText(fullExpressionRange).trim();

            // Check if string starts with Known Type
            for (const typeName of POSE_TYPES) {
                if (fullExpression.startsWith(typeName + ".") || fullExpression.startsWith("new " + typeName)) {
                    return this.generateHover(document, position, word, typeName, undefined);
                }
            }

            // 4. Deep Fallback: Trace the ROOT of the expression chain
            // If we have "newPose.getTranslation().getX()", scanning left gives us the full chain.
            // We want to check the Type Verification of the *first* identifier in that chain ("newPose").
            const identifiers = getIdentifiers(fullExpression);
            if (identifiers.length > 0) {
                const rootIdentifier = identifiers[0]; // e.g. "newPose"
                // Calculate position of root identifier
                const rootPosition = fullExpressionRange.start.translate(0, rootIdentifier.startOffset);

                // Check Type Definition of the root
                const rootTypeResults = await vscode.commands.executeCommand<vscode.Location[]>(
                    'vscode.executeTypeDefinitionProvider',
                    document.uri,
                    rootPosition // Use 'newPose' position, ignoring the '.getTranslation().getX()' part
                );

                if (rootTypeResults && rootTypeResults.length > 0) {
                    for (const result of rootTypeResults) {
                        const typePath = result.uri.path;
                        const typeName = typePath.split('/').pop()?.replace(/\.[^/.]+$/, '');
                        if (typeName && POSE_TYPES.includes(typeName)) {
                            // The ROOT is a Pose type, so the whole chain is a valid pose operation
                            // (or at least related to it). We trigger the hover.
                            return this.generateHover(document, position, word, typeName, result.uri);
                        }
                    }
                }
            }
        }

        return undefined;
    }

    private generateHover(document: vscode.TextDocument, position: vscode.Position, word: string, typeName: string, typeDefUri: vscode.Uri | undefined): Promise<vscode.Hover | undefined> {
        const markdown = new vscode.MarkdownString();
        markdown.appendCodeblock(`${word}: ${typeName}`, 'java');

        // Get full expression that is being hovered
        const fullExpressionRange = findExpressionAtPosition(document, position);

        if (!fullExpressionRange) return Promise.resolve(undefined);

        const fullExpression = document.getText(fullExpressionRange);

        markdown.appendMarkdown(`\n\n**Pose Variable: \`${word}\`**`);
        markdown.appendMarkdown(`\n\n*This is a ${typeName} - pose visualization coming soon!*`);
        markdown.appendCodeblock(`\n${fullExpression}`, 'java');

        // Return the promise directly which resolves to the hover
        return evaluateExpressionAtRange(document, fullExpressionRange).then(parsed => {
            markdown.appendMarkdown(`\n\n\`\`\`javascript\n${parsed}\n\`\`\``);
            if (typeDefUri) {
                markdown.appendMarkdown(`\n\n[Go to type definition](${typeDefUri})`);
            }
            return new vscode.Hover(markdown, fullExpressionRange);
        });
    }
}
