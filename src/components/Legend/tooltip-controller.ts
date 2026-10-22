import type {Dispatch} from 'd3-dispatch';

import {EventType} from '~core/utils/dispatcher';

import {observeHtmlOverflow} from './html-overflow';

export const LEGEND_TOOLTIP_OPEN_DELAY = 300;
export const LEGEND_TOOLTIP_CLOSE_DELAY = 150;

interface TooltipLabel {
    text: string;
    truncated: boolean;
    htmlLabel?: HTMLElement;
    vertical: boolean;
}

export interface LegendTooltipTarget {
    anchor: HTMLElement | SVGElement;
    text: string;
    vertical: boolean;
    onContentHover: (hovered: boolean) => void;
    onDismiss: (reason?: string) => void;
    onDescribe: (id?: string) => void;
}

interface Entry extends TooltipLabel {
    anchor: LegendTooltipTarget['anchor'];
    dispose: () => void;
}

export function createLegendTooltipController(dispatcher: Dispatch<object>) {
    const entries = new Map<LegendTooltipTarget['anchor'], Entry>();
    let active: Entry | undefined;
    let visible: LegendTooltipTarget | undefined;
    let ready = false;
    let overContent = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopObserving: (() => void) | undefined;
    const cancelTimer = () => clearTimeout(timer);
    const hasKeyboardFocus = (entry: Entry) => entry.anchor.matches(':focus-visible');
    const publish = () => {
        const entry = active;
        if (entry && ready && entry.truncated && entry.text && entry.anchor.isConnected) {
            if (
                visible?.anchor === entry.anchor &&
                visible.text === entry.text &&
                visible.vertical === entry.vertical
            )
                return;
            if (visible?.anchor !== entry.anchor) {
                visible?.anchor.removeAttribute('aria-describedby');
            }
            visible = {
                anchor: entry.anchor,
                text: entry.text,
                vertical: entry.vertical,
                onContentHover,
                onDismiss,
                onDescribe: (id) => {
                    if (id && active === entry && visible?.anchor === entry.anchor) {
                        entry.anchor.setAttribute('aria-describedby', id);
                    } else {
                        entry.anchor.removeAttribute('aria-describedby');
                    }
                },
            };
        } else {
            if (!visible) return;
            visible.anchor.removeAttribute('aria-describedby');
            visible = undefined;
            if (overContent) {
                overContent = false;
                if (!active?.anchor.matches(':hover')) hide();
            }
        }
        dispatcher.call(EventType.LEGEND_TOOLTIP, undefined, visible);
    };
    const reset = () => {
        cancelTimer();
        stopObserving?.();
        stopObserving = undefined;
        active = undefined;
        ready = false;
        overContent = false;
    };
    const dismiss = () => {
        reset();
        publish();
    };
    function hide() {
        cancelTimer();
        if (overContent || (active && hasKeyboardFocus(active))) return;
        timer = setTimeout(dismiss, LEGEND_TOOLTIP_CLOSE_DELAY);
    }
    function onContentHover(hovered: boolean) {
        overContent = hovered;
        if (hovered) cancelTimer();
        else if (!active?.anchor.matches(':hover')) hide();
    }
    function onDismiss(reason?: string) {
        if (
            reason === 'escape-key' ||
            (reason === 'ancestor-scroll' && active && !hasKeyboardFocus(active))
        ) {
            dismiss();
        }
    }
    const observe = (entry: Entry) => {
        stopObserving?.();
        stopObserving = entry.htmlLabel
            ? observeHtmlOverflow(entry.htmlLabel, (value) => {
                  Object.assign(entry, value);
                  entry.anchor.setAttribute('aria-label', value.text);
                  if (ready) publish();
              })
            : undefined;
    };
    const activate = (entry: Entry, keyboard: boolean) => {
        cancelTimer();
        if (active !== entry) {
            reset();
            active = entry;
            observe(entry);
        }
        if (keyboard || ready) {
            ready = true;
            publish();
        } else {
            publish();
            timer = setTimeout(() => {
                ready = true;
                publish();
            }, LEGEND_TOOLTIP_OPEN_DELAY);
        }
    };
    return {
        attach(anchor: Entry['anchor'], label: TooltipLabel) {
            let entry = entries.get(anchor);
            if (entry) {
                Object.assign(entry, label);
                if (active === entry) {
                    observe(entry);
                    publish();
                }
                return;
            }
            entry = {...label, anchor, dispose: () => {}};
            const target = entry;
            const enter = () => activate(target, false);
            const focus = () => {
                if (hasKeyboardFocus(target)) activate(target, true);
            };
            const leave = () => {
                if (active === target) hide();
            };
            const blur = () => {
                if (!anchor.matches(':hover')) leave();
            };
            const keydown = (event: Event) => {
                if ((event as KeyboardEvent).key === 'Escape' && active === target) dismiss();
            };
            anchor.addEventListener('mouseenter', enter);
            anchor.addEventListener('mouseleave', leave);
            anchor.addEventListener('focus', focus);
            anchor.addEventListener('blur', blur);
            anchor.addEventListener('keydown', keydown);
            entry.dispose = () => {
                anchor.removeEventListener('mouseenter', enter);
                anchor.removeEventListener('mouseleave', leave);
                anchor.removeEventListener('focus', focus);
                anchor.removeEventListener('blur', blur);
                anchor.removeEventListener('keydown', keydown);
                anchor.removeAttribute('aria-describedby');
            };
            entries.set(anchor, entry);
            if (hasKeyboardFocus(entry)) activate(entry, true);
            else if (anchor.matches(':hover')) enter();
        },
        detach(anchor: Entry['anchor']) {
            if (active?.anchor === anchor) dismiss();
            entries.get(anchor)?.dispose();
            entries.delete(anchor);
        },
        sync() {
            for (const [anchor, entry] of entries) {
                if (!anchor.isConnected) {
                    entry.dispose();
                    entries.delete(anchor);
                }
            }
            if (active && !active.anchor.isConnected) dismiss();
        },
        destroy() {
            dismiss();
            entries.forEach((entry) => entry.dispose());
            entries.clear();
        },
    };
}

export type LegendTooltipController = ReturnType<typeof createLegendTooltipController>;
