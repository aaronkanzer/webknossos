# define 
# 	[
# 		"model",
# 		"view",
# 		"geometry_factory"
# 	],
# 	(Model, View, GeometryFactory) ->

Controller =

	initialize : ->
		
		Model.Route.initialize().done (matrix) =>
				
			View.setCam(matrix)

			GeometryFactory.createMesh("coordinateAxes", "mesh").done (mesh) ->
				View.addGeometry mesh
				
			GeometryFactory.createMesh("crosshair", "mesh").done (mesh) -> 
				View.addGeometry mesh

			GeometryFactory.createTrianglesplane(128, 0, "trianglesplane").done (trianglesplane) ->
				View.addGeometry trianglesplane		

  # mouse events
  
  # keyboard events


start = ->
	Controller.initialize()

