// @flow
/* eslint-disable react/no-unused-prop-types */
import _ from "lodash";
import React from "react";
import { Router, Route, Switch, createBrowserHistory } from "react-router-dom";
import { connect } from "react-redux";
import { Layout, LocaleProvider } from "antd";
import enUS from "antd/lib/locale-provider/en_US";

import { SkeletonTracingTypeTracingEnum } from "oxalis/store";
import { ControlModeEnum } from "oxalis/constants";
import Navbar from "navbar";
import BackboneWrapper from "libs/backbone_wrapper";

import TracingLayoutView from "oxalis/view/tracing_layout_view";
import DashboardView from "dashboard/views/dashboard_view";
import SpotlightView from "dashboard/views/spotlight_view";
import LoginView from "admin/views/auth/login_view";
import RegistrationView from "admin/views/auth/registration_view";
import StartResetPasswordView from "admin/views/auth/start_reset_password_view";
import FinishResetPasswordView from "admin/views/auth/finish_reset_password_view";
import ChangePasswordView from "admin/views/auth/change_password_view";
import DatasetImportView from "dashboard/views/dataset/dataset_import_view";

// admin
import KeyboardShortcutView from "admin/views/help/keyboardshortcut_view";
import PaginationView from "admin/views/pagination_view";
import DatasetAddView from "admin/views/dataset/dataset_add_view";
import UserListView from "admin/views/user/user_list_view";
import TeamListView from "admin/views/team/team_list_view";
import TaskListView from "admin/views/task/task_list_view";
import TaskTypeListView from "admin/views/tasktype/task_type_list_view";
import ProjectListView from "admin/views/project/project_list_view";
import StatisticView from "admin/views/statistic/statistic_view";
import WorkloadListView from "admin/views/workload/workload_list_view";
import WorkloadCollection from "admin/models/workload/workload_collection";
import ScriptListView from "admin/views/scripts/script_list_view";
import ProjectCreateView from "admin/views/project/project_create_view";
import ProjectEditView from "admin/views/project/project_edit_view";
import ProjectModel from "admin/models/project/project_model";
import TaskModel from "admin/models/task/task_model";
import TaskCreateView from "admin/views/task/task_create_view";
import TaskCreateFromView from "admin/views/task/task_create_subviews/task_create_from_view";
import TaskTypeModel from "admin/models/tasktype/task_type_model";
import TaskTypeCreateView from "admin/views/tasktype/task_type_create_view";
import ScriptCreateView from "admin/views/scripts/script_create_view";
import ScriptModel from "admin/models/scripts/script_model";
import TaskOverviewView from "admin/views/task/task_overview_view";
import TaskOverviewCollection from "admin/models/task/task_overview_collection";
import PaginationCollection from "admin/models/pagination_collection";

import type { OxalisState, SkeletonTracingTypeTracingType } from "oxalis/store";

const { Content } = Layout;

type ReactRouterLocationType = {
  key: string,
  pathname: string,
  search: string,
  hash: string,
  state: Object,
};

export type ReactRouterHistoryType = {
  length: number,
  action: string,
  location: ReactRouterLocationType,
  pathname: string,
  search: string,
  hash: string,
  state: string,
  push: (string, ?Object) => void,
  replace: (string, ?Object) => void,
  go: number => void,
  goBack: () => void,
  goForward: () => void,
  block: Function => ?string | null,
};

type ReactRouterArgumentsType = {
  location: ReactRouterLocationType,
  match: {
    params: { [string]: string },
    isExact: boolean,
    path: string,
    url: string,
  },
  history: ReactRouterHistoryType,
};

const browserHistory = createBrowserHistory();
browserHistory.listen(location => {
  if (typeof window.ga !== "undefined" && window.ga !== null) {
    window.ga("send", "pageview", location.pathname);
  }
});

const SecuredRoute = ({ component: Component, render, isAuthenticated, ...rest }: Object) => (
  <Route
    {...rest}
    render={props => {
      if (isAuthenticated) {
        return Component ? <Component {...props} /> : render(props);
      } else {
        return <LoginView />;
      }
    }}
  />
);

class ReactRouter extends React.Component<*> {
  showWithPagination = (
    history: ReactRouterHistoryType,
    View: any,
    Collection: any,
    options: Object = {},
  ) => {
    _.defaults(options, { addButtonText: null });

    const collection = new Collection(null, options);
    const paginatedCollection = new PaginationCollection([], { fullCollection: collection });
    const view = new View({ collection: paginatedCollection });
    const paginationView = new PaginationView({
      collection: paginatedCollection,
      addButtonText: options.addButtonText,
    });

    return (
      <div>
        <BackboneWrapper history={history} backboneView={paginationView} />
        <BackboneWrapper history={history} backboneView={view} />
      </div>
    );
  };

  projectEdit = ({ match, history }: ReactRouterArgumentsType) => {
    const model = new ProjectModel({ name: match.params.projectName });
    const view = new ProjectEditView({ model });

    return <BackboneWrapper history={history} backboneView={view} />;
  };

  taskTypesCreate = ({ match, history }: ReactRouterArgumentsType) => {
    const model = new TaskTypeModel({ id: match.params.taskTypeId });
    const view = new TaskTypeCreateView({ model });

    return <BackboneWrapper history={history} backboneView={view} />;
  };

  workload = ({ history }: ReactRouterArgumentsType) =>
    this.showWithPagination(history, WorkloadListView, WorkloadCollection);

  taskEdit = ({ match, history }: ReactRouterArgumentsType) => {
    const model = new TaskModel({ id: match.params.taskId });
    const view = new TaskCreateFromView({ model, type: "from_form" });

    return <BackboneWrapper history={history} backboneView={view} />;
  };

  datasetAdd = ({ history }: ReactRouterArgumentsType) => {
    const view = new DatasetAddView();

    return <BackboneWrapper history={history} backboneView={view} />;
  };

  taskCreate = ({ history }: ReactRouterArgumentsType) => {
    const model = new TaskModel();
    const view = new TaskCreateView({ model });

    return <BackboneWrapper history={history} backboneView={view} />;
  };

  taskOverview = ({ history }: ReactRouterArgumentsType) => {
    const collection = new TaskOverviewCollection();
    const view = new TaskOverviewView({ collection });

    return <BackboneWrapper history={history} backboneView={view} />;
  };

  projectCreate = ({ history }: ReactRouterArgumentsType) => {
    const model = new ProjectModel();
    const view = new ProjectCreateView({ model });

    return <BackboneWrapper history={history} backboneView={view} foo="kevin" />;
  };

  scriptsCreate = ({ match, history }: ReactRouterArgumentsType) => {
    const model = new ScriptModel({ id: match.params.id });
    const view = new ScriptCreateView({ model });
    return <BackboneWrapper history={history} backboneView={view} />;
  };

  tracingView = ({ match }: ReactRouterArgumentsType) => {
    const tracingType = match.params.type;
    if (Object.keys(SkeletonTracingTypeTracingEnum).includes(tracingType)) {
      const saveTracingType = ((tracingType: any): SkeletonTracingTypeTracingType);
      return (
        <TracingLayoutView
          initialTracingType={saveTracingType}
          initialTracingId={match.params.id}
          initialControlmode={ControlModeEnum.TRACE}
        />
      );
    } else {
      return null;
    }
  };

  tracingViewPublic = ({ match }: ReactRouterArgumentsType) => (
    <TracingLayoutView
      initialTracingType={SkeletonTracingTypeTracingEnum.View}
      initialTracingId={match.params.id}
      initialControlmode={ControlModeEnum.VIEW}
    />
  );

  render() {
    const isAuthenticated = this.props.activeUser !== null;

    return (
      <Router history={browserHistory}>
        <LocaleProvider locale={enUS}>
          <Layout>
            <Navbar isAuthenticated={isAuthenticated} />
            <Content style={{ marginTop: 48 }}>
              <Switch>
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  exact
                  path="/"
                  render={() => <DashboardView userId={null} isAdminView={false} />}
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/dashboard"
                  render={() => <DashboardView userId={null} isAdminView={false} />}
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/users/:userId/details"
                  render={({ match }: ReactRouterArgumentsType) => (
                    <DashboardView
                      userId={match.params.userId}
                      isAdminView={match.params.userId !== null}
                    />
                  )}
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/users"
                  component={UserListView}
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/teams"
                  component={TeamListView}
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/statistics"
                  component={StatisticView}
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/tasks"
                  component={TaskListView}
                  exact
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/tasks/create"
                  render={this.taskCreate}
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/tasks/overview"
                  render={this.taskOverview}
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/tasks/:taskId/edit"
                  render={this.taskEdit}
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/projects"
                  component={ProjectListView}
                  exact
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/projects/create"
                  render={this.projectCreate}
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/projects/:projectName/tasks"
                  render={({ match }: ReactRouterArgumentsType) => (
                    <TaskListView initialFieldValues={{ projectName: match.params.projectName }} />
                  )}
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/projects/:id/edit"
                  render={this.projectEdit}
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/annotations/:type/:id"
                  render={this.tracingView}
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/annotations/:type/:id/readOnly)"
                  render={this.tracingView}
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/datasets/upload"
                  render={this.datasetAdd}
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/datasets/:datasetName/import"
                  component={DatasetImportView}
                  render={({ match }: ReactRouterArgumentsType) => (
                    <DatasetImportView
                      isEditingMode={false}
                      datasetName={match.params.datasetName}
                    />
                  )}
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/datasets/:datasetName/edit"
                  render={({ match }: ReactRouterArgumentsType) => (
                    <DatasetImportView isEditingMode datasetName={match.params.datasetName} />
                  )}
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/taskTypes"
                  component={TaskTypeListView}
                  exact
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/taskTypes/create"
                  render={this.taskTypesCreate}
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/taskTypes/:taskTypeId/edit"
                  render={this.taskTypesCreate}
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/taskTypes/:taskTypeId/tasks"
                  render={({ match }: ReactRouterArgumentsType) => (
                    <TaskListView initialFieldValues={{ taskTypeId: match.params.taskTypeId }} />
                  )}
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/scripts/create"
                  render={this.scriptsCreate}
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/scripts/:id/edit"
                  render={this.scriptsCreate}
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/scripts"
                  component={ScriptListView}
                  exact
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/workload"
                  render={this.workload}
                />
                <SecuredRoute
                  isAuthenticated={isAuthenticated}
                  path="/help/keyboardshortcuts"
                  component={KeyboardShortcutView}
                />
                <Route path="/login" render={() => <LoginView layout="horizontal" />} />
                <Route path="/register" component={RegistrationView} />
                <Route path="/reset" component={StartResetPasswordView} />
                <Route path="/finishreset" component={FinishResetPasswordView} />
                <Route path="/changepassword" component={ChangePasswordView} />
                <Route path="/spotlight" component={SpotlightView} />
                <Route path="/datasets/:id/view" render={this.tracingViewPublic} />
              </Switch>
            </Content>
          </Layout>
        </LocaleProvider>
      </Router>
    );
  }
}

const mapStateToProps = (state: OxalisState) => ({
  activeUser: state.activeUser,
});

export default connect(mapStateToProps)(ReactRouter);
