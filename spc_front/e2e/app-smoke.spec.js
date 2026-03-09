import { test, expect } from '@playwright/test';

const APP_BASE_PATH = '/spc';

const appRoute = (path) => {
    if (path === '/') {
        return `${APP_BASE_PATH}/`;
    }

    const normalizedPath = String(path || '').replace(/^\/+/, '');
    return `${APP_BASE_PATH}/${normalizedPath}/`;
};

test('home page renders the main entry actions', async ({ page }) => {
    await page.goto(appRoute('/'));

    await expect(page.getByText('CMM 성적서 관리 시스템')).toBeVisible();
    await expect(page.getByAltText('프로젝트')).toBeVisible();
    await expect(page.getByAltText('데이터')).toBeVisible();
});

test('project mapper route renders the mapper title', async ({ page }) => {
    await page.goto(appRoute('/project-mapper'));

    await expect(page.getByText('성적서 양식 설정')).toBeVisible();
});
