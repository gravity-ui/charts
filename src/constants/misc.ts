function isTouchEnabled() {
    if (typeof window !== 'object') {
        return false;
    }

    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export const IS_TOUCH_ENABLED = isTouchEnabled();

export const SCROLLBAR_WIDTH = (function () {
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll';
    outer.style.position = 'absolute';
    outer.style.top = '-9999px';
    document.body.appendChild(outer);

    const inner = document.createElement('div');
    outer.appendChild(inner);
    const width = outer.offsetWidth - inner.offsetWidth;

    document.body.removeChild(outer);

    return width;
})();
