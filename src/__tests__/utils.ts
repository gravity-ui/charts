import {expect} from '@playwright/experimental-ct-react';
import type {MountResult} from '@playwright/experimental-ct-react';
import type {Locator, Page} from '@playwright/test';

export async function getLocator(args: {component: MountResult; selector: string}) {
    const {component, selector} = args;
    const locator = component.locator(selector);
    await expect(locator).toBeVisible();

    return locator;
}

export async function getLocatorBoundingBox(locator: Locator) {
    const boundingBox = await locator.evaluate((el) => el.getBoundingClientRect());

    if (!boundingBox) {
        throw new Error('Bounding box not found');
    }

    return boundingBox;
}

async function simulateDrag(args: {from: [number, number]; page: Page; to: [number, number]}) {
    const {from, page, to} = args;
    const [fromX, fromY] = from;
    const [toX, toY] = to;

    await page.mouse.move(fromX, fromY);
    await page.mouse.down();
    await page.mouse.move(toX, toY);
    await page.mouse.up();
}

export async function dragElementByCalculatedPosition(args: {
    component: MountResult;
    getDragOptions: (args: {boundingBox: DOMRect}) => {
        from: [number, number];
        to: [number, number];
    };
    page: Page;
    selector: string;
}) {
    const {component, getDragOptions, page, selector} = args;
    const locator = await getLocator({component, selector});
    const boundingBox = await getLocatorBoundingBox(locator);
    const {from, to} = getDragOptions({boundingBox});

    await simulateDrag({page, from, to});
}
