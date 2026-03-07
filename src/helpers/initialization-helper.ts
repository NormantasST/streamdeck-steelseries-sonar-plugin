import streamDeck from "@elgato/streamdeck";
import { RotateOutputAudioDevice } from "../actions/rotate-audio-output-device";
import { ROTATE_OUTPUT_DEVICES } from "../constants/action-uuids.constants";
import { getCurrentSonarSettingsAsync } from "../sonar-helper";

export async function initializeGlobalSettingsAsync() {
    const globalSettings = await getCurrentSonarSettingsAsync();
    await streamDeck.settings.setGlobalSettings(globalSettings);
    
    setInterval(async () => {
        const globalSettings = await getCurrentSonarSettingsAsync();
        await streamDeck.settings.setGlobalSettings(globalSettings);
        await notifyAllAsync();
    }, 60000);
}

export async function notifyAllAsync()
{
    streamDeck.actions.forEach(async (action) => {
        switch (action.manifestId) {
            case ROTATE_OUTPUT_DEVICES:
                await RotateOutputAudioDevice.updateThisActionAsync(action);
                break;
        }
    });
}