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
exports.sidebarViewProvider = void 0;
// sidebarViewProvider.ts
const vscode = __importStar(require("vscode"));
const os = __importStar(require("os"));
const auth_1 = require("./auth"); // Import your signIn function
const connectedFilesService_1 = require("./connectedFilesService"); // Import the service to establish connections
const treeViewProvider_1 = require("./treeViewProvider"); // Import the new tree view provider
class sidebarViewProvider {
    _extensionUri;
    _context;
    static viewType = "vscodeSidebar.openview";
    _view;
    // Members to hold our tree view provider and tree view instance.
    _treeDataProvider;
    _treeView;
    constructor(_extensionUri, _context) {
        this._extensionUri = _extensionUri;
        this._context = _context;
    }
    resolveWebviewView(webviewView, context, token) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };
        // Set the initial HTML content (login or connection view)
        webviewView.webview.html = this.getHtmlContent(webviewView.webview);
        // Listen for messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case "login": {
                    const email = message.email;
                    const password = message.password;
                    await (0, auth_1.signIn)(this._context, email, password);
                    if (this._view) {
                        this._view.webview.html = this.getHtmlContent(this._view.webview);
                    }
                    break;
                }
                case "logout": {
                    await this._context.globalState.update("authToken", undefined);
                    vscode.window.showInformationMessage("Logged out successfully!");
                    // Set context key to false so that any session-dependent commands hide.
                    await vscode.commands.executeCommand("setContext", "extensionConnectedSession", false);
                    if (this._view) {
                        this._view.webview.html = this.getHtmlContent(this._view.webview);
                    }
                    break;
                }
                case "disconnect": {
                    // Run your custom disconnect logic before clearing the connection.
                    await connectedFilesService_1.ConnectedFilesService.disconnectSession(this._context);
                    // Disconnect the current connection without logging out completely.
                    vscode.window.showInformationMessage("Disconnected successfully!");
                    // Reset session-dependent context.
                    await vscode.commands.executeCommand("setContext", "extensionConnectedSession", false);
                    if (this._view) {
                        this._view.webview.html = this.getHtmlContent(this._view.webview);
                    }
                    break;
                }
                case "enableConnection": {
                    // Retrieve the stored session ID (if any) and then reset it.
                    const activeSessionId = this._context.globalState.get("activeSessionId") ?? null;
                    await this._context.globalState.update("activeSessionId", undefined);
                    // Get the workspace folder (assumes at least one folder is open)
                    const workspaceFolders = vscode.workspace.workspaceFolders;
                    if (!workspaceFolders || workspaceFolders.length === 0) {
                        vscode.window.showErrorMessage("No workspace folder found!");
                        return;
                    }
                    const workspaceFolder = workspaceFolders[0];
                    const rootFolder = workspaceFolder.name;
                    // Use the stored session ID if available; otherwise, use a new ID.
                    const connectionData = {
                        id: activeSessionId, // Optionally, generate a GUID here.
                        rootFolder: rootFolder,
                        name: os.hostname(),
                    };
                    const session = await connectedFilesService_1.ConnectedFilesService.establishConnection(this._context, connectionData);
                    console.log("session ", session);
                    if (session) {
                        // Retrieve folder hierarchy for tree view integration.
                        const folderHierarchy = await connectedFilesService_1.ConnectedFilesService.getFolderHierarchy(this._context, session.id);
                        console.log("folderHierarchy ", folderHierarchy);
                        // --- New TreeView integration ---
                        if (folderHierarchy) {
                            if (this._treeDataProvider) {
                                this._treeDataProvider.refresh(folderHierarchy);
                            }
                            else {
                                this._treeDataProvider = new treeViewProvider_1.FolderTreeDataProvider(folderHierarchy);
                                this._treeView = vscode.window.createTreeView("connectedFilesExplorer", {
                                    treeDataProvider: this._treeDataProvider,
                                });
                            }
                        }
                        // Set context key to true so that session-dependent commands can be enabled.
                        await vscode.commands.executeCommand("setContext", "extensionConnectedSession", true);
                        // Update the webview with a connection summary.
                        if (this._view) {
                            this._view.webview.html = this.getConnectionHtmlContent(this._view.webview, connectionData.name, folderHierarchy);
                        }
                    }
                    else {
                        console.error("session failed");
                    }
                    break;
                }
            }
        });
    }
    async autoEstablishConnection() {
        // Retrieve the stored session ID (if any) and then reset it.
        const activeSessionId = this._context.globalState.get("activeSessionId") ?? null;
        await this._context.globalState.update("activeSessionId", undefined);
        // Get the workspace folder (assumes at least one folder is open)
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage("No workspace folder found!");
            return;
        }
        const workspaceFolder = workspaceFolders[0];
        const rootFolder = workspaceFolder.name;
        // Build connection data
        const connectionData = {
            id: activeSessionId,
            rootFolder: rootFolder,
            name: os.hostname(),
        };
        // Establish the connection
        const session = await connectedFilesService_1.ConnectedFilesService.establishConnection(this._context, connectionData);
        console.log("Auto connection session:", session);
        if (session) {
            // Retrieve folder hierarchy
            const folderHierarchy = await connectedFilesService_1.ConnectedFilesService.getFolderHierarchy(this._context, session.id);
            // Update the tree view as before
            if (folderHierarchy) {
                if (this._treeDataProvider) {
                    this._treeDataProvider.refresh(folderHierarchy);
                }
                else {
                    this._treeDataProvider = new treeViewProvider_1.FolderTreeDataProvider(folderHierarchy);
                    this._treeView = vscode.window.createTreeView("connectedFilesExplorer", {
                        treeDataProvider: this._treeDataProvider,
                    });
                }
            }
            // Set context key to enable session-dependent commands.
            await vscode.commands.executeCommand("setContext", "extensionConnectedSession", true);
            // Update the webview with connection summary.
            if (this._view) {
                this._view.webview.html = this.getConnectionHtmlContent(this._view.webview, connectionData.name, folderHierarchy);
            }
        }
        else {
            vscode.window.showErrorMessage("Auto connection establishment failed.");
        }
    }
    // Helper method to update the tree view externally, if needed.
    updateTreeView(newFolderHierarchy) {
        if (this._treeDataProvider) {
            this._treeDataProvider.refresh(newFolderHierarchy);
        }
        else {
            console.warn("Tree data provider not initialized. Ensure you have established a connection first.");
        }
    }
    getHtmlContent(webview) {
        const token = this._context.globalState.get("authToken");
        const nonce = getNonce();
        // URIs for local resources (JS, CSS)
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "assets", "main.js"));
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "assets", "reset.css"));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "assets", "vscode.css"));
        const stylesheetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "assets", "main.css"));
        let bodyContent = "";
        let script = "";
        if (!token) {
            // Render a login form when not authenticated.
            bodyContent = `
        <section class="login-wrapper">
          <h2>Login</h2>
          <form id="loginForm">
            <input type="text" name="email" placeholder="Your email" required class="custom-input" aria-label="Email">
            <input type="password" name="password" placeholder="Your password" required class="custom-input" aria-label="Password">
            <button type="submit" class="btn btn-secondary">Sign In</button>
          </form>
        </section>
      `;
            script = `
        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
          const form = document.getElementById('loginForm');
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = form.email.value;
            const password = form.password.value;
            vscode.postMessage({
              command: 'login',
              email: email,
              password: password
            });
          });
        </script>
      `;
        }
        else {
            // When signed in, show the Enable Connection and Logout buttons.
            bodyContent = `
        <section class="connection-wrapper">
          <div class="button-group">
            <button id="enableConnectionBtn" class="btn btn-secondary">Enable Connection</button>
            <button id="logoutBtn" class="btn btn-secondary">Logout</button>
          </div>
        </section>
      `;
            script = `
        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
          document.getElementById('enableConnectionBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'enableConnection' });
          });
          document.getElementById('logoutBtn').addEventListener('click', () => {
            vscode.postMessage({ command: 'logout' });
          });
        </script>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      `;
        }
        return `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Security-Policy"
            content="default-src 'none'; style-src ${webview.cspSource} https://unpkg.com https://fonts.googleapis.com; script-src 'nonce-${nonce}';">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">

          <link rel="stylesheet" href="https://unpkg.com/modern-css-reset/dist/reset.min.css" />
          <link href="https://fonts.googleapis.com/css2?family=Muli:wght@300;400;700&display=swap" rel="stylesheet">

          <link href="${styleResetUri}" rel="stylesheet">
          <link href="${styleVSCodeUri}" rel="stylesheet">
          <link href="${stylesheetUri}" rel="stylesheet">
        </head>
        <body>
          ${bodyContent}
          ${script}
        </body>
      </html>`;
    }
    getConnectionHtmlContent(webview, connectionName, folderHierarchy) {
        const nonce = getNonce();
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "assets", "reset.css"));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "assets", "vscode.css"));
        const stylesheetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "assets", "main.css"));
        // Updated to include both Logout and Disconnect buttons with styles.
        const bodyContent = `
      <section class="connection-wrapper">
        <h2>${connectionName}</h2>
        <p>Status: Connected</p>
        <p>Track files in the Explorer view and see them in the "Connected Files" view on your browser.</p>
        <div class="button-group">
          <button id="disconnectBtn" class="btn btn-secondary">Disconnect</button>
          <button id="logoutBtn" class="btn btn-secondary">Logout</button>
        </div>
      </section>
    `;
        const script = `
      <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        document.getElementById('disconnectBtn').addEventListener('click', () => {
          vscode.postMessage({ command: 'disconnect' });
        });
        document.getElementById('logoutBtn').addEventListener('click', () => {
          vscode.postMessage({ command: 'logout' });
        });
      </script>
    `;
        return `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Security-Policy"
            content="default-src 'none'; style-src ${webview.cspSource} https://unpkg.com https://fonts.googleapis.com; script-src 'nonce-${nonce}';">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">

          <link rel="stylesheet" href="https://unpkg.com/modern-css-reset/dist/reset.min.css" />
          <link href="https://fonts.googleapis.com/css2?family=Muli:wght@300;400;700&display=swap" rel="stylesheet">

          <link href="${styleResetUri}" rel="stylesheet">
          <link href="${styleVSCodeUri}" rel="stylesheet">
          <link href="${stylesheetUri}" rel="stylesheet">
        </head>
        <body>
          ${bodyContent}
          ${script}
        </body>
      </html>`;
    }
}
exports.sidebarViewProvider = sidebarViewProvider;
function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=sidebarViewProvider.js.map