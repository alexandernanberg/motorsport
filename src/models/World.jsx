import { useGLTF } from '@react-three/drei'
import { useRef } from 'react'
import { useBox } from '../components/Physics'

function Plane(props) {
  const ref = useRef(null)
  useBox(ref, () => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    ...props,
  }))

  return (
    <mesh
      ref={ref}
      castShadow
      receiveShadow
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      {...props}
    >
      <planeBufferGeometry args={[100, 100]} />
      <meshStandardMaterial color="gray" />
    </mesh>
  )
}

function Cylinder(props) {
  // const [ref] = useCylinder(() => ({ ...props }))
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <cylinderBufferGeometry args={props.args} />
      <meshStandardMaterial color="green" />
    </mesh>
  )
}

// const EntityContext = createContext()

// function Entity(props) {
//   const context  = {}

//   return (
//     <EntityContext.Provider value={context}>
// hello
//     </EntityContext.Provider>
//   )
// }

// function Example() {
//   return (
//     <Entity>
//       <Collider></Collider>
//     </Entity>
//   )
// }

function Box(props) {
  const ref = useRef(null)
  useBox(ref, () => ({ ...props }))
  return (
    <mesh ref={ref} castShadow receiveShadow {...props}>
      <boxBufferGeometry args={props.args} />
      <meshStandardMaterial color="blue" />
    </mesh>
  )
}

export function World() {
  return (
    <>
      <Plane args={[100, 100, 0.1]} />
      {/* <Cylinder
        args={[1, 1]}
        mass={50}
        position={[-3, 6, -3]}
        rotation={[-Math.PI / 2, 0, 0]}
      /> */}
      <Box args={[1, 1, 1]} mass={100} position={[0, 5, 1]} />
      <Box args={[1, 3, 1]} mass={10} position={[0, 4, 1]} />
      {/* <TrafficCone position={[2, 1, 7]} />
      <TrafficCone position={[1, 1, 7]} />
      <TrafficCone position={[0, 1, 7]} />
      <TrafficCone position={[-1, 1, 7]} />
      <TrafficCone position={[-2, 1, 7]} />
      <TrafficCone position={[2, 1, 8]} />
      <TrafficCone position={[1, 1, 8]} />
      <TrafficCone position={[0, 1, 8]} />
      <TrafficCone position={[-1, 1, 8]} />
      <TrafficCone position={[-2, 1, 8]} /> */}
    </>
  )
}

useGLTF.preload('/world-simple.gltf')
