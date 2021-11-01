import { useFrame, useThree } from '@react-three/fiber'
import { forwardRef, useEffect, useImperativeHandle } from 'react'
import { Vector2 } from 'three'
import { useConstant } from './utils'

function applyDeadzone(number, threshold) {
  let percentage = (Math.abs(number) - threshold) / (1 - threshold)

  if (percentage < 0) {
    percentage = 0
  }

  return percentage * (number > 0 ? 1 : -1)
}

export const InputManager = forwardRef(function InputManager(
  { cameraRef },
  forwardedRef
) {
  const gl = useThree((state) => state.gl)

  const state = useConstant(() => ({
    movement: new Vector2(0, 0),
    lookAt: new Vector2(0, 0),
    keyboard: {},
    gamepadIndex: null,
    pointerLocked: false,
  }))

  const getInput = () => {
    const input = state

    if (state.gamepadIndex !== null) {
      const gamepad = navigator.getGamepads()[state.gamepadIndex]
      input.movement.x = applyDeadzone(gamepad.axes[0], 0.25) * -1
      input.movement.y = applyDeadzone(gamepad.axes[1], 0.25) * -1
    }

    return state
  }

  useImperativeHandle(forwardedRef, () => ({ getInput }))

  useEffect(() => {
    const updateMovementFromKeyboard = () => {
      let x = 0
      let y = 0

      if (state.keyboard.KeyW || state.keyboard.ArrowUp) {
        y += 1
      }
      if (state.keyboard.KeyA || state.keyboard.ArrowLeft) {
        x += 1
      }
      if (state.keyboard.KeyS || state.keyboard.ArrowDown) {
        y -= 1
      }
      if (state.keyboard.KeyD || state.keyboard.ArrowRight) {
        x -= 1
      }

      state.movement.set(x, y)
    }

    const onKeyDown = (event) => {
      state.keyboard[event.code] = true
      updateMovementFromKeyboard()
    }

    const onKeyUp = (event) => {
      state.keyboard[event.code] = false
      updateMovementFromKeyboard()
    }

    document.addEventListener('keydown', onKeyDown, false)
    document.addEventListener('keyup', onKeyUp, false)

    return () => {
      document.removeEventListener('keydown', onKeyDown, false)
      document.removeEventListener('keyup', onKeyUp, false)
    }
  }, [state.keyboard, state.movement])

  useEffect(() => {
    const domElement = gl.domElement

    const onPointerMove = (event) => {
      const { movementX, movementY } = event

      state.lookAt.x -= movementX
      state.lookAt.y -= movementY
    }

    // const onClick = () => {
    //   domElement.requestPointerLock();
    // };

    const onPointerLockChange = () => {
      state.pointerLocked = document.pointerLockElement === domElement
    }

    // domElement.addEventListener("click", onClick, false);
    domElement.addEventListener('pointerlockchange', onPointerLockChange)
    domElement.addEventListener('pointerlockerror', (e) => {
      console.log('err', e)
    })

    document.addEventListener('pointermove', onPointerMove, false)

    return () => {
      document.removeEventListener('pointermove', onPointerMove, false)
    }
  }, [cameraRef, gl.domElement, state, state.lookAt])

  useEffect(() => {
    const onConnect = (event) => {
      console.log(
        'Gamepad connected at index %d: %s. %d buttons, %d axes.',
        event.gamepad.index,
        event.gamepad.id,
        event.gamepad.buttons,
        event.gamepad.axes
      )
      if (state.gamepadIndex === null) {
        state.gamepadIndex = event.gamepad.index
      }
    }

    const onDisconnect = (event) => {
      if (event.gamepad.id === state.gamepadIndex) {
        state.gamepadIndex = null
      }
    }

    window.addEventListener('gamepadconnected', onConnect, true)
    window.addEventListener('gamepaddisconnected', onDisconnect, true)

    return () => {
      window.removeEventListener('gamepadconnected', onConnect, true)
      window.removeEventListener('gamepaddisconnected', onDisconnect, true)
    }
  })

  useFrame(() => {
    // console.log(state.gamepadIndex?.axes);
    // console.log(state.movement);
  })

  return null
})
