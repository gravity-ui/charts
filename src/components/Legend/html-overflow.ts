import {getReadableText} from '~core/utils/text';

export function isHtmlTextTruncated(element: HTMLElement) {
    return [element, ...element.querySelectorAll<HTMLElement>('*')].some((node) => {
        const style = getComputedStyle(node);
        return (
            (/(hidden|clip|auto|scroll)/.test(style.overflowX) &&
                node.scrollWidth > node.clientWidth) ||
            (/(hidden|clip|auto|scroll)/.test(style.overflowY) &&
                node.scrollHeight > node.clientHeight)
        );
    });
}

export function observeHtmlOverflow(
    element: HTMLElement,
    onChange: (value: {text: string; truncated: boolean}) => void,
) {
    let frame = 0;
    let measuredHtml: string | undefined;
    let text = '';
    const measure = () => {
        const html = element.innerHTML;
        if (html !== measuredHtml) {
            measuredHtml = html;
            text = getReadableText(html);
        }
        onChange({text, truncated: isHtmlTextTruncated(element)});
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
}
