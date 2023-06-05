package com.scalableminds.webknossos.datastore.dataformats.zarr3

import com.scalableminds.util.geometry.{BoundingBox, Vec3Int}
import com.scalableminds.webknossos.datastore.dataformats.MagLocator
import com.scalableminds.webknossos.datastore.models.datasource.{
  Category,
  CoordinateTransformation,
  DataFormat,
  DataLayer,
  ElementClass,
  SegmentationLayer
}
import com.scalableminds.webknossos.datastore.models.datasource.LayerViewConfiguration.LayerViewConfiguration
import com.scalableminds.webknossos.datastore.storage.DataVaultService
import play.api.libs.json.{Json, OFormat}

trait Zarr3Layer extends DataLayer {

  val dataFormat: DataFormat.Value = DataFormat.zarr3

  def bucketProvider(dataVaultServiceOpt: Option[DataVaultService]) =
    new Zarr3BucketProvider(this, dataVaultServiceOpt)

  def resolutions: List[Vec3Int] = mags.map(_.mag)

  def mags: List[MagLocator]

  def lengthOfUnderlyingCubes(resolution: Vec3Int): Int = Int.MaxValue // Prevents the wkw-shard-specific handle caching

  def numChannels: Option[Int] = Some(if (elementClass == ElementClass.uint24) 3 else 1)

}

case class Zarr3DataLayer(
    name: String,
    category: Category.Value,
    boundingBox: BoundingBox,
    elementClass: ElementClass.Value,
    mags: List[MagLocator],
    defaultViewConfiguration: Option[LayerViewConfiguration] = None,
    adminViewConfiguration: Option[LayerViewConfiguration] = None,
    coordinateTransformations: Option[List[CoordinateTransformation]] = None,
    override val numChannels: Option[Int] = Some(1)
) extends Zarr3Layer

object Zarr3DataLayer {
  implicit val jsonFormat: OFormat[Zarr3DataLayer] = Json.format[Zarr3DataLayer]
}

case class Zarr3SegmentationLayer(
    name: String,
    boundingBox: BoundingBox,
    elementClass: ElementClass.Value,
    mags: List[MagLocator],
    largestSegmentId: Option[Long] = None,
    mappings: Option[Set[String]] = None,
    defaultViewConfiguration: Option[LayerViewConfiguration] = None,
    adminViewConfiguration: Option[LayerViewConfiguration] = None,
    coordinateTransformations: Option[List[CoordinateTransformation]] = None,
    override val numChannels: Option[Int] = Some(1)
) extends SegmentationLayer
    with Zarr3Layer

object Zarr3SegmentationLayer {
  implicit val jsonFormat: OFormat[Zarr3SegmentationLayer] = Json.format[Zarr3SegmentationLayer]
}
