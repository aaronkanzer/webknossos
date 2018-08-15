// @flow
/* eslint-disable jsx-a11y/href-no-hash, react/prefer-stateless-function, react/no-unused-state */

import * as React from "react";
import { stringToColor, formatTuple } from "libs/format_utils";
import * as Utils from "libs/utils";
import { Table, Icon, Tag } from "antd";
import DatasetActionView from "dashboard/advanced_dataset/dataset_action_view";
import DatasetAccessListView from "dashboard/advanced_dataset/dataset_access_list_view";
import type { APITeamType, APIDatasetType } from "admin/api_flow_types";
import dice from "dice-coefficient";
import _ from "lodash";
import FormattedDate from "components/formatted_date";

const { Column } = Table;

const typeHint: APIDatasetType[] = [];
const useLruRank = false;

type Props = {
  datasets: Array<APIDatasetType>,
  searchQuery: string,
  isUserAdmin: boolean,
};

type State = {
  prevSearchQuery: string,
  sortedInfo: Object,
};

class AdvancedDatasetView extends React.PureComponent<Props, State> {
  static getDerivedStateFromProps(nextProps: Props, prevState: State): $Shape<State> {
    const maybeSortedInfo =
      // Clear the sorting exactly when the search box is initially filled
      // (searchQuery changes from empty string to non-empty string)
      nextProps.searchQuery !== "" && prevState.prevSearchQuery === ""
        ? {
            sortedInfo: { columnKey: null, order: "ascend" },
          }
        : {};

    return {
      prevSearchQuery: nextProps.searchQuery,
      ...maybeSortedInfo,
    };
  }

  constructor() {
    super();
    this.state = {
      sortedInfo: {
        columnKey: useLruRank ? "" : "created",
        order: "descend",
      },
      prevSearchQuery: "",
    };
  }

  handleChange = (pagination: Object, filters: Object, sorter: Object) => {
    this.setState({
      sortedInfo: sorter,
    });
  };

  render() {
    const { isUserAdmin } = this.props;
    const isImported = dataset => dataset.dataSource.dataLayers != null;
    const filteredDataSource = Utils.filterWithSearchQueryOR(
      isUserAdmin ? this.props.datasets : this.props.datasets.filter(isImported),
      ["name", "description"],
      this.props.searchQuery,
    );

    const { sortedInfo } = this.state;
    const dataSourceSortedByRank = useLruRank
      ? _.sortBy(filteredDataSource, ["lastUsedByUser", "created"]).reverse()
      : filteredDataSource;

    // Create a map from dataset to its rank
    const datasetToRankMap: Map<APIDatasetType, number> = new Map(
      dataSourceSortedByRank.map((dataset, rank) => [dataset, rank]),
    );

    const sortedDataSource =
      // Sort using the dice coefficient if the table is not sorted otherwise
      // and if the query is longer then 3 characters to avoid sorting *all* datasets
      this.props.searchQuery.length > 3 && sortedInfo.columnKey == null
        ? _.chain(filteredDataSource)
            .map(dataset => {
              const diceCoefficient = dice(dataset.name, this.props.searchQuery);
              const rank = useLruRank ? datasetToRankMap.get(dataset) || 0 : 0;
              const rankCoefficient = 1 - rank / filteredDataSource.length;
              const coefficient = (diceCoefficient + rankCoefficient) / 2;
              return {
                dataset,
                coefficient,
              };
            })
            .sortBy("coefficient")
            .map(({ dataset }) => dataset)
            .reverse()
            .value()
        : dataSourceSortedByRank;

    return (
      <div className="TestAdvancedDatasetView">
        <Table
          dataSource={sortedDataSource}
          rowKey="name"
          pagination={{
            defaultPageSize: 50,
          }}
          expandedRowRender={
            isUserAdmin ? dataset => <DatasetAccessListView dataset={dataset} /> : null
          }
          onChange={this.handleChange}
        >
          <Column
            title="Name"
            dataIndex="name"
            key="name"
            sorter={Utils.localeCompareBy(typeHint, dataset => dataset.name)}
            sortOrder={sortedInfo.columnKey === "name" && sortedInfo.order}
            render={(name: string, dataset: APIDatasetType) => (
              <div>
                {dataset.name}
                <br />
                <Tag color={stringToColor(dataset.dataStore.name)}>{dataset.dataStore.name}</Tag>
              </div>
            )}
          />
          <Column
            width={150}
            title="Creation Date"
            dataIndex="created"
            key="created"
            sorter={Utils.compareBy(typeHint, dataset => dataset.created)}
            sortOrder={sortedInfo.columnKey === "created" && sortedInfo.order}
            render={created => <FormattedDate timestamp={created} />}
          />
          <Column
            title="Scale"
            dataIndex="scale"
            key="scale"
            width={120}
            render={(__, dataset: APIDatasetType) => formatTuple(dataset.dataSource.scale)}
          />

          <Column
            title="Allowed Teams"
            dataIndex="allowedTeams"
            key="allowedTeams"
            width={150}
            render={(teams: Array<APITeamType>, dataset: APIDatasetType) =>
              teams.map(team => (
                <Tag
                  color={stringToColor(team.name)}
                  key={`allowed_teams_${dataset.name}_${team.name}`}
                >
                  {team.name}
                </Tag>
              ))
            }
          />
          <Column
            title="Active"
            dataIndex="isActive"
            key="isActive"
            width={100}
            sorter={(a, b) => a.isActive - b.isActive}
            sortOrder={sortedInfo.columnKey === "isActive" && sortedInfo.order}
            render={(isActive: boolean) => {
              const icon = isActive ? "check-circle-o" : "close-circle-o";
              return <Icon type={icon} style={{ fontSize: 20 }} />;
            }}
          />
          <Column
            title="Public"
            dataIndex="isPublic"
            key="isPublic"
            width={100}
            sorter={(a, b) => a.isPublic - b.isPublic}
            sortOrder={sortedInfo.columnKey === "isPublic" && sortedInfo.order}
            render={(isPublic: boolean) => {
              const icon = isPublic ? "check-circle-o" : "close-circle-o";
              return <Icon type={icon} style={{ fontSize: 20 }} />;
            }}
          />
          <Column
            title="Data Layers"
            dataIndex="dataSource.dataLayers"
            render={(__, dataset: APIDatasetType) =>
              (dataset.dataSource.dataLayers || []).map(layer => (
                <Tag key={layer.name}>
                  {layer.category} - {layer.elementClass}
                </Tag>
              ))
            }
          />

          <Column
            width={200}
            title="Actions"
            key="actions"
            render={(__, dataset: APIDatasetType) => (
              <DatasetActionView isUserAdmin={isUserAdmin} dataset={dataset} />
            )}
          />
        </Table>
      </div>
    );
  }
}

export default AdvancedDatasetView;
