export interface Translations {
  header: {
    title: string;
    scan: string;
    stop: string;
    disconnect: string;
    editNameTooltip: string;
  };
  scanner: {
    scanning: string;
    poweredOnHint: string;
    noDevices: string;
    scanHint: string;
    scanningShort: string;
  };
  deviceCard: {
    unknownDevice: string;
    disconnect: string;
    connect: string;
    connecting: string;
    onlyMyoTooltip: string;
    rssiNA: string;
    rssiExcellent: string;
    rssiGood: string;
    rssiFair: string;
    rssiWeak: string;
  };
  statusBar: {
    connectedTo: string;
    connecting: string;
    scanning: string;
    found: string;
    device: string;
    devices: string;
    ready: string;
  };
  connection: {
    title: string;
    connected: string;
    notConnected: string;
    scanHint: string;
    disconnect: string;
  };
  dashboard: {
    emgChannels: string;
    orientation: string;
    roll: string;
    pitch: string;
    yaw: string;
    accelerometer: string;
    gyroscope: string;
    gesture: string;
    noData: string;
    unknown: string;
    deviceInfo: string;
    firmware: string;
    serial: string;
    battery: string;
    batteryTooltip: string;
    armStatus: string;
    armSynced: string;
    armUnsynced: string;
    leftArm: string;
    rightArm: string;
    unknownArm: string;
    towardWrist: string;
    towardElbow: string;
    locked: string;
    unlocked: string;
    emgEnvelope: string;
    poseHistory: string;
    motionIntensity: string;
    accelMagnitude: string;
    gyroMagnitude: string;
    noHistory: string;
    ago: string;
    arm: string;
    direction: string;
    lock: string;
  };
  poses: {
    rest: string;
    fist: string;
    waveIn: string;
    waveOut: string;
    fingersSpread: string;
    doubleTap: string;
  };
  language: {
    en: string;
    es: string;
  };
}

export type Locale = "en" | "es";
