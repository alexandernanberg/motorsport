/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
*/

import { useGLTF } from '@react-three/drei'

export default function TrafficCone() {
  const { nodes, materials } = useGLTF('/traffic-cone.gltf')

  return (
    <group dispose={null}>
      <group position={[0, -0.38, 0]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Cube.geometry}
          material={nodes.Cube.material}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Cylinder_1.geometry}
          material={materials['Material.001']}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.Cylinder_2.geometry}
          material={nodes.Cylinder_2.material}
        />
      </group>
    </group>
  )
}

useGLTF.preload('/traffic-cone.gltf')
