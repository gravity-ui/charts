import {getGalleryGroups} from './gallery';
import type {ExampleMeta} from './gallery';

function example(title: string, gallery?: ExampleMeta['gallery']): ExampleMeta {
    return {title, description: title, seriesType: 'Line', docsUrl: 'line.html', gallery};
}

describe('example gallery grouping', () => {
    it('puts the basic example first regardless of registration order', () => {
        expect(
            getGalleryGroups({
                advanced: example('Advanced'),
                basic: example('Basic', {order: 0}),
            })[0].ids,
        ).toEqual(['basic', 'advanced']);
    });

    it('sorts equal priorities by title instead of registration order', () => {
        expect(getGalleryGroups({z: example('Zoom'), a: example('Axes')})[0].ids).toEqual([
            'a',
            'z',
        ]);
    });

    it('uses topic overrides once, keeping series groups first and topics in configured order', () => {
        const meta = {
            tooltip: example('Tooltip', {group: 'tooltip'}),
            line: example('Line'),
            axes: example('Axes', {group: 'axes'}),
            area: {...example('Area'), seriesType: 'Area'},
            labels: {...example('Labels', {group: 'data-labels'}), seriesType: 'Pie'},
            legend: example('Legend', {group: 'legend'}),
        };
        expect(getGalleryGroups(meta)).toEqual([
            {name: 'Area', ids: ['area']},
            {name: 'Line', ids: ['line']},
            {name: 'Axes and formatting', ids: ['axes']},
            {name: 'Legend', ids: ['legend']},
            {name: 'Tooltips', ids: ['tooltip']},
            {name: 'Data labels', ids: ['labels']},
        ]);
        expect(meta.labels.seriesType).toBe('Pie');
    });

    it('does not create empty topic groups', () => {
        expect(getGalleryGroups({basic: example('Basic')})).toEqual([
            {name: 'Line', ids: ['basic']},
        ]);
    });
});
