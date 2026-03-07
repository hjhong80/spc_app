import { describe, expect, it } from 'vitest';
import {
    buildPublicAssetPath,
    normalizeBasePath,
    resolveApiBaseUrl,
    resolveRouterBasename,
} from './runtimeConfig';

describe('runtimeConfig', () => {
    it('normalizes app base path with leading and trailing slash', () => {
        expect(normalizeBasePath('spc')).toBe('/spc/');
        expect(normalizeBasePath('/spc')).toBe('/spc/');
        expect(normalizeBasePath('/spc/')).toBe('/spc/');
        expect(normalizeBasePath('')).toBe('/');
    });

    it('resolves router basename from app base path', () => {
        expect(resolveRouterBasename('/')).toBe('/');
        expect(resolveRouterBasename('/spc/')).toBe('/spc');
    });

    it('uses provided API base url and trims trailing slash', () => {
        expect(resolveApiBaseUrl('https://zustand.store/spc/api/')).toBe(
            'https://zustand.store/spc/api',
        );
    });

    it('falls back to relative spc api path when API base url is missing', () => {
        expect(resolveApiBaseUrl('')).toBe('/spc/api');
        expect(resolveApiBaseUrl(undefined)).toBe('/spc/api');
    });

    it('builds public asset path under the configured base path', () => {
        expect(buildPublicAssetPath('/project.webp', '/spc/')).toBe(
            '/spc/project.webp',
        );
        expect(buildPublicAssetPath('data.webp', '/')).toBe('/data.webp');
    });
});
