package controllers

import javax.inject.Inject

import models.analytics.{AnalyticsDAO, AnalyticsEntry}
import oxalis.security.Secured
import play.api._
import play.api.i18n.MessagesApi
import play.api.libs.json.Json
import play.api.mvc.Action
import play.api.routing.JavaScriptReverseRouter
import play.twirl.api.Html

class Application @Inject()(val messagesApi: MessagesApi) extends Controller with Secured {

  def index() = UserAwareAction { implicit request =>
    request.userOpt match {
      case Some(user) if user.isAnonymous =>
        Redirect("/info")
      case Some(user) =>
        Redirect("/dashboard")
      case _ =>
        Redirect("/spotlight")
    }
  }

  def info() = UserAwareAction { implicit request =>
    Ok(views.html.info())
  }

  def thankyou() = UserAwareAction { implicit request =>
    Ok(views.html.thankyou())
  }

  def emptyMain = Authenticated { implicit request =>
    Ok(views.html.main()(Html("")))
  }

  def impressum = UserAwareAction { implicit request =>
    Ok(views.html.impressum())
  }

  def buildInfo = UserAwareAction { implicit request =>
    Ok(Json.obj(
      "webknossos" -> webknossos.BuildInfo.toMap.mapValues(_.toString),
      "braingames-libs" -> braingameslibs.BuildInfo.toMap.mapValues(_.toString),
      "webknossos-wrap" -> webknossoswrap.BuildInfo.toMap.mapValues(_.toString)
    ))
  }

  def analytics(namespace: String) = UserAwareAction(parse.json(1024 * 1024)) { implicit request =>
    AnalyticsDAO.insert(
      AnalyticsEntry(
        request.userOpt.map(_._id),
        namespace,
        request.body))
    Ok
  }
}
