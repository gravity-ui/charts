// Client side of the bundle size page: draws the precomputed series with @gravity-ui/charts.
// page.mjs bundles it with the charts build of the repository.
import React from 'react';

import {Chart} from '@gravity-ui/charts';
import {ThemeProvider} from '@gravity-ui/uikit';
import {createRoot} from 'react-dom/client';

import '@gravity-ui/uikit/styles/styles.css';

const kBFormat = {type: 'number', precision: 2, postfix: ' kB', lang: 'en'};

// Clicking a build opens its row in the table, which also expands its packages.
function openBuild({targets, chart, position}) {
    const target = targets?.[0] ?? (chart && position ? chart.getClosest(position) : undefined);
    const anchor = target?.point.custom?.anchor;
    if (anchor) {
        window.location.hash = anchor;
    }
}

function baseData(check) {
    return {
        xAxis: {type: 'category', categories: check.labels},
        tooltip: {valueFormat: kBFormat},
        chart: {events: {clickMode: 'plot', click: openBuild}},
    };
}

function point(check, i, kB) {
    return {x: i, y: kB, custom: {anchor: check.anchors[i]}};
}

function totalData(check) {
    return {
        ...baseData(check),
        legend: {enabled: false},
        yAxis: [{title: {text: 'Minified and brotlied, kB'}}],
        series: {
            options: {line: {marker: {enabled: true, radius: 3}}},
            data: [
                {
                    type: 'line',
                    name: check.name,
                    data: check.totals.map((kB, i) => point(check, i, kB)),
                },
            ],
        },
    };
}

function packagesData(check) {
    return {
        ...baseData(check),
        yAxis: [{title: {text: 'Minified, kB'}}],
        series: {
            data: check.packages.map(({name, values}) => ({
                type: 'area',
                name,
                stacking: 'normal',
                data: values.map((kB, i) => point(check, i, kB)),
            })),
        },
    };
}

const checks = JSON.parse(document.getElementById('bundle-size-data').textContent);
for (const container of document.querySelectorAll('[data-chart]')) {
    const check = checks.find((c) => c.slug === container.dataset.check);
    const data = container.dataset.chart === 'total' ? totalData(check) : packagesData(check);
    createRoot(container).render(
        <ThemeProvider theme="light">
            <Chart data={data} lang="en" />
        </ThemeProvider>,
    );
}
