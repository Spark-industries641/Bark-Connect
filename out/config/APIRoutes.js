"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIROUTES = void 0;
exports.APIROUTES = {
    get DEFAULT() {
        return "/api/v1";
    },
    AUTHENTICATION: {
        get BASE() {
            return `${exports.APIROUTES.DEFAULT}/Authentication`;
        },
        get SIGN_UP() {
            return `${exports.APIROUTES.AUTHENTICATION.BASE}/sign-up`;
        },
        get SIGN_IN() {
            return `${exports.APIROUTES.AUTHENTICATION.BASE}/sign-in`;
        },
    },
    ACCOUNT: {
        get BASE() {
            return `${exports.APIROUTES.DEFAULT}/Account`;
        },
        get UPDATE() {
            return `${exports.APIROUTES.ACCOUNT.BASE}/update`;
        },
        get DETAILS() {
            return `${exports.APIROUTES.ACCOUNT.BASE}/details`;
        },
    },
    CHAT: {
        get BASE() {
            return `${exports.APIROUTES.DEFAULT}/Chat`;
        },
        get SEND() {
            return `${exports.APIROUTES.CHAT.BASE}/send`;
        },
        get AVAILABLE_SORTED() {
            return `${exports.APIROUTES.CHAT.BASE}/available`;
        },
        HISTORY(conversationId) {
            return `${exports.APIROUTES.CHAT.BASE}/history/${conversationId}`;
        },
    },
    CONNECTED_FILES: {
        get BASE() {
            return `${exports.APIROUTES.DEFAULT}/ConnectedFiles`;
        },
        get GET_ENABLED_CONNECTIONS() {
            return `${exports.APIROUTES.CONNECTED_FILES.BASE}/get-enabled-connections`;
        },
        FOLDER_HIERARCHY(sessionId) {
            return `${exports.APIROUTES.CONNECTED_FILES.BASE}/folder-hierarchy/${sessionId}`;
        },
        get ESTABLISH_CONNECTION() {
            return `${exports.APIROUTES.CONNECTED_FILES.BASE}/establish-connection`;
        },
        CLOSE_CONNECTION(sessionId) {
            return `${exports.APIROUTES.CONNECTED_FILES.BASE}/close-connection/${sessionId}`;
        },
        UPDATE_FILE(sessionId) {
            return `${exports.APIROUTES.CONNECTED_FILES.BASE}/update-file/${sessionId}`;
        },
    },
    HUB: {
        get CHAT() {
            return "/hubs/chat";
        },
        get FILES() {
            return "/hubs/files";
        },
    },
};
//# sourceMappingURL=APIRoutes.js.map