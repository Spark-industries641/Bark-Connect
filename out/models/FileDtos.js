"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripFileContents = stripFileContents;
function stripFileContents(folder) {
    // Process the files in the current folder, omitting the "contents" field.
    const strippedFiles = folder.files.map((file) => {
        const { name, extension, timestamp, systemPath } = file;
        return { name, extension, timestamp, systemPath };
    });
    // Recursively process subfolders.
    const strippedSubFolders = folder.subFolders.map((subFolder) => stripFileContents(subFolder));
    return {
        name: folder.name,
        timestamp: folder.timestamp,
        systemPath: folder.systemPath,
        files: strippedFiles,
        subFolders: strippedSubFolders,
    };
}
//# sourceMappingURL=FileDtos.js.map