import { useState, useEffect, useCallback } from "react";
import "./App.css";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import StatusBar from "./components/StatusBar";
import { useMyoStream } from "./hooks/useMyoStream";
import {
  startScan,
  stopScan,
  connectDevice,
  disconnectDevice,
  onDeviceDiscovered,
  onConnectionChanged,
  type DiscoveredDevice,
  type ConnectionState,
} from "./services/ble";

function App() {
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectionStates, setConnectionStates] = useState<
    Record<string, ConnectionState>
  >({});
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [customDeviceName, setCustomDeviceName] = useState<string | null>(null);

  const isConnected = connectedDeviceId !== null;

  const {
    emgRef,
    imu,
    batteryLevel,
    deviceInfo,
  } = useMyoStream(isConnected);

  useEffect(() => {
    let unlistenDiscovered: (() => void) | null = null;
    let unlistenConnection: (() => void) | null = null;

    const setup = async () => {
      unlistenDiscovered = await onDeviceDiscovered((device) => {
        setDevices((prev) => {
          const idx = prev.findIndex((d) => d.id === device.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = device;
            return updated;
          }
          return [...prev, device];
        });
      });

      unlistenConnection = await onConnectionChanged((event) => {
        setConnectionStates((prev) => ({
          ...prev,
          [event.device_id]: event.state,
        }));

        if (event.state === "connected") {
          setConnectedDeviceId(event.device_id);
        } else if (event.state === "disconnected") {
          setConnectedDeviceId((prev) =>
            prev === event.device_id ? null : prev
          );
          setCustomDeviceName(null);
        }
      });
    };

    setup();

    return () => {
      unlistenDiscovered?.();
      unlistenConnection?.();
    };
  }, []);

  const handleScanToggle = useCallback(async () => {
    setError(null);
    try {
      if (isScanning) {
        await stopScan();
        setIsScanning(false);
      } else {
        setDevices([]);
        setIsScanning(true);
        await startScan();
      }
    } catch (err) {
      setError(String(err));
      setIsScanning(false);
    }
  }, [isScanning]);

  const handleConnect = useCallback(async (deviceId: string) => {
    setError(null);
    try {
      setIsScanning(false);
      await connectDevice(deviceId);
    } catch (err) {
      setError(String(err));
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    setError(null);
    try {
      await disconnectDevice();
    } catch (err) {
      setError(String(err));
    }
    // Reset all state to initial — as if the app just launched
    setDevices([]);
    setConnectionStates({});
    setIsScanning(false);
    setConnectedDeviceId(null);
    setCustomDeviceName(null);
  }, []);

  const connectedDevice = connectedDeviceId
    ? devices.find((d) => d.id === connectedDeviceId) ?? null
    : null;

  const displayDeviceName =
    customDeviceName ?? connectedDevice?.name ?? null;

  const overallConnectionState: ConnectionState = connectedDeviceId
    ? connectionStates[connectedDeviceId] ?? "disconnected"
    : "disconnected";

  const sortedDevices = [...devices].sort((a, b) => {
    if (a.is_myo !== b.is_myo) return a.is_myo ? -1 : 1;
    return (b.rssi ?? -999) - (a.rssi ?? -999);
  });

  return (
    <div className="app">
      <Header
        connectedDeviceName={displayDeviceName}
        batteryLevel={batteryLevel}
        onDeviceNameChange={setCustomDeviceName}
      />
      <Dashboard
        devices={sortedDevices}
        isScanning={isScanning}
        connectionStates={connectionStates}
        connectedDeviceName={displayDeviceName}
        onScanToggle={handleScanToggle}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        scanDisabled={overallConnectionState === "connecting"}
        emgRef={emgRef}
        imu={imu}
        batteryLevel={batteryLevel}
        deviceInfo={deviceInfo}
      />
      <StatusBar
        isScanning={isScanning}
        connectedDeviceName={displayDeviceName}
        connectionState={overallConnectionState}
        deviceCount={devices.length}
        error={error}
      />
    </div>
  );
}

export default App;
