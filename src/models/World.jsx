import { useHeightfield } from '@react-three/cannon'
import { useGLTF } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import { Raycaster, Vector3 } from 'three'
import { Geometry } from 'three-stdlib'

export function World(props) {
  const group = useRef()
  const { nodes, materials } = useGLTF('/world-simple.gltf')

  const geometry = useMemo(
    () => new Geometry().fromBufferGeometry(nodes.Grid.geometry),
    [nodes]
  )

  console.log(geometry)
  console.log(nodes.Grid)

  const heightMap = useMemo(() => {
    const {
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, z: maxZ },
    } = geometry.boundingBox

    const pointDistance = 1

    const width = Math.floor(maxX - minX)
    const length = Math.floor(maxZ - minZ)
    const sizeX = width / pointDistance + 1
    const sizeZ = length / pointDistance + 1

    const matrix = []

    for (let i = 0; i < sizeX; i++) {
      matrix.push([])
      for (let j = 0; j < sizeZ; j++) {
        // if (i === 0 || i === sizeX - 1 || j === 0 || j === sizeZ - 1) {
        //   const height = 3;
        //   matrix[i].push(height);
        //   continue;
        // }

        // const height =
        //   Math.cos((i / sizeX) * Math.PI * 2) *
        //     Math.cos((j / sizeZ) * Math.PI * 2) +
        //   2;
        const height = 0
        matrix[i].push(height)
      }
    }

    console.log(matrix.flat())

    return {
      matrix,
      position: [minX, 0, maxZ],
      elementSize: pointDistance,
    }
  }, [geometry])

  // const foo = useAsset(() => {
  //   return getHeightfieldFromMesh(geo);
  // }, geo);

  // console.log(foo);

  useHeightfield(
    () => ({
      args: [heightMap.matrix, { elementSize: heightMap.elementSize }],
      position: heightMap.position,
      rotation: [-Math.PI / 2, 0, 0],
      material: {
        friction: 0.99,
      },
    }),
    undefined,
    []
  )

  return (
    <group ref={group} {...props} dispose={null}>
      <mesh
        // ref={ref}
        castShadow
        receiveShadow
        geometry={nodes.Grid.geometry}
        material={nodes.Grid.material}
      />
    </group>
  )
}

useGLTF.preload('/world-simple.gltf')

async function getHeightMapFromGeometry(mesh, geometry, pointDistance = 1) {
  const rayCaster = new Raycaster()
  const rayCasterPosition = new Vector3()
  const upAxis = new Vector3(0, 1, 0)

  console.log(mesh)
  console.log(geometry)

  const heightMap = []

  geometry.computeBoundingBox()
  const {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, z: maxZ },
  } = geometry.boundingBox

  const width = maxX - minX
  const length = maxZ - minZ
  const totalX = width / pointDistance + 1
  const totalZ = length / pointDistance + 1
  const totalSteps = totalX * totalZ
  let currentStep = 0

  for (let x = minX; x <= maxX; x += pointDistance) {
    const heightDataRow = []
    heightMap.push(heightDataRow)

    for (let z = maxZ; z >= minZ; z -= pointDistance) {
      rayCasterPosition.set(x, minY, z)
      rayCaster.set(rayCasterPosition, upAxis)

      // console.log(x, minY, z);

      const result = rayCaster.intersectObject(mesh, true)
      // console.log(result);
      // const y = result.distance;

      // heightDataRow.push(y);
    }
  }

  var position = [minX, 0, maxZ]

  return heightMap
}

// async function generateHeightfieldFromMesh(
//   mesh /*: Mesh*/,
//   pointDistance /*: number*/
// ) {
//   // https://threejs.org/docs/index.html#api/en/core/Raycaster
//   const rayCaster = new Raycaster();
//   const rayCasterPosition = new Vector3();
//   const upAxis = new Vector3(0, 1, 0);

//   const heightMap = [];

//   const geometry = findGeometry(mesh);
//   geometry.computeBoundingBox();
//   const {
//     min: { x: minX, y: minY, z: minZ },
//     max: { x: maxX, z: maxZ },
//   } = geometry.boundingBox;

//   const width = maxX - minX;
//   const length = maxZ - minZ;
//   const totalX = width / pointDistance + 1;
//   const totalZ = length / pointDistance + 1;
//   const totalSteps = totalX * totalZ;
//   let currentStep = 0;

//   for (let x = minX; x <= maxX; x += pointDistance) {
//     const heightDataRow = [];
//     heightMap.push(heightDataRow);

//     for (let z = maxZ; z >= minZ; z -= pointDistance) {
//       rayCasterPosition.set(x, minY, z);
//       rayCaster.set(rayCasterPosition, upAxis);

//       const y = await calculateMeshSurfaceDistanceByRayCast();

//       heightDataRow.push(y);
//     }
//   }

//   var position = [minX, 0, maxZ];

//   // const terrainShape = new CANNON.Heightfield(heightMap, {
//   //   elementSize: pointDistance,
//   // });
//   // const heightfield = new CANNON.Body({ mass: 0, shape: terrainShape });
//   // heightfield.quaternion.setFromAxisAngle(
//   //   new CANNON.Vec3(1, 0, 0),
//   //   -Math.PI / 2
//   // );
//   // heightfield.position.set(minX, 0, maxZ);

//   // return heightfield;
// }
