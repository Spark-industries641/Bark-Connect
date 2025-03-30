// sidebarViewProvider.ts
import * as vscode from "vscode";
import * as os from "os";
import { signIn } from "./auth"; // Import your signIn function
import { ConnectedFilesService } from "./connectedFilesService"; // Import the service to establish connections
import {
  ConnectionEstablishDto,
  FolderDto,
} from "./models/FileDtos"; // Ensure FolderDto is imported
import { FolderTreeDataProvider } from "./treeViewProvider"; // Import the new tree view provider

export class sidebarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "vscodeSidebar.openview";

  private _view?: vscode.WebviewView;
  // Members to hold our tree view provider and tree view instance.
  private _treeDataProvider?: FolderTreeDataProvider;
  private _treeView?: vscode.TreeView<any>;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
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
          await signIn(this._context, email, password);
          if (this._view) {
            this._view.webview.html = this.getHtmlContent(this._view.webview);
          }
          break;
        }
        case "logout": {
          await this._context.globalState.update("authToken", undefined);
          vscode.window.showInformationMessage("Logged out successfully!");
          // Set context key to false so that any session-dependent commands hide.
          await vscode.commands.executeCommand(
            "setContext",
            "extensionConnectedSession",
            false
          );
          if (this._view) {
            this._view.webview.html = this.getHtmlContent(this._view.webview);
          }
          break;
        }
        case "disconnect": {
          // Run your custom disconnect logic before clearing the connection.
          await ConnectedFilesService.disconnectSession(this._context);

          // Disconnect the current connection without logging out completely.
          vscode.window.showInformationMessage("Disconnected successfully!");
          // Reset session-dependent context.
          await vscode.commands.executeCommand(
            "setContext",
            "extensionConnectedSession",
            false
          );
          if (this._view) {
            this._view.webview.html = this.getHtmlContent(this._view.webview);
          }
          break;
        }
        case "enableConnection": {
          // Retrieve the stored session ID (if any) and then reset it.
          const activeSessionId: string | null =
            this._context.globalState.get("activeSessionId") ?? null;
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
          const connectionData: ConnectionEstablishDto = {
            id: activeSessionId, // Optionally, generate a GUID here.
            rootFolder: rootFolder,
            name: os.hostname(),
          };

          const session = await ConnectedFilesService.establishConnection(
            this._context,
            connectionData
          );
          console.log("session ", session);

          if (session) {
            // Retrieve folder hierarchy for tree view integration.
            const folderHierarchy =
              await ConnectedFilesService.getFolderHierarchy(
                this._context,
                session.id
              );
            console.log("folderHierarchy ", folderHierarchy);
            // --- New TreeView integration ---
            if (folderHierarchy) {
              if (this._treeDataProvider) {
                this._treeDataProvider.refresh(folderHierarchy);
              } else {
                this._treeDataProvider = new FolderTreeDataProvider(
                  folderHierarchy
                );
                this._treeView = vscode.window.createTreeView(
                  "connectedFilesExplorer",
                  {
                    treeDataProvider: this._treeDataProvider,
                  }
                );
              }
            }
            // Set context key to true so that session-dependent commands can be enabled.
            await vscode.commands.executeCommand(
              "setContext",
              "extensionConnectedSession",
              true
            );
            // Update the webview with a connection summary.
            if (this._view) {
              this._view.webview.html = this.getConnectionHtmlContent(
                this._view.webview,
                connectionData.name,
                folderHierarchy
              );
            }
          } else {
            console.error("session failed");
          }
          break;
        }
      }
    });
  }

  public async autoEstablishConnection(): Promise<void> {
    // Retrieve the stored session ID (if any) and then reset it.
    const activeSessionId: string | null =
      this._context.globalState.get("activeSessionId") ?? null;
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
    const connectionData: ConnectionEstablishDto = {
      id: activeSessionId,
      rootFolder: rootFolder,
      name: os.hostname(),
    };

    // Establish the connection
    const session = await ConnectedFilesService.establishConnection(
      this._context,
      connectionData
    );
    console.log("Auto connection session:", session);

    if (session) {
      // Retrieve folder hierarchy
      const folderHierarchy =
        await ConnectedFilesService.getFolderHierarchy(
          this._context,
          session.id
        );

      // Update the tree view as before
      if (folderHierarchy) {
        if (this._treeDataProvider) {
          this._treeDataProvider.refresh(folderHierarchy);
        } else {
          this._treeDataProvider = new FolderTreeDataProvider(folderHierarchy);
          this._treeView = vscode.window.createTreeView(
            "connectedFilesExplorer",
            {
              treeDataProvider: this._treeDataProvider,
            }
          );
        }
      }

      // Set context key to enable session-dependent commands.
      await vscode.commands.executeCommand(
        "setContext",
        "extensionConnectedSession",
        true
      );

      // Update the webview with connection summary.
      if (this._view) {
        this._view.webview.html = this.getConnectionHtmlContent(
          this._view.webview,
          connectionData.name,
          folderHierarchy
        );
      }
    } else {
      vscode.window.showErrorMessage("Auto connection establishment failed.");
    }
  }

  // Helper method to update the tree view externally, if needed.
  public updateTreeView(newFolderHierarchy: FolderDto): void {
    if (this._treeDataProvider) {
      this._treeDataProvider.refresh(newFolderHierarchy);
    } else {
      console.warn(
        "Tree data provider not initialized. Ensure you have established a connection first."
      );
    }
  }

  private getHtmlContent(webview: vscode.Webview): string {
    const token = this._context.globalState.get("authToken");
    const nonce = getNonce();

    // URIs for local resources (JS, CSS)
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "assets", "main.js")
    );
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "assets", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "assets", "vscode.css")
    );
    const stylesheetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "assets", "main.css")
    );

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
    } else {
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

  private getConnectionHtmlContent(
    webview: vscode.Webview,
    connectionName: string,
    folderHierarchy: FolderDto | null
  ): string {
    const nonce = getNonce();

    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "assets", "reset.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "assets", "vscode.css")
    );
    const stylesheetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "assets", "main.css")
    );

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

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}