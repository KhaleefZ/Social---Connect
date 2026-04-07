const TOKEN_KEY = "socialconnect_token";
const AUTH_CHANGE_EVENT = "socialconnect-auth-change";

export function getClientToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(TOKEN_KEY) ?? "";
}

export function setClientToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function clearClientToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function subscribeAuthStore(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(AUTH_CHANGE_EVENT, handler);

  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(AUTH_CHANGE_EVENT, handler);
  };
}

export function getHasTokenSnapshot() {
  return getClientToken().length > 0;
}

export function getHasTokenServerSnapshot() {
  return false;
}