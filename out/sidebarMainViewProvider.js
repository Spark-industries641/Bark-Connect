"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SidebarMainViewProvider = void 0;
class SidebarMainViewProvider {
    context;
    static viewType = 'sidebarMain';
    _view;
    constructor(context) {
        this.context = context;
    }
    resolveWebviewView(webviewView, _context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            // Enable scripts if you need them later
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri]
        };
        webviewView.webview.html = this.getHtmlContent();
    }
    getHtmlContent() {
        return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none';">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sidebar</title>
      </head>
      <body>
          <h1>hi</h1>
      </body>
      </html>
    `;
    }
}
exports.SidebarMainViewProvider = SidebarMainViewProvider;
//# sourceMappingURL=sidebarMainViewProvider.js.map