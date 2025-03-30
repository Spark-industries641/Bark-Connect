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
exports.ConnectedFilesService = void 0;
//connectedFilesSerivce.ts
const vscode = __importStar(require("vscode"));
const configService_1 = require("./configService");
const APIRoutes_1 = require("./config/APIRoutes");
class ConnectedFilesService {
    // Helper to get the auth token from globalState.
    static getAuthToken(context) {
        return context.globalState.get("authToken");
    }
    // Calls the POST endpoint to get enabled connections.
    static async getEnabledConnections(context) {
        const token = this.getAuthToken(context);
        if (!token) {
            vscode.window.showErrorMessage("You are not authenticated!");
            return [];
        }
        const url = `${configService_1.ConfigService.getApiUrl()}${APIRoutes_1.APIROUTES.CONNECTED_FILES.GET_ENABLED_CONNECTIONS}`;
        console.log("url ", url);
        console.log("token ", token);
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            // Parse the response as an array of ConnectedFilesSession.
            const data = (await response.json());
            if (response.ok) {
                vscode.window.showInformationMessage("Enabled connections retrieved successfully!");
                return data;
            }
            else {
                vscode.window.showErrorMessage(data.error || "Failed to retrieve enabled connections");
                return [];
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error: ${error}`);
            return [];
        }
    }
    // Calls the GET endpoint to retrieve a folder hierarchy for a given session.
    static async getFolderHierarchy(context, sessionId) {
        const token = this.getAuthToken(context);
        if (!token) {
            vscode.window.showErrorMessage("You are not authenticated!");
            return null;
        }
        // Use the APIROUTES CONNECTED_FILES FOLDER_HIERARCHY function.
        const url = `${configService_1.ConfigService.getApiUrl()}${APIRoutes_1.APIROUTES.CONNECTED_FILES.FOLDER_HIERARCHY(sessionId)}`;
        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = (await response.json());
            if (response.ok) {
                vscode.window.showInformationMessage("Folder hierarchy retrieved successfully!");
                const newTrackedFiles = data ? ConnectedFilesService.extractTrackedFilePaths(data) : [];
                // Optionally, persist the new tracked files list
                console.log("newTrackedFiles ", newTrackedFiles);
                await context.globalState.update("trackedFiles", newTrackedFiles);
                // Execute the command to update decorations
                vscode.commands.executeCommand("extension.refreshFileDecorations", newTrackedFiles);
                return data;
            }
            else {
                vscode.window.showErrorMessage(data.error || "Failed to retrieve folder hierarchy");
                return null;
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error: ${error}`);
            return null;
        }
    }
    // Calls the POST endpoint to establish a new connection.
    static async establishConnection(context, connectionData) {
        console.log("connectionData ", connectionData);
        const token = this.getAuthToken(context);
        if (!token) {
            vscode.window.showErrorMessage("You are not authenticated!");
            return null;
        }
        const url = `${configService_1.ConfigService.getApiUrl()}${APIRoutes_1.APIROUTES.CONNECTED_FILES.ESTABLISH_CONNECTION}`;
        console.log("url ", url);
        // Determine if there is an active session ID in global state.
        const hasActiveSession = context.globalState.get("activeSessionId") !== null;
        // We'll allow one extra attempt if there was an active session ID.
        const maxAttempts = hasActiveSession ? 2 : 1;
        let attempt = 0;
        while (attempt < maxAttempts) {
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(connectionData),
                });
                console.log("response ", response);
                if (response.ok) {
                    const data = (await response.json());
                    console.log("data ", data);
                    vscode.window.showInformationMessage(attempt === 0
                        ? "Connection established successfully!"
                        : "Connection established successfully on retry!");
                    context.globalState.update("activeSessionId", data.id);
                    return data;
                }
                else {
                    console.error(`Response was not okay on attempt ${attempt + 1}`);
                    // If this is the first attempt and we had an active session, try one more time.
                    if (attempt === 0 && hasActiveSession) {
                        console.log("Retrying without activeSessionId...");
                        await context.globalState.update("activeSessionId", null);
                        attempt++;
                        continue;
                    }
                    vscode.window.showErrorMessage("Failed to establish connection");
                    return null;
                }
            }
            catch (error) {
                console.error(`Error on attempt ${attempt + 1}: `, error);
                // If this is the first attempt and we had an active session, try one more time.
                if (attempt === 0 && hasActiveSession) {
                    console.log("Retrying after error without activeSessionId...");
                    await context.globalState.update("activeSessionId", null);
                    attempt++;
                    continue;
                }
                vscode.window.showErrorMessage(`Error: ${error}`);
                return null;
            }
        }
        return null;
    }
    static extractTrackedFilePaths(folder) {
        const filePaths = [];
        // Recursive helper function
        function traverse(folderNode) {
            folderNode.files.forEach(file => filePaths.push(file.systemPath));
            folderNode.subFolders.forEach(subFolder => traverse(subFolder));
        }
        traverse(folder);
        console.log("filePaths ", filePaths);
        return filePaths;
    }
    // Calls the POST endpoint to update an individual file's contents.
    static async updateFile(context, sessionId, fileData) {
        const token = this.getAuthToken(context);
        if (!token) {
            vscode.window.showErrorMessage("You are not authenticated!");
            return null;
        }
        const url = `${configService_1.ConfigService.getApiUrl()}${APIRoutes_1.APIROUTES.CONNECTED_FILES.UPDATE_FILE(sessionId)}`;
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(fileData),
            });
            const data = (await response.json());
            if (response.ok) {
                vscode.window.showInformationMessage("File updated successfully!");
                return data;
            }
            else {
                // Log the error but do not display it to the user.
                console.error(data.error || "Failed to update file");
                return null;
            }
        }
        catch (error) {
            // Log the error but do not show an error message.
            console.error(`Error: ${error}`);
            return null;
        }
    }
    static async disconnectSession(context) {
        const token = this.getAuthToken(context);
        if (!token) {
            vscode.window.showErrorMessage("You are not authenticated!");
            return;
        }
        const activeSession = context.globalState.get("activeSessionId");
        if (activeSession === null || activeSession === undefined) {
            console.error("Active session was null");
            return;
        }
        const url = `${configService_1.ConfigService.getApiUrl()}${APIRoutes_1.APIROUTES.CONNECTED_FILES.CLOSE_CONNECTION(activeSession)}`;
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                await context.globalState.update("activeSessionId", undefined);
                // Clearing tracked files
                await context.globalState.update("trackedFiles", []);
                vscode.commands.executeCommand("extension.refreshFileDecorations", []);
                vscode.window.showInformationMessage("Session Closed!");
                return;
            }
            else {
                // Log the error but do not display it to the user.
                console.error("Failed to close session", response);
                return;
            }
        }
        catch (error) {
            // Log the error but do not show an error message.
            console.error(`Error: ${error}`);
            return;
        }
    }
}
exports.ConnectedFilesService = ConnectedFilesService;
//# sourceMappingURL=connectedFilesService.js.map