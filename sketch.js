// Fishy Feed: p5.js + Teachable Machine browser app
// Model trained by Akshara on her fish tank.

const MODEL_URL = "https://teachablemachine.withgoogle.com/models/Tklb02Syj/";

// IMPORTANT: These names must exactly match your Teachable Machine class names.
const FOOD_CLASS = "FOOD_DROPPED";
const EATING_CLASS = "FISH_EATING";
const CONFIDENCE_THRESHOLD = 0.80;

let model;
let video;
let latestLabel = "loading";
let latestConfidence = 0;
let allPredictions = [];

let monitoring = false;
let monitorStartMs = 0;
let checkWindowMs = 120000;
let foodSeen = false;
let eatingSeen = false;
let lastScheduledRunDate = "";
let reportText = "No feeding check yet.";
let statusText = "Ready";

// Optional Micro:bit connection. The app still works if no Micro:bit is connected.
let microbitPort = null;
let microbitWriter = null;

async function setup() {
  const canvas = createCanvas(640, 480);
  canvas.parent("canvas-holder");

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  model = await tmImage.load(MODEL_URL + "model.json", MODEL_URL + "metadata.json");

  document.getElementById("startBtn").onclick = startFeedingCheck;
  document.getElementById("resetBtn").onclick = resetCheck;
  document.getElementById("connectMicrobitBtn").onclick = connectMicrobit;

  setInterval(checkSchedule, 5000);
  classifyLoop();
}

function draw() {
  background(230);
  image(video, 0, 0, width, height);

  // Overlay box
  fill(0, 150);
  noStroke();
  rect(0, height - 90, width, 90);
  fill(255);
  textSize(22);
  textAlign(LEFT, TOP);
  text(`AI sees: ${latestLabel} (${(latestConfidence * 100).toFixed(1)}%)`, 16, height - 78);
  text(statusText, 16, height - 46);

  updatePageText();
}

async function classifyLoop() {
  if (model && video && video.elt.readyState === 4) {
    const predictions = await model.predict(video.elt);
    allPredictions = predictions;

    let best = predictions[0];
    for (const p of predictions) {
      if (p.probability > best.probability) best = p;
    }

    latestLabel = best.className;
    latestConfidence = best.probability;

    updateMonitoringState(predictions);
  }
  setTimeout(classifyLoop, 500); // run inference twice per second
}

function startFeedingCheck() {
  checkWindowMs = Number(document.getElementById("windowSec").value) * 1000;
  monitoring = true;
  monitorStartMs = millis();
  foodSeen = false;
  eatingSeen = false;
  reportText = "👀 Watching feeding time...";
  statusText = "Status: WATCHING";
  sendToMicrobit("WATCHING");
}

function resetCheck() {
  monitoring = false;
  foodSeen = false;
  eatingSeen = false;
  reportText = "No feeding check yet.";
  statusText = "Status: Ready";
}

function updateMonitoringState(predictions) {
  if (!monitoring) return;

  const foodProb = getProb(predictions, FOOD_CLASS);
  const eatingProb = getProb(predictions, EATING_CLASS);

  if (foodProb >= CONFIDENCE_THRESHOLD) foodSeen = true;
  if (eatingProb >= CONFIDENCE_THRESHOLD) eatingSeen = true;

  const elapsed = millis() - monitorStartMs;
  const remaining = Math.max(0, Math.ceil((checkWindowMs - elapsed) / 1000));

  statusText = `Status: WATCHING — ${remaining}s left | foodSeen=${foodSeen} eatingSeen=${eatingSeen}`;

  if (elapsed >= checkWindowMs) {
    monitoring = false;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (!foodSeen) {
      reportText = `⚠️ ALERT at ${timeStr}: No food dropped.`;
      sendToMicrobit("NO_FOOD");
    } else if (!eatingSeen) {
      reportText = `⚠️ ALERT at ${timeStr}: Food dropped, but fish did not eat.`;
      sendToMicrobit("NOT_EATING");
    } else {
      reportText = `✅ Fed at ${timeStr}: Food dropped and fish ate normally.`;
      sendToMicrobit("OK");
    }
    statusText = "Status: DONE";
  }
}

function getProb(predictions, className) {
  const match = predictions.find(p => p.className === className);
  return match ? match.probability : 0;
}

function checkSchedule() {
  if (monitoring) return;

  const feedTime = document.getElementById("feedTime").value; // HH:MM
  if (!feedTime) return;

  const now = new Date();
  const hhmm = now.toTimeString().slice(0, 5);
  const today = now.toISOString().slice(0, 10);

  // Run only once per day at the selected minute.
  if (hhmm === feedTime && lastScheduledRunDate !== today) {
    lastScheduledRunDate = today;
    startFeedingCheck();
  }
}

function updatePageText() {
  document.getElementById("prediction").innerText =
    `AI prediction: ${latestLabel} (${(latestConfidence * 100).toFixed(1)}%)`;

  document.getElementById("countdown").innerText = statusText;
  document.getElementById("report").innerText = reportText;
}


async function connectMicrobit() {
  // Chrome/Chromium Web Serial requires a button click from the user.
  if (!("serial" in navigator)) {
    document.getElementById("microbitStatus").innerText =
      "Micro:bit: Web Serial not supported in this browser";
    return;
  }

  try {
    microbitPort = await navigator.serial.requestPort();
    await microbitPort.open({ baudRate: 115200 });
    microbitWriter = microbitPort.writable.getWriter();

    document.getElementById("microbitStatus").innerText =
      "Micro:bit: connected ✅";

    sendToMicrobit("WATCHING");
  } catch (err) {
    console.log("Micro:bit connection failed:", err);
    document.getElementById("microbitStatus").innerText =
      "Micro:bit: not connected";
  }
}

async function sendToMicrobit(message) {
  // Optional feature: if no Micro:bit is connected, do nothing.
  if (!microbitWriter) {
    console.log("Micro:bit not connected. Browser app still works.");
    return;
  }

  try {
    const data = new TextEncoder().encode(message + "\n");
    await microbitWriter.write(data);
    console.log("Sent to Micro:bit:", message);
  } catch (err) {
    console.log("Micro:bit send failed:", err);
    microbitWriter = null;
    document.getElementById("microbitStatus").innerText =
      "Micro:bit: disconnected";
  }
}

