/* 
* Model Information:
* title:	Nissan Skyline R34 GT-R
* source:	https://sketchfab.com/3d-models/nissan-skyline-r34-gt-r-ff8fb2251dfa4bb9979e7022c5a6666c
* author:	Lexyc16 (https://sketchfab.com/Lexyc16)

Model License:
* license type:	CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)
* requirements:	Author must be credited. Commercial use is allowed. 
*/

import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { createRef, forwardRef, useLayoutEffect, useRef } from 'react'
import { MathUtils, Quaternion, Vector3 } from 'three'
import { useConstant } from '../utils'
import { Wheel } from './Wheel'

const { lerp } = MathUtils

const chassisBody = createRef()
const wheels = [createRef(), createRef(), createRef(), createRef()]

const vehicleConfig = {
  width: 1.5,
  height: 0.2,
  front: 1.3,
  back: -1.45,
  steer: 0.6,
  force: 12000,
  maxBrake: 300,
  maxSpeed: 88,
}

/**
 * @type {import('cannon-es').WheelInfo}
 */
const wheelInfo = {
  axleLocal: [-1, 0, 0],
  directionLocal: [0, -1, 0],
  frictionSlip: 5,
  radius: 0.32,
  rollInfluence: 0.05,
  // sideAcceleration: 10,
  suspensionRestLength: 0.5,
  suspensionStiffness: 100,
  maxSuspensionTravel: 10,
  // useCustomSlidingRotationalSpeed: true,
  // customSlidingRotationalSpeed: -2,
  dampingRelaxation: 5,
  dampingCompression: 5,
}

const { back, front, height, width, steer, force, maxBrake, maxSpeed } =
  vehicleConfig

/**
 * @type {import('cannon-es').WheelInfoOptions}
 */
const wheelInfos = wheels.map((_, index) => {
  const length = index < 2 ? front : back
  const sideMulti = index % 2 ? 0.5 : -0.5
  return {
    ...wheelInfo,
    chassisConnectionPointLocal: [width * sideMulti, height, length],
    isFrontWheel: Boolean(index % 2),
  }
})

const Skyline = forwardRef(function Skyline(
  { inputRef, cameraRef, ...props },
  forwardedRef
) {
  const ref = useRef()
  const chassiRef = forwardedRef || ref

  const [, api] = useRaycastVehicle(
    () => ({
      chassisBody: chassiRef,
      wheels,
      wheelInfos,
      indexForwardAxis: 2,
      indexRightAxis: 0,
      indexUpAxis: 1,
    }),
    null,
    [wheelInfo]
  )

  let engineValue = 0
  let speed = 0
  let steeringValue = 0

  useFrame((_, delta) => {
    const input = inputRef.current.getInput()

    engineValue = lerp(
      engineValue,
      input.movement.y !== 0 ? force * input.movement.y * -1 : 0,
      delta * 20
    )
    steeringValue = lerp(
      steeringValue,
      input.movement.x !== 0 ? steer * input.movement.x : 0,
      delta * 20
    )

    for (let i = 0; i < 4; i++) api.applyEngineForce(engineValue, i)
    for (let i = 0; i < 2; i++) api.setSteeringValue(steeringValue, i)
    for (let i = 0; i < 4; i++) {
      api.setBrake(input.keyboard.Space ? maxBrake : 0, i)
    }
  })

  return (
    <group {...props} dispose={null}>
      <Chassi ref={forwardedRef} cameraRef={cameraRef} />
      <Wheel ref={wheels[0]} side="right" radius={wheelInfo.radius} />
      <Wheel ref={wheels[1]} side="left" radius={wheelInfo.radius} />
      <Wheel ref={wheels[2]} side="right" radius={wheelInfo.radius} />
      <Wheel ref={wheels[3]} side="left" radius={wheelInfo.radius} />
    </group>
  )
})

const Chassi = forwardRef(function Chassi(
  { cameraRef, ...props },
  forwardedRef
) {
  const { nodes, materials } = useGLTF('/r34.gltf')

  const [, api] = useBox(
    () => ({
      mass: 1685,
      args: [1.8, 0.7, 4.6],
      position: [0, 1.5, 0],
      allowSleep: false,
      sleepSpeedLimit: 0.03,
      ...props,
    }),
    forwardedRef
  )

  // useImperativeHandle(forwardedRef, () => ({ getInput }))

  const position = useConstant(() => new Vector3())
  const quaternion = useConstant(() => new Quaternion())

  useLayoutEffect(() => {
    api.position.subscribe((pos) => {
      position.set(...pos)
    })
    api.quaternion.subscribe((rot) => {
      quaternion.set(...rot)
    })
  }, [])

  const currentPosition = useConstant(() => new Vector3())
  const currentLookAt = useConstant(() => new Vector3())

  useFrame((_, delta) => {
    const camera = cameraRef.current

    const idealOffset = new Vector3(0, 2, -4.8)
    idealOffset.applyQuaternion(quaternion)
    idealOffset.add(position)

    // console.log(idealOffset, position)

    const idealLookAt = new Vector3(0, 1, 5)
    idealLookAt.applyQuaternion(quaternion)
    idealLookAt.add(position)

    const t = 1.3 - Math.pow(0.001, delta)
    currentPosition.lerp(idealOffset, t)
    currentLookAt.lerp(idealLookAt, t)

    camera.position.copy(currentPosition)
    camera.lookAt(currentLookAt)
  })

  return (
    <group ref={forwardedRef} dispose={null}>
      <group position={[0, -0.4, 0]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_10.geometry}
          material={materials['Material.004']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_11.geometry}
          material={materials['Material.005']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_12.geometry}
          material={materials['Material.007']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_15.geometry}
          material={materials['Material.013']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_16.geometry}
          material={materials['Material.015']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_2.geometry}
          material={materials['Material.001']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_3.geometry}
          material={materials['Material.002']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_6.geometry}
          material={materials['Material.006']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_9.geometry}
          material={materials['Material.003']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_4.geometry}
          material={materials['Material.009']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_5.geometry}
          material={materials['Material.008']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_7.geometry}
          material={materials['Material.011']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Object_8.geometry}
          material={materials['Material.032']}
        />
      </group>
    </group>
  )
})

export { Skyline }

useGLTF.preload('/r34.gltf')
