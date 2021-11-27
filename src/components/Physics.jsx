import { useFrame } from '@react-three/fiber'
import * as Ammo from 'ammo.js'
import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react'
import { Euler, Quaternion } from 'three'
import { useConstant } from '../utils'

const PhysicsContext = createContext(null)

export function Physics({ children, gravity = [0, -9.82, 0] }) {
  const world = useConstant(() => {
    const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration()
    const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration)
    const broadphase = new Ammo.btDbvtBroadphase()
    const solver = new Ammo.btSequentialImpulseConstraintSolver()
    const physicsWorld = new Ammo.btDiscreteDynamicsWorld(
      dispatcher,
      broadphase,
      solver,
      collisionConfiguration
    )
    physicsWorld.setGravity(new Ammo.btVector3(...gravity))
    return physicsWorld
  })

  const bodies = useConstant(() => ({}))

  useFrame((_, delta) => {
    // console.log('run')
    world.stepSimulation(delta, 10)
  })

  const context = useMemo(() => ({ world, bodies }), [bodies, world])

  return (
    <PhysicsContext.Provider value={context}>
      {children}
    </PhysicsContext.Provider>
  )
}

const DISABLE_DEACTIVATION = 4
const TRANSFORM_AUX = new Ammo.btTransform()
const ZERO_QUATERNION = new Quaternion(0, 0, 0, 1)

export function useBox(ref, fn, deps = []) {
  const context = useContext(PhysicsContext)
  // const opts = useConstant(() => {
  //   const props = fn()
  // })
  const bodyRef = useRef()

  const props = useConstant(() => ({
    mass: 0,
    friction: 1,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    ...fn(),
  }))

  console.log(props)

  useLayoutEffect(() => {
    const object = ref.current
    const {
      mass,
      position,
      rotation,
      args: [w, l, h],
    } = props

    const geometry = new Ammo.btBoxShape(
      new Ammo.btVector3(w * 0.5, l * 0.5, h * 0.5)
    )

    // TODO: Optimize?
    const quat = new Quaternion().setFromEuler(new Euler(...rotation))

    const transform = new Ammo.btTransform()
    transform.setIdentity()
    transform.setOrigin(new Ammo.btVector3(...position))
    transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w))
    const motionState = new Ammo.btDefaultMotionState(transform)

    const localInertia = new Ammo.btVector3(0, 0, 0)
    geometry.calculateLocalInertia(mass, localInertia)

    const rbInfo = new Ammo.btRigidBodyConstructionInfo(
      mass,
      motionState,
      geometry,
      localInertia
    )

    const body = new Ammo.btRigidBody(rbInfo)
    body.setFriction(props.friction)
    // body.setRestitution(.9);
    // body.setDamping(0.2, 0.2);
    context.world.addRigidBody(body)

    body.setActivationState(DISABLE_DEACTIVATION)

    bodyRef.current = body

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useFrame((_, delta) => {
    // console.log('box')
    // if (mass > 0) {
    const mesh = ref.current
    const body = bodyRef.current
    const motionState = body.getMotionState()

    if (motionState) {
      motionState.getWorldTransform(TRANSFORM_AUX)
      const p = TRANSFORM_AUX.getOrigin()
      const q = TRANSFORM_AUX.getRotation()

      // console.log(mesh)
      // console.log(p.x(), p.y(), p.z())
      mesh.position.set(p.x(), p.y(), p.z())
      mesh.quaternion.set(q.x(), q.y(), q.z(), q.w())
    }
    // }
  })

  return null
}
