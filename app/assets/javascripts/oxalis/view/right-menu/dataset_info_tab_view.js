/**
 * dataset_info_view.js
 * @flow
 */
import React, { Component } from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { Input, Icon } from "antd";
import { getBaseVoxel } from "oxalis/model/scaleinfo";
import constants, { ControlModeEnum } from "oxalis/constants";
import { getPlaneScalingFactor } from "oxalis/model/accessors/flycam_accessor";
import Store from "oxalis/store";
import TemplateHelpers from "libs/template_helpers";
import { setTracingNameAction } from "oxalis/model/actions/annotation_actions";
import type { OxalisState, TracingType, DatasetType, FlycamType, TaskType } from "oxalis/store";

type DatasetInfoTabProps = {
  tracing: TracingType,
  dataset: DatasetType,
  flycam: FlycamType,
  task: ?TaskType,
  setTracingName: string => void,
};

class DatasetInfoTabView extends Component {
  props: DatasetInfoTabProps;

  state: {
    isEditingName: boolean,
    tracingName: string,
  } = {
    isEditingName: false,
    tracingName: "",
  };

  propsWillChange(newProps) {
    this.setState({ tracingName: newProps.tracing.name });
  }

  calculateZoomLevel(): number {
    let width;
    let zoom;
    const viewMode = Store.getState().temporaryConfiguration.viewMode;
    if (constants.MODES_PLANE.includes(viewMode)) {
      zoom = getPlaneScalingFactor(this.props.flycam);
      width = constants.PLANE_WIDTH;
    } else if (constants.MODES_ARBITRARY.includes(viewMode)) {
      zoom = this.props.flycam.zoomStep;
      width = constants.ARBITRARY_WIDTH;
    } else {
      throw Error(`Model mode not recognized: ${viewMode}`);
    }
    // unit is nm
    const baseVoxel = getBaseVoxel(this.props.dataset.scale);
    return zoom * width * baseVoxel;
  }

  chooseUnit(zoomLevel: number): string {
    if (zoomLevel < 1000) {
      return `${zoomLevel.toFixed(0)} nm`;
    } else if (zoomLevel < 1000000) {
      return `${(zoomLevel / 1000).toFixed(1)} μm`;
    } else {
      return `${(zoomLevel / 1000000).toFixed(1)} mm`;
    }
  }

  handleTracingNameChange = (event: SyntheticInputEvent) => {
    this.setState({ tracingName: event.target.value });
  };

  setTracingName = () => {
    this.props.setTracingName(this.state.tracingName);
  };

  render() {
    const { tracingType } = this.props.tracing;
    let annotationTypeLabel;

    if (this.props.task != null) {
      // In case we have a task display its id as well
      annotationTypeLabel = (
        <span>
          {tracingType} : {this.props.task.id}
        </span>
      );
    } else if (this.state.isEditingName) {
      // Or display an explorative tracings name
      annotationTypeLabel = (
        <span>
          {tracingType} :
          <Input
            value={this.state.tracingName}
            onChange={this.handleTracingNameChange}
            onPressEnter={this.setTracingName}
            style={{ width: "70%", margin: "0 10px" }}
            size="small"
          />{" "}
          <Icon type="check" onClick={this.setTracingName} />
        </span>
      );
    } else {
      annotationTypeLabel = (
        <span>
          {tracingType} : {this.state.tracingName}
          <Icon type="edit" onClick={() => this.setState({ isEditingName: true })} />
        </span>
      );
    }

    const zoomLevel = this.calculateZoomLevel();
    const dataSetName = this.props.dataset.name;
    const isPublicViewMode =
      Store.getState().temporaryConfiguration.controlMode === ControlModeEnum.VIEW;

    return (
      <div className="flex-overflow">
        <p>
          {annotationTypeLabel}
        </p>
        <p>
          DataSet: {dataSetName}
        </p>
        <p>
          Viewport width: {this.chooseUnit(zoomLevel)}
        </p>
        <p>
          Dataset resolution: {TemplateHelpers.formatScale(this.props.dataset.scale)}
        </p>
        {this.props.tracing.type === "skeleton"
          ? <p>
              Total number of trees: {_.size(this.props.tracing.trees)}
            </p>
          : null}
        {isPublicViewMode
          ? <div>
              <table className="table table-condensed table-nohead table-bordered">
                <tbody>
                  <tr>
                    <th colSpan="2">Controls</th>
                  </tr>
                  <tr>
                    <td>I,O or Alt + Mousewheel</td>
                    <td>Zoom in/out</td>
                  </tr>
                  <tr>
                    <td>Mousewheel or D and F</td>
                    <td>Move along 3rd axis</td>
                  </tr>
                  <tr>
                    <td>Left Mouse drag or Arrow keys</td>
                    <td>Move</td>
                  </tr>
                  <tr>
                    <td>Right click drag in 3D View</td>
                    <td>Rotate 3D View</td>
                  </tr>
                  <tr>
                    <td>K,L</td>
                    <td>Scale up/down viewports</td>
                  </tr>
                </tbody>
              </table>
              <div>
                <img
                  className="img-50"
                  src="/assets/images/Max-Planck-Gesellschaft.svg"
                  alt="Max Plank Geselleschaft Logo"
                />
                <img
                  className="img-50"
                  src="/assets/images/MPI-brain-research.svg"
                  alt="Max Plank Institute of Brain Research Logo"
                />
              </div>
            </div>
          : null}
      </div>
    );
  }
}

const mapStateToProps = (state: OxalisState): DatasetInfoTabProps => ({
  tracing: state.tracing,
  dataset: state.dataset,
  flycam: state.flycam,
  task: state.task,
});

const mapDispatchToProps = (dispatch: Dispatch<*>) => ({
  setTracingName(tracingName: string) {
    dispatch(setTracingNameAction(tracingName));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(DatasetInfoTabView);
