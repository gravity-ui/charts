import type {BaseTextStyle} from '../../types';

export const annotationLabelDefaults = {
    style: {
        fontSize: '13px',
        fontColor: 'var(--g-color-text-light-primary)',
    } satisfies BaseTextStyle,
};

export const annotationPopupDefaults = {
    backgroundColor: 'var(--g-color-base-float-heavy)',
    borderRadius: 4,
    offset: 5,
    padding: [4, 8] as [number, number],
};
