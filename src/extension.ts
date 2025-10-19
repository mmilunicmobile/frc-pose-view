// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "frc-pose-view" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "frc-pose-view.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage(
        "Hello World from FRC Pose View! This is really cool!"
      );
    }
  );

  context.subscriptions.push(disposable);

  const hoverProvider = vscode.languages.registerHoverProvider("java", {
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

      // Get type definition information
      const typePromise = vscode.commands.executeCommand<vscode.Location[]>(
        'vscode.executeTypeDefinitionProvider',
        document.uri,
        position
      );

      // Get definition information (variable/method declaration)
      const definitionPromise = vscode.commands.executeCommand<vscode.Location[]>(
        'vscode.executeDefinitionProvider',
        document.uri,
        position
      );

      return Promise.all([typePromise, definitionPromise]).then(([typeResults, defResults]) => {
        const markdown = new vscode.MarkdownString();
        
        // Try to extract type information from the definition location
        if (defResults && defResults.length > 0) {
          const defLocation = defResults[0];
          
          // Read the definition line to extract type information
          return vscode.workspace.openTextDocument(defLocation.uri).then(defDoc => {
            const defLine = defDoc.lineAt(defLocation.range.start.line);
            const defText = defLine.text.trim();
            
            // Simple regex to extract type from Java declarations
            const typeMatch = defText.match(/(?:public|private|protected)?\s*(?:static)?\s*(?:final)?\s*([A-Z][A-Za-z0-9_<>[\]]*)\s+\w+/);
            
            let typeInfo = 'Unknown type';
            if (typeMatch && typeMatch[1]) {
              typeInfo = typeMatch[1];
            } else if (typeResults && typeResults.length > 0) {
              // Fallback to class name from type definition
              const typePath = typeResults[0].uri.path;
              typeInfo = typePath.split('/').pop()?.replace('.java', '') || 'Unknown';
            }

            markdown.appendCodeblock(`${word}: ${typeInfo}`, 'java');
            markdown.appendMarkdown(`\n\n**Variable: \`${word}\`**`);
            
            if (typeResults && typeResults.length > 0) {
              markdown.appendMarkdown(`\n\n[Go to type definition](${typeResults[0].uri})`);
            }

            return new vscode.Hover(markdown, range);
          });
        } else {
          // No definition found, just show basic info
          markdown.appendCodeblock(`${word}: Unknown type`, 'java');
          return new vscode.Hover(markdown, range);
        }
      }).catch(error => {
        console.error('Error getting type information:', error);
        const markdown = new vscode.MarkdownString(`**${word}**\n\nCould not determine type`);
        return new vscode.Hover(markdown, range);
      });
    },
  });

  context.subscriptions.push(hoverProvider);
}

// This method is called when your extension is deactivated
export function deactivate() {}
