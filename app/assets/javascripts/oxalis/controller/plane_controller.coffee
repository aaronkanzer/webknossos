### define
jquery : $
underscore : _
./camera_controller : CameraController
../model/dimensions : Dimensions
libs/event_mixin : EventMixin
libs/input : Input
../view/plane_view : PlaneView
../constants : constants
libs/threejs/TrackballControls : TrackballControls
./celltracing_controller : CellTracingController
./volumetracing_controller : VolumeTracingController
###

class PlaneController

  bindings : []
  model : null
  view : null
  gui : null

  input :
    mouseControllers : []
    keyboard : null
    keyboardNoLoop : null
    keyboardLoopDelayed : null

    unbind : ->
      for mouse in @mouseControllers
        mouse.unbind()
      @mouseControllers = []
      @keyboard?.unbind()
      @keyboardNoLoop?.unbind()
      @keyboardLoopDelayed?.unbind()


  constructor : (@model, stats, @gui, renderer, scene, @sceneController, @controlMode) ->

    _.extend(@, new EventMixin())

    @isStarted = false

    @flycam = @model.flycam
    @flycam.setZoomStep(@model.user.zoom)
    @flycam.setQuality(@model.user.quality)

    @oldNmPos = @model.scaleInfo.voxelToNm( @flycam.getPosition() )

    @view  = new PlaneView(@model, @flycam, stats, renderer, scene)

    # initialize Camera Controller
    @cameraController = new CameraController(@view.getCameras(), @flycam, @model)

    @canvasesAndNav = $("#main")[0]

    @prevControls = $('#prevControls')
    @prevControls.addClass("btn-group")

    buttons = [
        name : "3D"
        callback : @cameraController.changePrevSV
      ,
        name : "XY"
        callback : @cameraController.changePrevXY
        color : "#f00"
      ,
        name : "YZ"
        callback : @cameraController.changePrevYZ
        color : "#00f"
      ,
        name : "XZ"
        callback : @cameraController.changePrevXZ
        color : "#0f0"
    ]

    for button in buttons

      button.control = @prevControls.append(
        $("<button>", type : "button", class : "btn btn-small")
          .html("#{if button.color then "<span style=\"background: #{button.color}\"></span>" else ""}#{button.name}")
          .on("click", button.callback)
      )    

    objects = { @model, @view, @sceneController, @cameraController, @move, @calculateGlobalPos }
    @cellTracingController = new CellTracingController( objects, @controlMode )
    @volumeTracingController = new VolumeTracingController( objects )

    meshes = @sceneController.getMeshes()
    
    for mesh in meshes
      @view.addGeometry(mesh)

    @model.user.triggerAll()

    # hide contextmenu, while rightclicking a canvas
    $("#render").bind "contextmenu", (event) ->
      event.preventDefault()
      return

    @initTrackballControls()
    @bind()


  initMouse : ->

    for planeId in ["xy", "yz", "xz"]
      @input.mouseControllers.push( new Input.Mouse($("#plane#{planeId}"),
        _.extend(@activeSubController.mouseControls,
          {
            over : @view["setActivePlane#{planeId.toUpperCase()}"]
            scroll : @scroll
          })))

    @input.mouseControllers.push( new Input.Mouse($("#skeletonview"),
      leftDownMove : (delta) => 
        @cameraController.movePrevX(delta.x * @model.user.getMouseInversionX())
        @cameraController.movePrevY(delta.y * @model.user.getMouseInversionY())
      scroll : (value) =>
        @cameraController.zoomPrev(value,
          @input.mouseControllers[constants.VIEW_3D].position,
          @view.curWidth)
      leftClick : (position, shiftPressed, altPressed) =>
        @cellTracingController.onClick(position, shiftPressed, altPressed, constants.VIEW_3D)
    ) )


  initTrackballControls : ->

    view = $("#skeletonview")[0]
    pos = @model.scaleInfo.voxelToNm(@flycam.getPosition())
    @controls = new THREE.TrackballControls(
      @view.getCameras()[constants.VIEW_3D],
      view, 
      new THREE.Vector3(pos...), 
      => @flycam.hasChanged = true )
    
    @controls.noZoom = true
    @controls.noPan = true

    @controls.target.set(
      @model.scaleInfo.voxelToNm(@flycam.getPosition())...)

    @flycam.on
      positionChanged : (position) =>

        nmPosition = @model.scaleInfo.voxelToNm(position)

        @controls.setTarget(
          new THREE.Vector3(nmPosition...))
      
        # As the previous step will also move the camera, we need to
        # fix this by offsetting the viewport

        invertedDiff = []
        for i in [0..2]
          invertedDiff.push( @oldNmPos[i] - nmPosition[i] )
        @oldNmPos = nmPosition

        @cameraController.movePrev( 
          new THREE.Vector3( invertedDiff... ))

    @cameraController.on
      cameraPositionChanged : =>
        @controls.update()


  initKeyboard : ->
    
    # avoid scrolling while pressing space
    $(document).keydown (event) ->
      event.preventDefault() if (event.which == 32 or event.which == 18 or 37 <= event.which <= 40) and !$(":focus").length
      return

    getVoxelOffset  = (timeFactor) =>
      return @model.user.moveValue * timeFactor / @model.scaleInfo.baseVoxel / constants.FPS

    @input.keyboard = new Input.Keyboard(

      #ScaleTrianglesPlane
      "l" : (timeFactor) => @scaleTrianglesPlane(-@model.user.scaleValue * timeFactor )
      "k" : (timeFactor) => @scaleTrianglesPlane( @model.user.scaleValue * timeFactor )

      #Move
      "left"  : (timeFactor) => @moveX(-getVoxelOffset(timeFactor))
      "right" : (timeFactor) => @moveX( getVoxelOffset(timeFactor))
      "up"    : (timeFactor) => @moveY(-getVoxelOffset(timeFactor))
      "down"  : (timeFactor) => @moveY( getVoxelOffset(timeFactor))

      #misc keys
      # TODO: what does this? I removed it, I need the key.
      #"n" : => Helper.toggle()
      #"ctr + s"       : => @model.route.pushImpl()
    )

    @input.keyboardLoopDelayed = new Input.Keyboard(

      "space"         : (timeFactor, first) => @moveZ( getVoxelOffset(timeFactor)    , first)
      "f"             : (timeFactor, first) => @moveZ( getVoxelOffset(timeFactor)    , first)
      "d"             : (timeFactor, first) => @moveZ(-getVoxelOffset(timeFactor)    , first)
      "shift + f"     : (timeFactor, first) => @moveZ( getVoxelOffset(timeFactor) * 5, first)
      "shift + d"     : (timeFactor, first) => @moveZ(-getVoxelOffset(timeFactor) * 5, first)
    
      "shift + space" : (timeFactor, first) => @moveZ(-getVoxelOffset(timeFactor)    , first)
      "ctrl + space"  : (timeFactor, first) => @moveZ(-getVoxelOffset(timeFactor)    , first)
    
    , @model.user.keyboardDelay)

    @model.user.on({
      keyboardDelayChanged : (value) => @input.keyboardLoopDelayed.delay = value
      })
    
    @input.keyboardNoLoop = new Input.KeyboardNoLoop( 
      _.extend(@activeSubController.keyboardControls,
        {
          #Zoom in/out
          "i" : => @zoomIn(false)
          "o" : => @zoomOut(false)

          #Change move value
          "h" : => @changeMoveValue(25)
          "g" : => @changeMoveValue(-25)
        }))

  init : ->

    @cameraController.setRouteClippingDistance @model.user.routeClippingDistance
    @sceneController.setRouteClippingDistance @model.user.routeClippingDistance


  start : (newMode) ->

    @stop()

    if newMode == constants.MODE_PLANE_TRACING
      @activeSubController = @cellTracingController
    else if newMode == constants.MODE_VOLUME
      @activeSubController = @volumeTracingController

    @initKeyboard()
    @init()
    @initMouse()
    @sceneController.start()
    @view.start()

    @isStarted = true


  stop : ->

    if @isStarted
      @input.unbind()
      @view.stop()
      @sceneController.stop()

    @isStarted = false

  bind : ->

    @view.bind()

    @view.on
      render : => @render()
      finishedRender : => @model.route.rendered()
      renderCam : (id, event) => @sceneController.updateSceneForCam(id)

    @sceneController.on
      newGeometries : (list, event) =>
        for geometry in list
          @view.addGeometry(geometry)
      removeGeometries : (list, event) =>
        for geometry in list
          @view.removeGeometry(geometry)   
    @sceneController.skeleton.on
      newGeometries : (list, event) =>
        for geometry in list
          @view.addGeometry(geometry)
      removeGeometries : (list, event) =>
        for geometry in list
          @view.removeGeometry(geometry)    


  render : ->

    binaries = [ @model.binary, @model.binaryVolume ]
    for i in [0..1]
      if i == 0 or i == @sceneController.dataMode
        binaries[i].ping(@flycam.getPosition(), {
          zoomStep:     @flycam.getIntegerZoomStep()
          area:         @flycam.getAreas()
          activePlane:  @flycam.getActivePlane()
        })
    
    @model.route.globalPosition = @flycam.getPosition()
    @cameraController.update()
    @sceneController.update()

  move : (v) => @flycam.moveActivePlane(v)

  moveX : (x) => @flycam.moveActivePlane([x, 0, 0])
  moveY : (y) => @flycam.moveActivePlane([0, y, 0])
  moveZ : (z, first) =>
    if(first)
      activePlane = @flycam.getActivePlane()
      @flycam.move(Dimensions.transDim(
        [0, 0, (if z < 0 then -1 else 1) << @flycam.getIntegerZoomStep()],
        activePlane), activePlane)
    else
      @flycam.moveActivePlane([0, 0, z], false)

  zoomIn : (zoomToMouse) =>
    if zoomToMouse
      @zoomPos = @getMousePosition()
    @cameraController.zoom(@flycam.getZoomStep() - constants.ZOOM_DIFF)
    @model.user.setValue("zoom", @flycam.getPlaneScalingFactor())
    if zoomToMouse
      @finishZoom()

  zoomOut : (zoomToMouse) =>
    if zoomToMouse
      @zoomPos = @getMousePosition()
    @cameraController.zoom(@flycam.getZoomStep() + constants.ZOOM_DIFF)
    @model.user.setValue("zoom", @flycam.getPlaneScalingFactor())
    if zoomToMouse
      @finishZoom()

  finishZoom : =>
    
    # Move the plane so that the mouse is at the same position as
    # before the zoom
    if @isMouseOver()
      mousePos = @getMousePosition()
      moveVector = [@zoomPos[0] - mousePos[0],
                    @zoomPos[1] - mousePos[1],
                    @zoomPos[2] - mousePos[2]]
      @flycam.move(moveVector, @flycam.getActivePlane())

  getMousePosition : ->
    activePlane = @flycam.getActivePlane()
    pos = @input.mouseControllers[activePlane].position
    return @calculateGlobalPos(pos)

  isMouseOver : ->
    activePlane = @flycam.getActivePlane()
    return @input.mouseControllers[activePlane].isMouseOver

  changeMoveValue : (delta) ->
    moveValue = @model.user.moveValue + delta
    moveValue = Math.min(constants.MAX_MOVE_VALUE, moveValue)
    moveValue = Math.max(constants.MIN_MOVE_VALUE, moveValue)

    @model.user.setValue("moveValue", (Number) moveValue)

  scaleTrianglesPlane : (delta) ->
    scale = @model.user.scale + delta
    scale = Math.min(constants.MAX_SCALE, scale)
    scale = Math.max(constants.MIN_SCALE, scale)

    @model.user.setValue("scale", (Number) scale)

  setNodeRadius : (delta) =>
    lastRadius = @model.route.getActiveNodeRadius()
    radius = lastRadius + (lastRadius/20 * delta) #achieve logarithmic change behaviour
    @model.route.setActiveNodeRadius(radius)

  scroll : (delta, type) =>
    switch type
      when null then @moveZ(delta)
      when "shift" then @cellTracingController.setParticleSize(delta)
      when "alt"
        if delta > 0
          @zoomIn(true)
        else
          @zoomOut(true)

  calculateGlobalPos : (clickPos) =>
    curGlobalPos  = @flycam.getPosition()
    zoomFactor    = @flycam.getPlaneScalingFactor()
    scaleFactor   = @view.scaleFactor
    planeRatio    = @model.scaleInfo.baseVoxelFactors
    position = switch @flycam.getActivePlane()
      when constants.PLANE_XY 
        [ curGlobalPos[0] - (constants.WIDTH * scaleFactor / 2 - clickPos.x) / scaleFactor * planeRatio[0] * zoomFactor, 
          curGlobalPos[1] - (constants.WIDTH * scaleFactor / 2 - clickPos.y) / scaleFactor * planeRatio[1] * zoomFactor, 
          curGlobalPos[2] ]
      when constants.PLANE_YZ 
        [ curGlobalPos[0], 
          curGlobalPos[1] - (constants.WIDTH * scaleFactor / 2 - clickPos.y) / scaleFactor * planeRatio[1] * zoomFactor, 
          curGlobalPos[2] - (constants.WIDTH * scaleFactor / 2 - clickPos.x) / scaleFactor * planeRatio[2] * zoomFactor ]
      when constants.PLANE_XZ 
        [ curGlobalPos[0] - (constants.WIDTH * scaleFactor / 2 - clickPos.x) / scaleFactor * planeRatio[0] * zoomFactor, 
          curGlobalPos[1], 
          curGlobalPos[2] - (constants.WIDTH * scaleFactor / 2 - clickPos.y) / scaleFactor * planeRatio[2] * zoomFactor ]

  centerActiveNode : ->
    @activeSubController.centerActiveNode()