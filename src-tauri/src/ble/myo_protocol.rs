#![allow(dead_code)]

use serde::Serialize;
use uuid::Uuid;

/// Build a Myo-specific UUID from a 16-bit short ID.
/// Base: d506XXXX-a904-deb9-4748-2c7f4a124842
fn myo_uuid(short: u16) -> Uuid {
    Uuid::from_u128(
        0xd506_0000_a904_deb9_4748_2c7f4a124842_u128 | ((short as u128) << 96),
    )
}

// ==================== Services ====================

pub fn control_service() -> Uuid {
    myo_uuid(0x0001)
}

pub fn imu_service() -> Uuid {
    myo_uuid(0x0002)
}

pub fn classifier_service() -> Uuid {
    myo_uuid(0x0003)
}

pub fn emg_service() -> Uuid {
    myo_uuid(0x0005)
}

// ==================== Characteristics ====================

pub fn info_char() -> Uuid {
    myo_uuid(0x0101)
}

pub fn firmware_version_char() -> Uuid {
    myo_uuid(0x0201)
}

pub fn command_char() -> Uuid {
    myo_uuid(0x0401)
}

pub fn imu_data_char() -> Uuid {
    myo_uuid(0x0402)
}

pub fn classifier_event_char() -> Uuid {
    myo_uuid(0x0103)
}

pub fn emg_data_chars() -> [Uuid; 4] {
    [
        myo_uuid(0x0105),
        myo_uuid(0x0205),
        myo_uuid(0x0305),
        myo_uuid(0x0405),
    ]
}

/// Standard BLE Battery Level characteristic (0x2A19)
pub fn battery_level_char() -> Uuid {
    Uuid::from_u128(0x00002A19_0000_1000_8000_00805f9b34fb)
}

pub fn is_myo_device(services: &[Uuid]) -> bool {
    services.contains(&control_service())
}

// ==================== Command Builders ====================

#[repr(u8)]
#[derive(Clone, Copy)]
pub enum EmgMode {
    None = 0x00,
    Filtered = 0x02,
    Raw = 0x03,
}

#[repr(u8)]
#[derive(Clone, Copy)]
pub enum ImuMode {
    None = 0x00,
    Data = 0x01,
    Events = 0x02,
    All = 0x03,
    Raw = 0x04,
}

#[repr(u8)]
#[derive(Clone, Copy)]
pub enum ClassifierMode {
    Disabled = 0x00,
    Enabled = 0x01,
}

pub fn cmd_set_mode(emg: EmgMode, imu: ImuMode, classifier: ClassifierMode) -> Vec<u8> {
    vec![0x01, 0x03, emg as u8, imu as u8, classifier as u8]
}

pub fn cmd_never_sleep() -> Vec<u8> {
    vec![0x09, 0x01, 0x01]
}

pub fn cmd_unlock_hold() -> Vec<u8> {
    vec![0x0a, 0x01, 0x02]
}

pub fn cmd_vibrate_short() -> Vec<u8> {
    vec![0x03, 0x01, 0x01]
}

// ==================== Data Parsers ====================

#[derive(Debug, Clone, Serialize)]
pub struct EmgSample {
    pub channels: [i8; 8],
}

pub fn parse_emg_notification(data: &[u8]) -> Option<[EmgSample; 2]> {
    if data.len() < 16 {
        return None;
    }
    Some([
        EmgSample {
            channels: [
                data[0] as i8,
                data[1] as i8,
                data[2] as i8,
                data[3] as i8,
                data[4] as i8,
                data[5] as i8,
                data[6] as i8,
                data[7] as i8,
            ],
        },
        EmgSample {
            channels: [
                data[8] as i8,
                data[9] as i8,
                data[10] as i8,
                data[11] as i8,
                data[12] as i8,
                data[13] as i8,
                data[14] as i8,
                data[15] as i8,
            ],
        },
    ])
}

#[derive(Debug, Clone, Serialize)]
pub struct ImuData {
    pub orientation: [f32; 4],
    pub accelerometer: [f32; 3],
    pub gyroscope: [f32; 3],
}

pub fn parse_imu_notification(data: &[u8]) -> Option<ImuData> {
    if data.len() < 20 {
        return None;
    }
    let r = |off: usize| i16::from_le_bytes([data[off], data[off + 1]]);
    Some(ImuData {
        orientation: [
            r(0) as f32 / 16384.0,
            r(2) as f32 / 16384.0,
            r(4) as f32 / 16384.0,
            r(6) as f32 / 16384.0,
        ],
        accelerometer: [
            r(8) as f32 / 2048.0,
            r(10) as f32 / 2048.0,
            r(12) as f32 / 2048.0,
        ],
        gyroscope: [
            r(14) as f32 / 16.0,
            r(16) as f32 / 16.0,
            r(18) as f32 / 16.0,
        ],
    })
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Pose {
    Rest,
    Fist,
    WaveIn,
    WaveOut,
    FingersSpread,
    DoubleTap,
    Unknown(u16),
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ClassifierEvent {
    ArmSynced { arm: u8, x_direction: u8 },
    ArmUnsynced,
    Pose { pose: Pose },
    Unlocked,
    Locked,
}

pub fn parse_classifier_event(data: &[u8]) -> Option<ClassifierEvent> {
    if data.len() < 3 {
        return None;
    }
    match data[0] {
        0x01 => Some(ClassifierEvent::ArmSynced {
            arm: data[1],
            x_direction: data[2],
        }),
        0x02 => Some(ClassifierEvent::ArmUnsynced),
        0x03 => {
            let pose_id = u16::from_le_bytes([data[1], data[2]]);
            let pose = match pose_id {
                0 => Pose::Rest,
                1 => Pose::Fist,
                2 => Pose::WaveIn,
                3 => Pose::WaveOut,
                4 => Pose::FingersSpread,
                5 => Pose::DoubleTap,
                other => Pose::Unknown(other),
            };
            Some(ClassifierEvent::Pose { pose })
        }
        0x04 => Some(ClassifierEvent::Unlocked),
        0x05 => Some(ClassifierEvent::Locked),
        _ => None,
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct FirmwareVersion {
    pub major: u16,
    pub minor: u16,
    pub patch: u16,
}

pub fn parse_firmware_version(data: &[u8]) -> Option<FirmwareVersion> {
    if data.len() < 6 {
        return None;
    }
    let r = |off: usize| u16::from_le_bytes([data[off], data[off + 1]]);
    Some(FirmwareVersion {
        major: r(0),
        minor: r(2),
        patch: r(4),
    })
}

pub fn parse_myo_info_serial(data: &[u8]) -> Option<[u8; 6]> {
    if data.len() < 6 {
        return None;
    }
    let mut serial = [0u8; 6];
    serial.copy_from_slice(&data[0..6]);
    Some(serial)
}
