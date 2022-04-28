import memoizeOne from "memoize-one";
import type { AnnotationTool } from "oxalis/constants";
import { AnnotationToolEnum } from "oxalis/constants";
import type { OxalisState } from "oxalis/store";
import {
  getActiveSegmentationTracing,
  getRenderableResolutionForSegmentationTracing,
  isVolumeAnnotationDisallowedForZoom,
} from "oxalis/model/accessors/volumetracing_accessor";
import { getVisibleSegmentationLayer } from "oxalis/model/accessors/dataset_accessor";
import { isMagRestrictionViolated } from "oxalis/model/accessors/flycam_accessor";

const zoomInToUseToolMessage = "Please zoom in further to use this tool.";

const isZoomStepTooHighFor = (state: OxalisState, tool: AnnotationTool) =>
  isVolumeAnnotationDisallowedForZoom(tool, state);

const getExplanationForDisabledVolume = (
  isSegmentationTracingVisible: boolean,
  isInMergerMode: boolean,
  isSegmentationTracingVisibleForMag: boolean,
  isZoomInvalidForTracing: boolean,
) => {
  if (!isSegmentationTracingVisible) {
    return "Volume annotation is disabled since no segmentation tracing layer is enabled. Enable it in the left settings sidebar.";
  }

  if (isZoomInvalidForTracing) {
    return "Volume annotation is disabled since the current zoom value is not in the required range. Please adjust the zoom level.";
  }

  if (isInMergerMode) {
    return "Volume annotation is disabled while the merger mode is active.";
  }

  if (!isSegmentationTracingVisibleForMag) {
    return "Volume annotation is disabled since no segmentation data can be shown at the current magnification. Please adjust the zoom level.";
  }

  return "Volume annotation is currently disabled.";
};

export function isVolumeDrawingTool(activeTool: AnnotationTool): boolean {
  return (
    activeTool === AnnotationToolEnum.TRACE ||
    activeTool === AnnotationToolEnum.BRUSH ||
    activeTool === AnnotationToolEnum.ERASE_TRACE ||
    activeTool === AnnotationToolEnum.ERASE_BRUSH
  );
}
export function isBrushTool(activeTool: AnnotationTool): boolean {
  return activeTool === AnnotationToolEnum.BRUSH || activeTool === AnnotationToolEnum.ERASE_BRUSH;
}
export function isTraceTool(activeTool: AnnotationTool): boolean {
  return activeTool === AnnotationToolEnum.TRACE || activeTool === AnnotationToolEnum.ERASE_TRACE;
}
const disabledSkeletonExplanation =
  "This annotation does not have a skeleton. Please convert it to a hybrid annotation.";

function _getDisabledInfoWhenVolumeIsDisabled(
  genericDisabledExplanation: string,
  hasSkeleton: boolean,
) {
  const disabledInfo = {
    isDisabled: true,
    explanation: genericDisabledExplanation,
  };
  const notDisabledInfo = {
    isDisabled: false,
    explanation: "",
  };
  return {
    [AnnotationToolEnum.MOVE]: notDisabledInfo,
    [AnnotationToolEnum.SKELETON]: {
      isDisabled: !hasSkeleton,
      explanation: disabledSkeletonExplanation,
    },
    [AnnotationToolEnum.BRUSH]: disabledInfo,
    [AnnotationToolEnum.ERASE_BRUSH]: disabledInfo,
    [AnnotationToolEnum.TRACE]: disabledInfo,
    [AnnotationToolEnum.ERASE_TRACE]: disabledInfo,
    [AnnotationToolEnum.FILL_CELL]: disabledInfo,
    [AnnotationToolEnum.PICK_CELL]: disabledInfo,
    [AnnotationToolEnum.BOUNDING_BOX]: notDisabledInfo,
  };
}

const getDisabledInfoWhenVolumeIsDisabled = memoizeOne(_getDisabledInfoWhenVolumeIsDisabled);

function _getDisabledInfoFromArgs(
  hasSkeleton: boolean,
  isZoomStepTooHighForBrushing: boolean,
  isZoomStepTooHighForTracing: boolean,
  isZoomStepTooHighForFilling: boolean,
  genericDisabledExplanation: string,
) {
  return {
    [AnnotationToolEnum.MOVE]: {
      isDisabled: false,
      explanation: "",
    },
    [AnnotationToolEnum.SKELETON]: {
      isDisabled: !hasSkeleton,
      explanation: disabledSkeletonExplanation,
    },
    [AnnotationToolEnum.BRUSH]: {
      isDisabled: isZoomStepTooHighForBrushing,
      explanation: zoomInToUseToolMessage,
    },
    [AnnotationToolEnum.ERASE_BRUSH]: {
      isDisabled: isZoomStepTooHighForBrushing,
      explanation: zoomInToUseToolMessage,
    },
    [AnnotationToolEnum.ERASE_TRACE]: {
      isDisabled: isZoomStepTooHighForTracing,
      explanation: zoomInToUseToolMessage,
    },
    [AnnotationToolEnum.TRACE]: {
      isDisabled: isZoomStepTooHighForTracing,
      explanation: zoomInToUseToolMessage,
    },
    [AnnotationToolEnum.FILL_CELL]: {
      isDisabled: isZoomStepTooHighForFilling,
      explanation: zoomInToUseToolMessage,
    },
    [AnnotationToolEnum.PICK_CELL]: {
      isDisabled: false,
      explanation: genericDisabledExplanation,
    },
    [AnnotationToolEnum.BOUNDING_BOX]: {
      isDisabled: false,
      explanation: disabledSkeletonExplanation,
    },
  };
}

const getDisabledInfoFromArgs = memoizeOne(_getDisabledInfoFromArgs);
export function getDisabledInfoForTools(state: OxalisState): Record<
  AnnotationTool,
  {
    isDisabled: boolean;
    explanation: string;
  }
> {
  const isInMergerMode = state.temporaryConfiguration.isMergerModeEnabled;
  const isZoomInvalidForTracing = isMagRestrictionViolated(state);
  const hasVolume = state.tracing.volumes.length > 0;
  const hasSkeleton = state.tracing.skeleton != null;
  const segmentationTracingLayer = getActiveSegmentationTracing(state);
  const maybeResolutionWithZoomStep = getRenderableResolutionForSegmentationTracing(
    state,
    segmentationTracingLayer,
  );
  const labeledResolution =
    maybeResolutionWithZoomStep != null ? maybeResolutionWithZoomStep.resolution : null;
  const isSegmentationTracingVisibleForMag = labeledResolution != null;
  const visibleSegmentationLayer = getVisibleSegmentationLayer(state);
  const isSegmentationTracingVisible =
    segmentationTracingLayer != null &&
    visibleSegmentationLayer != null &&
    visibleSegmentationLayer.name === segmentationTracingLayer.tracingId;
  const genericDisabledExplanation = getExplanationForDisabledVolume(
    isSegmentationTracingVisible,
    isInMergerMode,
    isSegmentationTracingVisibleForMag,
    isZoomInvalidForTracing,
  );

  if (
    !hasVolume ||
    !isSegmentationTracingVisible ||
    !isSegmentationTracingVisibleForMag ||
    isInMergerMode
  ) {
    // All segmentation-related tools are disabled.
    return getDisabledInfoWhenVolumeIsDisabled(genericDisabledExplanation, hasSkeleton);
  }

  const isZoomStepTooHighForBrushing = isZoomStepTooHighFor(state, AnnotationToolEnum.BRUSH);
  const isZoomStepTooHighForTracing = isZoomStepTooHighFor(state, AnnotationToolEnum.TRACE);
  const isZoomStepTooHighForFilling = isZoomStepTooHighFor(state, AnnotationToolEnum.FILL_CELL);
  return getDisabledInfoFromArgs(
    hasSkeleton,
    isZoomStepTooHighForBrushing,
    isZoomStepTooHighForTracing,
    isZoomStepTooHighForFilling,
    genericDisabledExplanation,
  );
}
export function adaptActiveToolToShortcuts(
  activeTool: AnnotationTool,
  isShiftPressed: boolean,
  isControlPressed: boolean,
  isAltPressed: boolean,
): AnnotationTool {
  if (!isShiftPressed && !isControlPressed && !isAltPressed) {
    // No modifier is pressed
    return activeTool;
  }

  if (
    activeTool === AnnotationToolEnum.MOVE ||
    activeTool === AnnotationToolEnum.ERASE_BRUSH ||
    activeTool === AnnotationToolEnum.ERASE_TRACE
  ) {
    // These tools do not have any modifier-related behavior currently (except for ALT
    // which is already handled below)
  } else {
    if (activeTool === AnnotationToolEnum.SKELETON) {
      // The "skeleton" tool is not changed right now (since actions such as moving a node
      // don't have a dedicated tool). The only exception is "Alt" which switches to the move tool.
      if (isAltPressed) {
        return AnnotationToolEnum.MOVE;
      }

      return activeTool;
    }

    if (isShiftPressed && !isControlPressed && !isAltPressed) {
      // Only shift is pressed. Switch to the picker
      return AnnotationToolEnum.PICK_CELL;
    }

    if (isControlPressed && isShiftPressed && !isAltPressed) {
      // Control and shift switch to the eraser
      if (activeTool === AnnotationToolEnum.BRUSH) {
        return AnnotationToolEnum.ERASE_BRUSH;
      } else if (activeTool === AnnotationToolEnum.TRACE) {
        return AnnotationToolEnum.ERASE_TRACE;
      }
    }
  }

  if (isAltPressed) {
    // Alt switches to the move tool
    return AnnotationToolEnum.MOVE;
  }

  return activeTool;
}