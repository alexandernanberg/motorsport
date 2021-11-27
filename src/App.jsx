import {
  Environment,
  Loader,
  OrbitControls,
  PerspectiveCamera,
  Sky as SkyShader,
  Stats,
} from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { forwardRef, Suspense, useLayoutEffect, useRef } from 'react'
import { Vector3 } from 'three'
import { InputManager } from './components/InputManager'
import { Physics } from './components/Physics'
import { Skyline } from './models/Skyline'
import { World } from './models/World'
import { useConstant } from './utils'

function Sky() {
  const sunPosition = [100, 200, 100]

  return (
    <>
      <SkyShader
        sunPosition={sunPosition}
        distance={10000}
        mieDirectionalG={0.9}
      />
      <hemisphereLight
        args={[0xffffff, 0xffffff, 1.0]}
        color={0x7095c1}
        position={[0, 50, 0]}
        groundColor={0xcbc1b2}
      />
      <directionalLight
        position={sunPosition}
        castShadow
        shadow-mapSize={[1024, 1024]}
        // shadow-camera-left={-5}
        // shadow-camera-right={5}
        // shadow-camera-top={5}
        // shadow-camera-bottom={-5}
        // shadow-camera-near={1}
        // shadow-camera-far={20}
      />
      <Environment preset="park" />
    </>
  )
}

export function App() {
  const cameraRef = useRef()
  const playerRef = useRef()
  const inputRef = useRef()
  const flags = useControls(
    {
      Debug: false,
    },
    {}
  )

  return (
    <>
      <Canvas shadows mode="concurrent" camera={{ position: [5, 4, -4] }}>
        <Suspense fallback={null}>
          <Stats />
          <fog attach="fog" args={[0xffffff, 10, 90]} />
          <Sky />
          <Environment preset="park" />
          <InputManager ref={inputRef} cameraRef={cameraRef} />
          <Physics>
            <World />
            {/* <Player
                ref={playerRef}
                inputRef={inputRef}
                cameraRef={cameraRef}
              /> */}
          </Physics>
          <OrbitControls />
          {/* <ThirdPersonCamera
            ref={cameraRef}
            targetRef={playerRef}
            inputRef={inputRef}
          /> */}
        </Suspense>
      </Canvas>
      <Loader />
    </>
  )
}

const ThirdPersonCamera = forwardRef(function ThirdPersonCamera(
  { targetRef, inputRef },
  forwardedRef
) {
  const ref = useRef()
  const cameraRef = forwardedRef || ref
  const groupRef = useRef()

  const currentPosition = useConstant(() => new Vector3())
  const currentLookAt = useConstant(() => new Vector3())

  useLayoutEffect(() => {
    // const target = targetRef.current
    // console.log(target.position)
  })

  useFrame((_, delta) => {
    const camera = cameraRef.current
    const target = targetRef.current

    // const idealOffset = new Vector3(0, 2, -3.5)
    // idealOffset.applyQuaternion(target.quaternion)
    // idealOffset.add(target.position)

    // const idealLookAt = new Vector3(0, 1, 5)
    // idealLookAt.applyQuaternion(target.quaternion)
    // idealLookAt.add(target.position)

    // const t = 1.05 - Math.pow(0.001, delta)
    // currentPosition.lerp(idealOffset, t)
    // currentLookAt.lerp(idealLookAt, t)

    // camera.position.copy(currentPosition)
    // camera.lookAt(currentLookAt)
  })

  return (
    <group rotate={[1, 1, 1]} ref={groupRef}>
      <PerspectiveCamera
        makeDefault
        ref={cameraRef}
        fov={90}
        position={[0, 4, 8]}
        zoom={1.2}
        near={0.1}
        far={1000}
      />
    </group>
  )
})

const Player = forwardRef(function Player(
  { inputRef, cameraRef },
  forwardedRef
) {
  const ref = useRef()
  const playerRef = forwardedRef || ref

  return <Skyline ref={playerRef} inputRef={inputRef} cameraRef={cameraRef} />
})
