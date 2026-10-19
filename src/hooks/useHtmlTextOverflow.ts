import React from 'react';

import {getReadableText} from '~core/utils/text';

export function useHtmlTextOverflow(element: HTMLElement | null) {
    const [truncated, setTruncated] = React.useState(false);
    const [text, setText] = React.useState('');

    React.useLayoutEffect(() => {
        if (!element) return undefined;
        let frame = 0;
        let measuredHtml: string | undefined;
        const measure = () => {
            const nodes = [element, ...element.querySelectorAll<HTMLElement>('*')];
            setTruncated(
                nodes.some((node) => {
                    const style = getComputedStyle(node);
                    return (
                        (/(hidden|clip|auto|scroll)/.test(style.overflowX) &&
                            node.scrollWidth > node.clientWidth) ||
                        (/(hidden|clip|auto|scroll)/.test(style.overflowY) &&
                            node.scrollHeight > node.clientHeight)
                    );
                }),
            );
            const html = element.innerHTML;
            if (html !== measuredHtml) {
                measuredHtml = html;
                setText(getReadableText(html));
            }
        };
        const schedule = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(measure);
        };
        const resize = new ResizeObserver(schedule);
        const observe = () => {
            resize.disconnect();
            resize.observe(element);
            element.querySelectorAll('*').forEach((node) => resize.observe(node));
        };
        const mutation = new MutationObserver((records) => {
            if (records.some((record) => record.type === 'childList')) observe();
            schedule();
        });
        observe();
        mutation.observe(element, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
        });
        document.fonts?.addEventListener('loadingdone', schedule);
        measure();
        return () => {
            cancelAnimationFrame(frame);
            resize.disconnect();
            mutation.disconnect();
            document.fonts?.removeEventListener('loadingdone', schedule);
        };
    }, [element]);

    return {text, truncated};
}
