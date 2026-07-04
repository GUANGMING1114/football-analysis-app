declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
  };
};

export const DEFAULT_API_URL = 'http://127.0.0.1:8787';
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;
