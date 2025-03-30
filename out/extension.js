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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const sidebarViewProvider_1 = require("./sidebarViewProvider");
const connectedFilesService_1 = require("./connectedFilesService");
const trackingService_1 = require("./trackingService");
const trackedFileDecorationProvider_1 = require("./trackedFileDecorationProvider");
function activate(context) {
    const provider = new sidebarViewProvider_1.sidebarViewProvider(context.extensionUri, context);
    // Load persisted tracked files from global state (if any).
    const storedTrackedFiles = context.globalState.get("trackedFiles", []);
    const trackedFiles = new Set(storedTrackedFiles);
    // Create and register the file decoration provider.
    const decorationProvider = new trackedFileDecorationProvider_1.TrackedFileDecorationProvider(trackedFiles);
    context.subscriptions.push(vscode.window.registerFileDecorationProvider(decorationProvider));
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(sidebarViewProvider_1.sidebarViewProvider.viewType, provider));
    const token = context.globalState.get("authToken");
    if (token) {
        provider.autoEstablishConnection();
    }
    context.subscriptions.push(vscode.commands.registerCommand("vscodeSidebar.menu.view", () => {
        vscode.window.showInformationMessage("Menu/Title of extension is clicked!");
    }));
    vscode.commands.registerCommand("extension.refreshFileDecorations", (newTrackedFiles) => {
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
    const trackCommand = vscode.commands.registerCommand("extension.track", async (resource) => {
        console.log("Tracking file:", resource.fsPath);
        vscode.window.showInformationMessage(`Tracking: ${resource.fsPath}`);
        const activeSessionId = context.globalState.get("activeSessionId");
        if (!activeSessionId) {
            vscode.window.showErrorMessage("No active session found!");
            return;
        }
        // Build a FileCreateDto for the file.
        let fileDto;
        try {
            const fileContents = await fs.readFile(resource.fsPath, "utf8");
            fileDto = {
                name: path.basename(resource.fsPath),
                extension: path.extname(resource.fsPath),
                contents: fileContents,
                timestamp: new Date().toISOString(),
                systemPath: (0, trackingService_1.getRelativePath)(resource.fsPath),
            };
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to read file: ${error}`);
            return;
        }
        // Call updateFile to add the file's contents to the server.
        const result = await connectedFilesService_1.ConnectedFilesService.updateFile(context, activeSessionId, fileDto);
        if (result) {
            vscode.window.showInformationMessage("File tracked and updated successfully.");
            // Use the relative path (systemPath) for tracking.
            const relativePath = (0, trackingService_1.getRelativePath)(resource.fsPath);
            trackedFiles.add(relativePath);
            // Persist updated tracked files.
            context.globalState.update("trackedFiles", Array.from(trackedFiles));
            decorationProvider.refresh(vscode.Uri.file(resource.fsPath));
        }
    });
    context.subscriptions.push(trackCommand);
    // COMMAND: Untrack File
    const untrackCommand = vscode.commands.registerCommand("extension.untrack", async (resource) => {
        console.log("Untracking file:", resource.fsPath);
        const relativePath = (0, trackingService_1.getRelativePath)(resource.fsPath);
        if (!trackedFiles.has(relativePath)) {
            vscode.window.showWarningMessage("This file is not being tracked.");
            return;
        }
        // Remove from tracked files.
        trackedFiles.delete(relativePath);
        // Persist updated tracked files.
        context.globalState.update("trackedFiles", Array.from(trackedFiles));
        // Get active session.
        const activeSessionId = context.globalState.get("activeSessionId");
        if (!activeSessionId) {
            vscode.window.showErrorMessage("No active session found!");
            return;
        }
        // Build a FileCreateDto with empty contents.
        const fileDto = {
            name: path.basename(resource.fsPath),
            extension: path.extname(resource.fsPath),
            contents: "",
            timestamp: new Date().toISOString(),
            systemPath: (0, trackingService_1.getRelativePath)(resource.fsPath),
        };
        // Call updateFile to update the server with empty content.
        await connectedFilesService_1.ConnectedFilesService.updateFile(context, activeSessionId, fileDto);
        decorationProvider.refresh(vscode.Uri.file(resource.fsPath));
    });
    context.subscriptions.push(untrackCommand);
    // Watch for file saves—if a tracked file is saved, update its contents on the server.
    vscode.workspace.onDidSaveTextDocument(async (doc) => {
        const relativePath = (0, trackingService_1.getRelativePath)(doc.uri.fsPath);
        if (trackedFiles.has(relativePath)) {
            console.log("Updating tracked file on save:", relativePath);
            const activeSessionId = context.globalState.get("activeSessionId");
            if (!activeSessionId) {
                vscode.window.showErrorMessage("No active session found for update.");
                return;
            }
            let fileDto;
            try {
                fileDto = {
                    name: path.basename(doc.uri.fsPath),
                    extension: path.extname(doc.uri.fsPath),
                    contents: doc.getText(),
                    timestamp: new Date().toISOString(),
                    systemPath: (0, trackingService_1.getRelativePath)(doc.uri.fsPath),
                };
            }
            catch (error) {
                vscode.window.showErrorMessage(`Failed to process file save: ${error}`);
                return;
            }
            await connectedFilesService_1.ConnectedFilesService.updateFile(context, activeSessionId, fileDto);
        }
    });
    // Refresh all decorations initially (in case there are pre-tracked files)
    decorationProvider.refresh();
}
function deactivate() { }
//# sourceMappingURL=extension.js.map