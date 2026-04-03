import type {ChartAnnotationLabel, ChartAnnotationPopup} from '../../types';
import {annotationLabelDefaults, annotationPopupDefaults} from '../constants';
import {getTextSizeFn} from '../utils';

import type {PreparedAnnotation} from './types';

function resolvePadding(padding?: number | [number, number]): [number, number] {
    if (padding === undefined) {
        return annotationPopupDefaults.padding;
    }

    if (typeof padding === 'number') {
        return [padding, padding];
    }

    return padding;
}

type AnnotationOptionsLabel = Omit<ChartAnnotationLabel, 'text'> | undefined;

export async function prepareAnnotation(args: {
    annotation: {label: ChartAnnotationLabel; popup?: ChartAnnotationPopup};
    optionsLabel?: AnnotationOptionsLabel;
    optionsPopup?: ChartAnnotationPopup;
}): Promise<PreparedAnnotation> {
    const {annotation, optionsLabel, optionsPopup} = args;

    const style = {
        ...annotationLabelDefaults.style,
        ...optionsLabel?.style,
        ...annotation.label.style,
    };
    const getTextSize = getTextSizeFn({style});
    const textSize = await getTextSize(annotation.label.text);

    return {
        label: {
            style,
            text: annotation.label.text,
            size: {height: textSize.height, width: textSize.width},
        },
        popup: {
            backgroundColor:
                annotation.popup?.backgroundColor ??
                optionsPopup?.backgroundColor ??
                annotationPopupDefaults.backgroundColor,
            borderRadius:
                annotation.popup?.borderRadius ??
                optionsPopup?.borderRadius ??
                annotationPopupDefaults.borderRadius,
            offset:
                annotation.popup?.offset ?? optionsPopup?.offset ?? annotationPopupDefaults.offset,
            padding: resolvePadding(annotation.popup?.padding ?? optionsPopup?.padding),
        },
    };
}
