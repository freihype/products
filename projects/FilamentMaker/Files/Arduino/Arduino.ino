//
// -- Caterpillar Controller v1.0 --
//
// Using a Ramps 1.4 and a RepRap discount screen to precisely controll 
// the pulling motion needed to extrude a consistent filament.
//
// author: Van Alles Wat Ontwerp
// more info: www.preciousplastic.com


#include <AccelStepper.h>
#include <ClickEncoder.h>
#include <TimerOne.h>
#include <LiquidCrystal.h>
#include <StopWatch.h>



// PINS - For RAMPS 1.4
// OUTPUT - stepper
#define CAT_STEP_PIN           54
#define CAT_DIR_PIN            55
#define CAT_ENABLE_PIN         38

#define SPOOL_STEP_PIN         60
#define SPOOL_DIR_PIN          61
#define SPOOL_ENABLE_PIN       56

// LCD (RepRapDiscount Smart Controller)
#define LCD_PINS_RS         16
#define LCD_PINS_ENABLE     17
#define LCD_PINS_D4         23
#define LCD_PINS_D5         25
#define LCD_PINS_D6         27
#define LCD_PINS_D7         29 

// OUTPUT - other
#define FAN_PIN            9
#define LED_PIN            13
#define BEEPER_PIN         37

// INPUT - ENCODER
#define BTN_EN1            31
#define BTN_EN2            33
#define BTN_ENC            35  //the clicking button

// INPUT - OTHER
#define BEEPER             37
#define KILL_PIN           41

// Stepper settings
const float maxSpeed = 1000;       // maximum steps per second
const float startSpeed = 50;       // speed at which the machine starts
const float acceleration = 5;      // steps/second/second to accelerate
const float stepperBoost = 1000;
const float reverseSpeed = 0;
const float spoolMultiplier = 1.0;

// LCD vars
LiquidCrystal lcd(LCD_PINS_RS, LCD_PINS_ENABLE, LCD_PINS_D4, LCD_PINS_D5, LCD_PINS_D6, LCD_PINS_D7);
unsigned long clock = millis();
const int LCDrefreshrate = 500;
float catterpillarDistance = 0;
StopWatch sw_secs(StopWatch::SECONDS);

// Stepper vars
AccelStepper caterpillar(1, CAT_STEP_PIN, CAT_DIR_PIN);
AccelStepper spool(1, SPOOL_STEP_PIN, SPOOL_DIR_PIN);
float curSpeed = startSpeed;
float memSpeed = 0;
boolean motorOn = false;
boolean boostStepper = false;
boolean reverse = false;

// Encoder vars
ClickEncoder *encoder;
int16_t last, value;

// init
void setup() {
  // set up the LCD's number of columns and rows: 
  lcd.clear();
  lcd.begin(20, 4);
  lcd.setCursor(0,0);
  lcd.print("Speed:          mm/s");
  lcd.setCursor(0,1);
  lcd.print("Distance:          m");
  lcd.setCursor(0,2);
  lcd.print("Time: ");
    
  // output pins  
  pinMode(FAN_PIN , OUTPUT);
  pinMode(LED_PIN , OUTPUT);
  pinMode(BEEPER_PIN , OUTPUT);
  
  pinMode(CAT_ENABLE_PIN , OUTPUT);
  pinMode(SPOOL_ENABLE_PIN, OUTPUT);
  
  digitalWrite(CAT_ENABLE_PIN , LOW);
  digitalWrite(SPOOL_ENABLE_PIN , LOW);
  
  // initialise stepper and encoder
  iniStepper();
  iniEncoder();
  
  // ready to go
  digitalWrite(BEEPER_PIN , HIGH);
  delay(10);
  digitalWrite(BEEPER_PIN , LOW);
}

// loop
void loop() {
  // check encoder for value changes and change motor settings accordingly
  checkEncoder();
 
  // make the stepper run at a specific speed
  caterpillar.runSpeed();
  spool.runSpeed();
    
  if(millis() > clock){  
    // update the LCD
    updateLCD();
    clock = millis() + LCDrefreshrate;
  }
  
}

void updateLCD() {
  
  // calculate speed in mm/s
  // stepper motor steps per second / number of steps it takes to complete 1 revolution (200 x 1/4 stepping = 800)
  // multiply with:
  // diameter of the roller times PI to get the circumference of the roller
   
  float catterpillarSpeed = ((float(caterpillar.speed()) / 800.0) * ( 44.0 * PI));
  
  // display speed
  lcd.setCursor(11, 0);
  lcd.print("    ");
  lcd.setCursor(7, 0);
  lcd.print(catterpillarSpeed);
  
  // calculate distance
  catterpillarDistance = catterpillarDistance + (((catterpillarSpeed/1000) * (LCDrefreshrate ))) / 1000;
  
  // display distance
  lcd.setCursor(10,1);
  lcd.print(catterpillarDistance);
  
  // get time 
  int time = sw_secs.elapsed();
  int mins = time / 60;
  time = time % 60;
  int secs = time;
  
  // display time    
  lcd.setCursor(6,2);
  lcd.print(mins);
  if(secs < 10){
    lcd.print(":0");
  }
  else{
    lcd.print(":");
  }
  lcd.print(secs);
  
}

// init stepper
void iniStepper() {
  // initialise caterpillar stepper with settings
  caterpillar.setPinsInverted(false, false, true);
  caterpillar.setEnablePin(CAT_ENABLE_PIN);
  caterpillar.setMaxSpeed(maxSpeed);
  caterpillar.setAcceleration(acceleration);
  
  // initialise spool stepper with settings  
  spool.setPinsInverted(false, false, true);
  spool.setEnablePin(SPOOL_ENABLE_PIN);
  spool.setMaxSpeed(maxSpeed);
  
  // start the stepper if the motor should be on
  if(motorOn) setMotorSpeed(curSpeed);
  else switchMotorOff();  
}

// init encoder
void iniEncoder() {
  // create new encoder with correct pins
  encoder = new ClickEncoder(BTN_EN1, BTN_EN2, BTN_ENC);
  
  // create timer for checks
  Timer1.initialize(1000);
  Timer1.attachInterrupt(timerIsr);
  last = -1;
}

// check and update encoder
void checkEncoder() {
  // read encoder turn value and reverse value
  value += (encoder->getValue() * -1);
  
  // if value is different from last known value, print out new value, set new motor speed
  if (value != last) {
    int difference = value - last;
    last = value;

    // if the motor should be running, change the speed
    if(!reverse) {
      // set motor speed based on encoder value
      curSpeed = startSpeed + value;
      setMotorSpeed(curSpeed);
    } else {
      memSpeed += difference;
      setMotorSpeed(memSpeed);
    } 
    
  }
  
  // check click actions (click, doubleclick, hold, release)
  ClickEncoder::Button b = encoder->getButton();
  if (b != ClickEncoder::Open) {
    switch (b) {
      case ClickEncoder::Held:
          // when button is held, boost the stepper
          if(!boostStepper) {
            boostStepper = true;
            memSpeed = caterpillar.speed();
            
            if(caterpillar.speed() >= 0) setMotorSpeed(caterpillar.speed() + (stepperBoost + (caterpillar.speed() / 100)));
            else setMotorSpeed(caterpillar.speed() - (stepperBoost + (caterpillar.speed() / 100)));
          }
          
          break;
      case ClickEncoder::Released:
          // when button is released, return stepper speed to normal
          if(boostStepper) {
            boostStepper = false;
            setMotorSpeed(memSpeed);
          }
          
          break;
      case ClickEncoder::Clicked:
          // feedback sound
          digitalWrite(BEEPER_PIN , HIGH);
          delay(10);
          digitalWrite(BEEPER_PIN , LOW);
          // when button is clicked, switch motor on/off
          if(motorOn) {
            switchMotorOff();
          } else {
            if(!reverse) switchMotorOn(curSpeed);
            else switchMotorOn(memSpeed);
          }
          
          break;
      case ClickEncoder::DoubleClicked:
          
          // feedback sound
          digitalWrite(BEEPER_PIN , HIGH);
          delay(10);
          digitalWrite(BEEPER_PIN , LOW);
          delay(50);
          digitalWrite(BEEPER_PIN , HIGH);
          delay(10);
          digitalWrite(BEEPER_PIN , LOW);
          
          //reset distance
          catterpillarDistance = 0;
          sw_secs.reset();
          if(motorOn) sw_secs.start(); 
    }
  }
}

void setMotorSpeed(int targetSpeed) {
  if(motorOn) {
    if(caterpillar.speed() == 0) caterpillar.enableOutputs();
    if(spool.speed() == 0) spool.enableOutputs();
    
    caterpillar.setSpeed(targetSpeed);
    spool.setSpeed(targetSpeed * spoolMultiplier);
  }
}

void switchMotorOn(int targetSpeed) {
  motorOn = true;
  sw_secs.start();    
  caterpillar.enableOutputs();
  caterpillar.setSpeed(targetSpeed);
    
  spool.enableOutputs();
  spool.setSpeed(targetSpeed * spoolMultiplier);
}

void switchMotorOff() {
  motorOn = false;
  sw_secs.stop();
  caterpillar.setSpeed(0);
  caterpillar.disableOutputs();
  
  spool.setSpeed(0);
  spool.disableOutputs();
}

void timerIsr() {
  encoder->service();
}
