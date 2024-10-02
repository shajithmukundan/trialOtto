{
// Set all 16 servos to the centre position
ServoBit.centreServos();
basic.pause(1000);

// Set Servo 5 to +30 degrees
ServoBit.setServo(5, 30);
basic.pause(1000);

// Set Servo 13 to -90 degrees
ServoBit.setServo(13, -90);
basic.pause(1000);

// Move servo 5 to 30 degrees at 40 degrees per second
ServoBit.moveServo(5, 30, 40);
basic.pause(3000);

// Check current actual position of servo 5
let actual = ServoBit.getServoActual(5);
basic.pause(1000);

// check current target positon for servo 5
let target = ServoBit.getServoTarget(5);
basic.pause(1000);

// Wait for servo 5 to complete its movement
ServoBit.waitServo(5);
basic.pause(1000);
