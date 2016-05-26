_                = require("lodash")
Backbone         = require("backbone")
DashboardTaskModel        = require("./task_model")
SortedCollection = require("admin/models/sorted_collection")

class UserTasksCollection extends SortedCollection

  model : DashboardTaskModel
  url : ->

    if userID = @get("userID")
      return "/api/users/#{userID}/tasks"
    else
      return "/api/user/tasks"


  newTaskUrl : "/user/tasks/request"
  defaults :
      showFinishedTasks : false


  unfinishedTasksFilter : (task) ->

    return !task.get("annotation.state.isFinished")


  getNewTask : ->

    newTask = new DashboardTaskModel()

    return newTask.fetch(
      url : @newTaskUrl
      success :  =>
        @add(newTask)
    )


module.exports = UserTasksCollection
