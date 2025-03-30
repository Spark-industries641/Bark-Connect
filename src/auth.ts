import * as vscode from 'vscode';
import { ConfigService } from './configService';
import { APIROUTES } from './config/APIRoutes';

export async function signIn(
    context: vscode.ExtensionContext,
    email?: string,
    password?: string
) {
    if (!email) {
        email = await vscode.window.showInputBox({ prompt: 'Enter your email' });
        if (!email) { return; }
    }
    if (!password) {
        password = await vscode.window.showInputBox({ prompt: 'Enter your password', password: true });
        if (!password) { return; }
    }

    // Retrieve the API URL from the configuration
    const apiUrl = ConfigService.getApiUrl();
    const url = `${apiUrl}${APIROUTES.AUTHENTICATION.SIGN_IN}`;

    console.debug("DEBUG: Sign In URL:", url);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        console.debug("DEBUG: Response Code:", response.status);
        const data: any = await response.json();

        if (response.ok) {
            // Save token in globalState or secure storage
            context.globalState.update('authToken', data.token);
            console.debug('authToken', data.token);
            vscode.window.showInformationMessage('Signed in successfully!');
        } else {
            console.error("DEBUG: Sign in failed with response:", data);
            vscode.window.showErrorMessage(data.error || 'Sign in failed');
        }
    } catch (error) {
        console.error("DEBUG: Error during sign in:", error);
        vscode.window.showErrorMessage(`Error: ${error}`);
    }
}
