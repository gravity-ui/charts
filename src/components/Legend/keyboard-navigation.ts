import {select} from 'd3-selection';

interface Options {
    container: HTMLElement | SVGElement;
    vertical: boolean;
    activeId: string | null;
    onFocus: (id: string) => void;
    onPageChange: (direction: 'next' | 'previous' | 'first' | 'last') => void;
}

export function bindLegendNavigation({
    container,
    vertical,
    activeId,
    onFocus,
    onPageChange,
}: Options) {
    select(container).selectAll('[data-legend-item-id]').on('.navigation', null);
    // Rendering marks only actionable or truncated items as focusable.
    const items = Array.from(
        container.querySelectorAll<HTMLElement | SVGElement>('[data-legend-item-id][tabindex="0"]'),
    );
    const active =
        items.find((node) => node.getAttribute('data-legend-item-id') === activeId) ?? items[0];
    const remember = (node: HTMLElement | SVGElement) => {
        items.forEach((item) => item.setAttribute('tabindex', item === node ? '0' : '-1'));
        const id = node.getAttribute('data-legend-item-id');
        if (id !== null) onFocus(id);
    };
    items.forEach((node, index) => {
        node.setAttribute('tabindex', node === active ? '0' : '-1');
        select<HTMLElement | SVGElement, unknown>(node)
            .on('focus.navigation', () => remember(node))
            .on('keydown.navigation', (event: KeyboardEvent) => {
                if (event.target !== node) return;
                const next = vertical ? 'ArrowDown' : 'ArrowRight';
                const previous = vertical ? 'ArrowUp' : 'ArrowLeft';
                if (![next, previous, 'Home', 'End'].includes(event.key)) return;
                event.preventDefault();
                if (event.key === 'Home' || event.key === 'End') {
                    const first = event.key === 'Home';
                    items[first ? 0 : items.length - 1]?.focus({preventScroll: true});
                    onPageChange(first ? 'first' : 'last');
                    return;
                }
                const forward = event.key === next;
                const target = items[index + (forward ? 1 : -1)];
                if (target) target.focus({preventScroll: true});
                else onPageChange(forward ? 'next' : 'previous');
            });
    });
    return items;
}
