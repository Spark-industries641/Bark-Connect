import * as vscode from "vscode";
import { getRelativePath } from "./trackingService";

export class TrackedFileDecorationProvider implements vscode.FileDecorationProvider {
  private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
  public readonly onDidChangeFileDecorations: vscode.Event<vscode.Uri | vscode.Uri[] | undefined> = this._onDidChangeFileDecorations.event;

  private trackedFiles: Set<string>;

  constructor(trackedFiles: Set<string>) {
    this.trackedFiles = trackedFiles;
  }

  // Call this method when the tracked files set is updated.
  public refresh(uri?: vscode.Uri) {
    this._onDidChangeFileDecorations.fire(uri);
  }

  provideFileDecoration(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<vscode.FileDecoration> {
    // Use the relative path for matching.
    const relativePath = getRelativePath(uri.fsPath);
    if (this.trackedFiles.has(relativePath)) {
      return {
        badge: "T",
        tooltip: "Tracked file",
        color: new vscode.ThemeColor("trackedFile.foreground"),
        propagate: true,
      };
    }
    return;
  }
}
