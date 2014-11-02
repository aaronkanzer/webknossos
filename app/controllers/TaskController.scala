package controllers

import com.scalableminds.util.geometry.{BoundingBox, Point3D}
import controllers.admin.TaskAdministration._
import models.binary.DataSetDAO
import play.api.data.Forms._
import play.api.libs.json.Json._
import play.api.libs.json._
import oxalis.security.Secured
import play.api.Logger
import models.user._
import models.task._
import models.annotation._
import views._
import play.api.libs.concurrent._
import play.api.libs.concurrent.Execution.Implicits._
import play.api.i18n.Messages
import models.annotation.AnnotationService
import play.api.Play.current
import com.scalableminds.util.tools.Fox
import net.liftweb.common.{Full, Failure}
import com.scalableminds.util.reactivemongo.DBAccessContext
import scala.concurrent.Future
import play.api.templates.Html
import play.api.libs.functional.syntax._

object TaskController extends Controller with Secured {

  val MAX_OPEN_TASKS = current.configuration.getInt("oxalis.tasks.maxOpenPerUser") getOrElse 5

  val taskJsonReads =
    ((__ \ 'dataSet).read[String] and
      (__ \ 'taskType).read[String] and
      (__ \ 'start).read[Point3D] and
      (__ \ 'experience).read[Experience] and
      (__ \ 'priority).read[Int] and
      (__ \ 'taskInstances).read[Int] and
      (__ \ 'team).read[String] and
      (__ \ 'project).read[String] and
      (__ \ 'boundingBox).read[BoundingBox]).tupled

  def empty = Authenticated{ implicit request =>
    Ok(views.html.main()(Html.empty))
  }

  def read(taskId: String) = Authenticated.async{ implicit request =>
    for{
      task <- TaskDAO.findOneById(taskId) ?~> Messages("task.notFound")
      js <- Task.transformToJson(task)
    } yield {
      Ok(js)
    }
  }

  def create() = Authenticated.async(parse.json){ implicit request =>
    "something" match {
      case x =>
        request.body.validate(taskJsonReads) match {
          case JsSuccess((dataSetName, taskTypeId, start, experience, priority, instances, team, projectName, boundingBox), _) =>
            for {
              dataSet <- DataSetDAO.findOneBySourceName(dataSetName) ?~> Messages("dataSet.notFound")
              taskType <- TaskTypeDAO.findOneById(taskTypeId) ?~> Messages("taskType.notFound")
              project <- ProjectService.findIfNotEmpty(projectName) ?~> Messages("project.notFound")
              _ <- ensureTeamAdministration(request.user, team).toFox
              task = Task(taskType._id, team, experience, priority, instances, _project = project.map(_.name))
              _ <- TaskDAO.insert(task)
            } yield {
              AnnotationService.createAnnotationBase(task, request.user._id, boundingBox, taskType.settings, dataSetName, start)
              Redirect(controllers.routes.TaskController.empty)
                .flashing(
                  FlashSuccess(Messages("task.createSuccess")))
                .highlighting(task.id)
            }
        }

    }
  }

  def list = Authenticated.async{ implicit request =>
    for {
      tasks <- TaskService.findAllAdministratable(request.user)
      js <- Future.traverse(tasks)(Task.transformToJson)
    } yield {
      Ok(Json.toJson(js))
    }
  }

  def listTasksForType(taskTypeId: String) = Authenticated.async { implicit request =>
    for {
      tasks <- TaskService.findAllByTaskType(taskTypeId)
      js <- Future.traverse(tasks)(Task.transformToJson)
    } yield {
      Ok(Json.toJson(js))
    }
  }

  def delete(taskId: String) = Authenticated.async { implicit request =>
    for {
      task <- TaskDAO.findOneById(taskId) ?~> Messages("task.notFound")
      _ <- TaskService.remove(task._id)
    } yield {
      JsonOk(Messages("task.removed"))
    }
  }

  def ensureMaxNumberOfOpenTasks(user: User)(implicit ctx: DBAccessContext): Fox[Int] = {
    AnnotationService.countOpenTasks(user).flatMap{ numberOfOpen => Future.successful(
      if (numberOfOpen < MAX_OPEN_TASKS)
        Full(numberOfOpen)
      else
        Failure(Messages("task.tooManyOpenOnes"))
    )}
  }

  def requestTaskFor(user: User)(implicit ctx: DBAccessContext) =
    TaskService.nextTaskForUser(user)

  def request = Authenticated.async { implicit request =>
    val user = request.user
    for {
      _ <- ensureMaxNumberOfOpenTasks(user)
      task <- requestTaskFor(user) ?~> Messages("task.unavailable")
      annotation <- AnnotationService.createAnnotationFor(user, task) ?~> Messages("annotation.creationFailed")
      annotationJSON <- AnnotationLike.annotationLikeInfoWrites(annotation, Some(user), List("content", "actions"))
    } yield {
      JsonOk(annotationJSON)
    }
  }
}
