import React from 'react';

import {line as lineGenerator, scaleLinear, select, symbol} from 'd3';
import type {AxisDomain, AxisScale, BaseType, Selection} from 'd3';

import {CONTINUOUS_LEGEND_SIZE} from '../../constants';
import type {
    LegendConfig,
    LegendItem,
    OnLegendItemClick,
    PreparedLegend,
    PreparedSeries,
    SymbolLegendSymbol,
} from '../../hooks';
import {formatNumber} from '../../libs';
import {
    block,
    createGradientRect,
    getContinuesColorFn,
    getLabelsSize,
    getLineDashArray,
    getSymbol,
    getUniqId,
    handleOverflowingText,
} from '../../utils';
import {axisBottom} from '../../utils/chart/axis-generators';

import './styles.scss';

const b = block('legend');

type Props = {
    chartSeries: PreparedSeries[];
    legend: PreparedLegend;
    items: LegendItem[][];
    config: LegendConfig;
    htmlLayout: HTMLElement | null;
    onItemClick: OnLegendItemClick;
    onUpdate?: () => void;
};

const getLegendPosition = (args: {
    align: PreparedLegend['align'];
    contentWidth: number;
    width: number;
    offsetLeft: number;
}) => {
    const {align, offsetLeft = 0, width, contentWidth} = args;
    const top = 0;

    if (align === 'left') {
        return {top, left: offsetLeft};
    }

    if (align === 'right') {
        return {top, left: offsetLeft + width - contentWidth};
    }

    return {top, left: offsetLeft + width / 2 - contentWidth / 2};
};

const appendPaginator = (args: {
    container: Selection<SVGGElement, unknown, null, undefined>;
    pageIndex: number;
    legend: PreparedLegend;
    transform: string;
    pages: NonNullable<LegendConfig['pagination']>['pages'];
    onArrowClick: (nextPageIndex: number) => void;
}) => {
    const {container, pageIndex, legend, transform, pages, onArrowClick} = args;
    const paginationLine = container.append('g').attr('class', b('pagination'));
    const maxPage = pages.length;
    let computedWidth = 0;

    paginationLine
        .append('text')
        .text('▲')
        .attr('class', function () {
            return b('pagination-arrow', {inactive: pageIndex === 0});
        })
        .style('font-size', legend.itemStyle.fontSize)
        .each(function () {
            computedWidth += this.getComputedTextLength();
        })
        .on('click', function () {
            if (pageIndex - 1 >= 0) {
                onArrowClick(pageIndex - 1);
            }
        });
    paginationLine
        .append('text')
        .text(`${pageIndex + 1}/${maxPage}`)
        .attr('class', b('pagination-counter'))
        .attr('x', computedWidth)
        .style('font-size', legend.itemStyle.fontSize)
        .each(function () {
            computedWidth += this.getComputedTextLength();
        });
    paginationLine
        .append('text')
        .text('▼')
        .attr('class', function () {
            return b('pagination-arrow', {inactive: pageIndex === maxPage - 1});
        })
        .attr('x', computedWidth)
        .style('font-size', legend.itemStyle.fontSize)
        .on('click', function () {
            if (pageIndex + 1 < maxPage) {
                onArrowClick(pageIndex + 1);
            }
        });
    paginationLine.attr('transform', transform);
};

const legendSymbolGenerator = lineGenerator<{x: number; y: number}>()
    .x((d) => d.x)
    .y((d) => d.y);

function renderLegendSymbol(args: {
    selection: Selection<SVGGElement, LegendItem, BaseType, unknown>;
    legend: PreparedLegend;
    legendLineHeight: number;
}) {
    const {selection, legend, legendLineHeight} = args;
    const line = selection.data();

    const getXPosition = (i: number) => {
        return line.slice(0, i).reduce((acc, legendItem) => {
            return (
                acc +
                legendItem.symbol.width +
                legendItem.symbol.padding +
                legendItem.textWidth +
                legend.itemDistance
            );
        }, 0);
    };

    selection.each(function (d, i) {
        const element = select(this);
        const x = getXPosition(i);
        const className = b('item-symbol', {shape: d.symbol.shape, unselected: !d.visible});
        const color = d.visible ? d.color : '';

        switch (d.symbol.shape) {
            case 'path': {
                const y = legendLineHeight / 2;
                const points = [
                    {x, y},
                    {x: x + d.symbol.width, y},
                ];

                element
                    .append('path')
                    .attr('d', legendSymbolGenerator(points))
                    .attr('fill', 'none')
                    .attr('stroke-width', d.symbol.strokeWidth)
                    .attr('class', className)
                    .style('stroke', color);

                if (d.dashStyle) {
                    element.attr(
                        'stroke-dasharray',
                        getLineDashArray(d.dashStyle, d.symbol.strokeWidth),
                    );
                }

                break;
            }
            case 'rect': {
                const y = (legendLineHeight - d.symbol.height) / 2;
                element
                    .append('rect')
                    .attr('x', x)
                    .attr('y', y)
                    .attr('width', d.symbol.width)
                    .attr('height', d.symbol.height)
                    .attr('rx', d.symbol.radius)
                    .attr('class', className)
                    .style('fill', color);

                break;
            }
            case 'symbol': {
                const y = legendLineHeight / 2;
                const translateX = x + d.symbol.width / 2;

                element
                    .append('svg:path')
                    .attr('d', () => {
                        const scatterSymbol = getSymbol(
                            (d.symbol as SymbolLegendSymbol).symbolType,
                        );

                        // D3 takes size as square pixels, so we need to make square pixels size by multiplying
                        // https://d3js.org/d3-shape/symbol#symbol
                        return symbol(scatterSymbol, d.symbol.width * d.symbol.width)();
                    })
                    .attr('transform', () => {
                        return 'translate(' + translateX + ',' + y + ')';
                    })
                    .attr('class', className)
                    .style('fill', color);

                break;
            }
        }
    });
}

export const Legend = (props: Props) => {
    const {chartSeries, legend, items, config, htmlLayout, onItemClick, onUpdate} = props;
    const ref = React.useRef<SVGGElement>(null);
    const [pageIndex, setPageIndex] = React.useState(0);

    React.useEffect(() => {
        setPageIndex(0);
    }, [config.maxWidth]);

    React.useEffect(() => {
        async function prepareLegend() {
            if (!ref.current || !htmlLayout) {
                return;
            }

            const svgElement = select(ref.current);
            svgElement.selectAll('*').remove();
            svgElement.style('opacity', 0);

            const htmlElement = select(htmlLayout);
            htmlElement.selectAll('[data-legend]').remove();
            const htmlContainer = legend.html
                ? htmlElement.append('div').attr('data-legend', 1).style('position', 'absolute')
                : null;

            let legendWidth = 0;
            if (legend.type === 'discrete') {
                const start = config.pagination?.pages[pageIndex]?.start;
                const end = config.pagination?.pages[pageIndex]?.end;
                const pageItems =
                    typeof start === 'number' && typeof end === 'number'
                        ? items.slice(start, end)
                        : items;
                const legendLineHeights: number[] = [];
                pageItems.forEach((line) => {
                    const legendLine = svgElement.append('g').attr('class', b('line'));
                    const htmlLegendLine = htmlContainer
                        ?.append('div')
                        .style('position', 'absolute');
                    const legendItemTemplate = legendLine
                        .selectAll('legend-history')
                        .data(line)
                        .enter()
                        .append('g')
                        .attr('class', b('item'))
                        .on('click', function (e, d) {
                            onItemClick({name: d.name, metaKey: e.metaKey});
                            onUpdate?.();
                        });

                    const getXPosition = (i: number) => {
                        return line.slice(0, i).reduce((acc, legendItem) => {
                            return (
                                acc +
                                legendItem.symbol.width +
                                legendItem.symbol.padding +
                                legendItem.textWidth +
                                legend.itemDistance
                            );
                        }, 0);
                    };

                    const legendLineHeight = Math.max(...line.map((l) => l.height));
                    renderLegendSymbol({selection: legendItemTemplate, legend, legendLineHeight});

                    if (htmlLegendLine) {
                        htmlLegendLine
                            .selectAll('legend-item')
                            .data(line)
                            .enter()
                            .append('div')
                            .attr('class', function (d) {
                                const mods = {selected: d.visible, unselected: !d.visible};
                                return b('item-text-html', mods);
                            })
                            .style('font-size', legend.itemStyle.fontSize)
                            .style('position', 'absolute')
                            .style('max-width', function (d) {
                                return `${d.textWidth}px`;
                            })
                            .style('left', function (d, i) {
                                return `${getXPosition(i) + d.symbol.width + d.symbol.padding}px`;
                            })
                            .style('top', function (d) {
                                if (d.height < legendLineHeight) {
                                    return `${(legendLineHeight - d.height) / 2}px`;
                                }
                                return '0px';
                            })
                            .on('click', function (e, d) {
                                onItemClick({name: d.name, metaKey: e.metaKey});
                                onUpdate?.();
                            })
                            [legend.html ? 'html' : 'text'](function (d) {
                                return d.name;
                            });
                    } else {
                        legendItemTemplate
                            .append('text')
                            .attr('x', function (legendItem, i) {
                                return (
                                    getXPosition(i) +
                                    legendItem.symbol.width +
                                    legendItem.symbol.padding
                                );
                            })
                            .attr('height', legend.height)
                            .attr('class', function (d) {
                                const mods = {selected: d.visible, unselected: !d.visible};
                                return b('item-text', mods);
                            })
                            .html(function (d) {
                                return ('name' in d && d.name) as string;
                            })
                            .style('font-size', legend.itemStyle.fontSize)
                            .each((d, index, nodes) => {
                                if (d.overflowed) {
                                    handleOverflowingText(nodes[index], d.textWidth);
                                }
                            });
                    }

                    const contentWidth =
                        (legend.html
                            ? getXPosition(line.length) - legend.itemDistance
                            : legendLine.node()?.getBoundingClientRect().width) || 0;

                    let left = 0;
                    switch (legend.justifyContent) {
                        case 'center': {
                            const legendLinePostion = getLegendPosition({
                                align: legend.align,
                                width: config.maxWidth,
                                contentWidth,
                                offsetLeft: config.offset.left,
                            });
                            left = legendLinePostion.left;
                            legendWidth = config.maxWidth;
                            break;
                        }
                        case 'start': {
                            legendWidth = Math.max(legendWidth, contentWidth);
                            break;
                        }
                    }

                    const top = legendLineHeights.reduce((acc, h) => acc + h, 0);
                    legendLineHeights.push(legendLineHeight);
                    legendLine.attr('transform', `translate(${[left, top].join(',')})`);
                    htmlLegendLine?.style('transform', `translate(${left}px, ${top}px)`);
                });

                if (config.pagination) {
                    const transform = `translate(${[0, legend.height - legend.lineHeight / 2].join(
                        ',',
                    )})`;
                    appendPaginator({
                        container: svgElement,
                        pageIndex: pageIndex,
                        legend,
                        transform,
                        pages: config.pagination.pages,
                        onArrowClick: setPageIndex,
                    });
                }
            } else {
                // gradient rect
                const domain = legend.colorScale.domain ?? [];
                const rectHeight = CONTINUOUS_LEGEND_SIZE.height;
                svgElement.call(createGradientRect, {
                    y: legend.title.height + legend.title.margin,
                    height: rectHeight,
                    width: legend.width,
                    interpolator: getContinuesColorFn({
                        values: [0, 1],
                        colors: legend.colorScale.colors,
                        stops: legend.colorScale.stops,
                    }),
                });

                // ticks
                const scale = scaleLinear(domain, [0, legend.width]) as AxisScale<AxisDomain>;
                const xAxisGenerator = await axisBottom({
                    domain: {
                        size: legend.width,
                        color: 'transparent',
                    },
                    htmlLayout,
                    scale,
                    ticks: {
                        items: [[0, -rectHeight]],
                        labelsMargin: legend.ticks.labelsMargin,
                        labelsLineHeight: legend.ticks.labelsLineHeight,
                        maxTickCount: 4,
                        tickColor: '#fff',
                        labelFormat: (value: number) => formatNumber(value, {unit: 'auto'}),
                        labelsStyle: legend.ticks.style,
                    },
                });
                const tickTop = legend.title.height + legend.title.margin + rectHeight;

                const legendAxisClassname = b('axis');
                svgElement.selectAll(`.${legendAxisClassname}`).remove();
                svgElement
                    .append('g')
                    .attr('class', legendAxisClassname)
                    .attr('transform', `translate(0, ${tickTop})`)
                    .call(xAxisGenerator);
                legendWidth = legend.width;
            }

            const legendTitleClassname = b('title');

            if (legend.title.enable) {
                const {maxWidth: titleWidth} = await getLabelsSize({
                    labels: [legend.title.text],
                    style: legend.title.style,
                });
                let dx = 0;
                switch (legend.title.align) {
                    case 'center': {
                        dx = legend.width / 2 - titleWidth / 2;
                        break;
                    }
                    case 'right': {
                        dx = legend.width - titleWidth;
                        break;
                    }
                    case 'left':
                    default: {
                        dx = 0;
                        break;
                    }
                }

                svgElement.selectAll(`.${legendTitleClassname}`).remove();
                svgElement
                    .append('g')
                    .attr('class', legendTitleClassname)
                    .append('text')
                    .attr('dx', dx)
                    .attr('font-weight', legend.title.style.fontWeight ?? null)
                    .attr('font-size', legend.title.style.fontSize ?? null)
                    .attr('fill', legend.title.style.fontColor ?? null)
                    .style('dominant-baseline', 'text-before-edge')
                    .html(legend.title.text);
            } else {
                svgElement.selectAll(`.${legendTitleClassname}`).remove();
            }

            const {left} = getLegendPosition({
                align: legend.align,
                width: config.maxWidth,
                contentWidth: legendWidth,
                offsetLeft: config.offset.left,
            });

            svgElement
                .attr('transform', `translate(${[left, config.offset.top].join(',')})`)
                .style('opacity', 1);
            htmlContainer?.style('transform', `translate(${left}px, ${config.offset.top}px)`);
        }

        prepareLegend();
    }, [chartSeries, onItemClick, onUpdate, legend, items, config, pageIndex, htmlLayout]);

    // due to asynchronous processing, we only need to work with the actual element
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const key = React.useMemo(() => getUniqId(), [legend, config]);

    return <g key={key} className={b()} ref={ref} width={config.maxWidth} height={legend.height} />;
};
