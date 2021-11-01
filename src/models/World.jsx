import { useBox, useCylinder, usePlane } from '@react-three/cannon'
import { useGLTF } from '@react-three/drei'
import TrafficCone from './TrafficCone'

function Plane(props) {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
    material: {
      friction: 0.8,
    },
    ...props,
  }))

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <planeBufferGeometry args={props.args} />
      <meshStandardMaterial color="white" />
    </mesh>
  )
}

function Cylinder(props) {
  const [ref] = useCylinder(() => ({ ...props }))
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <cylinderBufferGeometry args={props.args} />
      <meshStandardMaterial color="green" />
    </mesh>
  )
}

function Box(props) {
  const [ref] = useBox(() => ({ ...props }))
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxBufferGeometry args={props.args} />
      <meshStandardMaterial color="blue" />
    </mesh>
  )
}

export function World() {
  return (
    <>
      <Plane args={[100, 100]} />
      <Cylinder
        args={[1, 1]}
        mass={50}
        position={[-3, 6, -3]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <Box args={[1, 1, 1]} mass={100} position={[-5, 1, 3]} />
      <Box args={[1, 3, 1]} mass={100} position={[-5, 1, 6]} />
      <TrafficCone position={[2, 1, 7]} />
      <TrafficCone position={[1, 1, 7]} />
      <TrafficCone position={[0, 1, 7]} />
      <TrafficCone position={[-1, 1, 7]} />
      <TrafficCone position={[-2, 1, 7]} />
      <TrafficCone position={[2, 1, 8]} />
      <TrafficCone position={[1, 1, 8]} />
      <TrafficCone position={[0, 1, 8]} />
      <TrafficCone position={[-1, 1, 8]} />
      <TrafficCone position={[-2, 1, 8]} />
    </>
  )
}

useGLTF.preload('/world-simple.gltf')
