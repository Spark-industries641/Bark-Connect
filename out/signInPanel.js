"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignInPanel = void 0;
const vscode = __importStar(require("vscode"));
const auth_1 = require("./auth");
class SignInPanel {
    static currentPanel;
    _panel;
    _context;
    _disposables = [];
    static createOrShow(context) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        if (SignInPanel.currentPanel) {
            SignInPanel.currentPanel._panel.reveal(column);
        }
        else {
            const panel = vscode.window.createWebviewPanel('signIn', // Identifies the type of the webview. Used internally
            'Sign In', // Title of the panel displayed to the user
            column || vscode.ViewColumn.One, {
                enableScripts: true
            });
            SignInPanel.currentPanel = new SignInPanel(panel, context);
        }
    }
    constructor(panel, context) {
        this._panel = panel;
        this._context = context;
        // Set the webview HTML content
        this._panel.webview.html = this.getHtmlForWebview();
        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'submitSignIn':
                    const { email, password } = message;
                    // Call signIn with the provided credentials
                    (0, auth_1.signIn)(this._context, email, password);
                    return;
            }
        }, null, this._disposables);
        // Clean up when the panel is disposed
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }
    dispose() {
        SignInPanel.currentPanel = undefined;
        this._panel.dispose();
        this._disposables.forEach(d => d.dispose());
    }
    getHtmlForWebview() {
        // Note: The nonce should be a random value in a real implementation.
        const nonce = '123456';
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Sign In</title>
            </head>
            <body>
                <button id="showForm">Sign In</button>
                <div id="formContainer" style="display:none; margin-top: 1em;">
                    <input type="text" id="email" placeholder="Email" /><br/><br/>
                    <input type="password" id="password" placeholder="Password" /><br/><br/>
                    <button id="submit">Submit</button>
                </div>
                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    document.getElementById('showForm').addEventListener('click', () => {
                        document.getElementById('formContainer').style.display = 'block';
                    });
                    document.getElementById('submit').addEventListener('click', () => {
                        const email = document.getElementById('email').value;
                        const password = document.getElementById('password').value;
                        vscode.postMessage({ command: 'submitSignIn', email, password });
                    });
                </script>
            </body>
            </html>
        `;
    }
}
exports.SignInPanel = SignInPanel;
//# sourceMappingURL=signInPanel.js.map