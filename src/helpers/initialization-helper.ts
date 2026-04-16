import streamDeck from "@elgato/streamdeck";
import { RotateMichrophoneDevice } from "../actions/rotate-michrophone-device";
import { RotateOutputAudioDevice } from "../actions/rotate-audio-output-device";
import { CHAT_MIX_CONTROLLER, MUTE_CHANNEL, ROTATE_MICROPHONE_DEVICE, ROTATE_OUTPUT_DEVICES, VOLUME_MIXER } from "../constants/action-uuids.constants";
import { getCurrentSonarSettingsAsync } from "../sonar-helper";
import { ChangeChannelVolume } from "../actions/change-channel-volume";
import { ChatMixController } from "../actions/chat-mix-controller";
import { MuteChannel } from "../actions/mute-channel";

export async function initializeGlobalSettingsAsync() {
    const globalSettings = await getCurrentSonarSettingsAsync();
    // Functions weird during Streamdeck setup. Stops working.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    streamDeck.settings.setGlobalSettings(globalSettings);

    setInterval(async () => {
        const globalSettings = await getCurrentSonarSettingsAsync();
        // Functions weird during Streamdeeck setup. Stops working.
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        streamDeck.settings.setGlobalSettings(globalSettings);
        await notifyAllAsync();
    }, 60000);
}

export async function notifyAllAsync() {
    await Promise.all(streamDeck.actions.map(async (action) => {
        switch (action.manifestId) {
            case ROTATE_OUTPUT_DEVICES:
                return RotateOutputAudioDevice.updateThisActionAsync(action);
            case ROTATE_MICROPHONE_DEVICE:
                return RotateMichrophoneDevice.updateThisActionAsync(action);
            case VOLUME_MIXER:
                return ChangeChannelVolume.updateThisActionAsync(action);
            case CHAT_MIX_CONTROLLER:
                return ChatMixController.updateThisActionAsync(action);
            case MUTE_CHANNEL:
                return MuteChannel.updateThisActionAsync(action);
        }
    }));
}