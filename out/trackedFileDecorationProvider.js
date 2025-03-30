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
exports.TrackedFileDecorationProvider = void 0;
const vscode = __importStar(require("vscode"));
const trackingService_1 = require("./trackingService");
class TrackedFileDecorationProvider {
    _onDidChangeFileDecorations = new vscode.EventEmitter();
    onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
    trackedFiles;
    constructor(trackedFiles) {
        this.trackedFiles = trackedFiles;
    }
    // Call this method when the tracked files set is updated.
    refresh(uri) {
        this._onDidChangeFileDecorations.fire(uri);
    }
    provideFileDecoration(uri, token) {
        // Use the relative path for matching.
        const relativePath = (0, trackingService_1.getRelativePath)(uri.fsPath);
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
exports.TrackedFileDecorationProvider = TrackedFileDecorationProvider;
//# sourceMappingURL=trackedFileDecorationProvider.js.map