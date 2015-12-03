# Cozy-linux
Cozy SDK for Linux embedded

IoT devices usually require an Internet connection but most don't have a proper input/display (eg. a drone).
Cozy aims to solve this problem by providing an easy way to pass wifi credentials securely by using a smartphone as a configurator.

Cozy-linux is the embedded Linux based bluetooth service that runs on the device when not connected to the Internet and accepts the wifi credentials from mobile apps. Cozy-linux uses the excellent Bleno module for nodejs to achieve the BLE service implementation.

Test devices:
- Intel Edison
- UDOO Neo

Requirements:
- Nodejs
- Bleno (BLE under nodejs) https://github.com/sandeepmistry/bleno
- node-jquery-xhr (needed by Kii SDK)
- Kii JS SDK (included in repo)

How to run:

> sudo node cozy.js
