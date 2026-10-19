/** @jest-environment jsdom */

import {select} from 'd3-selection';

import {renderDataLabels} from '../data-labels';

test('refreshes grouped labels without keeping stale labels or hover styling', () => {
    const plot = select(document.createElementNS('http://www.w3.org/2000/svg', 'g'));
    const label = {
        text: 'First',
        x: 10,
        y: 20,
        textAnchor: 'start' as const,
        style: {fontSize: '12px'},
    };
    const data = [
        {x: 100, labels: [label, {...label, text: 'Removed'}]},
        {x: 200, labels: [{...label, text: 'Second'}]},
    ];
    const groups = plot
        .selectAll<SVGGElement, (typeof data)[number]>('g')
        .data(data)
        .join('g')
        .attr('transform', (d) => `translate(${d.x}, 0)`);

    renderDataLabels({
        container: groups,
        data: (d) => d.labels,
        className: 'label',
    }).attr('opacity', 0.2);

    data[0].labels = [{...label, text: 'Updated', x: 30}];
    data[1].labels = [];
    renderDataLabels({
        container: groups,
        data: (d) => d.labels,
        className: 'label',
    });

    const [first, second] = groups.nodes();
    expect(first.getAttribute('transform')).toBe('translate(100, 0)');
    expect(first.querySelectorAll('text')).toHaveLength(1);
    expect(first.querySelector('text')?.textContent).toBe('Updated');
    expect(first.querySelector('text')?.getAttribute('x')).toBe('30');
    expect(first.querySelector('text')?.hasAttribute('opacity')).toBe(false);
    expect(second.querySelectorAll('text')).toHaveLength(0);
});
