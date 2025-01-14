import { PacketType, MetadataType, EventNumber, CommandNumber, WhoopPacket } from "./packet";
import { AsyncQueue } from "./queue";
import { FileStreamHandler } from "./file";

// Define the UUIDs for WHOOP services and characteristics
const WHOOP_SERVICE = "61080001-8d6d-82b8-614a-1c8cb0f8dcc6";
const WHOOP_CHAR_CMD_TO_STRAP = "61080002-8d6d-82b8-614a-1c8cb0f8dcc6";
const WHOOP_CHAR_CMD_FROM_STRAP = "61080003-8d6d-82b8-614a-1c8cb0f8dcc6";
const WHOOP_CHAR_EVENTS_FROM_STRAP = "61080004-8d6d-82b8-614a-1c8cb0f8dcc6";
const WHOOP_CHAR_DATA_FROM_STRAP = "61080005-8d6d-82b8-614a-1c8cb0f8dcc6";

// Type definitions for characteristics
type Characteristics = {
  cmdToStrap?: BluetoothRemoteGATTCharacteristic;
  cmdFromStrap?: BluetoothRemoteGATTCharacteristic;
  eventsFromStrap?: BluetoothRemoteGATTCharacteristic;
  dataFromStrap?: BluetoothRemoteGATTCharacteristic;
};

// Callback types
type ConnectCallbacks = {
  onConnectSuccess?: () => void;
  onConnectFailure?: (error: any) => void;
  onDisconnect?: () => void;
  onBatteryUpdate?: (level: number) => void;
  onVersionUpdate?: (harvard: string, boylston: string) => void;
  onChargingStatusUpdate?: (charging: boolean) => void;
  onWristStatusUpdate?: (isWorn: boolean) => void;
  onClockUpdate?: (unix: number) => void;
  onHeartRateUpdate?: (heartRate: number) => void;
  onNotification?: (message: string) => void; // For general notifications
  onLog?: (message: string) => void; // For terminal logs
};

// Internal variables
let device: BluetoothDevice | undefined;
let server: BluetoothRemoteGATTServer | undefined;
let characteristics: Characteristics = {};

let seqNumber = 0;

// To store the interval reference
let batteryInterval: ReturnType<typeof setTimeout> | undefined;

// For the metadata packets
const metaQueue = new AsyncQueue<WhoopPacket>();

// Create a single instance
const historicalDataLogger = new FileStreamHandler("historical_data_stream.bin");

let isRealtimeActive = false; // Tracks the real-time status

export async function connectToWhoop(callbacks: ConnectCallbacks = {}): Promise<boolean> {
  try {
    console.log("Initiating Bluetooth request...");
    device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: "WHOOP" }],
      optionalServices: [WHOOP_SERVICE],
    });
    console.log("Device selected:", device.name);

    if (!device.gatt) throw new Error("GATT server not available on device");
    console.log("Connected to GATT server.");

    server = await device.gatt.connect();
    console.log("Connected to WHOOP device!");

    console.log("Getting primary service:", WHOOP_SERVICE);
    const service = await server.getPrimaryService(WHOOP_SERVICE);
    console.log("Primary service obtained:", service.uuid);

    console.log("Getting characteristics...");
    characteristics.cmdToStrap = await service.getCharacteristic(WHOOP_CHAR_CMD_TO_STRAP);
    console.log("cmdToStrap characteristic obtained:", WHOOP_CHAR_CMD_TO_STRAP);

    characteristics.cmdFromStrap = await service.getCharacteristic(WHOOP_CHAR_CMD_FROM_STRAP);
    console.log("cmdFromStrap characteristic obtained:", WHOOP_CHAR_CMD_FROM_STRAP);

    characteristics.eventsFromStrap = await service.getCharacteristic(WHOOP_CHAR_EVENTS_FROM_STRAP);
    console.log("eventsFromStrap characteristic obtained:", WHOOP_CHAR_EVENTS_FROM_STRAP);

    characteristics.dataFromStrap = await service.getCharacteristic(WHOOP_CHAR_DATA_FROM_STRAP);
    console.log("dataFromStrap characteristic obtained:", WHOOP_CHAR_DATA_FROM_STRAP);

    // Setting up notification handlers
    console.log("Starting notifications for cmdFromStrap...");
    if (characteristics.cmdFromStrap.properties.notify) {
      await characteristics.cmdFromStrap.startNotifications();
      console.log("Notifications started for cmdFromStrap.");
    } else {
      throw new Error("cmdFromStrap does not support notifications.");
    }

    console.log("Starting notifications for eventsFromStrap...");
    if (characteristics.eventsFromStrap.properties.notify) {
      await characteristics.eventsFromStrap.startNotifications();
      console.log("Notifications started for eventsFromStrap.");
    } else {
      throw new Error("eventsFromStrap does not support notifications.");
    }

    console.log("Starting notifications for dataFromStrap...");
    if (characteristics.dataFromStrap.properties.notify) {
      await characteristics.dataFromStrap.startNotifications();
      console.log("Notifications started for dataFromStrap.");
    } else {
      throw new Error("dataFromStrap does not support notifications.");
    }

    // Attach event listeners with callbacks
    characteristics.cmdFromStrap.addEventListener("characteristicvaluechanged", (event) =>
      handleCmdNotification(event, callbacks)
    );
    console.log("Event listener attached to cmdFromStrap.");

    characteristics.eventsFromStrap.addEventListener("characteristicvaluechanged", (event) =>
      handleEventsNotification(event, callbacks)
    );
    console.log("Event listener attached to eventsFromStrap.");

    characteristics.dataFromStrap.addEventListener("characteristicvaluechanged", (event) =>
      handleDataNotification(event, callbacks)
    );
    console.log("Event listener attached to dataFromStrap.");

    // Register the disconnect event handler
    device.addEventListener("gattserverdisconnected", () => handleDisconnect(callbacks));
    console.log("Disconnect event handler registered.");

    // Start periodic battery updates
    console.log("Starting battery updates...");
    await startBatteryUpdates(callbacks);
    console.log("Battery updates started.");

    // Get version and wrist status
    console.log("Sending report version command...");
    await sendReportVersion(callbacks);
    console.log("Report version command sent.");

    console.log("Sending hello Harvard command...");
    await sendHelloHarvard(callbacks);
    console.log("Hello Harvard command sent.");


    console.log("Setting device clock...");
    await sendSetClock(Math.floor(Date.now() / 1000), callbacks);
    console.log("SET_CLOCK command executed.");

    // Wait for SET_CLOCK acknowledgment
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Retrieve and verify RTC
    console.log("Retrieving current RTC to verify...");
    await sendGetClock(callbacks);
    console.log("GET_CLOCK command executed.");

    // Notify successful connection
    if (callbacks.onConnectSuccess) callbacks.onConnectSuccess();

    return true;
  } catch (error: any) {
    console.error("Error in connectToWhoop:", error);
    if (callbacks.onConnectFailure) callbacks.onConnectFailure(error);
    return false;
  }
}

function getNextSeqNumber(): number {
  seqNumber = (seqNumber + 1) % 256; // Assuming sequence number is 1 byte
  return seqNumber;
}

/**
 * Disconnect from the WHOOP and cleanup
 */
export async function disconnectFromWhoop(callbacks: ConnectCallbacks = {}): Promise<boolean> {
  try {
    if (device && device.gatt?.connected) {
      await device.gatt.disconnect();
      console.log(`Disconnected from WHOOP successfully`);
      if (callbacks.onDisconnect) callbacks.onDisconnect();
    } else {
      console.warn(`Device was not connected`);
      // Even if the device wasn't connected, consider the desired state (disconnected) achieved
      if (callbacks.onDisconnect) callbacks.onDisconnect();
    }
    return true; // Always return true unless an error occurred, if not this would lead to a disconnect while Whoop does nothing
  } catch (error: any) {
    console.error("Error in disconnectFromWhoop:", error);
    return false;
  }
}


/**
 * Handles device disconnection.
 */
async function handleDisconnect(callbacks: ConnectCallbacks): Promise<void> {
  console.warn(`Device disconnected!`);
  await stopBatteryUpdates(); // Stop updates on disconnect

  // Notify React component
  if (callbacks.onDisconnect) callbacks.onDisconnect();
}

/**
 * Parse the data field from REPORT_VERSION_INFO packet
 */
function parseVersionData(dataView: DataView): { harvard: string; boylston: string } {
  let offset = 0;

  const values: number[] = [];
  for (let i = 0; i < 16; i++) {
    values.push(dataView.getUint32(offset, true));
    offset += 4;
  }

  const harvard = `${values[0]}.${values[1]}.${values[2]}.${values[3]}`;
  const boylston = `${values[4]}.${values[5]}.${values[6]}.${values[7]}`;

  return { harvard, boylston };
}

/**
 * This will download the history from your WHOOP (Blob-based downloadHistory)
 */


export async function downloadHistory(callbacks: ConnectCallbacks = {}): Promise<void> {
  if (!characteristics.cmdToStrap) {
    console.error(`Device not connected or characteristic unavailable`);
    throw new Error("Device not connected or characteristic unavailable");
  }

  try {
    // Use the existing historicalDataLogger instance
    const fileHandler = historicalDataLogger;
    console.log("Using historicalDataLogger for Blob download.");

    console.log("Sending SEND_HISTORICAL_DATA command...");
    const sendHistoryPkt = new WhoopPacket(
      PacketType.COMMAND,
      0,
      CommandNumber.SEND_HISTORICAL_DATA,
      new Uint8Array([0x00])
    ).framedPacket();
    await characteristics.cmdToStrap.writeValue(sendHistoryPkt);
    console.log("SEND_HISTORICAL_DATA command sent.");

    console.log("Awaiting metadata packets...");

    let isComplete = false;
    while (!isComplete) {
      // Dequeue the next metadata packet
      const metapkt = await metaQueue.dequeue();
      console.log("Received metadata packet:", metapkt.toString());

      if (metapkt.cmd === MetadataType.HISTORY_COMPLETE) {
        console.log(`History download complete.`);
        isComplete = true;
        break;
      }

      if (metapkt.cmd === MetadataType.HISTORY_END) {
        // Extract the trim value from the packet
        const dataView = new DataView(metapkt.data.buffer);
        const trim = dataView.getUint32(10, true); // Little-endian

        console.log(`Received HISTORY_END with trim value: ${trim}`);

        // Construct HISTORICAL_DATA_RESULT command with the trim value
        const responseData = new Uint8Array(9);
        const responseView = new DataView(responseData.buffer);
        responseView.setUint8(0, 1);
        responseView.setUint32(1, trim, true);
        responseView.setUint32(5, 0, true);

        const responsePkt = new WhoopPacket(
          PacketType.COMMAND,
          getNextSeqNumber(),
          CommandNumber.HISTORICAL_DATA_RESULT,
          responseData
        ).framedPacket();

        console.log("Sending HISTORICAL_DATA_RESULT packet with trim:", trim);
        await characteristics.cmdToStrap.writeValue(responsePkt);
        console.log("HISTORICAL_DATA_RESULT packet sent.");
      } else if (metapkt.cmd === MetadataType.HISTORY_START) {
        // Handle history start packet
        console.log("Received HISTORY_START packet");
      } else {
        console.warn(`Unhandled metadata packet cmd: ${metapkt.cmd}`);
      }
    }

    // Only trigger download if we successfully completed
    if (isComplete) {
      console.log("History download finished successfully.");
      fileHandler.triggerDownload();
      console.log(`Total Data Chunks Accumulated: ${fileHandler.getDataChunksCount()}`);

      if (callbacks.onNotification) {
        callbacks.onNotification("History download successful! Please check your downloads folder.");
      }
    } else {
      throw new Error("History download did not complete properly");
    }

  } catch (error: any) {
    console.error("Error in downloadHistory:", error);
    if (callbacks.onNotification) {
      callbacks.onNotification("History download failed.");
    }
    throw error;
  }
}

export async function sendSetClock(unixTime: number, callbacks: ConnectCallbacks = {}): Promise<void> {
  if (!characteristics.cmdToStrap) {
      console.error("Device not connected or characteristic unavailable");
      return;
  }

  try {
      // Create an 8-byte payload
      const payload = new Uint8Array(8);
      const dataView = new DataView(payload.buffer);
      
      // Get current time in UTC
      const now = Math.floor(Date.now() / 1000);
      
      // First 4 bytes: Unix timestamp in little-endian
      dataView.setUint32(0, now, true);
      
      // Get timezone offset in seconds
      const timezoneOffsetInMinutes = new Date().getTimezoneOffset();
      const timezoneOffsetInSeconds = -timezoneOffsetInMinutes * 60; // Negative because getTimezoneOffset returns opposite
      
      // Next 4 bytes: Time zone offset in seconds (little-endian)
      dataView.setUint32(4, timezoneOffsetInSeconds, true);

      // Get the next sequence number
      const seq = getNextSeqNumber();

      // Create the SET_CLOCK packet
      const pkt = new WhoopPacket(
          PacketType.COMMAND,
          seq,
          CommandNumber.SET_CLOCK,
          payload
      ).framedPacket();

      // Send the SET_CLOCK command
      await characteristics.cmdToStrap.writeValue(pkt);
      console.log(`SET_CLOCK: Setting time to ${new Date(now * 1000).toISOString()} with offset ${timezoneOffsetInSeconds/3600}h`);

      // Wait for the device to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Send RTC set event
      const rtcEventPkt = new WhoopPacket(
          PacketType.EVENT,
          getNextSeqNumber(),
          EventNumber.SET_RTC,
          new Uint8Array([0x01])
      ).framedPacket();

      await characteristics.cmdToStrap.writeValue(rtcEventPkt);

      // Verify the clock was set by getting current time
      await sendGetClock(callbacks);

      if (callbacks.onNotification) {
          callbacks.onNotification("Clock set successfully");
      }

  } catch (error: any) {
      console.error(`Error in sendSetClock:`, error);
      if (callbacks.onConnectFailure) callbacks.onConnectFailure(error);
  }
}

export async function sendGetClock(callbacks: ConnectCallbacks = {}): Promise<void> {
  if (!characteristics.cmdToStrap) {
    console.error("Device not connected or characteristic unavailable");
    return;
  }

  try {
    const seq = getNextSeqNumber();
    const pkt = new WhoopPacket(PacketType.COMMAND, seq, CommandNumber.GET_CLOCK, new Uint8Array([0x00])).framedPacket();
    await characteristics.cmdToStrap.writeValue(pkt);
    console.log(`GET_CLOCK command sent, Seq: ${seq}`);
  } catch (error: any) {
    console.error(`Error sending GET_CLOCK command: ${error.message}`);
    if (callbacks.onConnectFailure) callbacks.onConnectFailure(error);
  }
}

/**
 * Handle incoming CMD notifications
 */
/**
 * Handle incoming CMD notifications
 */
function handleCmdNotification(event: Event, callbacks: ConnectCallbacks): void {
  const target = event.target as BluetoothRemoteGATTCharacteristic;
  const value = new Uint8Array(target.value!.buffer);
  let packet: WhoopPacket;

  try {
    packet = WhoopPacket.fromData(value);
  } catch (error) {
    console.error(`Failed to parse packet: ${error}`);
    return;
  }

  console.log(`Received CMD Packet: Type=${packet.type}, Cmd=${packet.cmd}`);

  switch (packet.cmd) {
    case CommandNumber.GET_BATTERY_LEVEL:
      const rawBatteryLevel = new DataView(packet.data.buffer).getUint16(2, true);
      const batteryLevel = rawBatteryLevel / 10.0;
      if (callbacks.onBatteryUpdate) callbacks.onBatteryUpdate(batteryLevel);
      break;

    case CommandNumber.REPORT_VERSION_INFO:
      const { harvard, boylston } = parseVersionData(new DataView(packet.data.buffer));
      if (callbacks.onVersionUpdate) callbacks.onVersionUpdate(harvard, boylston);
      break;

    case CommandNumber.GET_HELLO_HARVARD:
      const charging = !!new DataView(packet.data.buffer).getUint8(7);
      if (callbacks.onChargingStatusUpdate) callbacks.onChargingStatusUpdate(charging);
      const isWorn = !!new DataView(packet.data.buffer).getUint8(116);
      if (callbacks.onWristStatusUpdate) callbacks.onWristStatusUpdate(isWorn);
      break;

      case CommandNumber.GET_CLOCK:
        const unix = new DataView(packet.data.buffer).getUint32(2, true);
        console.log(`GET_CLOCK response: Unix Time = ${unix} (${new Date(unix * 1000).toISOString()})`);
        if (callbacks.onClockUpdate) callbacks.onClockUpdate(unix);
        break;

    case CommandNumber.SET_CLOCK:
      // Assuming the device sends back the updated clock or an acknowledgment
      const setClockSuccess = new DataView(packet.data.buffer).getUint8(0) === 1; // Example: 1 for success
      if (setClockSuccess) {
        console.log("SET_CLOCK command acknowledged successfully.");
        if (callbacks.onNotification) {
          callbacks.onNotification("Clock set successfully.");
        }
      } else {
        console.error("SET_CLOCK command failed.");
        if (callbacks.onConnectFailure) {
          callbacks.onConnectFailure(new Error("SET_CLOCK command failed."));
        }
      }
      break;

    // Add more cases as needed
  }
}


/**
 * Handle incoming EVENTS notifications
 */
function handleEventsNotification(event: Event, callbacks: ConnectCallbacks): void {
  const target = event.target as BluetoothRemoteGATTCharacteristic;
  const value = new Uint8Array(target.value!.buffer);
  const packet = WhoopPacket.fromData(value);

  switch (packet.cmd) {
    case EventNumber.WRIST_OFF:
      if (callbacks.onWristStatusUpdate) callbacks.onWristStatusUpdate(false);
      break;

    case EventNumber.WRIST_ON:
      if (callbacks.onWristStatusUpdate) callbacks.onWristStatusUpdate(true);
      break;

    case EventNumber.CHARGING_OFF:
      if (callbacks.onChargingStatusUpdate) callbacks.onChargingStatusUpdate(false);  
      break;

    case EventNumber.CHARGING_ON:
      if (callbacks.onChargingStatusUpdate) callbacks.onChargingStatusUpdate(true);
      break;  

    case EventNumber.DOUBLE_TAP:
      if (callbacks.onNotification) callbacks.onNotification("Double Tap Detected!");
      break;
  }
}

/**
 * Handle incoming DATA notifications
 */
function handleDataNotification(event: Event, callbacks: ConnectCallbacks): void {
  const target = event.target as BluetoothRemoteGATTCharacteristic;
  const value = new Uint8Array(target.value!.buffer);
  let packet: WhoopPacket;

  try {
    packet = WhoopPacket.fromData(value);
  } catch (error) {
    console.error(`Failed to parse packet: ${error}`);
    return;
  }

  console.log(`Received DATA Packet: Type=${packet.type}, Cmd=${packet.cmd}`);

  switch (packet.type) {
    case PacketType.REALTIME_DATA:
      const heartRate = packet.data[5];
      if (callbacks.onHeartRateUpdate) callbacks.onHeartRateUpdate(heartRate);
      break;
    case PacketType.METADATA:
      console.log(`Enqueuing Metadata Packet: Cmd=${packet.cmd}`);
      metaQueue.enqueue(packet);
      break;
    case PacketType.HISTORICAL_DATA:
      historicalDataLogger.streamData(value);
      break;
    case PacketType.CONSOLE_LOGS:
      const message = processLogData(packet.data);
      if (callbacks.onLog) callbacks.onLog(message);
      break;
    default:
      console.warn(`Unhandled DATA Packet Type: ${packet.type}`);
      break;
  }
}


function processLogData(data: Uint8Array): string {
  const slicedData = data.slice(7, data.length - 1);

  const cleanedData: number[] = [];
  for (let i = 0; i < slicedData.length; i++) {
    if (
      slicedData[i] === 0x34 &&
      slicedData[i + 1] === 0x00 &&
      slicedData[i + 2] === 0x01 &&
      i + 2 < slicedData.length
    ) {
      i += 2;
    } else {
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
async function startBatteryUpdates(callbacks: ConnectCallbacks): Promise<void> {
  if (device?.gatt?.connected) {
    await sendBatteryLevel(callbacks);
    batteryInterval = setInterval(() => sendBatteryLevel(callbacks), 30000);
  } else {
    console.error(`Device not connected`);
  }
}

/**
 * Stops battery updates
 */
async function stopBatteryUpdates(): Promise<void> {
  if (batteryInterval) {
    clearInterval(batteryInterval);
    batteryInterval = undefined;
  }
}

/**
 * Sends GET_BATTERY_LEVEL command
 */
async function sendBatteryLevel(callbacks?: ConnectCallbacks): Promise<void> {
  if (!characteristics.cmdToStrap) {
    console.error(`Device not connected or characteristic unavailable`);
    return;
  }

  try {
    const pkt = new WhoopPacket(PacketType.COMMAND, 0, CommandNumber.GET_BATTERY_LEVEL, new Uint8Array([0x00])).framedPacket();
    await characteristics.cmdToStrap.writeValue(pkt);
  } catch (error: any) {
    console.error(`Error sending battery level command: ${error.message}`);
    if (callbacks?.onConnectFailure) callbacks.onConnectFailure(error);
  }
}

/**
 * Sends REPORT_VERSION_INFO command
 */
async function sendReportVersion(callbacks?: ConnectCallbacks): Promise<void> {
  if (!characteristics.cmdToStrap) {
    console.error(`Device not connected or characteristic unavailable`);
    return;
  }

  try {
    const pkt = new WhoopPacket(PacketType.COMMAND, 0, CommandNumber.REPORT_VERSION_INFO, new Uint8Array([0x00])).framedPacket();
    await characteristics.cmdToStrap.writeValue(pkt);
  } catch (error: any) {
    console.error(`Error sending report version command: ${error.message}`);
    if (callbacks?.onConnectFailure) callbacks.onConnectFailure(error);
  }
}

/**
 * Sends GET_HELLO_HARVARD command
 */
async function sendHelloHarvard(callbacks?: ConnectCallbacks): Promise<void> {
  if (!characteristics.cmdToStrap) {
    console.error(`Device not connected or characteristic unavailable`);
    return;
  }

  try {
    const pkt = new WhoopPacket(PacketType.COMMAND, 0, CommandNumber.GET_HELLO_HARVARD, new Uint8Array([0x00])).framedPacket();
    await characteristics.cmdToStrap.writeValue(pkt);
  } catch (error: any) {
    console.error(`Error sending hello Harvard command: ${error.message}`);
    if (callbacks?.onConnectFailure) callbacks.onConnectFailure(error);
  }
}

/**
 * Toggles real-time heart rate updates.
 */
export async function sendToggleRealtime(): Promise<void> {
  if (!characteristics.cmdToStrap) {
    console.error("Device not connected or characteristic unavailable");
    return;
  }

  try {
    isRealtimeActive = !isRealtimeActive; // Toggle the state

    const pkt = new WhoopPacket(
      PacketType.COMMAND,
      0,
      CommandNumber.TOGGLE_REALTIME_HR,
      new Uint8Array([isRealtimeActive ? 0x01 : 0x00])
    ).framedPacket();

    await characteristics.cmdToStrap.writeValue(pkt);

    console.log(`Realtime heart rate ${isRealtimeActive ? "started" : "stopped"}`);
  } catch (error: any) {
    console.error(`Error toggling real-time heart rate: ${error.message}`);
  }
}
