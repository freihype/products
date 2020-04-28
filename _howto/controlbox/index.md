---
image: /pp/_howto/controlbox/5.JPG
category: "general"
title: "Control Box"
---


# Shredder / Extrusion controller

## Features

- Auto-Reverse. Supports 3 different methods : IR Sensor (recommended), hall sensor and proximity sensor
- Overheat protection
- Error and status feedback via LEDs
- Reset button
- Direction switch
- Hopper sensors
- Emergency switch
- Semi automatic extrusion control

## Behaviours

- If jamming occurred 3 times, it stops all and goes in fatal mode, indicated by red blinking LED. In this case you push reset and/or switch to stop and then again forward after un-jamming the shredder or extrusion
- If power comes back whilst direction is still set to forward, it waits til the user switches to stop and explicit switches to forward again
- If hopper sensors are installed, the motor will stop when opening the hopper
- Uninterrupted shredding will stop after one hour automatically. In later releases this time will be exteneded according to measured activity via HAL and/or speed sensor. That's a safety feature in case the operator got a heart attack, etc...
- If set to extrusion mode, the motor won't start before the barrel didn't heat up for at least some time.
