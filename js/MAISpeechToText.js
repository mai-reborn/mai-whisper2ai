/**
 * mai_ | Whisper to ChatGPT and Claude.ai
 * Copyright (C) 2023 mai_ (Fundacja Reborn) | https://mai.net.pl | info@mai.net.pl
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Main class for handling Speech-to-Text (STT) functionality.
 * This class acts as a facade for different STT implementations,
 * allowing for easy switching between different STT services such as Whisper and Webkit Speech-to-Text.
 */
class MAISpeechToText {
    
    /**
     * Constructor initializes an instance of the appropriate STT implementation based on provided settings.
     * @param {Object} settings - Configuration settings for the STT service.
     */
    constructor(settings) {
        if (settings.voiceToTextMode === "whisper") {
            this.sttInstance = new MAIWhisperSpeechToText(settings);
        } else if (settings.voiceToTextMode === "webkit") {
            this.sttInstance = new MAIWebkitSpeechToText(settings);
        }
    }
    
    /**
     * Updates the STT implementation based on new settings.
     * @param {Object} settings - New configuration settings for the STT service.
     */
    onUpdateSettings(settings) {
        if (settings.voiceToTextMode === "whisper") {
            this.sttInstance = new MAIWhisperSpeechToText(settings);
        } else if (settings.voiceToTextMode === "webkit") {
            this.sttInstance = new MAIWebkitSpeechToText(settings);
        }
    }
    
    /**
     * Adds an error observer to the current STT instance for error handling.
     * @param {Object} observer - The observer to be notified of errors.
     */
    addErrorObserver(observer) {
        this.sttInstance.addErrorObserver(observer);
    }


    addRecordingObservers(observer) {
        this.sttInstance.addRecordingObservers(observer);
    }

    
    /**
     * Starts recording audio for transcription on the current STT instance.
     */
    startRecording() {
        this.sttInstance.startRecording();
    }
    
    /**
     * Stops recording audio on the current STT instance.
     * @returns {any} - Return value depends on the implementation of stopRecording() in the STT instance.
     */
    stopRecording() {
        return this.sttInstance.stopRecording();
    }
    
    /**
     * Retrieves the transcribed text from the current STT instance.
     * @returns {string} - The transcribed text.
     */
    getText() {
        return this.sttInstance.getText();
    }
}
