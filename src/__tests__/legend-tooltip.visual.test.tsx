import React from 'react';

import {expect, test} from '@playwright/experimental-ct-react';

import {ChartTestStory} from '../../playwright/components/ChartTestStory';
import type {ChartData, ChartLegendItemClickData} from '../types';

import {LegendItemClickTestStory} from './components/LegendItemClickTestStory';

test.use({viewport: {width: 800, height: 400}});

const actual = 'Enterprise subscription revenue — actual';
const forecast = 'Enterprise subscription revenue — forecast';

function data(html = false, rows = 1): ChartData {
    return {
        legend: {
            enabled: true,
            position: 'right',
            layout: 'vertical',
            width: 'auto',
            maxWidth: 120,
            itemMaxRowCount: rows,
            html,
        },
        series: {
            data: [actual, forecast, 'Other'].map((label, index) => ({
                type: 'line',
                name: `Original series ${index}`,
                legend: {itemText: html ? `<b>${label}</b>` : label, groupId: `series-${index}`},
                data: [
                    {x: 0, y: index + 1},
                    {x: 1, y: index + 2},
                ],
            })),
        },
    };
}

for (const mode of ['svg', 'multiline', 'html'] as const) {
    test(`reveals full ${mode} labels with hover and keyboard`, async ({mount, page}) => {
        const component = await mount(
            <ChartTestStory
                data={data(mode === 'html', mode === 'multiline' ? 2 : 1)}
                styles={{width: 600, height: 320}}
            />,
        );
        const item = component.getByRole('button', {name: actual, exact: true});
        const tooltip = page.getByRole('tooltip');
        const plot = component.locator('.gcharts-line').first();
        await expect(item).toBeVisible();
        const before = await plot.boundingBox();
        await item.hover();
        await expect(tooltip).toHaveText(actual);
        await expect(tooltip.locator('b')).toHaveCount(0);
        await expect(item).toHaveAttribute(
            'aria-describedby',
            (await tooltip.getAttribute('id')) ?? '',
        );
        expect(await plot.boundingBox()).toEqual(before);
        await tooltip.hover();
        await page.waitForTimeout(350);
        await expect(tooltip).toBeVisible();
        await expect(page.locator('.gcharts-tooltip')).toHaveCount(0);
        await page.keyboard.press('Escape');
        await expect(tooltip).toHaveCount(0);
        await page.mouse.move(0, 0);
        await item.focus();
        await expect(item).toBeFocused();
        await expect(item).toHaveCSS('outline-style', 'none');
        await expect(tooltip).toHaveText(actual);
        if (mode === 'multiline') {
            await expect(page).toHaveScreenshot('legend-tooltip-focus.png');
        }
        await page.keyboard.press('Tab');
        await expect(component.getByRole('button', {name: forecast, exact: true})).toBeFocused();
        await expect(tooltip).toHaveCount(1);
        await expect(tooltip).toHaveText(forecast);
        await page.keyboard.press('Tab');
        await expect(component.getByRole('button', {name: 'Other', exact: true})).toBeFocused();
        await expect(tooltip).toHaveCount(0);
    });
}

test('keyboard activation preserves selection and focus', async ({mount, page}) => {
    const component = await mount(<ChartTestStory data={data()} />);
    const first = component.getByRole('button', {name: actual, exact: true});
    const second = component.getByRole('button', {name: forecast, exact: true});
    const lines = component.locator('.gcharts-line > path');
    await first.focus();
    await page.keyboard.press('Enter');
    await expect(lines).toHaveCount(1);
    await expect(first).toBeFocused();
    await expect(first).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Space');
    await expect(lines).toHaveCount(3);
    await expect(first).toBeFocused();
    await page.keyboard.press('ControlOrMeta+Enter');
    await expect(lines).toHaveCount(2);
    await expect(first).toHaveAttribute('aria-pressed', 'false');
    await second.click({modifiers: ['ControlOrMeta']});
    await expect(lines).toHaveCount(1);
    await expect.poll(() => second.evaluate((node) => node.matches(':focus-visible'))).toBe(false);
});

test('recomputes truncation after resize and content changes', async ({mount, page}) => {
    const chart = data();
    chart.legend = {...chart.legend, width: '50%', maxWidth: undefined};
    const component = await mount(<ChartTestStory data={chart} styles={{width: 300}} />);
    let item = component.getByRole('button', {name: actual, exact: true});
    await item.focus();
    await expect(page.getByRole('tooltip')).toHaveText(actual);
    await component.update(<ChartTestStory data={chart} styles={{width: 1000}} />);
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    await expect(item).toBeFocused();
    const updated = data();
    updated.series.data[0].legend = {itemText: 'Updated', groupId: 'series-0'};
    await component.update(<ChartTestStory data={updated} styles={{width: 300}} />);
    item = component.getByRole('button', {name: 'Updated', exact: true});
    await expect(item).toBeFocused();
    await expect(page.getByRole('tooltip')).toHaveCount(0);
});

test('detects nested CSS truncation and style updates in HTML', async ({mount, page}) => {
    const chart = data(true);
    chart.series.data[0].legend = {
        itemText: `<span style="display:block;width:300px;font-size:24px;overflow:hidden;text-overflow:ellipsis">${actual}</span>`,
    };
    chart.legend = {...chart.legend, maxWidth: 400};
    const component = await mount(<ChartTestStory data={chart} styles={{width: 900}} />);
    const item = component.getByRole('button', {name: actual, exact: true});
    await item.focus();
    await expect(page.getByRole('tooltip')).toHaveText(actual);
    await item.locator('span').evaluate((node) => {
        node.style.fontSize = '10px';
    });
    await expect(page.getByRole('tooltip')).toHaveCount(0);
});

test('dismisses stale tooltips on pagination, hiding and unmount', async ({mount, page}) => {
    const chart = data();
    chart.series.data = Array.from({length: 12}, (_, index) => ({
        type: 'line',
        data: [
            {x: 0, y: index + 1},
            {x: 1, y: index + 2},
        ],
        name: `Series ${index}`,
        legend: {itemText: `${actual} ${index}`},
    }));
    const component = await mount(<ChartTestStory data={chart} styles={{height: 140}} />);
    await component.getByRole('button', {name: `${actual} 0`, exact: true}).focus();
    await expect(page.getByRole('tooltip')).toHaveText(`${actual} 0`);
    await component.locator('.gcharts-legend__pagination-arrow').last().click();
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    await component.getByRole('button').first().focus();
    await expect(page.getByRole('tooltip')).toBeVisible();
    await component.update(
        <ChartTestStory data={{...chart, legend: {...chart.legend, enabled: false}}} />,
    );
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    await component.update(<ChartTestStory data={chart} />);
    await component.getByRole('button').first().focus();
    await expect(page.getByRole('tooltip')).toBeVisible();
    await component.unmount();
    await expect(page.getByRole('tooltip')).toHaveCount(0);
});

for (const html of [false, true]) {
    test(`keyboard click callback with no selection html=${html}`, async ({mount, page}) => {
        const events: {
            mouseEvent: boolean;
            ctrlKey: boolean;
            metaKey: boolean;
            currentTargetLabel: string | null;
        }[] = [];
        const items: ChartLegendItemClickData[] = [];
        const chart = data(html);
        const component = await mount(
            <LegendItemClickTestStory
                html={html}
                itemClickAction="none"
                legend={chart.legend}
                seriesData={chart.series.data}
                onItemClick={(item) => {
                    items.push(item);
                }}
                onActivation={(event) => {
                    events.push(event);
                }}
            />,
        );
        const first = component.getByRole('button', {name: actual, exact: true});
        await first.focus();
        await page.keyboard.press('Control+Enter');
        await page.keyboard.press('Space');
        await expect.poll(() => events.length).toBe(2);
        expect(events).toEqual([
            {mouseEvent: true, ctrlKey: true, metaKey: false, currentTargetLabel: actual},
            {mouseEvent: true, ctrlKey: false, metaKey: false, currentTargetLabel: actual},
        ]);
        expect(items.map((item) => item.name)).toEqual([
            html ? `<b>${actual}</b>` : actual,
            html ? `<b>${actual}</b>` : actual,
        ]);
        await expect(component.locator('.gcharts-line > path')).toHaveCount(3);
        await expect(first).toBeFocused();
    });
}

test('noninteractive items expose full labels without button semantics', async ({mount, page}) => {
    const chart = data();
    chart.legend = {...chart.legend, itemClickAction: 'none'};
    const component = await mount(<ChartTestStory data={chart} />);
    const first = component.getByRole('group', {name: actual, exact: true});
    await first.focus();
    await expect(first).toBeFocused();
    await expect(page.getByRole('tooltip')).toHaveText(actual);
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await expect(component.locator('.gcharts-line > path')).toHaveCount(3);
});
