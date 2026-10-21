/** @jest-environment jsdom */ // eslint-disable-line jsdoc/check-tag-names

import {EventType, getDispatcher} from '~core/utils/dispatcher';

import type {LegendTooltipTarget} from '../tooltip-controller';
import {createLegendTooltipController} from '../tooltip-controller';

jest.mock('../html-overflow', () => ({
    observeHtmlOverflow: (
        element: HTMLElement,
        onChange: (value: {text: string; truncated: boolean}) => void,
    ) => {
        onChange({text: element.textContent ?? '', truncated: true});
        return () => {};
    },
}));

test.each([false, true])(
    'switches keyboard tooltip targets without publishing a closed state html=%s',
    (html) => {
        const dispatcher = getDispatcher();
        const listener = jest.fn<void, [LegendTooltipTarget | undefined]>();
        dispatcher.on(EventType.LEGEND_TOOLTIP, listener);
        const controller = createLegendTooltipController(dispatcher);
        const anchors = ['Actual', 'Forecast'].map((text) => {
            const anchor = document.createElement('div');
            anchor.tabIndex = 0;
            // jsdom has no keyboard modality; model the focus-visible state explicitly.
            jest.spyOn(anchor, 'matches').mockImplementation(
                (selector) => selector === ':focus-visible' && document.activeElement === anchor,
            );
            const label = document.createElement('span');
            label.textContent = `${text} subscription revenue`;
            anchor.append(label);
            document.body.append(anchor);
            controller.attach(anchor, {
                text,
                truncated: true,
                vertical: true,
                htmlLabel: html ? label : undefined,
            });
            return anchor;
        });

        try {
            anchors[0].focus();
            expect(listener).toHaveBeenCalledTimes(1);
            listener.mock.calls[0][0]?.onDescribe('legend-tooltip');
            expect(anchors[0].getAttribute('aria-describedby')).toBe('legend-tooltip');
            listener.mockClear();

            anchors[1].focus();

            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({
                    anchor: anchors[1],
                    text: html ? 'Forecast subscription revenue' : 'Forecast',
                }),
            );
            expect(anchors[0].hasAttribute('aria-describedby')).toBe(false);
        } finally {
            controller.destroy();
            anchors.forEach((anchor) => anchor.remove());
        }
    },
);
