const DEFAULT_APP_BASE_PATH = '/';
const DEFAULT_API_BASE_URL = '/spc/api';

export const normalizeBasePath = (basePath = DEFAULT_APP_BASE_PATH) => {
    const normalized = String(basePath || '').trim();
    if (!normalized || normalized === '/') {
        return '/';
    }

    const withLeadingSlash = normalized.startsWith('/')
        ? normalized
        : `/${normalized}`;
    const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, '');
    return `${withoutTrailingSlash}/`;
};

export const resolveRouterBasename = (
    basePath = import.meta.env.BASE_URL || import.meta.env.VITE_SPC_APP_BASE_PATH,
) => {
    const normalizedBasePath = normalizeBasePath(basePath);
    return normalizedBasePath === '/'
        ? '/'
        : normalizedBasePath.replace(/\/$/, '');
};

export function resolveApiBaseUrl(apiBaseUrl) {
    const resolvedApiBaseUrl =
        arguments.length === 0
            ? import.meta.env.VITE_SPC_API_BASE_URL
            : apiBaseUrl;
    const normalized = String(resolvedApiBaseUrl || '').trim();
    if (!normalized) {
        return DEFAULT_API_BASE_URL;
    }

    return normalized.replace(/\/+$/, '');
}

export const buildPublicAssetPath = (
    assetPath,
    basePath = import.meta.env.BASE_URL || import.meta.env.VITE_SPC_APP_BASE_PATH,
) => {
    const normalizedAssetPath = String(assetPath || '').replace(/^\/+/, '');
    if (!normalizedAssetPath) {
        return normalizeBasePath(basePath);
    }

    return `${normalizeBasePath(basePath)}${normalizedAssetPath}`;
};
