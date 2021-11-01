import { useFrame, useThree } from '@react-three/fiber'
import { createRef, useLayoutEffect, useRef } from 'react'
import { Box3, MathUtils, Matrix4, ShaderChunk, Vector2, Vector3 } from 'three'
import { useConstant } from '../../utils'
import { CSMFrustum } from './CSMFrustum'
import { CSMShader } from './CSMShader'

const _cameraToLightMatrix = new Matrix4()
const _lightSpaceFrustum = new CSMFrustum()
const _center = new Vector3()
const _bbox = new Box3()
const _uniformArray = []
const _logArray = []

function useRefs(n) {
  const refs = useRef(null)
  if (!refs.current) {
    const arr = (refs.current = [])
    for (let i = 0; i < n; i++) {
      arr.push(createRef())
    }
  }
  return refs.current
}

export function CascadedShadowMap({
  cascades = 3,
  maxFar = 100000,
  mode = 'practical',
  shadowMapSize = 2048,
  shadowBias = 0.000001,
  lightDirection = new Vector3(1, -1, 1).normalize(),
  lightIntensity = 1,
  lightNear = 1,
  lightFar = 2000,
  lightMargin = 200,
  customSplitsCallback,
  fade = true,
}) {
  const { camera } = useThree()

  const mainFrustum = useConstant(() => new CSMFrustum())
  const frustums = useConstant(() => [])
  const breaks = useConstant(() => [])
  const shaders = useConstant(() => new Map())

  const lightsRef = useRefs(cascades)

  const initCascades = () => {
    camera.updateProjectionMatrix()
    mainFrustum.setFromProjectionMatrix(camera.projectionMatrix, maxFar)
    mainFrustum.split(breaks, frustums)
  }

  const getBreaks = () => {
    const far = Math.min(camera.far, maxFar)
    breaks.length = 0

    switch (mode) {
      case 'uniform':
        uniformSplit(cascades, camera.near, far, breaks)
        break
      case 'logarithmic':
        logarithmicSplit(cascades, camera.near, far, breaks)
        break
      case 'practical':
        practicalSplit(cascades, camera.near, far, 0.5, breaks)
        break
      case 'custom':
        if (customSplitsCallback === undefined)
          console.error('CSM: Custom split scheme callback not defined.')
        customSplitsCallback(cascades, camera.near, far, breaks)
        break
    }
  }

  const getExtendedBreaks = (target) => {
    while (target.length < breaks.length) {
      target.push(new Vector2())
    }

    target.length = breaks.length

    for (let i = 0; i < cascades; i++) {
      const amount = breaks[i]
      const prev = breaks[i - 1] || 0
      target[i].x = prev
      target[i].y = amount
    }
  }

  const updateShadowBounds = () => {
    for (let i = 0; i < frustums.length; i++) {
      const light = lightsRef[i].current
      const shadowCam = light.shadow.camera
      const frustum = frustums[i]

      // Get the two points that represent that furthest points on the frustum assuming
      // that's either the diagonal across the far plane or the diagonal across the whole
      // frustum itself.
      const nearVerts = frustum.vertices.near
      const farVerts = frustum.vertices.far
      const point1 = farVerts[0]
      let point2
      if (point1.distanceTo(farVerts[2]) > point1.distanceTo(nearVerts[2])) {
        point2 = farVerts[2]
      } else {
        point2 = nearVerts[2]
      }

      let squaredBBWidth = point1.distanceTo(point2)

      if (fade) {
        // expand the shadow extents by the fade margin if fade is enabled.
        const far = Math.max(camera.far, maxFar)
        const linearDepth = frustum.vertices.far[0].z / (far - camera.near)
        const margin = 0.25 * Math.pow(linearDepth, 2.0) * (far - camera.near)

        squaredBBWidth += margin
      }

      shadowCam.left = -squaredBBWidth / 2
      shadowCam.right = squaredBBWidth / 2
      shadowCam.top = squaredBBWidth / 2
      shadowCam.bottom = -squaredBBWidth / 2
      shadowCam.updateProjectionMatrix()
    }
  }

  const updateUniforms = () => {
    const far = Math.min(camera.far, maxFar)

    shaders.forEach((shader, material) => {
      if (shader !== null) {
        const uniforms = shader.uniforms
        getExtendedBreaks(uniforms.CSM_cascades.value)
        uniforms.cameraNear.value = camera.near
        uniforms.shadowFar.value = far
      }

      if (!fade && 'CSM_FADE' in material.defines) {
        delete material.defines.CSM_FADE
        material.needsUpdate = true
      } else if (fade && !('CSM_FADE' in material.defines)) {
        material.defines.CSM_FADE = ''
        material.needsUpdate = true
      }
    })
  }

  const updateFrustums = () => {
    getBreaks()
    initCascades()
    updateShadowBounds()
    updateUniforms()
  }

  const injectInclude = () => {
    ShaderChunk.lights_fragment_begin = CSMShader.lights_fragment_begin
    ShaderChunk.lights_pars_begin = CSMShader.lights_pars_begin
  }

  const setupMaterial = (material) => {
    material.defines = material.defines || {}
    material.defines.USE_CSM = 1
    material.defines.CSM_CASCADES = cascades

    if (fade) {
      material.defines.CSM_FADE = ''
    }

    const breaksVec2 = []

    material.onBeforeCompile = (shader) => {
      const far = Math.min(camera.far, maxFar)
      getExtendedBreaks(breaksVec2)

      shader.uniforms.CSM_cascades = { value: breaksVec2 }
      shader.uniforms.cameraNear = { value: camera.near }
      shader.uniforms.shadowFar = { value: far }

      shaders.set(material, shader)
    }

    shaders.set(material, null)
  }

  useLayoutEffect(() => {
    updateFrustums()
    injectInclude()
  }, [])

  useFrame(() => {
    for (let i = 0; i < frustums.length; i++) {
      const light = lightsRef[i].current
      const shadowCam = light.shadow.camera
      const texelWidth = (shadowCam.right - shadowCam.left) / shadowMapSize
      const texelHeight = (shadowCam.top - shadowCam.bottom) / shadowMapSize
      light.shadow.camera.updateMatrixWorld(true)
      _cameraToLightMatrix.multiplyMatrices(
        light.shadow.camera.matrixWorldInverse,
        camera.matrixWorld
      )
      frustums[i].toSpace(_cameraToLightMatrix, _lightSpaceFrustum)

      const nearVerts = _lightSpaceFrustum.vertices.near
      const farVerts = _lightSpaceFrustum.vertices.far
      _bbox.makeEmpty()
      for (let j = 0; j < 4; j++) {
        _bbox.expandByPoint(nearVerts[j])
        _bbox.expandByPoint(farVerts[j])
      }

      _bbox.getCenter(_center)
      _center.z = _bbox.max.z + lightMargin
      _center.x = Math.floor(_center.x / texelWidth) * texelWidth
      _center.y = Math.floor(_center.y / texelHeight) * texelHeight
      _center.applyMatrix4(light.shadow.camera.matrixWorld)

      light.position.copy(_center)
      light.target.position.copy(_center)

      light.target.position.x += lightDirection.x
      light.target.position.y += lightDirection.y
      light.target.position.z += lightDirection.z
    }
  })

  return (
    <>
      {Array.from(Array(cascades).keys()).map((i) => (
        <directionalLight
          key={i}
          ref={lightsRef[i]}
          args={[0xffffff, lightIntensity]}
          castShadow
          shadow-mapSize-width={shadowMapSize}
          shadow-mapSize-height={shadowMapSize}
          shadow-camera-near={lightNear}
          shadow-camera-far={lightFar}
          shadow-bias={shadowBias}
        />
      ))}
    </>
  )
}

function uniformSplit(amount, near, far, target) {
  for (let i = 1; i < amount; i++) {
    target.push((near + ((far - near) * i) / amount) / far)
  }

  target.push(1)
}

function logarithmicSplit(amount, near, far, target) {
  for (let i = 1; i < amount; i++) {
    target.push((near * (far / near) ** (i / amount)) / far)
  }

  target.push(1)
}

function practicalSplit(amount, near, far, lambda, target) {
  _uniformArray.length = 0
  _logArray.length = 0
  logarithmicSplit(amount, near, far, _logArray)
  uniformSplit(amount, near, far, _uniformArray)

  for (let i = 1; i < amount; i++) {
    target.push(MathUtils.lerp(_uniformArray[i - 1], _logArray[i - 1], lambda))
  }

  target.push(1)
}

// export class CSM {

//   setupMaterial(material) {
//     material.defines = material.defines || {}
//     material.defines.USE_CSM = 1
//     material.defines.CSM_CASCADES = cascades

//     if (this.fade) {
//       material.defines.CSM_FADE = ''
//     }

//     const breaksVec2 = []
//     const scope = this
//     const shaders = this.shaders

//     material.onBeforeCompile = (shader) => {
//       const far = Math.min(scope.camera.far, scope.maxFar)
//       scope.getExtendedBreaks(breaksVec2)

//       shader.uniforms.CSM_cascades = { value: breaksVec2 }
//       shader.uniforms.cameraNear = { value: scope.camera.near }
//       shader.uniforms.shadowFar = { value: far }

//       shaders.set(material, shader)
//     }

//     shaders.set(material, null)
//   }

//   remove() {
//     for (let i = 0; i < this.lights.length; i++) {
//       this.parent.remove(this.lights[i])
//     }
//   }

//   dispose() {
//     const shaders = this.shaders
//     shaders.forEach((shader, material) => {
//       delete material.onBeforeCompile
//       delete material.defines.USE_CSM
//       delete material.defines.CSM_CASCADES
//       delete material.defines.CSM_FADE

//       if (shader !== null) {
//         delete shader.uniforms.CSM_cascades
//         delete shader.uniforms.cameraNear
//         delete shader.uniforms.shadowFar
//       }

//       material.needsUpdate = true
//     })
//     shaders.clear()
//   }
// }
