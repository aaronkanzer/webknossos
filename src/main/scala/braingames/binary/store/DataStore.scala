package braingames.binary.store

import scala.concurrent.Future
import akka.actor.Actor
import scala.util._
import scala.concurrent.ExecutionContext.Implicits._
import braingames.binary.{DataStoreBlock, LoadBlock, SaveBlock}
import net.liftweb.common.{Full, Empty, Box}
import braingames.geometry.Point3D
import scalax.file.Path
import java.io.{File, FilenameFilter}

/**
 * Abstract Datastore defines all method a binary data source (e.q. normal file
 * system or db implementation) must implement to be used
 */

class DataNotFoundException(message: String) extends Exception(s"$message Could not find the data")

class DataStoreActor(dataStore: DataStore) extends Actor {

  def receive = {
    case request: LoadBlock =>
      val s = sender
      dataStore.load(request).onComplete {
        case Failure(e) =>
          s ! net.liftweb.common.Failure(e.getMessage, Full(e), Empty)
        case Success(d) =>
          s ! d
      }

    case request: SaveBlock =>
      val s = sender
      dataStore.save(request).onComplete {
        case Failure(e) =>
          s ! net.liftweb.common.Failure(e.getMessage, Full(e), Empty)
        case Success(d) =>
          s ! d
      }
  }
}

trait DataStore {
  /**
   * Loads the data of a given point from the data source
   */
  def load(dataInfo: LoadBlock): Future[Box[Array[Byte]]]

  /**
   * Saves the data of a given point to the data source
   */
  def save(dataInfo: SaveBlock): Future[Unit]
}

object DataStore {

  def createFilename(dataInfo: DataStoreBlock) =
    knossosFilePath(knossosBaseDir(dataInfo), dataInfo.dataSource.id, dataInfo.resolution, dataInfo.block)

  def knossosBaseDir(dataInfo: DataStoreBlock) =
    Path.fromString(dataInfo.dataLayer.baseDir + "/" + dataInfo.dataLayerSection.baseDir)

  def knossosDir(dataSetDir: Path, resolution: Int, block: Point3D) = {
    val x = "x%04d".format(block.x)
    val y = "y%04d".format(block.y)
    val z = "z%04d".format(block.z)
    dataSetDir / resolution.toString / x / y / z
  }

  def knossosFilePath(dataSetDir: Path, id: String, resolution: Int, block: Point3D) = {
    val x = "x%04d".format(block.x)
    val y = "y%04d".format(block.y)
    val z = "z%04d".format(block.z)
    val fileName = s"${id}_mag${resolution}_${x}_${y}_${z}.raw"
    knossosDir(dataSetDir, resolution, block) / fileName
  }

  def fuzzyKnossosFile(dataSetDir: Path, id: String, resolution: Int, block: Point3D): Option[File] = {
    val possibleFiles: Array[File] = knossosDir(dataSetDir, resolution, block).fileOption.map {
      dir =>
        dir.listFiles(new FilenameFilter() {
          override def accept(dir: File, name: String): Boolean = {
            name.endsWith(".raw")
          }
        })
    }.getOrElse(Array.empty)
    possibleFiles.headOption
  }
}