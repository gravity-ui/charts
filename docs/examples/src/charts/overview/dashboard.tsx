import React from 'react';

import {BarYBasicExample} from '../series-types/bar-y-basic';
import {FunnelExample} from '../series-types/funnel';
import {HeatmapExample} from '../series-types/heatmap';
import {LineBasicExample} from '../series-types/line-basic';
import {PieExample} from '../series-types/pie';
import {ScatterBasicExample} from '../series-types/scatter-basic';
import {TreemapExample} from '../series-types/treemap';
import {XRangeExample} from '../series-types/x-range';

import './dashboard.scss';

interface DashboardCard {
    title: string;
    caption: string;
    series: string;
    seriesName: string;
    size: 'wide' | 'narrow';
    Component: () => React.ReactElement;
}

const cards: DashboardCard[] = [
    {
        title: 'Orders over time',
        caption: 'January–June',
        series: 'line',
        seriesName: 'Line',
        size: 'wide',
        Component: LineBasicExample,
    },
    {
        title: 'Sales channels',
        caption: 'Website, app and store',
        series: 'pie',
        seriesName: 'Pie',
        size: 'narrow',
        Component: PieExample,
    },
    {
        title: 'Orders by category',
        caption: 'Product category comparison',
        series: 'bar-y',
        seriesName: 'Bar-Y',
        size: 'narrow',
        Component: BarYBasicExample,
    },
    {
        title: 'Checkout journey',
        caption: 'From product view to purchase',
        series: 'funnel',
        seriesName: 'Funnel',
        size: 'wide',
        Component: FunnelExample,
    },
    {
        title: 'Customer activity',
        caption: 'Requests by weekday and time of day',
        series: 'heatmap',
        seriesName: 'Heatmap',
        size: 'wide',
        Component: HeatmapExample,
    },
    {
        title: 'Storage usage',
        caption: 'Documents and media',
        series: 'treemap',
        seriesName: 'Treemap',
        size: 'narrow',
        Component: TreemapExample,
    },
    {
        title: 'Delivery performance',
        caption: 'Distance and delivery time',
        series: 'scatter',
        seriesName: 'Scatter',
        size: 'narrow',
        Component: ScatterBasicExample,
    },
    {
        title: 'Project schedule',
        caption: 'From design to review',
        series: 'x-range',
        seriesName: 'X-Range',
        size: 'wide',
        Component: XRangeExample,
    },
];

export function OverviewDashboardExample() {
    return (
        <div className="docs-dashboard">
            <div className="docs-dashboard__heading">
                <div className="docs-dashboard__title">Store overview</div>
                <div className="docs-dashboard__subtitle">Sales and operations · Sample data</div>
            </div>
            <div className="docs-dashboard__grid">
                {cards.map(({title, caption, series, seriesName, size, Component}) => (
                    <section
                        key={series}
                        className={`docs-dashboard__card docs-dashboard__card_${size}`}
                        aria-label={title}
                    >
                        <a
                            className="docs-dashboard__link"
                            href={`pages/guides/series-types/${series}.html#example`}
                            aria-label={`${title}: ${seriesName} series guide and example`}
                        >
                            <span className="docs-dashboard__card-title">{title}</span>
                            <span className="docs-dashboard__type">
                                {seriesName} <span aria-hidden="true">↗</span>
                            </span>
                        </a>
                        <div className="docs-dashboard__caption">{caption}</div>
                        <div className="docs-dashboard__chart">
                            <Component />
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}
