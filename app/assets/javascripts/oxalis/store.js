/**
 * store.js
 * @flow
 */

 /* eslint-disable no-useless-computed-key */

import { createStore, applyMiddleware } from "redux";
import createSagaMiddleware from "redux-saga";
import reduceReducers from "reduce-reducers";
import SettingsReducer from "oxalis/model/reducers/settings_reducer";
import SkeletonTracingReducer from "oxalis/model/reducers/skeletontracing_reducer";
import rootSaga from "oxalis/model/sagas/root_saga";
import type { RestrictionsType, BoundingBoxObjectType, SettingsType } from "oxalis/model";
import type { Vector3, Vector4 } from "oxalis/constants";
import type { ElementClassType } from "oxalis/model/binary/layers/layer";

export type CommentType = {
  node: number;
  comment: string;
};

export type EdgeType = {
  source: number,
  target: number,
};

export type NodeType = {
  position: Vector3,
  rotation: Vector3,
  bitdepth: number,
  radius: number,
  timestamp: number,
};


export type BranchPointType = {
  id: number;
  timestamp: number;
};

export type TreeType = {
  treeId: number;
  color: Vector4;
  name: string;
  timestamp: number;
  comments: Array<CommentType>;
  branchPoints: Array<BranchPointType>;
  edges: Array<EdgeType>;
  nodes: {[number]: NodeType};
};

export type SkeletonContentDataType = {
  activeNode: null | number;
  trees: Array<TreeType>;
  zoomLevel: number;
  customLayers: null;
};

export type VolumeContentDataType = {
  activeCell: null | number;
  customLayers: Array<Object>;
  maxCoordinates: BoundingBoxObjectType;
  customLayers: ?Array<Object>;
  name: string;
};

type DataLayerType = {
  name: string,
  category: "color" | "segmentation",
  maxCoordinates: {
    topLeft: Vector3,
    width: number,
    height: number,
    depth: number,
  },
  resolutions: Vector4,
  fallback: any,
  elementClass: ElementClassType,
  mappings:[],
}

export type DatasetType = {
 name: string,
 dataStore: {
  name: string,
  url: string,
  typ: string,
 },
 scale: Vector3,
 dataLayers: Array<DataLayerType>
}

export type SkeletonTracingType = {
  trees: {[number]: TreeType},
  name: string,
  activeTreeId: number,
  activeNodeId: number,
  restrictions: RestrictionsType & SettingsType,
}

export type DatasetConfigurationType = {
  datasetName: string,
  fourBit: boolean,
  interpolation: boolean,
  keyboardDelay: number,
  layers: {
    [name:string]: {
      color: Vector3,
      brightness: number,
      contrast: number
    }
  },
  quality: number
}

export type UserConfigurationType = {
  boundingBox: Array<number>,
  clippingDistance: number,
  clippingDistanceArbitrary: number,
  crosshairSize: number,
  displayCrosshair: boolean,
  dynamicSpaceDirection: boolean,
  firstVisToggle: boolean,
  inverseX: boolean,
  inverseY: boolean,
  isosurfaceBBsize: number,
  isosurfaceDisplay: boolean,
  isosurfaceResolution: number,
  keyboardDelay: number,
  mouseRotateValue: number,
  moveValue: number,
  moveValue3d: number,
  newNodeNewTree: boolean,
  overrideNodeRadius: boolean,
  particleSize: number,
  renderComments: boolean,
  radius: number,
  rotateValue: number,
  scale: number,
  scaleValue: number,
  segmentationOpacity: number,
  sortCommentsAsc: boolean,
  sortTreesByName: boolean,
  sphericalCapRadius: number,
  tdViewDisplayPlanes: boolean,
  zoom: number,
}

export type OxalisState = {
  datasetConfiguration: DatasetConfigurationType,
  userConfiguration: UserConfigurationType,
  dataset: ?DatasetType,
  skeletonTracing: SkeletonTracingType,
}


const defaultState: OxalisState = {
  datasetConfiguration: {
    datasetName: "",
    fourBit: true,
    interpolation: false,
    keyboardDelay: 342,
    layers: {},
    quality: 0,
  },
  userConfiguration: {
    boundingBox: [],
    clippingDistance: 50,
    clippingDistanceArbitrary: 64,
    crosshairSize: 0.1,
    displayCrosshair: true,
    dynamicSpaceDirection: true,
    firstVisToggle: false,
    inverseX: false,
    inverseY: false,
    isosurfaceBBsize: 1,
    isosurfaceDisplay: false,
    isosurfaceResolution: 80,
    keyboardDelay: 200,
    mouseRotateValue: 0.004,
    moveValue: 300,
    moveValue3d: 300,
    newNodeNewTree: false,
    overrideNodeRadius: true,
    particleSize: 5,
    radius: 5,
    renderComments: false,
    rotateValue: 0.01,
    scale: 1,
    scaleValue: 0.05,
    segmentationOpacity: 20,
    sortCommentsAsc: true,
    sortTreesByName: false,
    sphericalCapRadius: 140,
    tdViewDisplayPlanes: true,
    zoom: 1,
  },
  dataset: null,
  skeletonTracing: {
    trees: {
      [0]: {
        treeId: 0,
        name: "TestTree",
        nodes: {},
        timestamp: Date.now(),
        branchPoints: [],
        edges: [],
        comments: [],
      },
    },
    name: "",
    activeTreeId: 0,
    activeNodeId: 0,
    restrictions: {
      branchPointsAllowed: true,
      allowUpdate: true,
      allowFinish: true,
      allowAccess: true,
      allowDownload: true,
    },
  },
};

const sagaMiddleware = createSagaMiddleware();
const combinedReducers = reduceReducers(
  SettingsReducer,
  SkeletonTracingReducer,
);

const store = createStore(combinedReducers, defaultState, applyMiddleware(sagaMiddleware));
sagaMiddleware.run(rootSaga);

export default store;
