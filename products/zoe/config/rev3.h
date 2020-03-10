#ifndef CONFIG_H
#define CONFIG_H

#include "enums.h"
#include "macros.h"

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Core settings
//

#define LOOP_DELAY              100         // Our frame time, exluding delays in some places
#define BOOT_DELAY              1000        // Wait at least this amount in ms after boot before doing anything

// Please consider to set this to false for production - especially with the full feature set since this is requiring extra
// time for the serial communication and will affect the overall framerate/performance
#define DEBUG true

#define DEBUG_INTERVAL          100
#define DEBUG_BAUD_RATE         19200       // Serial port speed

#define RELAY_ON 0                          // The relay bank's on value (eg: normally closed) 
#define RELAY_OFF 255                       // The relay bank's off value (eg: normally closed) 

#define DIR_SWITCH_UP_PIN       4           // The 3 position's up output
#define DIR_SWITCH_DOWN_PIN     5           // The 3 position's down output
// #define IGNORE_FIRST_DIRECTION              // Uncomment to ignore the 3pos switch (forward/reverse) after booting. This prevents surprises but possibly also accidents.
//#define DIR_SWITCH_DELAY        500      // If defined, add this as blocking delay between direction changes. Needed for some types of relays.

#define USE_UNO                             // On Arduino Uno we have only limited ports which are not enough to enable all features.

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Motor settings
//

#define FWD_PIN                 A4          // VFD FWD Pin. This goes into the relay and then into the VFD.
#define REV_PIN                 A5          // VFD REV Pin. This goes into the relay and then into the VFD.

// Threshold, if after this time the motor doesn't spin, abort!
// That can happen when the shredder or extrusion heavily jammed. Uncomment to activate this feature.
#define STARTING_MIN_TIME       1800        
// Threshold, time needed to have the motor on target speed but incl. some time to have shredded some material. 
// This may depend also on the VFDs primary acceleration time.
#define STARTING_TIMEOUT        3500        

// Threshold, if after that time the motor doesn't spin, abort ! 
// That can happen when the shredder or extrusion heavily jammed. Uncomment to activate this feature.
#define REVERSE_MIN_TIME        2800        
// Threshold, time needed to have the motor on target speed but also rotated for some time.
#define REVERSING_TIMEOUT       3200

// When shredding, stop all after this time. Uncomment to activate.
// This will be only used when AUTO_REVERSE_MODE is not AR_MODE::EXTRUSION.
// That means of course that shredding will always stop after one hour. 
// I considered this a safety feature and will be of importance when the operator is absent unexpectly.
// @TODO: in case there is a VFD speed sensor, or a hall sensor : augment mean deltas to determine 'activity' which
// will then extend the time. It may make sense to apply this feature also for extruding then.
#define MAX_SHRED_TIME          HOUR_MS

#define MAX_REVERSE_TRIALS      3           // Max. trials to reverse before aborting (goes in FATAL state, unlock via 3pos switch = 0 or reset button)

#define AUTO_REVERSE_DELAY      1000        // When instructing direction changes, put this as delay in between. This is needed with certain relays which may require a delay.

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Extrusion related
//

// Extrusion temperature sensor - uncomment to activate. If the EX_TEMPERTURE_MIN isn't reached yet, it won't allow the motor to run and goes into fatal mode.
// This will be only evaluated if the AUTO_REVERSE_MODE is set to AR_MODE::EXTRUSION;
// #define HAS_EXTRUDER_TEMPERATUR
#define EX_TEMPERTURE_SCK_PIN  5            
#define EX_TEMPERTURE_CS_PIN   6
#define EX_TEMPERTURE_SO_PIN   7
#define EX_TEMPERTURE_INTERVAL 1000         // Sensor read interval, MAX6675 wants it over 1000
#define EX_TEMPERTURE_MIN      170          // Min. extrusion temperature, in C
#define EX_TEMPERTURE_MIN_TIME MIN_MS * 5   // Min. time to have EX_TEMPERTURE_MIN present, second safety check

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Auto-Reverse Basics
//

int AUTO_REVERSE_MODE = AR_MODE::NONE;    // See enums.h :: AR_MODE. This value will be controlled by a 2 or 3 state switch.

// The pin to disable/enable auto-reverse - uncomment to activate
// This is for a 2 state toggle switch and is intented for using this on a shredder only.
// For extrusion & shredder combos, please use a 3 state switch instead ('HAS_AUTO_REVERSE_MODE')
// #define ENABLE_AUTO_REVERSE_PIN 10       
#define SHOW_REVERSE_STATUS                 // If defined and there are status lights, toggle the OK LED for indicating reversing
#define HAS_AUTO_REVERSE_MODE               // 3pos switch to switch between: auto-reverse, extruding and none
#define AUTO_REVERSE_MODE_UP_PIN    9
#define AUTO_REVERSE_MODE_DOWN_PIN  8

// In some cases it makes sense to disable extrusion reverse entirely. Set this to false otherwise.
// This setting will be only used if AUTO_REVERSE_MODE is set to AR_MODE::EXTRUSION. 
// In later versions this will be refined with the MachineFeatures flags.
#define ALLOW_EXTRUSION_REVERSE     true    

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    Optional : you need to activate at least one sensor, HALL or/and IR


// IR sensor ( LM393 ) used together with a rotary encoder disc - uncomment to activate
#define HAS_IR
#define IR_PIN 2                            // Arduino has fixed pins for using interrupts, don't change this
#define IR_INTERVAL         1000             // Recompute values in this interval
#define IR_TIMEOUT          2000            // Max. delta time between the sensor's on/off. This is used to recognize a jamming
// #define IR_SPEED                            // Calculate also the speed - needed for addons: injection & printer extension - uncomment to activate

// Reset button - uncomment to activate. This will unlock the fatal state in case of jamming or other problems.
//#define HAS_RESET
#define RESET_PIN           3
#define RESET_DELAY         1000            // Time to wait when reset has been hit or hold. This is good to give the system some time
#define RESET_FATAL         true            // Makes the reset button act as emergency button. User has to go into stop positon first to unlock it again otherwise it keeps spinning after the RESET_DELAY
#define RESET_INTERVAL      300             // Interval to read the NC reset button
#define RESET_NC            false            // Toggles the reset button type between NC and NO

// Status LEDS (ok, error) - uncomment to activate
#define HAS_STATUS
#define STATUS_OK_PIN       A3              // This goes into the relay
#define STATUS_ERROR_PIN    A2              // This goes into the relay

// Some VFDs have an error signal. Consume this to set FATAL state - Not impl.  - uncomment to activate
// #define VFD_ERROR_PIN 13

// Some VFDs have a reset signal. Consume this in case we have a reset button - Not impl.  - uncomment to activate
// #define VFD_RESET_PIN 12

// Many VFDs accept speed regulation between 0 - 10V, uncomment - activate. This makes 
// only sense when a local quick speed dial or a remote operators is present 
// #define VFD_VSI_PIN         A4

// Motor temperature sensor - uncomment to activate. If the TEMPERTURE_MAX has been exceeded, it will stop the motor and goes into fatal mode.
// #define HAS_TEMPERTURE
#define TEMPERTURE_SCK_PIN  5
#define TEMPERTURE_CS_PIN   6
#define TEMPERTURE_SO_PIN   7

#define TEMPERTURE_INTERVAL 1000            // Sensor read interval, MAX6675 wants it over 1000
#define TEMPERTURE_MAX      50              // Max. motor temperature, in C

// Alarm sound - uncomment to activate
// #define HAS_SOUND
// #define SOUND_PIN           4

// Hall Sensor (Experimental) - uncomment to activate
// #define HAS_HALL
#define HALL_INTERVAL       500           // hall sensor read interval
#define HALL_PIN            A0            // this pin has a hall sensor connected to it that measures the output current to the motor
#define MAX_AMPS            65            // this is the value over which the hall sensor signal will register as a jam

// Hopper - Sensors (For hopper with flip back joint and/or door) - uncomment to activate
// #define HOPPER_DOOR_PIN     11            // uncomment to activate - sets the input pin for the proximity sensor of the hopper door
// #define HOPPER_PIN          12            // uncomment to activate - sets the input pin for the proximity sensor of the hopper (if with flip joint)

// Hopper - feed sensor
// uncomment to activate - sets the input pin for the PIR sensor - signaling that there is something to shred.
// This is under development and being used in v3.5 builds. This is being used to power up the shredding system
// when anything is tossed in the feeder.
// Not impl. !
// #define HOPPER_FEED_SENSOR 13

#define FEED_READ_INTERVAL      1000        // Interval to read the feed sensor

// Suspend output
// uncomment to activate - sets the output pin going to a contactor, typically over a relay. 
// This is under development and being used in v3.5 builds. This will shutdown the shredding system with all it's
// components (VFD)
// Not impl. !
// #define SUSPEND_PIN         A1

// Resume output
// uncomment to activate - sets the output pin going to a contactor, typically over a relay. 
// This is under development and being used in v3.5 builds. This will power up the shredding system with all it's
// components (VFD)
// Not impl. !
// #define RESUME_PIN         A0


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    @Plastic Hub - Addons | Vendor configuration
//

// Experimental ! This activates the serial communication to the RPI4 master controller - uncomment to activate
#define HAS_SHREDDER_HMI

// Experimental ! This activates the serial communication to the RPI4 master controller - uncomment to activate
// #define HAS_GRINDER_HMI

// Experimental ! This activates the serial communication to the RPI4 master controller - uncomment to activate
// #define HAS_INJECTOR_HMI

// Experimental ! This activates the serial communication to the RPI4 master controller - uncomment to activate
// #define HAS_EXTRUDER_HMI

#define FIRMWARE_VERSION 0.5

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Plastic Hub Studio - internals : used by external controller setups
// Make sure it's matching 
#define FIRMATA_BAUD_RATE 19200

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//    externals
//

// pull in internal constants
#include "constants.h"

// pull in internal configs
#include "config_adv.h"

// The user_config.h is initially added to the github repository but changes will be ignored via .gitignore. Please keep this file safe and possibly
// on a per tenant base stored. You can override parameters in this file by using #undef SOME_PARAMETER and then re-define again if needed, otherwise disable 
// default features by using #undef FEATURE_OR_PARAMETER.
// This presents the possibilty to play with the code whilst staying in the loop with latest updates.
#include "user_config.h"

// At last we check all configs and spit compiler errors
#include "config_validator.h"

#endif
