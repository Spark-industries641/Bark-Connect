import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs/promises";
import { FolderCreateDto, FileCreateDto } from "./models/FileDtos";

/**
 * Returns the relative path of a given full path, relative to the workspace folder (if available),
 * and prepends the workspace folder's name.
 * For example, if the workspace folder is 'bark-webapp' and a file is in its root,
 * the resulting path would be 'bark-webapp/.readme'
 * @param fullPath The absolute file or folder path.
 */
export function getRelativePath(fullPath: string): string {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(fullPath));
  if (workspaceFolder) {
    const workspaceName = path.basename(workspaceFolder.uri.fsPath);
    const relPath = path.relative(workspaceFolder.uri.fsPath, fullPath);
    return relPath ? path.join(workspaceName, relPath) : workspaceName;
  }
  return fullPath;
}

/**
 * Recursively builds a FolderCreateDto from a folder path.
 * @param folderPath The folder's system path.
 * @param now The current timestamp.
 */
export async function buildFolderDto(folderPath: string, now: string): Promise<FolderCreateDto> {
  const folderName = path.basename(folderPath);
  const files: FileCreateDto[] = [];
  const subFolders: FolderCreateDto[] = [];

  let entries;
  try {
    entries = await fs.readdir(folderPath, { withFileTypes: true });
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to read directory ${folderPath}: ${error}`);
    return {
      name: folderName,
      timestamp: now,
      systemPath: getRelativePath(folderPath),
      files: [],
      subFolders: [],
    };
  }
  console.log("entries ", entries);

  for (const entry of entries) {
    // Skip processing any folder named "node_modules"
    if (entry.isDirectory() && (entry.name.toLowerCase() === "node_modules" || entry.name.toLowerCase() === ".vs")) {
      continue;
    }

    const fullPath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      // Recursively build DTO for subfolder.
      const subFolderDto = await buildFolderDto(fullPath, now);
      subFolders.push(subFolderDto);
    } else if (entry.isFile()) {
      let fileContents = "";
      try {
        fileContents = await fs.readFile(fullPath, "utf8");
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to read file ${fullPath}: ${error}`);
      }
      const fileDto: FileCreateDto = {
        name: entry.name,
        extension: path.extname(entry.name),
        contents: fileContents,
        timestamp: now,
        systemPath: getRelativePath(fullPath),
      };
      console.log("fileDto ", fileDto);
      files.push(fileDto);
    }
  }

  return {
    name: folderName,
    timestamp: now,
    systemPath: getRelativePath(folderPath),
    files,
    subFolders,
  };
}

/**
 * Builds a FolderCreateDto for a selected resource (file or folder).
 * If a file is selected, it wraps the file inside a root folder DTO.
 * @param resource The URI of the selected resource.
 */
export async function buildResourceDto(resource: vscode.Uri): Promise<FolderCreateDto | null> {
  const now = new Date().toISOString();
  let stats;
  console.log("resource ", resource);
  try {
    stats = await fs.stat(resource.fsPath);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to get stats for ${resource.fsPath}: ${error}`);
    console.error("error ", error);
    return null;
  }

  console.log("stats ", stats);

  if (stats.isDirectory()) {
    // Recursively build the folder DTO.
    return await buildFolderDto(resource.fsPath, now);
  } else if (stats.isFile()) {
    // Read file contents.
    let fileContents = "";
    try {
      fileContents = await fs.readFile(resource.fsPath, "utf8");
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to read file ${resource.fsPath}: ${error}`);
      return null;
    }
    const fileDto: FileCreateDto = {
      name: path.basename(resource.fsPath),
      extension: path.extname(resource.fsPath),
      contents: fileContents,
      timestamp: now,
      systemPath: getRelativePath(resource.fsPath),
    };
    console.log("fileDto ", fileDto);

    // Wrap the file DTO in a FolderCreateDto.
    return {
      name: "Root",
      timestamp: now,
      systemPath: "", // Optionally set to a relative path.
      files: [fileDto],
      subFolders: [],
    };
  } else {
    vscode.window.showErrorMessage("Selected resource is not a file or folder.");
    return null;
  }
}
