import streamDeck from "@elgato/streamdeck";
import { RotateOutputAudioDevice } from "../actions/rotate-audio-output-device";
import { ROTATE_OUTPUT_DEVICES } from "../constants/action-uuids.constants";
import { getCurrentSonarSettings } from "../sonar-helper";

export async function initializeGlobalSettings() {
    const globalSettings = await getCurrentSonarSettings();
    streamDeck.settings.setGlobalSettings(globalSettings);
    
    setInterval(async () => {
        const globalSettings = await getCurrentSonarSettings();
        streamDeck.settings.setGlobalSettings(globalSettings);
        await notifyAll();
    }, 60000);
}

export async function notifyAll()
{
    streamDeck.actions.forEach(async (action) => {
        switch (action.manifestId) {
            case ROTATE_OUTPUT_DEVICES:
                await RotateOutputAudioDevice.updateThisAction(action);
                break;
        }
    });
}