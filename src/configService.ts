import * as vscode from 'vscode';

export class ConfigService {
    /**
     * Returns the API URL from the extension settings.
     * Falls back to the production URL if the setting is not set.
     */
    public static getApiUrl(): string {
        const config = vscode.workspace.getConfiguration('bark-connect');
        return config.get<string>('apiUrl', 'https://localhost:7247');
    }
}