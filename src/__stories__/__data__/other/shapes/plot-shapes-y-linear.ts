import type {AxisPlotShape, ChartData, LineSeries, LineSeriesData} from '../../../../types';
import nintendoGames from '../../nintendoGames';

function measureTextWidth(text: string, fontSize: number): number {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    document.body.appendChild(svg);
    const textEl = document.createElementNS(ns, 'text');
    textEl.setAttribute('font-size', String(fontSize));
    textEl.textContent = text;
    svg.appendChild(textEl);
    const width = textEl.getComputedTextLength();
    document.body.removeChild(svg);
    return width;
}

function createHorizontalLabelMarkup({label, color}: {label: string; color: string}): string {
    const fontSize = 10;
    const paddingX = 5;
    const paddingY = 3;
    const poleWidth = 10;
    const textWidth = measureTextWidth(label, fontSize);
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = fontSize + paddingY * 2;

    return [
        `<circle cx="0" cy="0" r="2.5" fill="${color}"/>`,
        `<line x1="0" y1="0" x2="${poleWidth}" y2="0" stroke="${color}" stroke-width="1"/>`,
        `<rect x="${poleWidth}" y="${-boxHeight / 2}" width="${boxWidth}" height="${boxHeight}" rx="3" fill="${color}"/>`,
        `<text x="${poleWidth + paddingX}" y="${fontSize * 0.32}" font-size="${fontSize}" fill="#fff">${label}</text>`,
    ].join('');
}

const SCORE_THRESHOLDS = [
    {label: 'Excellent', value: 9, color: '#28a745'},
    {label: 'Good', value: 7, color: '#4da2f1'},
    {label: 'Mediocre', value: 5, color: '#ff3d64'},
];

function prepareData(): ChartData {
    const switchGames = nintendoGames
        .filter((d) => d.date && d.user_score && d.platform === 'Switch')
        .sort((a, b) => (a.date ?? 0) - (b.date ?? 0));

    const data: LineSeriesData[] = switchGames.map((d) => ({
        x: d.date as number,
        y: d.user_score as number,
    }));

    const plotShapes: AxisPlotShape[] = SCORE_THRESHOLDS.map((threshold) => ({
        value: threshold.value,
        layerPlacement: 'after',
        custom: {label: threshold.label},
        renderer: ({y, plotHeight}) => {
            const boxHeight = 16;
            let offsetY = 0;
            if (y - boxHeight / 2 < 0) {
                offsetY = boxHeight / 2 - y;
            } else if (y + boxHeight / 2 > plotHeight) {
                offsetY = plotHeight - y - boxHeight / 2;
            }
            const inner = createHorizontalLabelMarkup({
                label: threshold.label,
                color: threshold.color,
            });
            return offsetY !== 0 ? `<g transform="translate(0, ${offsetY})">${inner}</g>` : inner;
        },
    }));

    return {
        series: {
            data: [
                {
                    type: 'line',
                    data,
                    name: 'User score',
                },
            ] as LineSeries[],
        },
        xAxis: {
            type: 'datetime',
            title: {text: 'Release date'},
        },
        yAxis: [
            {
                plotShapes,
                title: {text: 'User score'},
            },
        ],
    };
}

export const lineWithYLinearPlotShapesData = prepareData();
