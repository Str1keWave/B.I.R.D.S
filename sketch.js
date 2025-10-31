// variable to hold an instance of the p5.webserial library:
const serial = new p5.WebSerial();
 
// HTML button object:
let portButton;
let inData;                            // for incoming serial data
let outByte = 0;                       // for outgoing data
 let video;
let detector;
let detections = [];
let mySound;

gone_timer = 0;
function preload() {
  soundFormats('mp3', 'ogg');
  mySound = loadSound('data/Distressed and Aggravated Starling Call (320)');
}

function setup() {
  perm_x = width/2;
  perm_y = height/2;
  createCanvas(640, 480);
  // check to see if serial is available:
  if (!navigator.serial) {
    alert("WebSerial is not supported in this browser. Try Chrome or MS Edge.");
  }
  // if serial is available, add connect/disconnect listeners:
  navigator.serial.addEventListener("connect", portConnect);
  navigator.serial.addEventListener("disconnect", portDisconnect);
  // check for any ports that are available:
  serial.getPorts();
  // if there's no port chosen, choose one:
  serial.on("noport", makePortButton);
  // open whatever port is available:
  serial.on("portavailable", openPort);
  // handle serial errors:
  serial.on("requesterror", portError);
  // handle any incoming serial data:
  serial.on("data", serialEvent);
  serial.on("close", makePortButton);

  //video stuff
    video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // Load the COCO-SSD model
  cocoSsd.load().then(model => {
    console.log('Model loaded!');
    detector = model;
    window.requestAnimationFrame(detectObjects);  // Use requestAnimationFrame for better performance
  }).catch(err => console.error('Failed to load model', err));
  
  
}
 
function draw() {
  // black background, white text:
  
  background(0);
  fill(255);
  image(video, 0, 0);
  drawDetections();
  // display the incoming serial data as a string:
  text("incoming value: " + inData, 30, 30);
  
}

// if there's no port selected, 
// make a port select button appear:
function makePortButton() {
  // create and position a port chooser button:
  portButton = createButton("choose port");
  portButton.position(10, 10);
  // give the port button a mousepressed handler:
  portButton.mousePressed(choosePort);
}
 
// make the port selector window appear:
function choosePort() {
  serial.requestPort();
}
 
// open the selected port, and make the port 
// button invisible:
function openPort() {
  // wait for the serial.open promise to return,
  // then call the initiateSerial function
  serial.open().then(initiateSerial);
 
  // once the port opens, let the user know:
  function initiateSerial() {
    console.log("port open");
  }
  // hide the port button once a port is chosen:
  if (portButton) portButton.hide();
}
 
// read any incoming data as a byte:
function serialEvent() {
  // read a byte from the serial port:
  var inByte = serial.read();
  // store it in a global variable:
  inData = inByte;
}
 
// pop up an alert if there's a port error:
function portError(err) {
  alert("Serial port error: " + err);
}
 
// try to connect if a new serial port 
// gets added (i.e. plugged in via USB):
function portConnect() {
  console.log("port connected");
  serial.getPorts();
}
 
// if a port is disconnected:
function portDisconnect() {
  serial.close();
  console.log("port disconnected");
}
 
function closePort() {
  serial.close();
}

function mouseDragged() {
  // map the mouseY to a range from 0 to 255:
  x = int(map(mouseX, 0, width,180,0));
  y = int(map(mouseY, 0, height,0,180));
  // outByte = byte(x + "," + y);
  // console.log(x + "," + y);
  // send it out the serial port:
  serial.write(x + "," + y + "\n");
}

function detectObjects() {
  if (detector && video.elt.readyState === 4) {
    detector.detect(video.elt).then(predictions => {
      detections = predictions;
      window.requestAnimationFrame(detectObjects);  // Continue detecting objects
    }).catch(error => {
      console.error('Detection failed', error);
      setTimeout(detectObjects, 1000);  // Wait a bit before trying again
    });
  } else {
    setTimeout(detectObjects, 100);  // Wait for video to be ready
  }
}

function drawDetections() {
  detections.forEach(d => {
    if (d.class === 'bird' && d.score > 0.1) {  // Change 0.3 to your desired threshold
      if (mySound.isPlaying() == false){
      mySound.play(undefined,undefined,undefined,8);
        
      }
      stroke(255, 0, 0);  // Red color for the bounding box
      noFill();
      strokeWeight(2);  // Thinner bounding box
      rect(d.bbox[0], d.bbox[1], d.bbox[2], d.bbox[3]);  // Draw the bounding box
      x = (d.bbox[0]+d.bbox[2]/2);
      y = (d.bbox[1]+d.bbox[3]/2);
      
      if (x < width/2){
        p = int((width/2-x)/10);
        perm_x -= p;
      }
      if (x > width/2){
        p = int((x - width/2)/10);
        perm_x += p;
      }
       if (y < height/2){
         p = int((height/2-y)/10);
        perm_y -= p;
      }
      if (y > height/2){
        p = int((y - height/2)/10);
        perm_y += p;
      }
      
      if (perm_y > height){perm_y = height};
      if (perm_y < 0){perm_y = 0};
      if (perm_x > width){perm_y = width};
      if (perm_y < 0){perm_y = 0};
      
      console.log(perm_y)
      a = int(map(perm_x, 0, width,180,0));
      b = int(map(perm_y, 0, height,180,0));
      serial.write(a + "," + b + "\n");
      circle(x,y,5);

      fill(255);  // White color for text
      textSize(14);  // Smaller text size
      text(`Bird: ${Math.round(d.score * 100)}%`, d.bbox[0] + 10, d.bbox[1] + 20);  // Label the detection
       gone_timer=0;
    }
    else{
      gone_timer+=1;
      
      if (gone_timer > 60)
      mySound.stop();}
  });
}