import * as vscode from 'vscode';

// Types that should show pose visualization hovers
const POSE_TYPES = [
    'Pose2d',
    'Poses'
];

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

                if (typeName && POSE_TYPES.includes(typeName)) {
                    const markdown = new vscode.MarkdownString();
                    markdown.appendCodeblock(`${word}: ${typeName}`, 'java');
                    markdown.appendMarkdown(`\n\n**Pose Variable: \`${word}\`**`);
                    markdown.appendMarkdown(`\n\n*This is a ${typeName} - pose visualization coming soon!*`);
                    markdown.appendMarkdown(`\n\n[Go to type definition](${result.uri})`);

                    return new vscode.Hover(markdown, range);
                }
            }

            return undefined;
        });
    }
}
