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

function createLabelMarkup({
    label,
    color,
    offsetX = 0,
}: {
    label: string;
    color: string;
    offsetX?: number;
}): string {
    const fontSize = 10;
    const paddingX = 5;
    const paddingY = 3;
    const poleHeight = 20;
    const textWidth = measureTextWidth(label, fontSize);
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = fontSize + paddingY * 2;
    const boxX = -boxWidth / 2 + offsetX;

    return [
        `<line x1="0" y1="${boxHeight}" x2="0" y2="${boxHeight + poleHeight}" stroke="${color}" stroke-width="1"/>`,
        `<circle cx="0" cy="${boxHeight + poleHeight}" r="2.5" fill="${color}"/>`,
        `<rect x="${boxX}" y="0" width="${boxWidth}" height="${boxHeight}" rx="3" fill="${color}"/>`,
        `<text x="${offsetX}" y="${paddingY + fontSize * 0.82}" font-size="${fontSize}" fill="#fff" text-anchor="middle">${label}</text>`,
    ].join('');
}

const NOTABLE_RELEASES = [
    {title: 'Super Mario Odyssey', date: 1509051600000, color: '#ff3d64'},
    {title: 'Animal Crossing: NH', date: 1584655200000, color: '#4da2f1'},
    {title: 'Zelda: TotK', date: 1683838800000, color: '#28a745'},
];

function prepareData(): ChartData {
    const switchGames = nintendoGames
        .filter((d) => d.date && d.user_score && d.platform === 'Switch')
        .sort((a, b) => (a.date ?? 0) - (b.date ?? 0));

    const data: LineSeriesData[] = switchGames.map((d) => ({
        x: d.date as number,
        y: d.user_score as number,
    }));

    const plotShapes: AxisPlotShape[] = NOTABLE_RELEASES.map((release) => ({
        value: release.date,
        layerPlacement: 'after',
        custom: {title: release.title},
        renderer: ({x, plotWidth, plotHeight}) => {
            const boxWidth = measureTextWidth(release.title, 10) + 10;
            let offsetX = 0;
            if (x - boxWidth / 2 < 0) {
                offsetX = boxWidth / 2 - x;
            } else if (x + boxWidth / 2 > plotWidth) {
                offsetX = plotWidth - x - boxWidth / 2;
            }
            return `<g transform="translate(0, ${plotHeight - 36})">${createLabelMarkup({label: release.title, color: release.color, offsetX})}</g>`;
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
            plotShapes,
            type: 'datetime',
            title: {text: 'Release date'},
        },
        yAxis: [
            {
                title: {text: 'User score'},
            },
        ],
    };
}

export const lineWithXDatetimePlotShapesData = prepareData();
