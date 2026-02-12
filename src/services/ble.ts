import { invoke, Channel } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export interface DiscoveredDevice {
  id: string;
  name: string | null;
  rssi: number | null;
  is_myo: boolean;
}

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting";

export interface ConnectionEvent {
  device_id: string;
  state: ConnectionState;
}

export function startScan(): Promise<void> {
  return invoke("ble_start_scan");
}

export function stopScan(): Promise<void> {
  return invoke("ble_stop_scan");
}

export function connectDevice(deviceId: string): Promise<void> {
  return invoke("ble_connect", { deviceId });
}

export function disconnectDevice(): Promise<void> {
  return invoke("ble_disconnect");
}

export function getDevices(): Promise<DiscoveredDevice[]> {
  return invoke("ble_get_devices");
}

export function onDeviceDiscovered(
  callback: (device: DiscoveredDevice) => void
): Promise<UnlistenFn> {
  return listen<DiscoveredDevice>("ble:device-discovered", (event) => {
    callback(event.payload);
  });
}

export function onConnectionChanged(
  callback: (event: ConnectionEvent) => void
): Promise<UnlistenFn> {
  return listen<ConnectionEvent>("ble:connection-changed", (event) => {
    callback(event.payload);
  });
}

// ==================== Myo Stream Types ====================

export interface EmgMessage {
  type: "emg";
  channels: number[];
}

export interface ImuMessage {
  type: "imu";
  orientation: number[];
  accelerometer: number[];
  gyroscope: number[];
}

export interface ClassifierMessage {
  type: "classifier";
  event: ClassifierEvent;
}

export interface BatteryMessage {
  type: "battery";
  level: number;
}

export type MyoStreamMessage =
  | EmgMessage
  | ImuMessage
  | ClassifierMessage
  | BatteryMessage;

export type ClassifierEvent =
  | { type: "arm_synced"; arm: number; x_direction: number }
  | { type: "arm_unsynced" }
  | { type: "pose"; pose: Pose }
  | { type: "unlocked" }
  | { type: "locked" };

export type Pose =
  | "rest"
  | "fist"
  | "wave_in"
  | "wave_out"
  | "fingers_spread"
  | "double_tap"
  | { unknown: number };

export interface DeviceInfo {
  firmware_version: string | null;
  serial_number: string | null;
  battery_level: number | null;
}

// ==================== Myo Stream Commands ====================

export function startMyoStream(
  onData: (msg: MyoStreamMessage) => void
): Promise<void> {
  const channel = new Channel<MyoStreamMessage>();
  channel.onmessage = onData;
  return invoke("myo_start_stream", { onData: channel });
}

export function stopMyoStream(): Promise<void> {
  return invoke("myo_stop_stream");
}

export function getDeviceInfo(): Promise<DeviceInfo> {
  return invoke("myo_get_device_info");
}
