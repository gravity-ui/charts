/* @jest-environment jsdom */
import React from 'react';

import type {PopupProps} from '@gravity-ui/uikit';
import {render} from '@testing-library/react';

import {useTooltip} from '../../../hooks';
import {Tooltip} from '../index';

jest.mock('../../../hooks', () => ({useTooltip: jest.fn()}));
jest.mock('../ChartTooltipContent', () => ({TooltipContent: () => null}));
jest.mock('@gravity-ui/uikit', () => ({
    ...jest.requireActual('@gravity-ui/uikit'),
    Popup: jest.fn(() => null),
}));

const {Popup} = jest.requireMock('@gravity-ui/uikit');
const tooltip = {} as React.ComponentProps<typeof Tooltip>['tooltip'];

function getAnchor() {
    return Popup.mock.calls.at(-1)[0].anchorElement as Exclude<
        PopupProps['anchorElement'],
        Element | null | undefined
    >;
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useTooltip).mockReturnValue({
        hovered: [{data: {x: 0, y: 1}, series: {type: 'line', name: 'Series'}}],
        pointerPosition: [40, 60],
    } as ReturnType<typeof useTooltip>);
});

function renderTooltip(svgContainer: SVGSVGElement) {
    return render(
        <Tooltip
            dispatcher={{} as React.ComponentProps<typeof Tooltip>['dispatcher']}
            tooltip={tooltip}
            seriesData={undefined}
            svgContainer={svgContainer}
            xAxis={null}
            yAxis={[]}
            tooltipPinned={false}
        />,
    );
}

it('measures the screen matrix lazily without requiring DOMPoint', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const getScreenCTM = jest.fn(() => ({a: 0.6, b: 0.2, c: -0.1, d: 0.8, e: 100, f: 30}));
    Object.defineProperty(svg, 'getScreenCTM', {value: getScreenCTM});
    renderTooltip(svg);
    expect(getScreenCTM).not.toHaveBeenCalled();
    expect(getAnchor().getBoundingClientRect()).toMatchObject({left: 118, top: 86});
    expect(getScreenCTM).toHaveBeenCalledTimes(1);
});

it.each(['missing', 'null'])('reads current bounds on demand when the matrix is %s', (mode) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    if (mode === 'null') {
        Object.defineProperty(svg, 'getScreenCTM', {value: () => null});
    }
    const getRect = jest.spyOn(svg, 'getBoundingClientRect');
    getRect.mockReturnValue({left: 100, top: 30} as DOMRect);
    renderTooltip(svg);
    expect(getRect).not.toHaveBeenCalled();
    const anchor = getAnchor();
    expect(anchor.contextElement).toBe(svg);
    expect(anchor.getBoundingClientRect()).toMatchObject({left: 140, top: 90});
    getRect.mockReturnValue({left: 150, top: 80} as DOMRect);
    expect(anchor.getBoundingClientRect()).toMatchObject({left: 190, top: 140});
});
