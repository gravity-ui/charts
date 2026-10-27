// Module treemap of one build with drill-down: a click on a tile opens it, the breadcrumbs go back.
import React from 'react';

import {Chart} from '@gravity-ui/charts';

import './treemap.css';

const PALETTE = [
    '#4c7bd9',
    '#e8743b',
    '#3aa76d',
    '#d6a400',
    '#9b59b6',
    '#20a8c4',
    '#e0557f',
    '#6c7ae0',
    '#a0522d',
    '#7f8c8d',
];
const OTHER_COLOR = '#bbbbbb';
const TOP_TILES = 48;
const TOP_GROUPS = 24;
const TOP_CHILDREN = 12;
const formatKB = (bytes) => `${(bytes / 1000).toFixed(2)} kB`;
// Tile values are in kB, like the history charts.
const toKB = (bytes) => bytes / 1000;

// Flat tiles are named [name, size] for a two-line label, which the default tooltip row would
// show joined. This row shows the plain name from `custom.label` and the size of the tile.
function TooltipRow({className, hovered}) {
    const point = hovered?.[0]?.data;
    if (!point) return null;
    return (
        <tr className={className}>
            <td>
                <span className="bs-swatch" style={{background: point.color}} />
            </td>
            <td>{point.custom?.label}</td>
            <td className="bs-value">{point.value.toFixed(2)} kB</td>
        </tr>
    );
}

// A path element is a child index, or `rest:<n>` for the "other" tile: the children from
// index n on, which opens like any other node.
const REST = 'rest:';

function step(node, element) {
    if (typeof element === 'number') return node.children[element];
    const rest = node.children.slice(Number(element.slice(REST.length)));
    return {
        name: `other (${rest.length})`,
        size: rest.reduce((sum, child) => sum + child.size, 0),
        children: rest,
    };
}

// The biggest children, with the rest folded into one "other" tile.
function topChildren(node, limit) {
    const children = (node.children ?? []).map((child, index) => ({child, element: index}));
    if (children.length <= limit) return children;
    const element = `${REST}${limit}`;
    return [...children.slice(0, limit), {child: step(node, element), element}];
}

const colorOf = (element, i) =>
    typeof element === 'string' ? OTHER_COLOR : PALETTE[i % PALETTE.length];

// One level: every tile is labelled with its name and size.
function flatPoints(node, path) {
    return topChildren(node, TOP_TILES).map(({child, element}, i) => ({
        name: [child.name, formatKB(child.size)],
        value: toKB(child.size),
        color: colorOf(element, i),
        custom: {path: [...path, element], label: child.name},
    }));
}

// Two levels. The charts treemap labels only leaves, so groups are told apart by color.
function nestedPoints(node, path) {
    const points = [];
    topChildren(node, TOP_GROUPS).forEach(({child, element}, i) => {
        const color = colorOf(element, i);
        const childPath = [...path, element];
        const grandchildren = child.children ? topChildren(child, TOP_CHILDREN) : [];
        if (grandchildren.length < 2) {
            points.push({
                name: child.name,
                value: toKB(child.size),
                color,
                custom: {path: childPath, label: child.name},
            });
            return;
        }
        const id = `group-${i}`;
        points.push({id, name: child.name, color, custom: {path: childPath, label: child.name}});
        for (const {child: grandchild, element: grandElement} of grandchildren) {
            points.push({
                name: grandchild.name,
                parentId: id,
                value: toKB(grandchild.size),
                color,
                custom: {path: [...childPath, grandElement], label: grandchild.name},
            });
        }
    });
    return points;
}

export function Treemap({tree}) {
    const [path, setPath] = React.useState([]);
    const [nested, setNested] = React.useState(false);
    const nodes = path.reduce(
        (list, element) => [...list, step(list[list.length - 1], element)],
        [tree],
    );
    const node = nodes[nodes.length - 1];

    // A tile without children opens its parent group instead.
    const open = React.useCallback(
        (target) => {
            const resolved = target.reduce(step, tree);
            setPath(resolved.children ? target : target.slice(0, -1));
        },
        [tree],
    );
    const data = React.useMemo(
        () => ({
            legend: {enabled: false},
            tooltip: {rows: [{renderer: TooltipRow}]},
            series: {
                data: [
                    {
                        type: 'treemap',
                        name: node.name,
                        layoutAlgorithm: 'squarify',
                        levels: [{index: 1, padding: 6}],
                        data: nested ? nestedPoints(node, path) : flatPoints(node, path),
                    },
                ],
            },
            chart: {
                events: {
                    click: ({targets}) => {
                        const target = targets?.[0]?.point.custom?.path;
                        if (target) open(target);
                    },
                },
            },
        }),
        [node, path, nested, open],
    );

    return (
        <div>
            <nav className="crumbs">
                {nodes.map((n, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && <span className="sep">›</span>}
                        <button
                            type="button"
                            disabled={i === nodes.length - 1}
                            onClick={() => setPath(path.slice(0, i))}
                        >
                            {n.name}
                        </button>
                    </React.Fragment>
                ))}
                <span className="size">
                    {formatKB(node.size)} · {((node.size / tree.size) * 100).toFixed(1)}% of the
                    build
                </span>
                <label className="nested">
                    <input
                        type="checkbox"
                        checked={nested}
                        onChange={(event) => setNested(event.target.checked)}
                    />{' '}
                    nested
                </label>
            </nav>
            <div className="treemap">
                <Chart data={data} lang="en" />
            </div>
        </div>
    );
}
