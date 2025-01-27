// web/app.js

let device, server, fitnessService, characteristics = {};

// Bluetooth service and characteristic UUIDs
const SERVICE_UUID = "180D";
const STEPS_UUID = "2A53";
const CALORIES_UUID = "2A99";
const CYCLING_UUID = "2A5B";
const BATTERY_UUID = "2A19";
const CONTROL_UUID = "2A9F";

// Connect to the BLE device
async function connectToDevice() {
  try {
    device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [SERVICE_UUID]
    });

    server = await device.gatt.connect();
    fitnessService = await server.getPrimaryService(SERVICE_UUID);

    // Get characteristics
    characteristics.steps = await fitnessService.getCharacteristic(STEPS_UUID);
    characteristics.calories = await fitnessService.getCharacteristic(CALORIES_UUID);
    characteristics.cycling = await fitnessService.getCharacteristic(CYCLING_UUID);
    characteristics.battery = await fitnessService.getCharacteristic(BATTERY_UUID);
    characteristics.control = await fitnessService.getCharacteristic(CONTROL_UUID);

    document.getElementById("device-status").hidden = false;
    startReadingData();
  } catch (error) {
    console.error("Error connecting to device:", error);
  }
}

// Read and display data
async function startReadingData() {
  setInterval(async () => {
    const steps = await readCharacteristic(characteristics.steps);
    const calories = await readCharacteristic(characteristics.calories);
    const cycling = await readCharacteristic(characteristics.cycling);
    const battery = await readCharacteristic(characteristics.battery);

    document.getElementById("steps-count").innerText = steps;
    document.getElementById("calories").innerText = calories;
    document.getElementById("cycling-time").innerText = cycling;
    document.getElementById("battery").innerText = `${battery}%`;
  }, 1000);
}

// Read a characteristic value
async function readCharacteristic(characteristic) {
  const value = await characteristic.readValue();
  return value.getInt32(0, true);
}

// Toggle device power
async function togglePower() {
  const controlChar = characteristics.control;
  const isOn = document.getElementById("toggle-power-btn").innerText.includes("Off");
  await controlChar.writeValue(new Uint8Array([isOn ? 0 : 1]));
  document.getElementById("toggle-power-btn").innerText = isOn ? "Turn On Device" : "Turn Off Device";
}

// Event Listeners
document.getElementById("connect-btn").addEventListener("click", connectToDevice);
document.getElementById("toggle-power-btn").addEventListener("click", togglePower);
// Load user data from localStorage
function loadUserData() {
  const weight = localStorage.getItem("weight") || 70;
  const height = localStorage.getItem("height") || 170;
  const age = localStorage.getItem("age") || 25;

  document.getElementById("weight").value = weight;
  document.getElementById("height").value = height;
  document.getElementById("age").value = age;
}

// Save user data to localStorage
function saveUserData() {
  const weight = document.getElementById("weight").value;
  const height = document.getElementById("height").value;
  const age = document.getElementById("age").value;

  localStorage.setItem("weight", weight);
  localStorage.setItem("height", height);
  localStorage.setItem("age", age);
}

// Add event listeners to save data when inputs change
document.getElementById("weight").addEventListener("change", saveUserData);
document.getElementById("height").addEventListener("change", saveUserData);
document.getElementById("age").addEventListener("change", saveUserData);

// Load saved user data on app startup
loadUserData();
function loadHistory() {
  const history = JSON.parse(localStorage.getItem("history")) || [];
  const historyList = document.getElementById("history-list");

  // Clear the current list
  historyList.innerHTML = "";

  // Populate the list with saved history
  history.forEach((entry) => {
    const listItem = document.createElement("li");
    listItem.textContent = `${entry.date} - Steps: ${entry.steps}, Cycling: ${entry.cycling} min, Calories: ${entry.calories}`;
    historyList.appendChild(listItem);
  });
}
function saveHistory(steps, cycling, calories) {
  const history = JSON.parse(localStorage.getItem("history")) || [];
  const newEntry = {
    date: new Date().toLocaleDateString(),
    steps,
    cycling,
    calories
  };
  history.push(newEntry);
  localStorage.setItem("history", JSON.stringify(history));
}
document.addEventListener("DOMContentLoaded", () => {
  loadUserData(); // Load user data from localStorage
  loadHistory();  // Load activity history
});
