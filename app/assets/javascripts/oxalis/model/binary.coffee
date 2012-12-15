### define
./binary/cube : Cube
./binary/pullqueue : PullQueue
./binary/plane2d : Plane2D
./binary/ping_strategy : PingStrategy
./dimensions : DimensionHelper
###

class Binary

  # Constants
  PING_THROTTLE_TIME : 50
  DIRECTION_VECTOR_SMOOTHER : .125
  TEXTURE_SIZE_P : 0

  cube : null
  queue : null
  planes : []

  dataSetId : ""
  direction : [0, 0, 0]


  constructor : (flycam, dataSet, @TEXTURE_SIZE_P) ->

    @dataSetId = dataSet.id

    @cube = new Cube(dataSet.upperBoundary, dataSet.resolutions.length)
    @queue = new PullQueue(@dataSetId, @cube)

    @pingStrategies = [new PingStrategy.DslSlow(@cube, @TEXTURE_SIZE_P)]

    @planes = []
    @planes[Dimensions.PLANE_XY] = new Plane2D(Dimensions.PLANE_XY, @cube, @queue, @TEXTURE_SIZE_P)
    @planes[Dimensions.PLANE_XZ] = new Plane2D(Dimensions.PLANE_XZ, @cube, @queue, @TEXTURE_SIZE_P)
    @planes[Dimensions.PLANE_YZ] = new Plane2D(Dimensions.PLANE_YZ, @cube, @queue, @TEXTURE_SIZE_P)


  updateLookupTable : (brightness, contrast) ->

    lookUpTable = new Uint8Array(256)

    for i in [0..255]
      lookUpTable[i] = Math.max(Math.min((i + brightness) * contrast, 255), 0)

    for plane in @planes
      plane.updateLookUpTable(lookUpTable)


  ping : _.once (position, {zoomStep, area}) ->

    @ping = _.throttle(@pingImpl, @PING_THROTTLE_TIME)
    @ping(position, {zoomStep, area})


  pingImpl : (position, {zoomStep, area}) ->

    if @lastPosition?
      
      @direction = [
        (1 - @DIRECTION_VECTOR_SMOOTHER) * @direction[0] + @DIRECTION_VECTOR_SMOOTHER * (position[0] - @lastPosition[0])
        (1 - @DIRECTION_VECTOR_SMOOTHER) * @direction[1] + @DIRECTION_VECTOR_SMOOTHER * (position[1] - @lastPosition[1])
        (1 - @DIRECTION_VECTOR_SMOOTHER) * @direction[2] + @DIRECTION_VECTOR_SMOOTHER * (position[2] - @lastPosition[2])
      ]

    unless _.isEqual(position, @lastPosition) and _.isEqual(zoomStep, @lastZoomStep) and _.isEqual(area, @lastArea)

      @lastPosition = position.slice()
      @lastZoomStep = zoomStep.slice()
      @lastArea     = area.slice()

      console.log "ping", @queue.roundTripTime, @queue.bucketsPerSecond

      for strategy in @pingStrategies 
        if strategy.inVelocityRange(1) and strategy.inRoundTripTimeRange(@queue.roundTripTime)

          pullQueue = strategy.ping(position, @direction, zoomStep[0], area[0]) if zoomStep[0]? and area[0]? 

          for entry in pullQueue
            @queue.insert(entry...)

          break

      @queue.pull()


  # Not used anymore. Instead the planes get-functions are called directly.
  #get : (position, options) ->

   # for i in [0...Math.min(options.length, @planes.length)]
    #  @planes[i].get(position, options[i]) if options[i]?
