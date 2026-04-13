import type { DidReceiveSettingsEvent, KeyDownEvent, WillAppearEvent } from "@elgato/streamdeck";
import streamDeck, { action, SingletonAction } from "@elgato/streamdeck";
import { ROTATE_MICROPHONE_DEVICE } from "../constants/action-uuids.constants";
import type { INotifyableAction } from "../models/interfaces/notifyable-users.interface";
import type { GlobalSettings } from "../models/types/global-settings.type";
import sonarClient from "../services/sonar-client";
import type { AudioDevice } from "../models/types/sonar-models.type";
import { RedirectionEnum, SonarMode, StreamRedirectionEnum } from "../models/types/sonar-models.type";
import { wrapText } from "../helpers/plugin-helper";
import { logErrorAndThrow } from "../helpers/streamdeck-logger-helper";
import type { DeviceData } from "../models/types/device-data.type";

const logger = streamDeck.logger.createScope("rotate-microphone");

@action({ UUID: ROTATE_MICROPHONE_DEVICE })
export class RotateMichrophoneDevice extends SingletonAction<RotateMicrophoneSettings> implements INotifyableAction {
	public static async updateThisActionAsync(action: any): Promise<void> {
		const globalSettings = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
		const localSettings = await action.getSettings() as RotateMicrophoneSettings;

		await action.setTitle(RotateMichrophoneDevice.getTitleFromSettings(globalSettings, localSettings));
	}

	public async notifyRelatedActionsAsync(globalSettings: GlobalSettings): Promise<void> {
		await streamDeck.settings.setGlobalSettings(globalSettings);
		await Promise.all(streamDeck.actions.map(async (action) => {
			switch (action.manifestId) {
				case ROTATE_MICROPHONE_DEVICE:
					return RotateMichrophoneDevice.updateThisActionAsync(action);
			}
		}));
	}

	public override async onWillAppear(ev: WillAppearEvent<RotateMicrophoneSettings>): Promise<void> {
		await RotateMichrophoneDevice.initializeActionAsync(ev.action);
	}

	public override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<RotateMicrophoneSettings> | any): Promise<void> {
		if (ev.id === undefined)
			await RotateMichrophoneDevice.updateThisActionAsync(ev.action);
	}

	public override async onKeyDown(ev: KeyDownEvent<RotateMicrophoneSettings>): Promise<void> {
		const localSettings = await ev.action.getSettings() as RotateMicrophoneSettings;
		const globalSettings = await streamDeck.settings.getGlobalSettings<GlobalSettings>();

		const sonarMode = await sonarClient.getSonarModeAsync();
		const allDevices = await sonarClient.getAllInputAudioDevicesAsync();
		const currentInputDeviceId = await RotateMichrophoneDevice.getCurrentDeviceIdAsync(globalSettings, localSettings.rotationMode, sonarMode);

		const availableDeviceIds = await RotateMichrophoneDevice.filterAvailableDevicesAsync(allDevices, localSettings.allowExcludedDevices ?? false);
		const nextAudioDevice = RotateMichrophoneDevice.getNextAudioDevice(allDevices, availableDeviceIds, currentInputDeviceId);
		if (nextAudioDevice.id === undefined)
			throw logErrorAndThrow(logger, "Next audio input device is not assigned");

		await RotateMichrophoneDevice.setCurrentAudioInputAsync(nextAudioDevice.id, localSettings.rotationMode, sonarMode);

		globalSettings.sonarMode = sonarMode;
		RotateMichrophoneDevice.updateAudioDeviceGlobalSettings(
			globalSettings,
			nextAudioDevice.id,
			nextAudioDevice.friendlyName,
			localSettings.rotationMode,
			sonarMode);

		await streamDeck.settings.setGlobalSettings(globalSettings);
		await this.notifyRelatedActionsAsync(globalSettings);
	}

	private static async initializeActionAsync(action: any) {
		const settings = await action.getSettings();
		settings.rotationMode = settings.rotationMode ?? RotationMode.AutoSelect;
		settings.maxTitleLength = settings.maxTitleLength ?? 20;
		settings.allowExcludedDevices = settings.allowExcludedDevices ?? false;
		await action.setSettings(settings);

		await RotateMichrophoneDevice.updateThisActionAsync(action);
	}

	private static updateAudioDeviceGlobalSettings(
		globalSettings: GlobalSettings,
		deviceId: string,
		friendlyName: string,
		rotationMode: RotationMode,
		sonarMode: SonarMode) {
		const channel = RotateMichrophoneDevice.getCurrentChannel(globalSettings, rotationMode, sonarMode);

		channel.deviceId = deviceId;
		channel.deviceName = friendlyName;
	}

	private static getCurrentChannel(
		globalSettings: GlobalSettings,
		rotationMode: RotationMode,
		sonarMode: SonarMode): DeviceData {
		switch (rotationMode) {
			case RotationMode.ClassicOnly:
				return globalSettings.micChannel;
			case RotationMode.StreamModeOnly:
				return globalSettings.streamMicChannel;
			case RotationMode.AutoSelect:
				if (sonarMode == SonarMode.Classic)
					return globalSettings.micChannel;

				if (sonarMode == SonarMode.Streaming)
					return globalSettings.streamMicChannel;
		}

		throw logErrorAndThrow(logger, `Rotation Channel is not assigned ${rotationMode}`);
	}

	private static async setCurrentAudioInputAsync(nextAudioDeviceId: string, rotationMode: RotationMode, sonarMode: SonarMode) {
		switch (rotationMode) {
			case RotationMode.ClassicOnly:
				await sonarClient.putOutputAudioDeviceAsync(nextAudioDeviceId, RedirectionEnum.Microphone);
				break;
			case RotationMode.StreamModeOnly:
				await sonarClient.putStreamOutputAudioDeviceAsync(nextAudioDeviceId, StreamRedirectionEnum.Microphone);
				break;
			case RotationMode.AutoSelect:
				if (sonarMode == SonarMode.Classic) {
					await sonarClient.putOutputAudioDeviceAsync(nextAudioDeviceId, RedirectionEnum.Microphone);
					break;
				}

				if (sonarMode == SonarMode.Streaming) {
					await sonarClient.putStreamOutputAudioDeviceAsync(nextAudioDeviceId, StreamRedirectionEnum.Microphone);
					break;
				}
		}

		throw logErrorAndThrow(logger, `Unable to update microphone mode for ${rotationMode}`);
	}

	private static getTitleFromSettings(globalSettings: GlobalSettings, localSettings: RotateMicrophoneSettings) {
		const channel = RotateMichrophoneDevice.getCurrentChannel(globalSettings, localSettings.rotationMode, globalSettings.sonarMode);
		const titleText = channel.deviceName;

		if (titleText == undefined)
			throw logErrorAndThrow(logger, `Related Channel for setting title on ${ROTATE_MICROPHONE_DEVICE} is not found!`);

		return wrapText(titleText, 9, localSettings.maxTitleLength);
	}

	private static async filterAvailableDevicesAsync(allDevices: AudioDevice[], allowExcludedDevices: boolean): Promise<string[]> {
		if (allowExcludedDevices)
			return allDevices.map((device) => device.id ?? "Unknown");

		const availableDevices = await sonarClient.getAllExcludedMicrophoneAudioDevicesAsync();
		return availableDevices.map((device) => device.id ?? "Unknown");
	}

	private static async getCurrentDeviceIdAsync(
		globalSettings: GlobalSettings,
		rotationMode: RotationMode,
		sonarMode: SonarMode): Promise<string> {
		const channel = RotateMichrophoneDevice.getCurrentChannel(globalSettings, rotationMode, sonarMode);
		return channel.deviceId ?? "Unknown";
	}

	private static getNextAudioDevice(allDevices: AudioDevice[], availableDeviceIds: string[], currentInputDeviceId: string): AudioDevice {
		const currentDeviceIndex = availableDeviceIds.findIndex((id) => id == currentInputDeviceId);
		const nextAudioDeviceIdIndex = currentDeviceIndex + 1 < availableDeviceIds.length ? currentDeviceIndex + 1 : 0;
		const nextAudioDeviceId = availableDeviceIds[nextAudioDeviceIdIndex];

		const nextAudioDeviceIndex = allDevices.findIndex((device) => device.id == nextAudioDeviceId);
		return allDevices[nextAudioDeviceIndex];
	}
}

type RotateMicrophoneSettings = {
	rotationMode: RotationMode,
	maxTitleLength: number,
	allowExcludedDevices: boolean,
};

enum RotationMode {
	AutoSelect = "auto-select",
	ClassicOnly = "classic-only",
	StreamModeOnly = "stream-mode-only",
}