#include <AccelStepper.h>
#include <MultiStepper.h>


#define Pulse 9
#define Dir 8

AccelStepper stepper(AccelStepper::DRIVER, 9, 8);  // 1=Stepper driver option, 3=Step pulse pin, 2=Direction

void setup()
{
  pinMode(Pulse, OUTPUT);
  pinMode(Dir, OUTPUT);
  stepper.setMaxSpeed(8000); // Set max speed. Steps per second
  stepper.setAcceleration(5000);  // set motor acceleration
  Serial.begin(9600);
}
int rot = 0;
bool hasSpeed = false;

void loop() {

  int rot = analogRead(A1);
  int move = rot;
  if(move <512){
    move = 1024 - move ;
  }
   float speed = (float)rot;
  if (speed < 0) {
    speed *= -1;
  }

  int dir = 1;
  if (rot < 512){
    dir = -1;
  }
  
  if(move < 550 && move > 450){
    move = 0; 
  }

  int s = !stepper.isRunning();
  s = 1;
  if ( s ) {
      //if(!hasSpeed){
        hasSpeed = true;
        //stepper.setSpeed(speed * 10);
     // }
    int fac = 10;
    if(move < 700 && move > 600){
      fac = 30;
    }
    stepper.move((move / fac )  * dir );
    stepper.run();
  }else{
  //  stepper.run(); 
  }
}
