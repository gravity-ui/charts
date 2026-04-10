import {expect} from '@playwright/experimental-ct-react';
import type {MountResult} from '@playwright/experimental-ct-react';
import type {Locator, Page} from '@playwright/test';

/** Same shape as Playwright `locator.boundingBox()` (not `DOMRect`: no top/left/right/bottom). */
export type LocatorBoundingBox = {x: number; y: number; width: number; height: number};

/**
 * Waits for the element to be visible before returning the locator. Use this
 * when the test needs to interact with a rendered element (read its bounding
 * box, simulate mouse events on it, parse its attributes) and you want a clear
 * failure if the chart hasn't painted it yet. For elements that can
 * legitimately exist without a visible bounding box — an SVG `<path>` with an
 * empty `d`, for example — use `getAttachedLocator` instead.
 */
export async function getLocator(args: {component: MountResult; selector: string}) {
    const {component, selector} = args;
    const locator = component.locator(selector);
    await expect(locator).toBeVisible();

    return locator;
}

/**
 * Waits for the element to be attached to the DOM without requiring visibility.
 * Useful for SVG paths that can legitimately have a zero-size bounding box
 * (e.g. empty `d` attribute), which Playwright's `toBeVisible()` rejects.
 */
export async function getAttachedLocator(args: {component: MountResult; selector: string}) {
    const {component, selector} = args;
    const locator = component.locator(selector);
    await expect(locator).toBeAttached();

    return locator;
}

export async function getLocatorBoundingBox(locator: Locator): Promise<LocatorBoundingBox> {
    const boundingBox = await locator.boundingBox();

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
    getDragOptions: (args: {boundingBox: LocatorBoundingBox}) => {
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
