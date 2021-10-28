import {
  Debug,
  Physics,
  useBox,
  useCylinder,
  usePlane,
} from "@react-three/cannon";
import {
  Environment,
  Loader,
  OrbitControls,
  PerspectiveCamera,
  Sky,
  Stats,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import {
  forwardRef,
  Suspense,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { Layers, Vector2, Vector3 } from "three";
import { Map } from "./models/Map";
import { Skyline } from "./models/Skyline";

const layers = new Layers();
layers.enable(1);

function Plane(props) {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [1, 1, 1],
    friction: 20,
    ...props,
  }));
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <planeBufferGeometry args={[10, 10]} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
}

function Cylinder(props) {
  const [ref] = useCylinder(() => ({
    mass: 10,
    position: [0, 6, -3],
    rotation: [-Math.PI / 2, 0, 0],
    ...props,
  }));
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <cylinderBufferGeometry args={[1, 1]} />
      <meshStandardMaterial color="green" />
    </mesh>
  );
}

function Cube(props) {
  const [ref] = useBox(() => ({ mass: 100, position: [0, 6, 3], ...props }));
  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxBufferGeometry args={[1, 1]} />
      <meshStandardMaterial color="blue" />
    </mesh>
  );
}

function ToggablePysicsDebug({ enabled = false, children }) {
  if (enabled) {
    return <Debug color="red">{children}</Debug>;
  }

  return children;
}

export function App() {
  const cameraRef = useRef();
  const playerRef = useRef();
  const inputRef = useRef();
  const flags = useControls(
    {
      Debug: false,
    },
    {}
  );

  const sunPosition = [100, 100, 100];

  return (
    <>
      <Canvas shadows mode="concurrent">
        <Suspense fallback={null}>
          <Stats />
          <fog attach="fog" args={["white", 0, 500]} />
          <Sky
            sunPosition={sunPosition}
            distance={10000}
            mieDirectionalG={0.9}
          />
          <ambientLight intensity={0.1} />
          <directionalLight
            position={sunPosition}
            shadow-bias={-0.001}
            shadow-mapSize={[4096, 4096]}
            shadow-camera-left={-150}
            shadow-camera-right={150}
            shadow-camera-top={150}
            shadow-camera-bottom={-150}
            castShadow
          />
          <Environment preset="park" />
          <Map />
          <InputControls ref={inputRef} cameraRef={cameraRef} />
          <Physics broadphase="SAP" allowSleep gravity={[0, -9.81, 0]}>
            <ToggablePysicsDebug enabled={flags.Debug}>
              <Cylinder />
              <Plane />
              <Cube />
              <Player ref={playerRef} inputRef={inputRef} />
            </ToggablePysicsDebug>
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
  );
}

const ThirdPersonCamera = forwardRef(function ThirdPersonCamera(
  { targetRef, inputRef },
  forwardedRef
) {
  const ref = useRef();
  const cameraRef = forwardedRef || ref;
  const groupRef = useRef();

  const currentPosition = useConstant(() => new Vector3());
  const currentLookAt = useConstant(() => new Vector3());

  useFrame((_, delta) => {
    const camera = cameraRef.current;
    const target = targetRef.current;
    // const group = groupRef.current;
    // const input = inputRef.current.getInput();

    const idealOffset = new Vector3(0, 2, -3.5);
    idealOffset.applyQuaternion(target.quaternion);
    idealOffset.add(target.position);

    const idealLookAt = new Vector3(0, 1, 5);
    idealLookAt.applyQuaternion(target.quaternion);
    idealLookAt.add(target.position);

    const t = 1.05 - Math.pow(0.001, delta);
    currentPosition.lerp(idealOffset, t);
    currentLookAt.lerp(idealLookAt, t);

    camera.position.copy(currentPosition);
    camera.lookAt(currentLookAt);
  });

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
  );
});

/*
=============================================
  InputControls
=============================================
*/

function applyDeadzone(number, threshold) {
  let percentage = (Math.abs(number) - threshold) / (1 - threshold);

  if (percentage < 0) {
    percentage = 0;
  }

  return percentage * (number > 0 ? 1 : -1);
}

const InputControls = forwardRef(function InputControls(
  { cameraRef },
  forwardedRef
) {
  const gl = useThree((state) => state.gl);

  const state = useConstant(() => ({
    movement: new Vector2(0, 0),
    lookAt: new Vector2(0, 0),
    keyboard: {},
    gamepadIndex: null,
    pointerLocked: false,
  }));

  const getInput = () => {
    const input = state;

    if (state.gamepadIndex !== null) {
      const gamepad = navigator.getGamepads()[state.gamepadIndex];
      input.movement.x = applyDeadzone(gamepad.axes[0], 0.25) * -1;
      input.movement.y = applyDeadzone(gamepad.axes[1], 0.25) * -1;
    }

    return state;
  };

  useImperativeHandle(forwardedRef, () => ({ getInput }));

  useEffect(() => {
    const updateMovementFromKeyboard = () => {
      let x = 0;
      let y = 0;

      if (state.keyboard.KeyW || state.keyboard.ArrowUp) {
        y += 1;
      }
      if (state.keyboard.KeyA || state.keyboard.ArrowLeft) {
        x += 1;
      }
      if (state.keyboard.KeyS || state.keyboard.ArrowDown) {
        y -= 1;
      }
      if (state.keyboard.KeyD || state.keyboard.ArrowRight) {
        x -= 1;
      }

      state.movement.set(x, y);
    };

    const onKeyDown = (event) => {
      state.keyboard[event.code] = true;
      updateMovementFromKeyboard();
    };

    const onKeyUp = (event) => {
      state.keyboard[event.code] = false;
      updateMovementFromKeyboard();
    };

    document.addEventListener("keydown", onKeyDown, false);
    document.addEventListener("keyup", onKeyUp, false);

    return () => {
      document.removeEventListener("keydown", onKeyDown, false);
      document.removeEventListener("keyup", onKeyUp, false);
    };
  }, [state.keyboard, state.movement]);

  useEffect(() => {
    const domElement = gl.domElement;

    const onPointerMove = (event) => {
      const { movementX, movementY } = event;

      state.lookAt.x -= movementX;
      state.lookAt.y -= movementY;
    };

    // const onClick = () => {
    //   domElement.requestPointerLock();
    // };

    const onPointerLockChange = () => {
      state.pointerLocked = document.pointerLockElement === domElement;
    };

    // domElement.addEventListener("click", onClick, false);
    domElement.addEventListener("pointerlockchange", onPointerLockChange);
    domElement.addEventListener("pointerlockerror", (e) => {
      console.log("err", e);
    });

    document.addEventListener("pointermove", onPointerMove, false);

    return () => {
      document.removeEventListener("pointermove", onPointerMove, false);
    };
  }, [cameraRef, gl.domElement, state, state.lookAt]);

  useEffect(() => {
    const onConnect = (event) => {
      console.log(
        "Gamepad connected at index %d: %s. %d buttons, %d axes.",
        event.gamepad.index,
        event.gamepad.id,
        event.gamepad.buttons,
        event.gamepad.axes
      );
      if (state.gamepadIndex === null) {
        state.gamepadIndex = event.gamepad.index;
      }
    };

    const onDisconnect = (event) => {
      if (event.gamepad.id === state.gamepadIndex) {
        state.gamepadIndex = null;
      }
    };

    window.addEventListener("gamepadconnected", onConnect, true);
    window.addEventListener("gamepaddisconnected", onDisconnect, true);

    return () => {
      window.removeEventListener("gamepadconnected", onConnect, true);
      window.removeEventListener("gamepaddisconnected", onDisconnect, true);
    };
  });

  useFrame(() => {
    // console.log(state.gamepadIndex?.axes);
    // console.log(state.movement);
  });

  return null;
});

/**
 * Player
 */

const Player = forwardRef(function Player({ inputRef }, forwardedRef) {
  const ref = useRef();
  const playerRef = forwardedRef || ref;

  // const decceleration = useConstant(() => new Vector3(-0.001, 1, -10));
  // const acceleration = useConstant(() => new Vector3(0.25, 100, 100));
  // const velocity = useConstant(() => new Vector3(0, 0, 0));

  // useFrame((state, delta) => {
  //   const input = inputRef.current.getInput();
  //   const player = playerRef.current;

  //   const frameDecceleration = new Vector3(
  //     velocity.x * decceleration.x,
  //     velocity.y * decceleration.y,
  //     velocity.z * decceleration.z
  //   );
  //   frameDecceleration.multiplyScalar(delta);
  //   frameDecceleration.z =
  //     Math.sign(frameDecceleration.z) *
  //     Math.min(Math.abs(frameDecceleration.z), Math.abs(velocity.z));

  //   velocity.add(frameDecceleration);

  //   const axis = new Vector3();
  //   const quat = new Quaternion();
  //   const playerQuat = player.quaternion.clone();
  //   const acc = acceleration.clone();

  //   velocity.z += input.movement.y * acc.z * delta;

  //   axis.set(0, 1, 0);
  //   quat.setFromAxisAngle(
  //     axis,
  //     4.0 * input.movement.x * Math.PI * delta * acc.x
  //   );
  //   playerQuat.multiply(quat);
  //   player.quaternion.copy(playerQuat);

  //   const forward = new Vector3(0, 0, 1);
  //   forward.applyQuaternion(player.quaternion);
  //   forward.normalize();

  //   const sideways = new Vector3(1, 0, 0);
  //   sideways.applyQuaternion(player.quaternion);
  //   sideways.normalize();

  //   velocity.y += acc.y;
  //   velocity.y = Math.max(velocity.y, -100);

  //   sideways.multiplyScalar(velocity.x * delta);
  //   forward.multiplyScalar(velocity.z * delta);

  //   player.position.add(forward);
  //   player.position.add(sideways);
  // });

  return <Skyline ref={playerRef} inputRef={inputRef} />;
});

/**
 * Create constant only once.
 * @template T
 * @param {() => T} fn
 * @return {T}
 */
function useConstant(fn) {
  const ref = useRef();

  if (!ref.current) {
    ref.current = { v: fn() };
  }

  return ref.current.v;
}
