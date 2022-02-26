import * as RAPIER from '@dimforge/rapier3d-compat'
import type { Object3DNode } from '@react-three/fiber'
import { useFrame } from '@react-three/fiber'
import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useRef } from 'react'
import { suspend } from 'suspend-react'
import type { Object3D } from 'three'
import { useConstant } from '../utils'

// Temporary solution until the PR is merged.
// https://github.com/pmndrs/react-three-fiber/pull/2099#issuecomment-1050891821
export type Object3DProps = Object3DNode<THREE.Object3D, typeof Object3D>
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      object3D: Object3DProps
    }
  }
}

///////////////////////////////////////////////////////////////
// PhysicsContext
///////////////////////////////////////////////////////////////

interface PhysicsContextValue {
  world: RAPIER.World
  debug: boolean
}

const PhysicsContext = createContext<PhysicsContextValue | null>(null)

function usePhysicsContext() {
  const context = useContext(PhysicsContext)

  if (!context) {
    throw new Error(
      'usePhysicsContext() may be used only in the context of a <Physics> component.'
    )
  }

  return context
}

///////////////////////////////////////////////////////////////
// Physics
///////////////////////////////////////////////////////////////

interface PhysicsProps {
  children: ReactNode
  debug?: boolean
}

export function Physics({ children, debug = false }: PhysicsProps) {
  suspend(() => RAPIER.init(), ['rapier'])

  const world = useConstant(() => {
    const gravity = { x: 0.0, y: -9.81, z: 0.0 }
    return new RAPIER.World(gravity)
  })

  useFrame(() => {
    world.step()
  })

  const context = useMemo(() => ({ world, debug }), [debug, world])

  return (
    <PhysicsContext.Provider value={context}>
      {children}
    </PhysicsContext.Provider>
  )
}

///////////////////////////////////////////////////////////////
// RigidBody
///////////////////////////////////////////////////////////////

const RigidBodyContext = createContext<RAPIER.RigidBody | null>(null)

type RigidBodyType = 'dynamic' | 'static'

interface RigidBodyProps {
  children: ReactNode
  position?: [number, number, number]
  type?: RigidBodyType
}

export function RigidBody({
  children,
  position,
  type = 'dynamic',
}: RigidBodyProps) {
  const { world } = usePhysicsContext()
  const ref = useRef<Object3D>(null)

  const rigidBody = useConstant(() => {
    let rigidBodyDesc: RAPIER.RigidBodyDesc
    switch (type) {
      case 'dynamic':
        rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic()
        break
      case 'static':
        rigidBodyDesc = RAPIER.RigidBodyDesc.newStatic()
        break
      default:
        throw new Error(`Unsupported RigidBody.type: "${type}"`)
    }

    if (position) {
      rigidBodyDesc.setTranslation(...position)
    }

    return world.createRigidBody(rigidBodyDesc)
  })

  // Remove the rigid body whenever the component unmounts.
  useEffect(() => {
    return () => world.removeRigidBody(rigidBody)
  }, [rigidBody, world])

  useFrame(() => {
    const object3d = ref.current
    if (!object3d) return

    if (!rigidBody.isSleeping()) {
      const pos = rigidBody.translation()
      const rot = rigidBody.rotation()

      object3d.position.set(pos.x, pos.y, pos.z)
      object3d.quaternion.set(rot.x, rot.y, rot.z, rot.w)
    }
  })

  return (
    <RigidBodyContext.Provider value={rigidBody}>
      <object3D ref={ref}>{children}</object3D>
    </RigidBodyContext.Provider>
  )
}

///////////////////////////////////////////////////////////////
// Colliders
///////////////////////////////////////////////////////////////

interface ColliderProps {
  position?: [number, number, number]
  children: ReactNode
}

export function useCollider(
  cb: () => RAPIER.ColliderDesc,
  props: Omit<ColliderProps, 'children'>
) {
  const rigidBody = useContext(RigidBodyContext)
  const { world } = usePhysicsContext()

  return useConstant(() => {
    const { position } = props
    const colliderDesc = cb()

    if (position) {
      colliderDesc.setTranslation(...position)
    }

    if (rigidBody) {
      return world.createCollider(colliderDesc, rigidBody.handle)
    }

    return world.createCollider(colliderDesc)
  })
}

interface CuboidColliderProps extends ColliderProps {
  args: [width: number, height: number, depth: number]
}

export function CuboidCollider({
  children,
  args,
  ...props
}: CuboidColliderProps) {
  const { debug } = usePhysicsContext()

  useCollider(
    () => RAPIER.ColliderDesc.cuboid(args[0] / 2, args[1] / 2, args[2] / 2),
    props
  )

  return (
    <object3D>
      {debug && (
        <mesh>
          <boxGeometry args={args} />
          <meshBasicMaterial wireframe color={0x0000ff} />
        </mesh>
      )}
      {children}
    </object3D>
  )
}

interface BallColliderProps extends ColliderProps {
  args: [radius: number]
}

export function BallCollider({ children, args, ...props }: BallColliderProps) {
  const { debug } = usePhysicsContext()

  useCollider(() => RAPIER.ColliderDesc.ball(args[0]), props)

  return (
    <object3D>
      {debug && (
        <mesh>
          <sphereGeometry args={args} />
          <meshBasicMaterial wireframe color={0x00ff00} />
        </mesh>
      )}
      {children}
    </object3D>
  )
}

interface CylinderColliderProps extends ColliderProps {
  args: [radius: number, height: number]
}

export function CylinderCollider({
  children,
  args,
  ...props
}: CylinderColliderProps) {
  const { debug } = usePhysicsContext()
  const [radius, height] = args

  useCollider(() => RAPIER.ColliderDesc.cylinder(height / 2, radius), props)

  return (
    <object3D>
      {debug && (
        <mesh>
          <cylinderGeometry args={[radius, radius, height, 32]} />
          <meshBasicMaterial wireframe color={0x00ff00} />
        </mesh>
      )}
      {children}
    </object3D>
  )
}
