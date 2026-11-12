import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';
import cloneDeep from 'es-toolkit/compat/cloneDeep';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import {lineMarkerHaloData} from '../__stories__/__data__/line/marker-halo';
import type {ChartData, Halo} from '../types';

import {getLocatorBoundingBox} from './utils';

function createData(halo?: Halo, hoverMarkerEnabled = true): ChartData {
    const data = cloneDeep(lineMarkerHaloData);
    data.tooltip = {enabled: false};
    data.series.options = {
        line: {
            ...data.series.options?.line,
            states: {
                hover: {marker: {enabled: hoverMarkerEnabled, halo}},
            },
        },
    };
    return data;
}

test.describe('Line marker halo', () => {
    test('halo follows both marker modes, fill, hover movement and exit', async ({mount, page}) => {
        const data = createData({enabled: true, size: 9, opacity: 0.6});
        const component = await mount(<ChartTestStory data={data} />);
        const line = component.locator('.gcharts-line > path').first();
        const box = await getLocatorBoundingBox(line);
        const halos = component.locator('.gcharts-marker__halo');
        await expect(halos).toHaveCount(0);

        await page.mouse.move(box.x + box.width / 2, box.y);
        await expect(halos).toHaveCount(2);
        for (const fill of ['#e8590c', '#7048e8']) {
            const halo = component.locator(`.gcharts-marker__halo[fill="${fill}"]`);
            await expect(halo).toBeVisible();
            await expect(halo).toHaveAttribute('opacity', '0.6');
        }
        await expect(component.locator('svg')).toHaveScreenshot();

        await page.mouse.move(box.x + 1, box.y);
        await expect(halos).toHaveCount(2);
        await expect(
            component.locator(
                '.gcharts-marker__halo[fill="#e8590c"], .gcharts-marker__halo[fill="#7048e8"]',
            ),
        ).toHaveCount(0);
        expect((await getLocatorBoundingBox(halos.first())).x).toBeLessThan(box.x + box.width / 2);

        await page.mouse.move(500, 400);
        await expect(halos).toHaveCount(0);
        await expect(component.locator('.gcharts-marker__symbol:visible')).toHaveCount(3);
    });

    for (const [name, halo, enabled] of [
        ['omitted halo', undefined, true],
        ['halo styling without enabling', {size: 12, opacity: 0.5}, true],
        ['disabled halo', {enabled: false}, true],
        ['disabled hover markers', {enabled: true}, false],
    ] as const) {
        test(`${name} keeps halos hidden in both marker modes`, async ({mount, page}) => {
            const component = await mount(<ChartTestStory data={createData(halo, enabled)} />);
            const box = await getLocatorBoundingBox(
                component.locator('.gcharts-line > path').first(),
            );
            await page.mouse.move(box.x + box.width / 2, box.y);
            await expect(component.locator('.gcharts-marker__symbol:visible')).toHaveCount(
                enabled ? 4 : 3,
            );
            await expect(component.locator('.gcharts-marker__halo')).toHaveCount(0);
        });
    }

    test('default halo options and zero opacity are respected', async ({mount, page}) => {
        const component = await mount(<ChartTestStory data={createData({enabled: true})} />);
        const box = await getLocatorBoundingBox(component.locator('.gcharts-line > path').first());
        const halos = component.locator('.gcharts-marker__halo');
        await page.mouse.move(box.x + box.width / 2, box.y);
        await expect(halos).toHaveCount(2);
        await expect(halos.first()).toHaveAttribute('opacity', '0.25');
        // Default marker radius 4 plus halo size 6.
        expect(
            await halos
                .first()
                .evaluate((element) => (element as SVGGraphicsElement).getBBox().width),
        ).toBe(20);

        await component.update(<ChartTestStory data={createData({enabled: true, opacity: 0})} />);
        await page.mouse.move(box.x + box.width / 2 + 1, box.y);
        await expect(halos).toHaveCount(2);
        await expect(halos.first()).toHaveAttribute('opacity', '0');

        await component.update(<ChartTestStory data={createData({enabled: false})} />);
        await expect(halos).toHaveCount(0);
    });
});
