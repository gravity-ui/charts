import React from 'react';

import type {Meta, StoryObj} from '@storybook/react';

import {Chart} from '../../components';
import type {ChartData} from '../../types';

const chartData: ChartData = {
    series: {
        data: [
            {
                type: 'line',
                name: 'Series A',
                data: [
                    {x: 0, y: 10},
                    {x: 1, y: 25},
                    {x: 2, y: 18},
                    {x: 3, y: 32},
                    {x: 4, y: 27},
                    {x: 5, y: 40},
                    {x: 6, y: 35},
                ],
            },
        ],
    },
    xAxis: {title: {text: 'X'}},
    yAxis: [{title: {text: 'Y'}}],
};

// ─── Resizable Container ───

function ResizablePanel({
    children,
    initialWidth,
}: {
    children: React.ReactNode;
    initialWidth: number;
}) {
    const [width, setWidth] = React.useState(initialWidth);
    const dragging = React.useRef(false);
    const startX = React.useRef(0);
    const startWidth = React.useRef(0);

    const onPointerDown = React.useCallback(
        (e: React.PointerEvent) => {
            dragging.current = true;
            startX.current = e.clientX;
            startWidth.current = width;
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
        },
        [width],
    );

    const onPointerMove = React.useCallback((e: React.PointerEvent) => {
        if (!dragging.current) return;
        const delta = e.clientX - startX.current;
        setWidth(Math.min(1200, Math.max(200, startWidth.current + delta)));
    }, []);

    const onPointerUp = React.useCallback(() => {
        dragging.current = false;
    }, []);

    return (
        <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
            <div style={{fontSize: 12, color: '#888', fontFamily: 'monospace'}}>
                Resizable panel — drag right edge
            </div>
            <div
                style={{
                    display: 'flex',
                    width,
                    border: '2px solid #e0e0e0',
                    borderRadius: 8,
                    overflow: 'hidden',
                }}
            >
                <div style={{flex: 1, height: 280, minWidth: 0}}>{children}</div>
                <div
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    style={{
                        width: 14,
                        cursor: 'col-resize',
                        background: '#e8e8e8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        userSelect: 'none',
                        touchAction: 'none',
                        fontSize: 10,
                        color: '#999',
                    }}
                >
                    ⋮
                </div>
            </div>
            <div style={{fontSize: 11, color: '#aaa', fontFamily: 'monospace'}}>
                container width: {Math.round(width)}px
            </div>
        </div>
    );
}

// ─── Demo ───

function ResizableContainerDemo() {
    const [resizeCount, setResizeCount] = React.useState(0);
    const [lastWidth, setLastWidth] = React.useState<number | undefined>();

    const handleResize = React.useCallback<
        NonNullable<React.ComponentProps<typeof Chart>['onResize']>
    >(({dimensions}) => {
        if (dimensions) {
            setResizeCount((c) => c + 1);
            setLastWidth(dimensions.width);
        }
    }, []);

    return (
        <div style={{padding: 16, fontFamily: 'sans-serif'}}>
            <h3 style={{margin: '0 0 8px'}}>Resizable Container</h3>
            <p style={{margin: '0 0 16px', color: '#666', fontSize: 14, maxWidth: 700}}>
                The chart automatically adapts when the container is resized via drag — no{' '}
                <code>reflow()</code> call needed. Powered by <code>ResizeObserver</code> on the
                parent element.
            </p>

            <ResizablePanel initialWidth={600}>
                <Chart data={chartData} onResize={handleResize} />
            </ResizablePanel>

            <div
                style={{
                    marginTop: 12,
                    fontSize: 12,
                    fontFamily: 'monospace',
                    color: '#999',
                    display: 'flex',
                    gap: 24,
                }}
            >
                <span>onResize calls: {resizeCount}</span>
                <span>chart width: {lastWidth ?? '—'}px</span>
            </div>
        </div>
    );
}

// ─── Storybook ───

const meta: Meta = {
    title: 'Other/Resizable Container',
};

export default meta;

type Story = StoryObj;

export const Demo: Story = {
    name: 'Resizable Container',
    render: () => <ResizableContainerDemo />,
};
