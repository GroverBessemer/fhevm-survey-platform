import { SDK_CDN_URL } from "./constants";

type TraceType = (message?: unknown, ...optionalParams: unknown[]) => void;

export interface FhevmRelayerSDKType {
  initSDK: (options?: any) => Promise<boolean>;
  createInstance: (config: any) => Promise<any>;
  SepoliaConfig: any;
  __initialized__?: boolean;
}

export interface FhevmWindowType extends Window {
  relayerSDK: FhevmRelayerSDKType;
}

export class RelayerSDKLoader {
  private _trace?: TraceType;

  constructor(options: { trace?: TraceType }) {
    this._trace = options.trace;
  }

  public isLoaded(): boolean {
    if (typeof window === "undefined") {
      return false;
    }
    return isFhevmWindowType(window, this._trace);
  }

  public async load(): Promise<void> {
    console.log("[RelayerSDKLoader] Loading SDK...");
    
    if (typeof window === "undefined") {
      throw new Error("RelayerSDKLoader: can only be used in the browser.");
    }

    if ("relayerSDK" in window) {
      if (!isFhevmRelayerSDKType((window as any).relayerSDK, this._trace)) {
        throw new Error("RelayerSDKLoader: Unable to load FHEVM Relayer SDK");
      }
      console.log("[RelayerSDKLoader] SDK already loaded");
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        `script[src="${SDK_CDN_URL}"]`
      );
      
      if (existingScript) {
        if (!isFhevmWindowType(window, this._trace)) {
          reject(new Error("RelayerSDKLoader: window.relayerSDK is invalid."));
        }
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = SDK_CDN_URL;
      script.type = "text/javascript";
      script.async = true;

      script.onload = () => {
        if (!isFhevmWindowType(window, this._trace)) {
          console.log("[RelayerSDKLoader] script onload FAILED");
          reject(new Error("RelayerSDKLoader: window.relayerSDK is invalid after load."));
        }
        console.log("[RelayerSDKLoader] SDK loaded successfully");
        resolve();
      };

      script.onerror = () => {
        console.log("[RelayerSDKLoader] script onerror");
        reject(new Error(`RelayerSDKLoader: Failed to load SDK from ${SDK_CDN_URL}`));
      };

      console.log("[RelayerSDKLoader] Adding script to DOM...");
      document.head.appendChild(script);
    });
  }
}

function isFhevmRelayerSDKType(
  o: unknown,
  trace?: TraceType
): o is FhevmRelayerSDKType {
  if (typeof o === "undefined" || o === null || typeof o !== "object") {
    trace?.("RelayerSDKLoader: relayerSDK is not a valid object");
    return false;
  }
  
  if (!("initSDK" in o) || typeof (o as any).initSDK !== "function") {
    trace?.("RelayerSDKLoader: relayerSDK.initSDK is invalid");
    return false;
  }
  
  if (!("createInstance" in o) || typeof (o as any).createInstance !== "function") {
    trace?.("RelayerSDKLoader: relayerSDK.createInstance is invalid");
    return false;
  }
  
  if (!("SepoliaConfig" in o) || typeof (o as any).SepoliaConfig !== "object") {
    trace?.("RelayerSDKLoader: relayerSDK.SepoliaConfig is invalid");
    return false;
  }
  
  return true;
}

export function isFhevmWindowType(
  win: unknown,
  trace?: TraceType
): win is FhevmWindowType {
  if (typeof win === "undefined" || win === null || typeof win !== "object") {
    trace?.("RelayerSDKLoader: window is not valid");
    return false;
  }
  
  if (!("relayerSDK" in win)) {
    trace?.("RelayerSDKLoader: window does not contain 'relayerSDK'");
    return false;
  }
  
  return isFhevmRelayerSDKType((win as any).relayerSDK, trace);
}

