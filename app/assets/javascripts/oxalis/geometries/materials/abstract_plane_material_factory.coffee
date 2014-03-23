### define
three : THREE
./abstract_material_factory : AbstractMaterialFactory
###

class AbstractPlaneMaterialFactory extends AbstractMaterialFactory


  constructor : (@model, @tWidth) ->

    super(@model)


  setupAttributesAndUniforms : ->

    super()

    @uniforms = _.extend @uniforms,
      # TODO: Initialize correctly
      brightness :
        type : "f"
        value : 0
      contrast :
        type : "f"
        value : 1

    @createTextures()


  makeMaterial : (options) ->

    super(options)

    @material.setData = (name, data) =>
      @textures[name].image.data.set(data)
      @textures[name].needsUpdate = true


  setupChangeListeners : ->

    for binary in @model.getColorBinaries()
      do (binary) =>
        binary.on
          newColorSettings : (brightness, contrast) =>
            @uniforms.brightness.value = brightness / 255
            @uniforms.contrast.value = contrast


  createTextures : ->

    throw new Error("Subclass responsibility")


  createDataTexture : (width, bytes) ->

    format = if bytes == 1 then THREE.LuminanceFormat else THREE.RGBFormat

    return new THREE.DataTexture(
      new Uint8Array(bytes * width * width), width, width,
      format, THREE.UnsignedByteType,
      new THREE.UVMapping(),
      THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping,
      THREE.NearestFilter, THREE.NearestFilter
    )


  getVertexShader : ->

    return """
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position =   projectionMatrix *
                        modelViewMatrix *
                        vec4(position,1.0); }
    """
