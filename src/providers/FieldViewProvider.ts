import * as vscode from 'vscode';

export class FieldViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'frc-pose-view.fieldView';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'updatePose':
                    // Handle pose update from webview (if needed to sync back to code)
                    // vscode.window.showInformationMessage(`Pose updated: ${message.x}, ${message.y}, ${message.rotation}`);
                    return;
            }
        });
    }

    public updatePose(x: number, y: number, rotation: number) {
        if (this._view) {
            this._view.webview.postMessage({ type: 'updatePose', x: x, y: y, rotation: rotation });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css'));
        const fieldImageUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'field.svg'));

        const nonce = getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet">
                <title>Field View</title>
            </head>
            <body>
                <div id="field-container">
                    <img id="field-image" src="${fieldImageUri}" alt="FRC Field" />
                    <div id="robot" class="robot"></div>
                    <div id="ghost-robot" class="robot ghost"></div>
                </div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
