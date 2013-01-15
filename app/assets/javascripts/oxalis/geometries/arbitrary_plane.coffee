### define
three : THREE
m4x4 : M4x4
v3 : V3
underscore : _
###

# Let's set up our trianglesplane.
# It serves as a "canvas" where the brain images
# are drawn.
# Don't let the name fool you, this is just an
# ordinary plane with a texture applied to it.
#
# User tests showed that looking a bend surface (a half sphere)
# feels more natural when moving around in 3D space.
# To acknowledge this fact we determine the pixels that will
# be displayed by requesting them as though they were
# attached to bend surface.
# The result is then projected on a flat surface.
# For me detail look in Model.
#
# queryVertices: holds the position/matrices
# needed to for the bend surface.
# normalVertices: (depricated) holds the vertex postion
# for the flat surface
class ArbitraryPlane

  sphericalCapRadius : 0
  cam : null

  mesh : null

  isDirty : false

  queryVertices : null
  width : 0
  height : 0


  constructor : (@cam, @binary, @width = 128, @height = 128) ->

    @sphericalCapRadius = @cam.distance
    @queryVertices = @calculateQueryVertices()
    @mesh = @createMesh()

    @cam.on "changed", => @isDirty = true
    #@binary.on "bucketLoaded", => @isDirty = true

    throw "width needs to be a power of 2" unless Math.log(width) / Math.LN2 % 1 != 1
    throw "height needs to be a power of 2" unless Math.log(height) / Math.LN2 % 1 != 1


  attachScene : (scene) ->

    scene.add(@mesh)


  update : ->

    if true #@isDirty

      { mesh, cam } = this

      matrix = @cam.getZoomedMatrix()

      newVertices = M4x4.transformPointsAffine matrix, @queryVertices
      newColors = @binary.getByVerticesSync(newVertices)
 
      @mesh.texture.image.data.set(newColors)
      @mesh.texture.needsUpdate = true

      @isDirty = false



  calculateQueryVertices : ->

    { width, height, sphericalCapRadius } = this

    queryVertices = new Float32Array(width * height * 3)

    # so we have Point [0, 0, 0] centered
    currentIndex = 0

    vertex        = [0, 0, 0]
    vector        = [0, 0, 0]
    centerVertex  = [0, 0, -sphericalCapRadius]

    # Transforming those normalVertices to become a spherical cap
    # which is better more smooth for querying.
    # http://en.wikipedia.org/wiki/Spherical_cap
    for y in [0...height] by 1
      for x in [0...width] by 1

        vertex[0] = x - (Math.floor width/2)
        vertex[1] = y - (Math.floor height/2)
        vertex[2] = 0

        vector = V3.sub(vertex, centerVertex, vector)
        length = V3.length(vector)
        vector = V3.scale(vector, sphericalCapRadius / length, vector)

        queryVertices[currentIndex++] = centerVertex[0] + vector[0]
        queryVertices[currentIndex++] = centerVertex[1] + vector[1]
        queryVertices[currentIndex++] = centerVertex[2] + vector[2]

    queryVertices


  applyScale : (delta) ->

    x = Number(@mesh.scale.x) + Number(delta)

    if x > .5 and x < 10
      @mesh.scale.x = @mesh.scale.y = @mesh.scale.z = x
      @cam.update()


  createMesh : ->

    { height, width } = this
    # create plane
    planeGeo = new THREE.PlaneGeometry(width, height, 1, 1)

    # create texture
    texture             = new THREE.DataTexture(new Uint8Array(width*height), width, height, THREE.LuminanceFormat, THREE.UnsignedByteType, new THREE.UVMapping(), THREE.ClampToEdgeWrapping , THREE.ClampToEdgeWrapping, THREE.LinearMipmapLinearFilter, THREE.LinearMipmapLinearFilter )
    texture.needsUpdate = true
    textureMaterial     = new THREE.MeshBasicMaterial({wireframe : false, map : texture})

    # create mesh
    plane = new THREE.Mesh( planeGeo, textureMaterial )
    plane.texture = texture
    plane.rotation.x = Math.PI
    #@mesh.material.map = @mesh.texture  
    #  @mesh.material.needsUpdate = true
    mesh = plane

    #colorCorrectionMap = THREE.ImageUtils.loadTexture("assets/textures/color_correction_map9d.png")

    #shaderUniforms =
    #  brainData : { type: "t", value: texture },
    #  colorMap : { type: "t", value: colorCorrectionMap }
    #  color :    { type: "c", value: new THREE.Color( 0x30D158 ) }

    #@textureMaterial = new THREE.MeshBasicMaterial( wireframe: false, map: texture )
    #textureMaterial = new THREE.MeshBasicMaterial({wireframe : false})
    # shader idea from Nvidia:
    # http://http.developer.nvidia.com/GPUGems/gpugems_ch22.html

    vertexShader =
      """
      varying vec2 vUv;

      void main() {

        vUv = vec2( uv.x, uv.y );
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

      }"""

    fragmentShader =
    """
      uniform sampler2D brainData;
      uniform sampler2D colorMap;

      varying vec2 vUv;

      void main() {

        vec4 inputColor = texture2D( brainData, vUv );

        vec3 outColor;
        outColor.r = texture2D( colorMap, vec2( inputColor.r, 1.0 ) ).r;
        outColor.g = texture2D( colorMap, vec2( inputColor.g, 1.0 ) ).g;
        outColor.b = texture2D( colorMap, vec2( inputColor.b, 1.0 ) ).b;

        gl_FragColor = vec4( outColor.rgb, 1.0);
      }
      """

    #basicM = new THREE.MeshBasicMaterial
    #@shaderMaterial = new THREE.ShaderMaterial(
    #  uniforms : shaderUniforms
    #  vertexShader : vertexShader
    #  fragmentShader : fragmentShader
    #)
    #textureMaterial.side = THREE.DoubleSide
    #shaderMaterial.transparent = true
    #mesh = new THREE.Mesh( plane, @shaderMaterial )
    #mesh = new THREE.Mesh( plane, textureMaterial )
    #mesh.rotation.y = Math.PI
    #mesh.scale.x = mesh.scale.z = mesh.scale.y = 2
    #mesh.texture = texture
    #mesh.matrixAutoUpdate = false

    mesh

