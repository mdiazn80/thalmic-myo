import { useState, useEffect, useRef, useCallback } from "react";
import {
  startMyoStream,
  stopMyoStream,
  getDeviceInfo,
  type MyoStreamMessage,
  type Pose,
  type DeviceInfo,
} from "../services/ble";

export interface ImuState {
  orientation: number[];
  accelerometer: number[];
  gyroscope: number[];
}

export interface ArmState {
  synced: boolean;
  arm: number | null;
  xDirection: number | null;
  locked: boolean;
}

export interface PoseEvent {
  pose: Pose;
  timestamp: number;
}

const MAX_POSE_HISTORY = 20;

export interface MyoStreamState {
  imu: ImuState;
  currentPose: Pose | null;
  batteryLevel: number | null;
  deviceInfo: DeviceInfo | null;
  armState: ArmState;
  poseHistory: PoseEvent[];
  isStreaming: boolean;
  error: string | null;
}

const INITIAL_ARM_STATE: ArmState = {
  synced: false,
  arm: null,
  xDirection: null,
  locked: true,
};

export function useMyoStream(isConnected: boolean) {
  const [state, setState] = useState<MyoStreamState>({
    imu: {
      orientation: [1, 0, 0, 0],
      accelerometer: [0, 0, 0],
      gyroscope: [0, 0, 0],
    },
    currentPose: null,
    batteryLevel: null,
    deviceInfo: null,
    armState: INITIAL_ARM_STATE,
    poseHistory: [],
    isStreaming: false,
    error: null,
  });

  // EMG data at 200Hz — stored in ref to avoid re-renders
  const emgRef = useRef<number[]>([0, 0, 0, 0, 0, 0, 0, 0]);

  const handleMessage = useCallback((msg: MyoStreamMessage) => {
    switch (msg.type) {
      case "emg":
        emgRef.current = msg.channels;
        break;
      case "imu":
        setState((prev) => ({
          ...prev,
          imu: {
            orientation: msg.orientation,
            accelerometer: msg.accelerometer,
            gyroscope: msg.gyroscope,
          },
        }));
        break;
      case "classifier": {
        const event = msg.event;
        if (event.type === "pose") {
          setState((prev) => {
            const newHistory =
              event.pose !== "rest"
                ? [
                    { pose: event.pose, timestamp: Date.now() },
                    ...prev.poseHistory,
                  ].slice(0, MAX_POSE_HISTORY)
                : prev.poseHistory;
            return { ...prev, currentPose: event.pose, poseHistory: newHistory };
          });
        } else if (event.type === "arm_synced") {
          setState((prev) => ({
            ...prev,
            armState: {
              synced: true,
              arm: event.arm,
              xDirection: event.x_direction,
              locked: prev.armState.locked,
            },
          }));
        } else if (event.type === "arm_unsynced") {
          setState((prev) => ({
            ...prev,
            armState: { ...prev.armState, synced: false, arm: null, xDirection: null },
          }));
        } else if (event.type === "locked") {
          setState((prev) => ({
            ...prev,
            armState: { ...prev.armState, locked: true },
          }));
        } else if (event.type === "unlocked") {
          setState((prev) => ({
            ...prev,
            armState: { ...prev.armState, locked: false },
          }));
        }
        break;
      }
      case "battery":
        setState((prev) => ({ ...prev, batteryLevel: msg.level }));
        break;
    }
  }, []);

  useEffect(() => {
    if (!isConnected) {
      setState((prev) => ({
        ...prev,
        isStreaming: false,
        deviceInfo: null,
        currentPose: null,
        armState: INITIAL_ARM_STATE,
        poseHistory: [],
      }));
      emgRef.current = [0, 0, 0, 0, 0, 0, 0, 0];
      return;
    }

    let cancelled = false;

    const start = async () => {
      try {
        const info = await getDeviceInfo();
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          deviceInfo: info,
          batteryLevel: info.battery_level,
          error: null,
        }));

        await startMyoStream(handleMessage);
        if (cancelled) return;
        setState((prev) => ({ ...prev, isStreaming: true }));
      } catch (err) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            error: String(err),
          }));
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      stopMyoStream().catch(() => {});
    };
  }, [isConnected, handleMessage]);

  const setArmOverride = useCallback((arm: number) => {
    setState((prev) => ({
      ...prev,
      armState: { ...prev.armState, arm },
    }));
  }, []);

  const setDirectionOverride = useCallback((xDirection: number) => {
    setState((prev) => ({
      ...prev,
      armState: { ...prev.armState, xDirection },
    }));
  }, []);

  return { ...state, emgRef, setArmOverride, setDirectionOverride };
}
