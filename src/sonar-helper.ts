import streamDeck from '@elgato/streamdeck';
import sonarClient from './services/sonar-client';
import { RedirectionEnum, StreamRedirectionEnum } from './models/types/sonar-models.type';
import { GlobalSettings } from './models/types/global-settings.type';

const logger = streamDeck.logger.createScope("sonar-helper");

export async function getCurrentSonarSettings(): Promise<GlobalSettings>
{
    const classicRedirections = await sonarClient.getDeviceRedirectionsAsync();
    const streamRedirections = await sonarClient.getStreamDeviceRedirectionsAsync();
    logger.debug(JSON.stringify(classicRedirections));

    const mode = await sonarClient.getSonarModeAsync();

    const allOutputDevices = await sonarClient.getAllOutputAudioDevicesAsync();
    const gameDevice = allOutputDevices.find((x: { id: any; }) => x.id == classicRedirections.find((x) => x.id == RedirectionEnum.Game)!.deviceId);
    const chatDevice = allOutputDevices.find((x: { id: any; }) => x.id == classicRedirections.find((x) => x.id == RedirectionEnum.Chat)!.deviceId);
    const mediaDevice = allOutputDevices.find((x: { id: any; }) => x.id == classicRedirections.find((x) => x.id == RedirectionEnum.Media)!.deviceId);
    const auxDevice = allOutputDevices.find((x: { id: any; }) => x.id == classicRedirections.find((x) => x.id == RedirectionEnum.Aux)!.deviceId);

    const personalDevice = allOutputDevices.find((x: { id: any; }) => x.id == streamRedirections.find((x) => x.streamRedirectionId == StreamRedirectionEnum.PersonalMix)!.deviceId);
    const streamMixDevice = allOutputDevices.find((x: { id: any; }) => x.id == streamRedirections.find((x) => x.streamRedirectionId == StreamRedirectionEnum.StreamMix)!.deviceId);

    const globalSettings: GlobalSettings = {
        sonarMode: mode,
        gameChannel: {
            deviceId: gameDevice!.id!,
            deviceName: gameDevice!.friendlyName,
        },
        chatChannel: {
            deviceId: chatDevice!.id!,
            deviceName: chatDevice!.friendlyName,
        },
        mediaChannel: {
            deviceId: mediaDevice!.id!,
            deviceName: mediaDevice!.friendlyName,
        },
        auxChannel: {
            deviceId: auxDevice!.id!,
            deviceName: auxDevice!.friendlyName,
        },
        personalMixChannel: {
            deviceId: personalDevice!.id!,
            deviceName: personalDevice!.friendlyName!
        },
        streamMixChannel: {
            deviceId: streamMixDevice!.id!,
            deviceName: streamMixDevice!.friendlyName!
        }
    };

    return globalSettings;
}