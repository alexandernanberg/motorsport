import {
  Environment,
  Loader,
  OrbitControls,
  Sky as SkyShader,
  Stats,
} from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { button, useControls } from 'leva'
import { Perf } from 'r3f-perf'
import { Suspense, useEffect, useRef, useState } from 'react'
import { Vector3 } from 'three'
import {
  BallCollider,
  CuboidCollider,
  CylinderCollider,
  Physics,
  RigidBody,
} from './components/Physics'
import { useConstant } from './utils'

export function Root() {
  return (
    <>
      <Canvas shadows mode="concurrent" camera={{ position: [5, 4, -4] }}>
        <Suspense fallback={null}>
          <App />
        </Suspense>
      </Canvas>
      <Loader />
    </>
  )
}

export function App() {
  const [physicsKey, setPhysicsKey] = useState(1)
  const flags = useControls({
    debug: { label: 'Debug', value: false },
    _reset: {
      label: 'Reset physics',
      ...button(() => setPhysicsKey((s) => s + 1)),
    },
  })

  const [items, setItems] = useState<Array<number>>([])

  // useInterval(() => {
  //   setItems((state) => {
  //     const arr = [...state]
  //     const num = (arr[arr.length - 1] || 0) + 1
  //     arr.push(num)
  //     if (arr.length > 20) {
  //       arr.shift()
  //     }
  //     return arr
  //   })
  // }, 250)

  return (
    <>
      <Perf position="bottom-right" />
      <Stats />
      <fog attach="fog" args={[0xffffff, 10, 90]} />
      <Sky />

      <OrbitControls />

      <Physics debug={flags.debug} key={physicsKey}>
        <RigidBody type="static">
          <CuboidCollider args={[20, 0, 20]}>
            <mesh>
              <boxGeometry args={[20, 0, 20]} />
              <meshStandardMaterial color="white" />
            </mesh>
          </CuboidCollider>
        </RigidBody>

        {items.map((item) => (
          <RigidBody key={item} position={[0, 6, 0]}>
            <CuboidCollider args={[1, 1, 1]}>
              <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="blue" />
              </mesh>
            </CuboidCollider>
          </RigidBody>
        ))}

        <RigidBody position={[0.5, 1, 0]}>
          <BallCollider args={[0.5]}>
            <mesh>
              <sphereGeometry args={[0.5]} />
              <meshStandardMaterial color="red" />
            </mesh>
          </BallCollider>
        </RigidBody>

        <RigidBody position={[1, 4, 0]}>
          <CylinderCollider args={[0.5, 1]}>
            <mesh>
              <cylinderGeometry args={[0.5, 0.5, 1]} />
              <meshStandardMaterial color="red" />
            </mesh>
          </CylinderCollider>
        </RigidBody>

        <RigidBody position={[0, 5, 0]}>
          <CuboidCollider args={[1, 1, 1]}>
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="red" />
            </mesh>
          </CuboidCollider>
        </RigidBody>
      </Physics>
    </>
  )
}

function Sky() {
  const sunPosition = useConstant(() => new Vector3(100, 200, 100))

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

function useInterval<T extends () => void>(cb: T, delay?: number) {
  const ref = useRef<T>()

  useEffect(() => {
    ref.current = cb
  }, [cb])

  useEffect(() => {
    function tick() {
      ref.current?.()
    }
    if (delay !== null) {
      const id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay])
}
