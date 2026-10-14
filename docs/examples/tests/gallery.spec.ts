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
