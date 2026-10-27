import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import MigrationV1Example from '../../docs/examples/src/charts/migration/v1';
import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {migrateChartDataV1} from '../compat/v1';

import {MigrationV2Cases} from './components/MigrationV2Cases';
import {getLocatorBoundingBox} from './utils';

test('v1 adapter fixes HTML inside label centering', async ({mount}) => {
    const {data} = migrateChartDataV1({
        legend: {enabled: false},
        xAxis: {type: 'category', categories: ['A']},
        series: {
            data: [
                {
                    type: 'bar-x',
                    name: 'Revenue',
                    data: [{x: 'A', y: 80}],
                    dataLabels: {enabled: true, html: true, inside: true},
                },
            ],
        },
    });
    const component = await mount(<ChartTestStory data={data} />);
    const bar = await getLocatorBoundingBox(component.locator('.gcharts-bar-x__segment'));
    const label = await getLocatorBoundingBox(component.locator('.gcharts-chart__html-layer-item'));
    expect(label.y + label.height / 2).toBeCloseTo(bar.y + bar.height / 2, 0);
});

test('renders the v1 migration documentation example', async ({mount}) => {
    const component = await mount(
        <div style={{width: 600, height: 300}}>
            <MigrationV1Example />
        </div>,
    );
    await expect(component.locator('.gcharts-marker__symbol[d]')).toHaveCount(3);
    await expect(
        component.locator('.gcharts-y-axis__tick text').filter({hasText: /K$/}).first(),
    ).toBeVisible();
});

for (const kind of ['tooltip', 'click'] as const) {
    test(`v2 migration evidence: ${kind}`, async ({mount, page}) => {
        await page.setViewportSize({width: 1100, height: 700});
        const component = await mount(<MigrationV2Cases kind={kind} />);
        await expect(component.locator('svg')).toHaveCount(kind === 'click' ? 1 : 2);
        const marks = component.locator(
            '.gcharts-bar-x__segment, .gcharts-waterfall__segment, .gcharts-marker__symbol[d]',
        );
        await expect(marks.first()).toBeVisible();
        if (kind === 'click') {
            await marks.first().click();
            await expect(component.getByTestId('migration-event')).toContainText('"modern"');
            const event = JSON.parse(
                (await component.getByTestId('migration-event').textContent()) ?? '',
            );
            expect(event.v1.point.y).toBe(0);
            expect(event.modern.point.y).toBeNull();
            expect(event.v1.eventHasNativeEvent).toBe(true);
            expect(event.modern.eventHasNativeEvent).toBe(false);
        }
        if (kind === 'tooltip') {
            const left = component.locator('section').first();
            const right = component.locator('section').nth(1);
            await left.locator('.gcharts-waterfall__segment').nth(1).hover();
            await expect(page.locator('.gcharts-tooltip')).toContainText('Subtotal');
            await expect(page.locator('.gcharts-tooltip tbody tr')).toHaveCount(2);
            await left.screenshot({
                path: 'docs/diplodoc/pages/development/v2-compatibility/tooltip-v1.png',
            });
            await right.locator('.gcharts-waterfall__segment').nth(1).hover();
            await expect(page.locator('.gcharts-tooltip')).toContainText('null');
            await expect(page.locator('.gcharts-tooltip tbody tr')).toHaveCount(1);
            await right.screenshot({
                path: 'docs/diplodoc/pages/development/v2-compatibility/tooltip-candidate.png',
            });
            return;
        }
        await page.mouse.move(1080, 650);
        await component.screenshot({
            path: `docs/diplodoc/pages/development/v2-compatibility/${kind}.png`,
        });
    });
}
