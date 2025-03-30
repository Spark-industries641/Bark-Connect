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
exports.FolderTreeDataProvider = exports.FileItem = void 0;
// treeViewProvider.ts
const vscode = __importStar(require("vscode"));
class FileItem extends vscode.TreeItem {
    label;
    collapsibleState;
    folder;
    resourceUri;
    // Optional reference to the underlying folder data if this item represents a folder.
    constructor(label, collapsibleState, folder, resourceUri) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.folder = folder;
        this.resourceUri = resourceUri;
        this.tooltip = label;
    }
}
exports.FileItem = FileItem;
class FolderTreeDataProvider {
    folderHierarchy;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    constructor(folderHierarchy) {
        this.folderHierarchy = folderHierarchy;
    }
    refresh(folderHierarchy) {
        this.folderHierarchy = folderHierarchy;
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!element) {
            // Return the root folder as the only top-level item.
            const rootItem = new FileItem(this.folderHierarchy.name, vscode.TreeItemCollapsibleState.Expanded, this.folderHierarchy);
            return Promise.resolve([rootItem]);
        }
        else if (element.folder) {
            // When a folder is expanded, return its subfolders and files.
            return Promise.resolve(this.getItemsForFolder(element.folder));
        }
        return Promise.resolve([]);
    }
    getItemsForFolder(folder) {
        const items = [];
        // Add subfolders as collapsible items.
        if (folder.subFolders && folder.subFolders.length > 0) {
            folder.subFolders.forEach(subFolder => {
                items.push(new FileItem(subFolder.name, vscode.TreeItemCollapsibleState.Collapsed, subFolder));
            });
        }
        // Add files as non-collapsible items.
        if (folder.files && folder.files.length > 0) {
            folder.files.forEach(file => {
                items.push(new FileItem(file.name, vscode.TreeItemCollapsibleState.None));
            });
        }
        return items;
    }
}
exports.FolderTreeDataProvider = FolderTreeDataProvider;
//# sourceMappingURL=treeViewProvider.js.map