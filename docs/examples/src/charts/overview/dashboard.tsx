import React from 'react';

import {Chart} from '@gravity-ui/charts';
import type {ChartData} from '@gravity-ui/charts';
import {scaleLinear} from 'd3-scale';

interface DashboardCard {
    title: string;
    caption: string;
    data: ChartData;
}

const activityColors = ['#e6f2ff', '#1769aa'];
const activityDomain = [0, 100];
const activityColor = scaleLinear<string>().domain(activityDomain).range(activityColors);
const activity = [
    [20, 35, 40, 30, 45, 65, 55],
    [45, 55, 60, 50, 70, 95, 85],
    [30, 40, 35, 45, 60, 80, 70],
];

const cards: DashboardCard[] = [
    {
        title: 'Revenue',
        caption: 'Line · USD, thousands',
        data: {
            series: {
                data: [
                    {
                        type: 'line',
                        name: 'Revenue',
                        data: [32, 38, 35, 46, 51, 58].map((y, x) => ({x, y})),
                    },
                ],
            },
            xAxis: {type: 'category', categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']},
            yAxis: [{min: 0}],
        },
    },
    {
        title: 'Orders by category',
        caption: 'Bar-Y · June',
        data: {
            series: {
                data: [
                    {
                        type: 'bar-y',
                        name: 'Orders',
                        data: [420, 310, 180, 90].map((x, y) => ({x, y})),
                    },
                ],
            },
            xAxis: {min: 0},
            yAxis: [{type: 'category', categories: ['Home', 'Clothing', 'Electronics', 'Books']}],
        },
    },
    {
        title: 'Sales channels',
        caption: 'Pie · Share of June orders',
        data: {
            series: {
                data: [
                    {
                        type: 'pie',
                        innerRadius: '55%',
                        dataLabels: {enabled: false},
                        data: [
                            {name: 'Website', value: 600},
                            {name: 'App', value: 300},
                            {name: 'Store', value: 100},
                        ],
                    },
                ],
            },
            legend: {enabled: true},
        },
    },
    {
        title: 'Checkout journey',
        caption: 'Funnel · Visitors reaching each stage',
        data: {
            series: {
                data: [
                    {
                        type: 'funnel',
                        dataLabels: {align: 'left'},
                        data: [
                            {name: 'Viewed', value: 4000, label: 'Viewed · 4,000'},
                            {name: 'In cart', value: 2600, label: 'In cart · 2,600'},
                            {name: 'Checkout', value: 1600, label: 'Checkout · 1,600'},
                            {name: 'Paid', value: 1000, label: 'Paid · 1,000'},
                        ],
                    },
                ],
            },
        },
    },
    {
        title: 'Shopping activity',
        caption: 'Heatmap · Relative activity, 0–100',
        data: {
            series: {
                data: [
                    {
                        type: 'heatmap',
                        name: 'Activity',
                        data: activity.flatMap((row, y) =>
                            row.map((value, x) => ({x, y, value, color: activityColor(value)})),
                        ),
                    },
                ],
            },
            xAxis: {
                type: 'category',
                categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            },
            yAxis: [{type: 'category', categories: ['Morning', 'Afternoon', 'Evening']}],
            legend: {
                enabled: true,
                type: 'continuous',
                colorScale: {colors: activityColors, domain: activityDomain, stops: [0, 1]},
            },
        },
    },
    {
        title: 'Inventory mix',
        caption: 'Treemap · Units in stock',
        data: {
            series: {
                data: [
                    {
                        type: 'treemap',
                        name: 'Inventory',
                        data: [
                            {name: 'Home', value: 420},
                            {name: 'Clothing', value: 300},
                            {name: 'Electronics', value: 180},
                            {name: 'Books', value: 100},
                        ],
                    },
                ],
            },
        },
    },
    {
        title: 'Order size and value',
        caption: 'Scatter · Items per order × USD',
        data: {
            series: {
                data: [
                    {
                        type: 'scatter',
                        name: 'Orders',
                        data: [
                            {x: 1, y: 18},
                            {x: 1, y: 42},
                            {x: 2, y: 32},
                            {x: 2, y: 65},
                            {x: 3, y: 48},
                            {x: 3, y: 90},
                            {x: 4, y: 75},
                            {x: 4, y: 120},
                            {x: 5, y: 110},
                            {x: 6, y: 145},
                        ],
                    },
                ],
            },
            xAxis: {min: 0, max: 7, title: {text: 'Items'}},
            yAxis: [{min: 0, title: {text: 'USD'}}],
        },
    },
    {
        title: 'Restocking schedule',
        caption: 'X-Range · Days from order to delivery',
        data: {
            series: {
                data: [
                    {
                        type: 'x-range',
                        name: 'Delivery',
                        data: [
                            {x0: 1, x1: 4, y: 0},
                            {x0: 2, x1: 7, y: 1},
                            {x0: 4, x1: 9, y: 2},
                            {x0: 6, x1: 10, y: 3},
                        ],
                    },
                ],
            },
            xAxis: {min: 0, max: 12, title: {text: 'Day'}},
            yAxis: [{type: 'category', categories: ['Home', 'Clothing', 'Electronics', 'Books']}],
        },
    },
];

const charts = cards.map((card) => ({
    ...card,
    data: {legend: {enabled: false}, ...card.data},
}));

export function OverviewDashboardExample() {
    return (
        <div style={{padding: 16, background: 'var(--g-color-base-generic)', borderRadius: 12}}>
            <div style={{marginBottom: 20}}>
                <div style={{fontSize: 22, fontWeight: 600, lineHeight: '28px'}}>
                    Store overview
                </div>
                <div style={{marginTop: 4, color: 'var(--g-color-text-secondary)', fontSize: 13}}>
                    January–June 2026 · Sample data
                </div>
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                    gap: 12,
                }}
            >
                {charts.map(({title, caption, data}) => (
                    <div
                        key={title}
                        style={{
                            minWidth: 0,
                            padding: 16,
                            borderRadius: 8,
                            background: 'var(--g-color-base-background)',
                        }}
                    >
                        <div style={{fontSize: 15, fontWeight: 600, lineHeight: '20px'}}>
                            {title}
                        </div>
                        <div
                            style={{
                                marginTop: 4,
                                marginBottom: 16,
                                color: 'var(--g-color-text-secondary)',
                                fontSize: 12,
                            }}
                        >
                            {caption}
                        </div>
                        <div style={{height: 220}}>
                            <Chart data={data} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
