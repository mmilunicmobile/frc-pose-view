// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// Types that should show pose visualization hovers
import { PoseHoverProvider } from "./providers/hoverProvider.js";
import { FieldViewProvider } from "./providers/FieldViewProvider.js";
import { evaluateExpression } from "./parsers/expressionMatchParser.js";

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

  const disposable2 = vscode.commands.registerCommand(
    "frc-pose-view.evaluateExpression",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      // Get expression from active editor via popup
      const expression = vscode.window.showInputBox({
        prompt: "Enter expression to evaluate",
      });
      expression.then((expression) => {
        if (expression === undefined) {
          return;
        }
        const result = evaluateExpression(expression);
        vscode.window.showInformationMessage(
          "Result: " + result
        );
      });
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(disposable2);

  const hoverProvider = vscode.languages.registerHoverProvider("java", new PoseHoverProvider());
  context.subscriptions.push(hoverProvider);

  const fieldViewProvider = new FieldViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(FieldViewProvider.viewType, fieldViewProvider)
  );

  context.subscriptions.push(vscode.commands.registerCommand('frc-pose-view.focusFieldView', (poseData: any) => {
    vscode.commands.executeCommand('frc-pose-view.fieldView.focus');
    if (poseData && typeof poseData === 'object') {
      const { x, y, rotation } = poseData;
      // Short delay to ensure view is ready/visible
      setTimeout(() => {
        fieldViewProvider.updatePose(x || 0, y || 0, rotation || 0);
      }, 500);
    }
  }));
}

// This method is called when your extension is deactivated
export function deactivate() { }
