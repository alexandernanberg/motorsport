import { useGLTF } from '@react-three/drei'

export function World() {
  return (
    <>
      {/* <Cylinder
        args={[1, 1]}
        mass={50}
        position={[-3, 6, -3]}
        rotation={[-Math.PI / 2, 0, 0]}
      /> 
      <TrafficCone position={[2, 1, 7]} />
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
