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
exports.signIn = signIn;
const vscode = __importStar(require("vscode"));
const configService_1 = require("./configService");
const APIRoutes_1 = require("./config/APIRoutes");
async function signIn(context, email, password) {
    if (!email) {
        email = await vscode.window.showInputBox({ prompt: 'Enter your email' });
        if (!email) {
            return;
        }
    }
    if (!password) {
        password = await vscode.window.showInputBox({ prompt: 'Enter your password', password: true });
        if (!password) {
            return;
        }
    }
    // Retrieve the API URL from the configuration
    const apiUrl = configService_1.ConfigService.getApiUrl();
    const url = `${apiUrl}${APIRoutes_1.APIROUTES.AUTHENTICATION.SIGN_IN}`;
    console.debug("DEBUG: Sign In URL:", url);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        console.debug("DEBUG: Response Code:", response.status);
        const data = await response.json();
        if (response.ok) {
            // Save token in globalState or secure storage
            context.globalState.update('authToken', data.token);
            console.debug('authToken', data.token);
            vscode.window.showInformationMessage('Signed in successfully!');
        }
        else {
            console.error("DEBUG: Sign in failed with response:", data);
            vscode.window.showErrorMessage(data.error || 'Sign in failed');
        }
    }
    catch (error) {
        console.error("DEBUG: Error during sign in:", error);
        vscode.window.showErrorMessage(`Error: ${error}`);
    }
}
//# sourceMappingURL=auth.js.map