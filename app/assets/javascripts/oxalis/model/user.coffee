### define
../../libs/request : Request
libs/event_mixin : EventMixin
underscore : _
###

class User

  # userdata
  # default values are defined in server
  moveValue : null
  moveValue3d : null
  rotateValue : null
  crosshairSize : null
  scaleValue : null
  mouseRotateValue : null
  clippingDistance : null
  clippingDistanceArbitrary : null
  dynamicSpaceDirection : null
  displayCrosshair : null
  interpolation : null
  fourBit : null
  briConNames : null
  brightness : null
  contrast : null
  quality : null
  zoom : null
  scale : null
  displayTDViewXY : null
  displayTDViewYZ : null
  displayTDViewXZ : null
  newNodeNewTree : null
  inverseX : null
  inverseY : null
  keyboardDelay : null
  mouseActive : null
  keyboardActive : null
  gamepadActive : null
  motionsensorActive : null
  firstVisToggle : null
  particleSize : null
  sortTreesByName : null
  push_throttle_time : 500

  constructor : (user) ->

    _.extend(this, new EventMixin())
    _.extend(@, user)


  setValue : (name, value) ->

    @[name] = value
    @trigger(name + "Changed", value)
    @push()

  getMouseInversionX : ->

    return if @inverseX then 1 else -1

  getMouseInversionY : ->

    return if @inverseY then 1 else -1


  triggerAll : ->

    for property of this
      @trigger(property + "Changed", @[property]) 


  push : ->

    $.when(@pushImpl())


  pushThrottled : ->

    saveFkt = @pushImpl
    @pushThrottled = _.throttle(_.mutexDeferred( saveFkt, -1), @push_throttle_time)
    @pushThrottled()


  pushImpl : ->

    deferred = $.Deferred()

    data = {}
    for property of this
      
      if not (typeof this[property] == "function") and property.charAt(0) != '_'

        data[property] = this[property]

    console.log "Sending User Data:", data
      
    Request.send(
      url      : "/user/configuration"
      type     : "POST"
      dataType : "json"
      data     : data
    ).fail( =>
      
      console.log "couldn't save userdata"

    ).always(-> deferred.resolve())
    
    deferred.promise()    
