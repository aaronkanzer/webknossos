package brainflight.io

import java.io.File
import name.pachler.nio.file.Path
import name.pachler.nio.file.impl.PathImpl
import brainflight.tools.geometry.Point3D
import play.api.Logger
import braingames.util.ExtendedTypes.ExtendedString
import models.binary.DataSet
import models.binary.ColorLayer
import models.binary.DataLayer

class DataSetChangeHandler extends DirectoryChangeHandler {
  def onStart(path: Path) {
    val file = path.asInstanceOf[PathImpl].getFile
    val files = file.listFiles()
    Logger.trace(s"DataSetChangeHandler.onStart: files: ${files.mkString(", ")}")
    if (files != null) {
      val foundDataSets = files.filter(_.isDirectory).flatMap { f =>
        dataSetFromFile(f).map { dataSet =>
          DataSet.updateOrCreate(dataSet)
          dataSet.name
        }
      }
      Logger.info(s"Found datasets: ${foundDataSets.mkString(",")}")
      DataSet.deleteAllExcept(foundDataSets)
    }
  }

  def onTick(path: Path) {
    onStart(path)
  }

  def onCreate(path: Path) {
    val file = path.asInstanceOf[PathImpl].getFile
    dataSetFromFile(file).map { dataSet =>
      DataSet.updateOrCreate(dataSet)
    }
  }

  def onDelete(path: Path) {
    val file = path.asInstanceOf[PathImpl].getFile
    dataSetFromFile(file).map { dataSet =>
      DataSet.removeByName(dataSet.name)
    }
  }

  def listDirectories(f: File) = {
    f.listFiles().filter(_.isDirectory())
  }

  def highestResolutionDir(l: Array[File]) = {
    if (l.isEmpty)
      None
    else
      Some(l.minBy(f => f.getName.toIntOpt.getOrElse(Int.MaxValue)))
  }

  def maxValueFromFiles(l: Array[File]): Option[Int] = {
    val numbers = l.flatMap { f =>
      if (f.getName.size > 1)
        f.getName.substring(1).toIntOpt
      else
        None
    }
    if (numbers.isEmpty)
      None
    else {
      Some(numbers.max)
    }
  }

  def dataSetFromFile(f: File): Option[DataSet] = {
    if (f.isDirectory) {
      Logger.trace(s"dataSetFromFile: $f")

      for {
        colorLayer <- listDirectories(f).find(dir => dir.getName == ColorLayer.identifier)
        resolutionDirectories = listDirectories(colorLayer)
        resolutions = resolutionDirectories.flatMap(_.getName.toIntOpt).toList
        res <- highestResolutionDir(resolutionDirectories)
        xs <- listDirectories(res).headOption
        ys <- listDirectories(xs).headOption
        xMax <- maxValueFromFiles(res.listFiles())
        yMax <- maxValueFromFiles(xs.listFiles())
        zMax <- maxValueFromFiles(ys.listFiles())
      } yield {
        val maxCoordinates = Point3D((xMax + 1) * 128, (yMax + 1) * 128, (zMax + 1) * 128)
        DataSet(f.getName(), f.getAbsolutePath(), maxCoordinates, dataLayers = Map[String, DataLayer](ColorLayer.identifier -> ColorLayer(supportedResolutions = resolutions)))
      }
    } else None
  }

}
