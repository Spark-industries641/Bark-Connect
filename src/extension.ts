import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs/promises";
import { sidebarViewProvider } from "./sidebarViewProvider";
import { ConnectedFilesService } from "./connectedFilesService";
import { FileCreateDto } from "./models/FileDtos";
import { getRelativePath } from "./trackingService";
import { TrackedFileDecorationProvider } from "./trackedFileDecorationProvider";

export function activate(context: vscode.ExtensionContext) {
  const provider = new sidebarViewProvider(context.extensionUri, context);

  // Load persisted tracked files from global state (if any).
  const storedTrackedFiles: string[] = context.globalState.get("trackedFiles", []);
  const trackedFiles = new Set<string>(storedTrackedFiles);

  // Create and register the file decoration provider.
  const decorationProvider = new TrackedFileDecorationProvider(trackedFiles);
  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(decorationProvider)
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(sidebarViewProvider.viewType, provider)
  );

  const token = context.globalState.get("authToken");
  if (token) {
    provider.autoEstablishConnection();
  }

  context.subscriptions.push(
    vscode.commands.registerCommand("vscodeSidebar.menu.view", () => {
      vscode.window.showInformationMessage("Menu/Title of extension is clicked!");
    })
  );

  vscode.commands.registerCommand("extension.refreshFileDecorations", (newTrackedFiles: string[]) => {
    // Clear and update the trackedFiles set (the same Set used by your TrackedFileDecorationProvider)
    trackedFiles.clear();
    newTrackedFiles.forEach(file => trackedFiles.add(file));
    decorationProvider.refresh();
  });

  let openWebView = vscode.commands.registerCommand("vscodeSidebar.openview", () => {
    vscode.window.showInformationMessage('Command "Sidebar View [vscodeSidebar.openview]" called.');
  });
  context.subscriptions.push(openWebView);

  // COMMAND: Track File
  const trackCommand = vscode.commands.registerCommand(
    "extension.track",
    async (resource: vscode.Uri) => {
      console.log("Tracking file:", resource.fsPath);
      vscode.window.showInformationMessage(`Tracking: ${resource.fsPath}`);

      const activeSessionId = context.globalState.get("activeSessionId") as string;
      if (!activeSessionId) {
        vscode.window.showErrorMessage("No active session found!");
        return;
      }

      // Build a FileCreateDto for the file.
      let fileDto: FileCreateDto;
      try {
        const fileContents = await fs.readFile(resource.fsPath, "utf8");
        fileDto = {
          name: path.basename(resource.fsPath),
          extension: path.extname(resource.fsPath),
          contents: fileContents,
          timestamp: new Date().toISOString(),
          systemPath: getRelativePath(resource.fsPath),
        };
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to read file: ${error}`);
        return;
      }

      // Call updateFile to add the file's contents to the server.
      const result = await ConnectedFilesService.updateFile(context, activeSessionId, fileDto);
      if (result) {
        vscode.window.showInformationMessage("File tracked and updated successfully.");
        // Use the relative path (systemPath) for tracking.
        const relativePath = getRelativePath(resource.fsPath);
        trackedFiles.add(relativePath);
        // Persist updated tracked files.
        context.globalState.update("trackedFiles", Array.from(trackedFiles));
        decorationProvider.refresh(vscode.Uri.file(resource.fsPath));
      }
    }
  );
  context.subscriptions.push(trackCommand);

  // COMMAND: Untrack File
  const untrackCommand = vscode.commands.registerCommand(
    "extension.untrack",
    async (resource: vscode.Uri) => {
      console.log("Untracking file:", resource.fsPath);
      const relativePath = getRelativePath(resource.fsPath);
      if (!trackedFiles.has(relativePath)) {
        vscode.window.showWarningMessage("This file is not being tracked.");
        return;
      }

      // Remove from tracked files.
      trackedFiles.delete(relativePath);
      // Persist updated tracked files.
      context.globalState.update("trackedFiles", Array.from(trackedFiles));

      // Get active session.
      const activeSessionId = context.globalState.get("activeSessionId") as string;
      if (!activeSessionId) {
        vscode.window.showErrorMessage("No active session found!");
        return;
      }

      // Build a FileCreateDto with empty contents.
      const fileDto: FileCreateDto = {
        name: path.basename(resource.fsPath),
        extension: path.extname(resource.fsPath),
        contents: "",
        timestamp: new Date().toISOString(),
        systemPath: getRelativePath(resource.fsPath),
      };

      // Call updateFile to update the server with empty content.
      await ConnectedFilesService.updateFile(context, activeSessionId, fileDto);

      decorationProvider.refresh(vscode.Uri.file(resource.fsPath));
    }
  );
  context.subscriptions.push(untrackCommand);

  // Watch for file saves—if a tracked file is saved, update its contents on the server.
  vscode.workspace.onDidSaveTextDocument(async (doc: vscode.TextDocument) => {
    const relativePath = getRelativePath(doc.uri.fsPath);
    if (trackedFiles.has(relativePath)) {
      console.log("Updating tracked file on save:", relativePath);
      const activeSessionId = context.globalState.get("activeSessionId") as string;
      if (!activeSessionId) {
        vscode.window.showErrorMessage("No active session found for update.");
        return;
      }
      let fileDto: FileCreateDto;
      try {
        fileDto = {
          name: path.basename(doc.uri.fsPath),
          extension: path.extname(doc.uri.fsPath),
          contents: doc.getText(),
          timestamp: new Date().toISOString(),
          systemPath: getRelativePath(doc.uri.fsPath),
        };
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to process file save: ${error}`);
        return;
      }
      await ConnectedFilesService.updateFile(context, activeSessionId, fileDto);
    }
  });

  // Refresh all decorations initially (in case there are pre-tracked files)
  decorationProvider.refresh();
}

export function deactivate() {}
