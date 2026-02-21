import streamDeck from "@elgato/streamdeck";
import { ROTATE_OUTPUT_DEVICES } from "../constants/action-uuids.constants";
import { RotateOutputAudioDevice } from "../actions/rotate-audio-output-device";

export function wrapText(text: string, targetLength: number = 9): string {
    const words = text.split(" ");
    let output = "";
    let currentSentenceLength = 0;
    words.forEach(word => {
        if (currentSentenceLength + word.length + 1 <= targetLength)
        {
            output = output.concat(" ", word);
            currentSentenceLength += word.length;
        }
        else
        {
            output = output.concat("\r\n", word);
            currentSentenceLength = word.length;
        }
    });

    return output.trim();
}