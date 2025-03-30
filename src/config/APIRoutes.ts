export const APIROUTES = {
  get DEFAULT() {
    return "/api/v1";
  },
  AUTHENTICATION: {
    get BASE() {
      return `${APIROUTES.DEFAULT}/Authentication`;
    },
    get SIGN_UP() {
      return `${APIROUTES.AUTHENTICATION.BASE}/sign-up`;
    },
    get SIGN_IN() {
      return `${APIROUTES.AUTHENTICATION.BASE}/sign-in`;
    },
  },
  ACCOUNT: {
    get BASE() {
      return `${APIROUTES.DEFAULT}/Account`;
    },
    get UPDATE() {
      return `${APIROUTES.ACCOUNT.BASE}/update`;
    },
    get DETAILS() {
      return `${APIROUTES.ACCOUNT.BASE}/details`;
    },
  },
  CHAT: {
    get BASE() {
      return `${APIROUTES.DEFAULT}/Chat`;
    },
    get SEND() {
      return `${APIROUTES.CHAT.BASE}/send`;
    },
    get AVAILABLE_SORTED() {
      return `${APIROUTES.CHAT.BASE}/available`;
    },
    HISTORY(conversationId: string) {
      return `${APIROUTES.CHAT.BASE}/history/${conversationId}`;
    },
  },
  CONNECTED_FILES: {
    get BASE() {
      return `${APIROUTES.DEFAULT}/ConnectedFiles`;
    },
    get GET_ENABLED_CONNECTIONS() {
      return `${APIROUTES.CONNECTED_FILES.BASE}/get-enabled-connections`;
    },
    FOLDER_HIERARCHY(sessionId: string) {
      return `${APIROUTES.CONNECTED_FILES.BASE}/folder-hierarchy/${sessionId}`;
    },
    get ESTABLISH_CONNECTION() {
      return `${APIROUTES.CONNECTED_FILES.BASE}/establish-connection`;
    },
    CLOSE_CONNECTION(sessionId: string) {
      return `${APIROUTES.CONNECTED_FILES.BASE}/close-connection/${sessionId}`;
    },
    UPDATE_FILE(sessionId: string) {
      return `${APIROUTES.CONNECTED_FILES.BASE}/update-file/${sessionId}`;
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
