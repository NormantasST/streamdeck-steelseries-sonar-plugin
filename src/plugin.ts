import streamDeck from '@elgato/streamdeck';

import { RotateOutputAudioDevice as RotateOutputAudioDevice } from "./actions/rotate-audio-output-device";
import { initializeGlobalSettings } from './helpers/initialization-helper';

streamDeck.logger.setLevel("trace");

streamDeck.settings.useExperimentalMessageIdentifiers = true;
await initializeGlobalSettings();

streamDeck.actions.registerAction(new RotateOutputAudioDevice());

streamDeck.connect();
