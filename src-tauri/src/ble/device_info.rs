use btleplug::api::Peripheral as _;
use btleplug::platform::Peripheral;
use serde::Serialize;

use super::manager::BleError;
use super::myo_protocol;

#[derive(Debug, Clone, Serialize)]
pub struct DeviceInfo {
    pub firmware_version: Option<String>,
    pub serial_number: Option<String>,
    pub battery_level: Option<u8>,
}

pub async fn read_device_info(peripheral: &Peripheral) -> Result<DeviceInfo, BleError> {
    let chars = peripheral.characteristics();

    let mut firmware_version = None;
    let mut serial_number = None;
    let mut battery_level = None;

    if let Some(fw_char) = chars.iter().find(|c| c.uuid == myo_protocol::firmware_version_char()) {
        if let Ok(data) = peripheral.read(fw_char).await {
            if let Some(fw) = myo_protocol::parse_firmware_version(&data) {
                firmware_version = Some(format!("{}.{}.{}", fw.major, fw.minor, fw.patch));
            }
        }
    }

    if let Some(info_char) = chars.iter().find(|c| c.uuid == myo_protocol::info_char()) {
        if let Ok(data) = peripheral.read(info_char).await {
            if let Some(serial) = myo_protocol::parse_myo_info_serial(&data) {
                serial_number = Some(
                    serial.iter().map(|b| format!("{:02x}", b)).collect::<String>(),
                );
            }
        }
    }

    if let Some(batt_char) = chars.iter().find(|c| c.uuid == myo_protocol::battery_level_char()) {
        if let Ok(data) = peripheral.read(batt_char).await {
            if let Some(&level) = data.first() {
                battery_level = Some(level);
            }
        }
    }

    Ok(DeviceInfo {
        firmware_version,
        serial_number,
        battery_level,
    })
}
