export const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

export type GoogleCredentialResponse = {
  credential?: string;
  select_by?: string;
};

type GoogleIdConfiguration = {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  nonce?: string;
  auto_select?: boolean;
  context?: "signin" | "signup" | "use";
  ux_mode?: "popup" | "redirect";
  use_fedcm_for_prompt?: boolean;
  itp_support?: boolean;
};

type GoogleButtonConfiguration = {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
  locale?: string;
};

export type GoogleIdentityServices = {
  accounts: {
    id: {
      initialize: (configuration: GoogleIdConfiguration) => void;
      renderButton: (parent: HTMLElement, configuration: GoogleButtonConfiguration) => void;
      cancel?: () => void;
      disableAutoSelect?: () => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

let googleIdentityPromise: Promise<GoogleIdentityServices> | null = null;

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function getGoogleWebClientId() {
  return String(import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "").trim();
}

export function isGoogleIdentityConfigured() {
  return getGoogleWebClientId().length > 0;
}

export async function createGoogleIdentityNonce() {
  if (!globalThis.crypto?.getRandomValues || !globalThis.crypto?.subtle) {
    throw new Error("Web Crypto indisponível para autenticação Google.");
  }

  const randomBytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(randomBytes);
  const rawNonce = bytesToBase64Url(randomBytes);
  const encoded = new TextEncoder().encode(rawNonce);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", encoded);

  return {
    rawNonce,
    hashedNonce: bytesToHex(new Uint8Array(digest)),
  };
}

export async function loadGoogleIdentityServices() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Google Identity Services só pode ser carregado no navegador.");
  }

  if (window.google?.accounts?.id) return window.google;
  if (googleIdentityPromise) return googleIdentityPromise;

  googleIdentityPromise = new Promise<GoogleIdentityServices>((resolve, reject) => {
    const resolveGoogle = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google);
        return;
      }

      googleIdentityPromise = null;
      reject(new Error("Google Identity Services não ficou disponível após carregar o script."));
    };

    const rejectGoogle = () => {
      googleIdentityPromise = null;
      reject(new Error("Não foi possível carregar o Google Identity Services."));
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GOOGLE_IDENTITY_SCRIPT_SRC}"]`,
    );

    if (existing) {
      existing.addEventListener("load", resolveGoogle, { once: true });
      existing.addEventListener("error", rejectGoogle, { once: true });
      window.setTimeout(resolveGoogle, 0);
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.referrerPolicy = "strict-origin-when-cross-origin";
    script.addEventListener("load", resolveGoogle, { once: true });
    script.addEventListener("error", rejectGoogle, { once: true });
    document.head.appendChild(script);
  });

  return googleIdentityPromise;
}
