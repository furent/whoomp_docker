import { PacketType, EventNumber, CommandNumber, WhoopPacket } from "./packet";
import { AsyncQueue } from "./queue";
import * as ui from "./ui";
import { FileStreamHandler } from "./file";
const WHOOP_SERVICE = "61080001-8d6d-82b8-614a-1c8cb0f8dcc6";
const WHOOP_CHAR_CMD_TO_STRAP = "61080002-8d6d-82b8-614a-1c8cb0f8dcc6";
const WHOOP_CHAR_CMD_FROM_STRAP = "61080003-8d6d-82b8-614a-1c8cb0f8dcc6";
const WHOOP_CHAR_EVENTS_FROM_STRAP = "61080004-8d6d-82b8-614a-1c8cb0f8dcc6";
const WHOOP_CHAR_DATA_FROM_STRAP = "61080005-8d6d-82b8-614a-1c8cb0f8dcc6";
let device;
let server;
let characteristics = {};
// To store the interval reference
let batteryInterval;
// For the metadata packets
const metaQueue = new AsyncQueue();
// Create separate instances for historical data
const historicalDataLogger = new FileStreamHandler("historical_data_stream.bin");
let isRealtimeActive = false; // Tracks the real-time status
/**
 * Connect to the WHOOP device and setup notifications
 */
export async function connectToWhoop() {
    try {
        device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "WHOOP" }],
            optionalServices: [WHOOP_SERVICE]
        });
        if (!device.gatt)
            throw new Error("GATT server not available on device");
        server = await device.gatt.connect();
        console.log(`connected to WHOOP device!`);
        const service = await server.getPrimaryService(WHOOP_SERVICE);
        characteristics.cmdToStrap = await service.getCharacteristic(WHOOP_CHAR_CMD_TO_STRAP);
        characteristics.cmdFromStrap = await service.getCharacteristic(WHOOP_CHAR_CMD_FROM_STRAP);
        characteristics.eventsFromStrap = await service.getCharacteristic(WHOOP_CHAR_EVENTS_FROM_STRAP);
        characteristics.dataFromStrap = await service.getCharacteristic(WHOOP_CHAR_DATA_FROM_STRAP);
        // Setting up notification handlers
        await characteristics.cmdFromStrap.startNotifications();
        await characteristics.eventsFromStrap.startNotifications();
        await characteristics.dataFromStrap.startNotifications();
        characteristics.cmdFromStrap.addEventListener("characteristicvaluechanged", handleCmdNotification);
        characteristics.eventsFromStrap.addEventListener("characteristicvaluechanged", handleEventsNotification);
        characteristics.dataFromStrap.addEventListener("characteristicvaluechanged", handleDataNotification);
        // Register the disconnect event handler
        device.addEventListener("gattserverdisconnected", handleDisconnect);
        // Start periodic battery updates
        await startBatteryUpdates();
        // Get version and wrist status
        await sendReportVersion();
        await sendHelloHarvard();
        // Show elements
        ui.hideElements(false);
        return true;
    }
    catch (error) {
        console.error(error.message);
        return false;
    }
}
/**
 * Disconnect from the WHOOP and cleanup
 */
export async function disconnectFromWhoop() {
    if (device && device.gatt?.connected) {
        await device.gatt.disconnect();
        console.log(`disconnected from WHOOP successfully`);
        return true;
    }
    else {
        console.warn(`device was not connected`);
        return false;
    }
}
/**
 * Handles device disconnection.
 */
async function handleDisconnect() {
    console.warn(`device disconnected!`);
    await stopBatteryUpdates(); // Stop updates on disconnect
    // Hide elements
    ui.hideElements(true);
    // Change button back
    const connectButton = document.getElementById("connectButton");
    if (connectButton && connectButton.textContent) {
        connectButton.textContent = "Connect WHOOP";
        connectButton.classList.replace("bg-red-500", "bg-blue-500");
        connectButton.classList.replace("hover:bg-red-700", "hover:bg-blue-700");
    }
}
/**
 * Parse the data field from REPORT_VERSION_INFO packet
 */
function parseVersionData(dataView) {
    let offset = 0;
    const values = [];
    for (let i = 0; i < 16; i++) {
        values.push(dataView.getUint32(offset, true));
        offset += 4;
    }
    const harvard = `${values[0]}.${values[1]}.${values[2]}.${values[3]}`;
    const boylston = `${values[4]}.${values[5]}.${values[6]}.${values[7]}`;
    return { harvard, boylston };
}
/**
 * Handle incoming CMD notifications
 */
function handleCmdNotification(event) {
    const target = event.target;
    const value = new Uint8Array(target.value.buffer);
    const packet = WhoopPacket.fromData(value);
    const dataView = new DataView(packet.data.buffer);
    switch (packet.cmd) {
        case CommandNumber.GET_BATTERY_LEVEL:
            const rawBatteryLevel = dataView.getUint16(2, true);
            const batteryLevel = rawBatteryLevel / 10.0;
            ui.updateBattery(batteryLevel);
            break;
        case CommandNumber.REPORT_VERSION_INFO:
            const { harvard, boylston } = parseVersionData(dataView);
            ui.updateDeviceVersion(harvard, boylston);
            break;
        case CommandNumber.GET_HELLO_HARVARD:
            const charging = !!dataView.getUint8(7);
            ui.updateChargingStatus(charging);
            const isWorn = !!dataView.getUint8(116);
            ui.updateWristStatus(isWorn);
            break;
        case CommandNumber.GET_CLOCK:
            const unix = dataView.getUint32(2, true);
            ui.updateClock(unix);
            break;
    }
}
/**
 * Handle incoming EVENTS notifications
 */
function handleEventsNotification(event) {
    const target = event.target;
    const value = new Uint8Array(target.value.buffer);
    const packet = WhoopPacket.fromData(value);
    switch (packet.cmd) {
        case EventNumber.WRIST_OFF:
            ui.updateWristStatus(false);
            break;
        case EventNumber.WRIST_ON:
            ui.updateWristStatus(true);
            break;
        case EventNumber.CHARGING_OFF:
            ui.updateChargingStatus(false);
            break;
        case EventNumber.CHARGING_ON:
            ui.updateChargingStatus(true);
            break;
        case EventNumber.DOUBLE_TAP:
            ui.showNotification("Double Tap Detected!");
            break;
    }
}
/**
 * Handle incoming DATA notifications
 */
function handleDataNotification(event) {
    const target = event.target;
    const value = new Uint8Array(target.value.buffer);
    const packet = WhoopPacket.fromData(value);
    if (packet.type === PacketType.REALTIME_DATA) {
        ui.updateHeartRate(packet.data[5]);
    }
    else if (packet.type === PacketType.METADATA) {
        metaQueue.enqueue(packet);
    }
    else if (packet.type === PacketType.HISTORICAL_DATA) {
        historicalDataLogger.streamData(value);
    }
    else if (packet.type === PacketType.CONSOLE_LOGS) {
        const message = processLogData(packet.data);
        ui.logToTerminal(message);
    }
}
function processLogData(data) {
    const slicedData = data.slice(7, data.length - 1);
    const cleanedData = [];
    for (let i = 0; i < slicedData.length; i++) {
        if (slicedData[i] === 0x34 &&
            slicedData[i + 1] === 0x00 &&
            slicedData[i + 2] === 0x01 &&
            i + 2 < slicedData.length) {
            i += 2;
        }
        else {
            cleanedData.push(slicedData[i]);
        }
    }
    const cleanedUint8Array = new Uint8Array(cleanedData);
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(cleanedUint8Array);
}
/**
 * Starts periodic battery level updates every 30 seconds if connected
 */
async function startBatteryUpdates() {
    if (device?.gatt?.connected) {
        await sendBatteryLevel();
        batteryInterval = setInterval(sendBatteryLevel, 30000);
    }
    else {
        console.error(`device not connected`);
    }
}
/**
 * Stops battery updates
 */
async function stopBatteryUpdates() {
    if (batteryInterval) {
        clearInterval(batteryInterval);
        batteryInterval = undefined;
    }
}
/**
 * Sends GET_BATTERY_LEVEL command
 */
async function sendBatteryLevel() {
    if (!characteristics.cmdToStrap) {
        console.error(`Device not connected or characteristic unavailable`);
        return;
    }
    try {
        const pkt = new WhoopPacket(PacketType.COMMAND, 0, CommandNumber.GET_BATTERY_LEVEL, new Uint8Array([0x00])).framedPacket();
        await characteristics.cmdToStrap.writeValue(pkt);
    }
    catch (error) {
        console.error(`Error sending battery level command: ${error.message}`);
    }
}
/**
 * Sends REPORT_VERSION_INFO command
 */
async function sendReportVersion() {
    if (!characteristics.cmdToStrap) {
        console.error(`Device not connected or characteristic unavailable`);
        return;
    }
    try {
        const pkt = new WhoopPacket(PacketType.COMMAND, 0, CommandNumber.REPORT_VERSION_INFO, new Uint8Array([0x00])).framedPacket();
        await characteristics.cmdToStrap.writeValue(pkt);
    }
    catch (error) {
        console.error(`Error sending report version command: ${error.message}`);
    }
}
/**
 * Sends GET_HELLO_HARVARD command
 */
async function sendHelloHarvard() {
    if (!characteristics.cmdToStrap) {
        console.error(`Device not connected or characteristic unavailable`);
        return;
    }
    try {
        const pkt = new WhoopPacket(PacketType.COMMAND, 0, CommandNumber.GET_HELLO_HARVARD, new Uint8Array([0x00])).framedPacket();
        await characteristics.cmdToStrap.writeValue(pkt);
    }
    catch (error) {
        console.error(`Error sending hello Harvard command: ${error.message}`);
    }
}
/**
 * Toggles real-time heart rate updates.
 */
async function sendToggleRealtime() {
    if (!characteristics.cmdToStrap) {
        console.error("Device not connected or characteristic unavailable");
        return;
    }
    try {
        isRealtimeActive = !isRealtimeActive; // Toggle the state
        ui.updateHeartStatus(isRealtimeActive); // Update UI status
        const pkt = new WhoopPacket(PacketType.COMMAND, 0, CommandNumber.TOGGLE_REALTIME_HR, new Uint8Array([isRealtimeActive ? 0x01 : 0x00])).framedPacket();
        await characteristics.cmdToStrap.writeValue(pkt);
        console.log(`Realtime heart rate ${isRealtimeActive ? "started" : "stopped"}`);
    }
    catch (error) {
        console.error(`Error toggling real-time heart rate: ${error.message}`);
    }
}
// Event listeners
const connectButton = document.getElementById("connectButton");
if (connectButton) {
    connectButton.addEventListener("click", async () => {
        if (connectButton.textContent?.trim() === "Connect WHOOP") {
            if (await connectToWhoop()) {
                connectButton.textContent = "Disconnect";
                connectButton.classList.replace("bg-blue-500", "bg-red-500");
                connectButton.classList.replace("hover:bg-blue-700", "hover:bg-red-700");
            }
        }
        else {
            await disconnectFromWhoop();
        }
    });
}
const heartButton = document.getElementById("heartButton");
if (heartButton) {
    heartButton.addEventListener("click", sendToggleRealtime);
}
