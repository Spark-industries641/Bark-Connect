export interface ConnectedFilesSession {
  id: string; // Corresponds to Guid Id
  userId: string; // Corresponds to Guid UserId
  name?: string; // string? Name (optional)
  connected: boolean;
  disabled: boolean;
  rootFolder: string; // required string RootFolder
  dateCreated: string; // ISO string representation of DateTimeOffset
  lastConnectionDate: string; // ISO string representation of DateTimeOffset
}

export interface FolderDto {
  id: string; // Guid Id
  name: string; // string Name
  dateCreated: string; // DateTimeOffset DateCreated
  dateUpdated: string; // DateTimeOffset DateUpdated
  files: FileDto[]; // List<FileDto>
  subFolders: FolderDto[]; // List<FolderDto>
}

export interface FileDto {
  id: string; // Guid Id
  name: string; // string Name
  extension?: string; // string? Extension
  contents?: string; // string? Contents
  systemPath?: string;
  dateCreated: string; // DateTimeOffset DateCreated
  dateUpdated: string; // DateTimeOffset DateUpdated
}

export interface FileCreateDto {
  name: string; // string Name
  extension?: string; // string? Extension
  contents?: string; // string? Contents
  timestamp: string; // DateTimeOffset Timestamp
  systemPath?: string; // string? SystemPath
}

export interface FolderCreateDto {
  name: string; // string Name
  timestamp: string; // DateTimeOffset Timestamp
  systemPath?: string; // string? SystemPath
  files: FileCreateDto[]; // List<FileCreateDto>
  subFolders: FolderCreateDto[]; // List<FolderCreateDto>
}

export function stripFileContents(folder: FolderCreateDto): FolderCreateDto {
  // Process the files in the current folder, omitting the "contents" field.
  const strippedFiles: FileCreateDto[] = folder.files.map((file) => {
    const { name, extension, timestamp, systemPath } = file;
    return { name, extension, timestamp, systemPath };
  });

  // Recursively process subfolders.
  const strippedSubFolders: FolderCreateDto[] = folder.subFolders.map(
    (subFolder) => stripFileContents(subFolder)
  );

  return {
    name: folder.name,
    timestamp: folder.timestamp,
    systemPath: folder.systemPath,
    files: strippedFiles,
    subFolders: strippedSubFolders,
  };
}

// Although not explicitly provided, based on your usage,
// ConnectionEstablishDto is assumed to have these properties:
export interface ConnectionEstablishDto {
  id: string | null; // Guid Id
  rootFolder: string; // string RootFolder
  name: string; // string Name
}
