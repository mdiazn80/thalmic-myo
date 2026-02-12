import type { MutableRefObject } from "react";
import type { DeviceInfo, DiscoveredDevice, ConnectionState } from "../services/ble";
import ConnectionPanel from "./dashboard/ConnectionPanel";
import EmgPanel from "./dashboard/EmgPanel";
import EmgEnvelopePanel from "./dashboard/EmgEnvelopePanel";
import OrientationPanel from "./dashboard/OrientationPanel";
import AccelerometerPanel from "./dashboard/AccelerometerPanel";
import GyroscopePanel from "./dashboard/GyroscopePanel";
import MotionIntensityPanel from "./dashboard/MotionIntensityPanel";
import DeviceInfoPanel from "./dashboard/DeviceInfoPanel";

interface DashboardProps {
  // Connection
  devices: DiscoveredDevice[];
  isScanning: boolean;
  connectionStates: Record<string, ConnectionState>;
  connectedDeviceName: string | null;
  onScanToggle: () => void;
  onConnect: (deviceId: string) => void;
  onDisconnect: () => void;
  scanDisabled: boolean;
  // Stream data
  emgRef: MutableRefObject<number[]>;
  imu: { orientation: number[]; accelerometer: number[]; gyroscope: number[] };
  batteryLevel: number | null;
  deviceInfo: DeviceInfo | null;
}

export default function Dashboard({
  devices,
  isScanning,
  connectionStates,
  connectedDeviceName,
  onScanToggle,
  onConnect,
  onDisconnect,
  scanDisabled,
  emgRef,
  imu,
  batteryLevel,
  deviceInfo,
}: DashboardProps) {
  return (
    <div className="dashboard">
      {/* Left column: rows 1-2 EMG Envelope, rows 3-4 EMG Channels */}
      <EmgEnvelopePanel emgRef={emgRef} />
      <EmgPanel emgRef={emgRef} />
      {/* Middle column: 4 half-height cards */}
      <MotionIntensityPanel
        accelerometer={imu.accelerometer}
        gyroscope={imu.gyroscope}
      />
      <OrientationPanel orientation={imu.orientation} />
      <AccelerometerPanel accelerometer={imu.accelerometer} />
      <GyroscopePanel gyroscope={imu.gyroscope} />
      {/* Right column: rows 1-2 Connection, rows 3-4 Device Info */}
      <ConnectionPanel
        devices={devices}
        isScanning={isScanning}
        connectionStates={connectionStates}
        connectedDeviceName={connectedDeviceName}
        onScanToggle={onScanToggle}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        scanDisabled={scanDisabled}
      />
      <DeviceInfoPanel deviceInfo={deviceInfo} batteryLevel={batteryLevel} />
    </div>
  );
}
