import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { resolveApiBaseUrl } from '../config/runtimeConfig';

const API_BASE_URL = resolveApiBaseUrl();

const TOKEN_KEYS = ['accessToken', 'token', 'authToken', 'jwtToken', 'jwt'];

export const getAccessToken = () => {
    if (typeof window === 'undefined') {
        return '';
    }

    for (const storage of [window.localStorage, window.sessionStorage]) {
        for (const key of TOKEN_KEYS) {
            const token = storage.getItem(key);
            if (token) {
                return token;
            }
        }
    }
    return '';
};

export const clearAccessToken = () => {
    if (typeof window === 'undefined') {
        return;
    }

    for (const storage of [window.localStorage, window.sessionStorage]) {
        for (const key of TOKEN_KEYS) {
            storage.removeItem(key);
        }
    }
};

export const AXIOS_INSTANCE = axios.create({
    baseURL: API_BASE_URL,
});

AXIOS_INSTANCE.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = token.startsWith('Bearer ')
            ? token
            : `Bearer ${token}`;
    }
    return config;
});

const normalizeHeaders = (headers?: HeadersInit): Record<string, string> => {
    if (!headers) {
        return {};
    }

    if (headers instanceof Headers) {
        return Object.fromEntries(headers.entries());
    }
    if (Array.isArray(headers)) {
        return Object.fromEntries(headers);
    }
    return headers as Record<string, string>;
};

export const customInstance = <T>(
    url: string,
    options?: RequestInit & AxiosRequestConfig,
): Promise<T> => {
    const source = axios.CancelToken.source();
    const promise = AXIOS_INSTANCE({
        url,
        ...options,
        headers: normalizeHeaders(options?.headers),
        data: options?.body,
        cancelToken: source.token,
    }).then(
        ({ data, status, headers }) =>
            ({ data, status, headers } as T),
    ) as Promise<T> & { cancel?: () => void };

    // React Query cancellation hook compatibility
    promise.cancel = () => {
        source.cancel('Request cancelled by React Query');
    };

    return promise;
};

export type ErrorType<Error> = AxiosError<Error>;
