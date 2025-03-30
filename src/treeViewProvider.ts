// treeViewProvider.ts
import * as vscode from 'vscode';
import { FolderDto } from './models/FileDtos';

export class FileItem extends vscode.TreeItem {
  // Optional reference to the underlying folder data if this item represents a folder.
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly folder?: FolderDto,
    public readonly resourceUri?: vscode.Uri
  ) {
    super(label, collapsibleState);
    this.tooltip = label;
  }
}

export class FolderTreeDataProvider implements vscode.TreeDataProvider<FileItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined | void> = new vscode.EventEmitter<FileItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<FileItem | undefined | void> = this._onDidChangeTreeData.event;

  constructor(private folderHierarchy: FolderDto) {}

  refresh(folderHierarchy: FolderDto): void {
    this.folderHierarchy = folderHierarchy;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: FileItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: FileItem): Thenable<FileItem[]> {
    if (!element) {
      // Return the root folder as the only top-level item.
      const rootItem = new FileItem(
        this.folderHierarchy.name,
        vscode.TreeItemCollapsibleState.Expanded,
        this.folderHierarchy
      );
      return Promise.resolve([rootItem]);
    } else if (element.folder) {
      // When a folder is expanded, return its subfolders and files.
      return Promise.resolve(this.getItemsForFolder(element.folder));
    }
    return Promise.resolve([]);
  }

  private getItemsForFolder(folder: FolderDto): FileItem[] {
    const items: FileItem[] = [];
    
    // Add subfolders as collapsible items.
    if (folder.subFolders && folder.subFolders.length > 0) {
      folder.subFolders.forEach(subFolder => {
        items.push(new FileItem(
          subFolder.name,
          vscode.TreeItemCollapsibleState.Collapsed,
          subFolder
        ));
      });
    }
    
    // Add files as non-collapsible items.
    if (folder.files && folder.files.length > 0) {
      folder.files.forEach(file => {
        items.push(new FileItem(
          file.name,
          vscode.TreeItemCollapsibleState.None
        ));
      });
    }
    
    return items;
  }
}
