
/// <reference types="vite/client" />

declare global {
  interface Window {
    Tawk_API?: {
      onLoad?: () => void;
    };
  }
}
