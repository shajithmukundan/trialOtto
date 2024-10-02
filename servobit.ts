

/**
  * Pre-Defined LED colours
  */
enum vColors
{
    //% block=red
    Red = 0xff0000,
    //% block=orange
    Orange = 0xffa500,
    //% block=yellow
    Yellow = 0xffff00,
    //% block=green
    Green = 0x00ff00,
    //% block=blue
    Blue = 0x0000ff,
    //% block=indigo
    Indigo = 0x4b0082,
    //% block=violet
    Violet = 0x8a2be2,
    //% block=purple
    Purple = 0xff00ff,
    //% block=white
    White = 0xffffff,
    //% block=black
    Black = 0x000000
}

/**
 * Custom blocks
 */
//% weight=50 color=#e7660b icon="\uf1da"
namespace ServoBit
{
    let fireBand: fireled.Band;
    let _flashing = false;

// Servo PCA9685
    let PCA = 0x6A;	// i2c address of PCA9685 servo controller
    let initI2C = false;
    let _i2cError = 0;
    let SERVOS = 0x06; // first servo address for start byte low
    let servoTarget: number[] = [];
    let servoActual: number[] = [];
    let servoCancel: boolean[] = [];

// Helper functions

    // initialise the servo driver and the offset array values
    function initPCA(): void
    {

        let i2cData = pins.createBuffer(2);
        initI2C = true;

        i2cData[0] = 0;		// Mode 1 register
        i2cData[1] = 0x10;	// put to sleep
        pins.i2cWriteBuffer(PCA, i2cData, false);

        i2cData[0] = 0xFE;	// Prescale register
        i2cData[1] = 101;	// set to 60 Hz
        pins.i2cWriteBuffer(PCA, i2cData, false);

        i2cData[0] = 0;		// Mode 1 register
        i2cData[1] = 0x81;	// Wake up
        pins.i2cWriteBuffer(PCA, i2cData, false);

        for (let servo=0; servo<16; servo++)
        {
            i2cData[0] = SERVOS + servo*4 + 0;	// Servo register
            i2cData[1] = 0x00;			// low byte start - always 0
            _i2cError = pins.i2cWriteBuffer(PCA, i2cData, false);

            i2cData[0] = SERVOS + servo*4 + 1;	// Servo register
            i2cData[1] = 0x00;			// high byte start - always 0
            pins.i2cWriteBuffer(PCA, i2cData, false);

            servoTarget[servo]=0;
            servoActual[servo]=0;
            servoCancel[servo]=false;
        }
    }

    /**
      * Initialise all servos to Angle=0
      */
    //% blockId="centreServos"
    //% block="centre all servos"
    //% subcategory=Servos
    export function centreServos(): void
    {
        for (let i=0; i<16; i++)
            setServo(i, 0);
    }

    /**
      * Set Servo Position by Angle
      * @param servo Servo number (0 to 15)
      * @param angle degrees to turn servo (-90 to +90)
      */
    //% blockId="an_setServo" block="set servo %servo| to angle %angle"
    //% weight=70
    //% angle.min=-90 angle.max.max=90
    //% subcategory=Servos
    export function setServo(servo: number, angle: number): void
    {
        setServoRaw(servo, angle);
        servoTarget[servo] = angle;
    }

    function setServoRaw(servo: number, angle: number): void
    {
        if (initI2C == false)
        {
            initPCA();
        }
        // two bytes need setting for start and stop positions of the servo
        // servos start at SERVOS (0x06) and are then consecutive blocks of 4 bytes
        // the start position (always 0x00) is set during init for all servos

        let i2cData = pins.createBuffer(2);
        let start = 0;
        angle = Math.max(Math.min(90, angle),-90);
        let stop = 369 + angle * 223 / 90;

        i2cData[0] = SERVOS + servo*4 + 2;	// Servo register
        i2cData[1] = (stop & 0xff);		// low byte stop
        pins.i2cWriteBuffer(PCA, i2cData, false);

        i2cData[0] = SERVOS + servo*4 + 3;	// Servo register
        i2cData[1] = (stop >> 8);		// high byte stop
        pins.i2cWriteBuffer(PCA, i2cData, false);
        servoActual[servo] = angle;
    }

    /**
      * Move Servo to Target Position at selected Speed
      * @param servo Servo number (0 to 15)
      * @param angle degrees to turn to (-90 to +90)
      * @param speed degrees per second to move (1 to 1000) eg: 60
      */
    //% blockId="moveServo" block="move servo %servo| to angle %angle| at speed %speed| degrees/sec"
    //% weight=70
    //% angle.min=-90 angle.max.max=90
    //% speed.min=1 speed.max=1000
    //% subcategory=Servos
    export function moveServo(servo: number, angle: number, speed: number): void
    {
        let step = 1;
        let delay = 10; // 10ms delay between steps
        if(servoTarget[servo] != servoActual[servo])   // cancel any existing movement on this servo?
        {
            servoCancel[servo] = true;
            while(servoCancel[servo])
                basic.pause(1);  // yield
        }
        angle = Math.max(Math.min(90, angle),-90);
        speed = Math.max(Math.min(1000, speed),1);
        delay = Math.round(1000/speed);
        servoTarget[servo] = angle;
        if (angle < servoActual[servo])
            step = -1;
        control.inBackground(() =>
        {
            while (servoActual[servo] != servoTarget[servo])
            {
                if(servoCancel[servo])
                {
                    servoCancel[servo] = false;
                    break;
                }
                setServoRaw(servo, servoActual[servo]+step);
                basic.pause(delay);
            }
        })
    }

    /**
      * Get Servo Current Actual Position
      * @param servo Servo number (0 to 15)
      */
    //% blockId="getServoActual" block="servo %servo| actual position"
    //% weight=10
    //% subcategory=Servos
    export function getServoActual(servo: number): number
    {
        return servoActual[servo];
    }

    /**
      * Get Servo Target Position
      * @param servo Servo number (0 to 15)
      */
    //% blockId="getServoTarget" block="servo %servo| target position"
    //% weight=8
    //% subcategory=Servos
    export function getServoTarget(servo: number): number
    {
        return servoTarget[servo];
    }

    /**
      * Check if servo has reached target
      * @param servo Servo number (0 to 15)
      */
    //% blockId="isServoDone" block="servo %servo| is complete"
    //% weight=5
    //% subcategory=Servos
    export function isServoDone(servo: number): boolean
    {
        return servoTarget[servo]==servoActual[servo];
    }

    /**
      * Wait until servo has reached target position
      * @param servo Servo number (0 to 15)
      */
    //% blockId="waitServo" block="wait for servo %servo"
    //% weight=5
    //% subcategory=Servos
 
    export function waitServo(servo: number): void
    {
        while (servoActual[servo] != servoTarget[servo]) // what if nothing is changing these values?
            basic.pause(10);
    }

