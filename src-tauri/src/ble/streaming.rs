use btleplug::api::{Characteristic, Peripheral as _, WriteType};
use btleplug::platform::Peripheral;
use futures::StreamExt;
use serde::Serialize;
use tauri::ipc::Channel;
use tokio::sync::watch;
use tokio::task::JoinHandle;

use super::manager::BleError;
use super::myo_protocol;

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum MyoStreamMessage {
    Emg { channels: [i8; 8] },
    Imu {
        orientation: [f32; 4],
        accelerometer: [f32; 3],
        gyroscope: [f32; 3],
    },
    Classifier {
        event: myo_protocol::ClassifierEvent,
    },
    Battery { level: u8 },
}

pub struct StreamHandle {
    shutdown_tx: watch::Sender<bool>,
    task: JoinHandle<()>,
}

impl StreamHandle {
    pub async fn stop(self) {
        let _ = self.shutdown_tx.send(true);
        let _ = self.task.await;
    }
}

fn find_char(peripheral: &Peripheral, uuid: uuid::Uuid) -> Option<Characteristic> {
    peripheral
        .characteristics()
        .into_iter()
        .find(|c| c.uuid == uuid)
}

pub async fn start_data_stream(
    peripheral: Peripheral,
    channel: Channel<MyoStreamMessage>,
) -> Result<StreamHandle, BleError> {
    let cmd = find_char(&peripheral, myo_protocol::command_char())
        .ok_or_else(|| BleError::ConnectionFailed("Command characteristic not found".into()))?;

    let emg_chars: Vec<Characteristic> = myo_protocol::emg_data_chars()
        .iter()
        .filter_map(|uuid| find_char(&peripheral, *uuid))
        .collect();

    let imu_char = find_char(&peripheral, myo_protocol::imu_data_char());
    let classifier_char = find_char(&peripheral, myo_protocol::classifier_event_char());
    let battery_char = find_char(&peripheral, myo_protocol::battery_level_char());

    // Send initialization commands
    peripheral
        .write(&cmd, &myo_protocol::cmd_never_sleep(), WriteType::WithResponse)
        .await?;
    peripheral
        .write(&cmd, &myo_protocol::cmd_unlock_hold(), WriteType::WithResponse)
        .await?;
    peripheral
        .write(
            &cmd,
            &myo_protocol::cmd_set_mode(
                myo_protocol::EmgMode::Raw,
                myo_protocol::ImuMode::Data,
                myo_protocol::ClassifierMode::Enabled,
            ),
            WriteType::WithResponse,
        )
        .await?;

    // Subscribe to notifications
    for c in &emg_chars {
        peripheral.subscribe(c).await?;
    }
    if let Some(ref c) = imu_char {
        peripheral.subscribe(c).await?;
    }
    if let Some(ref c) = classifier_char {
        peripheral.subscribe(c).await?;
    }

    let (shutdown_tx, mut shutdown_rx) = watch::channel(false);
    let mut shutdown_rx_battery = shutdown_rx.clone();

    let emg_uuids: Vec<uuid::Uuid> = myo_protocol::emg_data_chars().to_vec();
    let imu_uuid = myo_protocol::imu_data_char();
    let classifier_uuid = myo_protocol::classifier_event_char();

    let ch = channel.clone();
    let p = peripheral.clone();
    let battery_char_clone = battery_char.clone();

    let task = tokio::spawn(async move {
        let mut notifications = match p.notifications().await {
            Ok(n) => n,
            Err(_) => return,
        };

        // Battery polling sub-task
        let ch_bat = ch.clone();
        let p_bat = p.clone();
        let battery_task = tokio::spawn(async move {
            loop {
                if let Some(ref bc) = battery_char_clone {
                    if let Ok(data) = p_bat.read(bc).await {
                        if let Some(&level) = data.first() {
                            let _ = ch_bat.send(MyoStreamMessage::Battery { level });
                        }
                    }
                }
                tokio::select! {
                    _ = tokio::time::sleep(std::time::Duration::from_secs(30)) => {}
                    _ = shutdown_rx_battery.changed() => break,
                }
            }
        });

        loop {
            tokio::select! {
                Some(notif) = notifications.next() => {
                    let uuid = notif.uuid;
                    let data = &notif.value;

                    if emg_uuids.contains(&uuid) {
                        if let Some(samples) = myo_protocol::parse_emg_notification(data) {
                            let _ = ch.send(MyoStreamMessage::Emg { channels: samples[0].channels });
                            let _ = ch.send(MyoStreamMessage::Emg { channels: samples[1].channels });
                        }
                    } else if uuid == imu_uuid {
                        if let Some(imu) = myo_protocol::parse_imu_notification(data) {
                            let _ = ch.send(MyoStreamMessage::Imu {
                                orientation: imu.orientation,
                                accelerometer: imu.accelerometer,
                                gyroscope: imu.gyroscope,
                            });
                        }
                    } else if uuid == classifier_uuid {
                        if let Some(event) = myo_protocol::parse_classifier_event(data) {
                            let _ = ch.send(MyoStreamMessage::Classifier { event });
                        }
                    }
                }
                _ = shutdown_rx.changed() => break,
                else => break,
            }
        }

        battery_task.abort();
    });

    Ok(StreamHandle { shutdown_tx, task })
}
