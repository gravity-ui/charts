import {expect, test} from '@playwright/test';

for (const {hash, title} of [
    {hash: 'radar', title: 'Radar'},
    {hash: 'series-types/radar', title: 'Basic radar chart'},
]) {
    test(`opens and reloads the gallery at #${hash}`, async ({page}) => {
        await page.goto(`pages/examples.html#${encodeURIComponent(hash)}`);
        const heading = page.getByRole('heading', {name: title, exact: true});
        await expect(heading).toBeInViewport();
        await expect(page.locator('[id="series-types/radar"] svg')).toBeVisible();

        await page.reload();
        await expect(heading).toBeInViewport();
        await expect(page.locator('[id="series-types/radar"] svg')).toBeVisible();
    });
}

test('shows the source of the selected example and returns focus when closed', async ({page}) => {
    await page.goto('pages/examples.html');

    for (const {title, option} of [
        {
            title: 'Cardinal interpolation',
            option: "interpolation: {type: 'cardinal', tension: 0.5}",
        },
        {title: 'Fixed label placement', option: "placement: ['bottom']"},
        {title: 'Hide labels that do not fit', option: "placementFallback: 'hide'"},
    ]) {
        const button = page.getByRole('button', {name: `Code for ${title}`, exact: true});
        await button.click();
        const dialog = page.getByRole('dialog', {name: title, exact: true});
        await expect(dialog.locator('code')).toContainText(option);
        await expect(dialog.locator('code')).toContainText('export default function');
        await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible();
        await expect(button).toBeFocused();
    }
});

test('keeps the source dialog and its close button accessible on mobile', async ({page}) => {
    await page.setViewportSize({width: 375, height: 812});
    await page.goto('pages/examples.html');
    await page.getByRole('button', {name: 'Code for Cardinal interpolation'}).click();
    const dialog = page.getByRole('dialog', {name: 'Cardinal interpolation', exact: true});
    await expect(dialog).toBeVisible();
    await expect(async () => {
        const bounds = await dialog.boundingBox();
        if (!bounds) throw new Error('The code dialog has no bounds');
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(375);
        expect(bounds.y).toBeGreaterThanOrEqual(0);
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(812);
    }).toPass();
    await expect(dialog.locator('code')).toContainText("interpolation: {type: 'cardinal'");
    const close = dialog.getByRole('button', {name: 'Close dialog', exact: true});
    await expect(close).toBeInViewport();
    await close.click();
    await expect(dialog).not.toBeVisible();
});

test('shows highlighted guide source and restores the chart preview', async ({page}) => {
    await page.goto('pages/guides/series-types/line.html');
    const example = page.locator('[data-chart-example="series-types/line-basic"]');
    await expect(example.locator('svg')).toBeVisible();
    await example.getByRole('tab', {name: 'Code', exact: true}).click();
    const code = example.locator('code');
    await expect(code).toContainText('export default function');
    // Check visible syntax colors without depending on Monaco's markup or chunk names.
    await expect
        .poll(() =>
            code.evaluate((element) => {
                const colors = new Set<string>();
                const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
                while (walker.nextNode()) {
                    const node = walker.currentNode;
                    if (node.textContent?.trim() && node.parentElement) {
                        colors.add(getComputedStyle(node.parentElement).color);
                    }
                }
                return colors.size;
            }),
        )
        .toBeGreaterThan(1);
    await example.getByRole('tab', {name: 'Preview', exact: true}).click();
    await expect(example.locator('svg')).toBeVisible();
});
