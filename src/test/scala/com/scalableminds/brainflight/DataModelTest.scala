package com.scalableminds.brainflight

import binary._
import org.specs._
import net.liftweb._
import net.liftweb.util._
import java.io.FileNotFoundException

//class DataModelTest extends JUnit3(DataModelTestSpecs)
//object DataModelTestSpecsRunner extends ConsoleRunner(DataModelTestSpecs)

object DataStoreTest extends Specification{
  "DataStore" should {
    "load Data" in {
      try{
        // if this failes the data has changed
        DataStore.load((0,0,0)) must be equalTo(0.toByte)
      } catch{
        case e: FileNotFoundException =>
          fail("Data not found: Put binary data in e.q. binarydata/x0000/y0000/z0000/100527_k0563_mag1_x0000_y0000_z0000.raw")
      }
    }
  }
}

object DataModelTestSpecs extends Specification {
  object TestModel extends DataModel{
    val id = "testModel"
    val yLength = 2
    val containingCoordinates =
      for{
        y <- 0 to yLength
        x <- -yLength/2 to yLength/2
        z <- -yLength/2 to yLength/2
      }yield{
        (x,y,z)
      }

  }
  "ModelStore" should {
    "contain one Element" in {
      ModelStore.register(TestModel)
      ModelStore.models.size must be equalTo 1
    }
    "match Cube id" in {
      ModelStore(TestModel.id) must be like{
        case Some(_) => true
      }
    }
  }

  "Abstract DataModel" should{
    "be able to move Model" in {
      TestModel.rotateAndMove((1,2,3),(0,1,0)) must be equalTo  IndexedSeq(
        (0,2,2), (0,2,3), (0,2,4), (1,2,2), (1,2,3), (1,2,4), (2,2,2), (2,2,3), (2,2,4), (0,3,2), (0,3,3), (0,3,4), (1,3,2), (1,3,3), (1,3,4), (2,3,2), (2,3,3), (2,3,4), (0,4,2), (0,4,3), (0,4,4), (1,4,2), (1,4,3), (1,4,4), (2,4,2), (2,4,3), (2,4,4)
      )
    }
    "be able to rotate Model" in  {
      TestModel.rotateAndMove((0,0,0),(1,2,3)) must be equalTo  IndexedSeq(
        (-3,3,0), (-5,1,1), (-6,-2,2), (1,3,-1), (0,0,0), (-1,-3,1), (6,2,-2), (5,-1,-1), (3,-3,0), (-2,4,3), (-4,1,4), (-5,-1,5), (2,3,2), (1,1,3), (-1,-2,4), (7,2,0), (6,0,1), (4,-3,2), (-2,4,5), (-3,2,6), (-4,-1,7), (3,4,4), (2,1,5), (0,-1,6), (8,3,3), (6,0,4), (5,-2,5)
      )
    }
  }
}
