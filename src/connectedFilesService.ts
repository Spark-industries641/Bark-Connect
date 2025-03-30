//connectedFilesSerivce.ts
import * as vscode from "vscode";
import { ConfigService } from "./configService";
import { APIROUTES } from "./config/APIRoutes";
import {
  ConnectedFilesSession,
  ConnectionEstablishDto,
  FolderCreateDto,
  FolderDto,
  FileCreateDto,
  FileDto,
} from "./models/FileDtos";

export class ConnectedFilesService {
  // Helper to get the auth token from globalState.
  private static getAuthToken(
    context: vscode.ExtensionContext
  ): string | undefined {
    return context.globalState.get("authToken") as string | undefined;
  }

  // Calls the POST endpoint to get enabled connections.
  public static async getEnabledConnections(
    context: vscode.ExtensionContext
  ): Promise<ConnectedFilesSession[]> {
    const token = this.getAuthToken(context);
    if (!token) {
      vscode.window.showErrorMessage("You are not authenticated!");
      return [];
    }
    const url = `${ConfigService.getApiUrl()}${
      APIROUTES.CONNECTED_FILES.GET_ENABLED_CONNECTIONS
    }`;
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
      const data = (await response.json()) as ConnectedFilesSession[];

      if (response.ok) {
        vscode.window.showInformationMessage(
          "Enabled connections retrieved successfully!"
        );
        return data;
      } else {
        vscode.window.showErrorMessage(
          (data as any).error || "Failed to retrieve enabled connections"
        );
        return [];
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Error: ${error}`);
      return [];
    }
  }

  // Calls the GET endpoint to retrieve a folder hierarchy for a given session.
  public static async getFolderHierarchy(
    context: vscode.ExtensionContext,
    sessionId: string
  ): Promise<FolderDto | null> {
    const token = this.getAuthToken(context);
    if (!token) {
      vscode.window.showErrorMessage("You are not authenticated!");
      return null;
    }

    // Use the APIROUTES CONNECTED_FILES FOLDER_HIERARCHY function.
    const url = `${ConfigService.getApiUrl()}${APIROUTES.CONNECTED_FILES.FOLDER_HIERARCHY(
      sessionId
    )}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await response.json()) as FolderDto;

      if (response.ok) {
        vscode.window.showInformationMessage(
          "Folder hierarchy retrieved successfully!"
        );

        const newTrackedFiles = data ? ConnectedFilesService.extractTrackedFilePaths(data) : [];
        // Optionally, persist the new tracked files list
        console.log("newTrackedFiles ", newTrackedFiles);
        await context.globalState.update("trackedFiles", newTrackedFiles);
        // Execute the command to update decorations
        vscode.commands.executeCommand("extension.refreshFileDecorations", newTrackedFiles);
        
        return data;
      } else {
        vscode.window.showErrorMessage(
          (data as any).error || "Failed to retrieve folder hierarchy"
        );
        return null;
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Error: ${error}`);
      return null;
    }
  }

  // Calls the POST endpoint to establish a new connection.
  public static async establishConnection(
    context: vscode.ExtensionContext,
    connectionData: ConnectionEstablishDto
  ): Promise<ConnectedFilesSession | null> {
    console.log("connectionData ", connectionData);
    const token = this.getAuthToken(context);
    if (!token) {
      vscode.window.showErrorMessage("You are not authenticated!");
      return null;
    }

    const url = `${ConfigService.getApiUrl()}${
      APIROUTES.CONNECTED_FILES.ESTABLISH_CONNECTION
    }`;
    console.log("url ", url);

    // Determine if there is an active session ID in global state.
    const hasActiveSession =
      context.globalState.get("activeSessionId") !== null;
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
          const data = (await response.json()) as ConnectedFilesSession;
          console.log("data ", data);
          vscode.window.showInformationMessage(
            attempt === 0
              ? "Connection established successfully!"
              : "Connection established successfully on retry!"
          );
          context.globalState.update("activeSessionId", data.id);
          return data;
        } else {
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
      } catch (error) {
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

  public static extractTrackedFilePaths(folder: FolderDto): string[] {
    const filePaths: string[] = [];
  
    // Recursive helper function
    function traverse(folderNode: FolderDto) {
      folderNode.files.forEach(file => filePaths.push(file.systemPath!));
      folderNode.subFolders.forEach(subFolder => traverse(subFolder));
    }
  
    traverse(folder);
    console.log("filePaths ", filePaths);
    return filePaths;
  }
  

  // Calls the POST endpoint to update an individual file's contents.
  public static async updateFile(
    context: vscode.ExtensionContext,
    sessionId: string,
    fileData: FileCreateDto
  ): Promise<FileDto | null> {
    const token = this.getAuthToken(context);
    if (!token) {
      vscode.window.showErrorMessage("You are not authenticated!");
      return null;
    }

    const url = `${ConfigService.getApiUrl()}${APIROUTES.CONNECTED_FILES.UPDATE_FILE(
      sessionId
    )}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fileData),
      });
      const data = (await response.json()) as FileDto;
      if (response.ok) {
        vscode.window.showInformationMessage("File updated successfully!");
        return data;
      } else {
        // Log the error but do not display it to the user.
        console.error((data as any).error || "Failed to update file");
        return null;
      }
    } catch (error) {
      // Log the error but do not show an error message.
      console.error(`Error: ${error}`);
      return null;
    }
  }

  public static async disconnectSession(
    context: vscode.ExtensionContext
  ): Promise<void> {
    const token = this.getAuthToken(context);
    if (!token) {
      vscode.window.showErrorMessage("You are not authenticated!");
      return;
    }

    const activeSession: string | undefined =
      context.globalState.get("activeSessionId");
    if (activeSession === null || activeSession === undefined) {
      console.error("Active session was null");
      return;
    }

    const url = `${ConfigService.getApiUrl()}${APIROUTES.CONNECTED_FILES.CLOSE_CONNECTION(
      activeSession
    )}`;

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
      } else {
        // Log the error but do not display it to the user.
        console.error("Failed to close session", response);
        return;
      }
    } catch (error) {
      // Log the error but do not show an error message.
      console.error(`Error: ${error}`);
      return;
    }
  }
}
