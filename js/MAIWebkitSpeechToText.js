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
 * Implementation for Webkit Speech to Text.
 * @extends MAISpeechToTextInterface
 */
class MAIWebkitSpeechToText extends MAISpeechToTextInterface {
    /**
     * Creates a new instance of MAIWebkitSpeechToText.
     * @param {Object} settings - The settings for speech recognition.
     */
    constructor(settings, recordingTimeout = 120000, stopRecordingTimeout = 20000) {
        super();
        this.settings = settings;

        MAILogger.log("window.hasOwnProperty('webkitSpeechRecognition'): ", window.hasOwnProperty('webkitSpeechRecognition'));
        MAILogger.log("this.settings.ttsLanguage: " + this.settings.ttsLanguage);
        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.recognition.continuous = true;  // continuous recording
        this.recognition.interimResults = false;  // final results only
        this.recognition.lang = this.settings.ttsLanguage;
        this.transcript = "";


        this.stopRecordingTimeout = stopRecordingTimeout;
        this.stopRecordingTimeoutId = null;  // to store the stopRecordingTimeoutId ID 
        this.recordingTimeout = recordingTimeout;
        this.recordingTimeoutId = null;  // to store the startRecordingTimeoutId ID 

        this.status = MAISpeechToTextInterface.STATUS.STANDBY;
    }

    /**
     * Begins recording audio for speech recognition.
     */
    startRecording() {
        this.status = MAISpeechToTextInterface.STATUS.START_RECORDING;
        clearTimeout(this.stopRecordingTimeoutId);
        this.transcript = "";  // Reset text before each new recording

        this.recognition.onresult = event => {
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    this.transcript += event.results[i][0].transcript;
                    MAILogger.log(this.transcript);
                }
            }
        };

        this.recognition.onerror = event => {
            clearTimeout(this.recordingTimeoutId);
            MAILogger.error("Error during speech recognition:", event.error);
            let errorMessage = event.error;
            if (this.status === MAISpeechToTextInterface.STATUS.TIMEOUT_ERROR)
                errorMessage = "Timeout Error: " + errorMessage;
            this.notifyErrorObservers(errorMessage);
            this.status = MAISpeechToTextInterface.STATUS.STANDBY;
        };



        try {
            MAILogger.log("About to start recognition with language:", this.recognition.lang);
            this.recognition.start();

        } catch (error) {
            MAILogger.error("Error recognition.start: ", error);
            clearTimeout(this.recordingTimeoutId);
            this.notifyErrorObservers(error);
        }

        this.recordingTimeoutId = setTimeout(() => {
            // If startRecording is still ongoing and the timeout has been exceeded,
            // force the recording to stop
            if (this.status === MAISpeechToTextInterface.STATUS.START_RECORDING) {
                this.status = MAISpeechToTextInterface.STATUS.TIMEOUT_ERROR;
                this.recognition.abort();
                MAILogger.warn("TIMEOUT - recognition.start()->abort()");
            }
        }, this.recordingTimeout);

    }




    /**
     * Stops recording audio for speech recognition.
     * @return {Promise} Resolves when the recording is successfully stopped.
     */
    stopRecording() {
        this.status = MAISpeechToTextInterface.STATUS.STOP_RECORDING;
        clearTimeout(this.recordingTimeoutId);

        return new Promise((resolve, reject) => {

            this.recognition.onend = () => {
                clearTimeout(this.stopRecordingTimeoutId);
                MAILogger.log("stopRecording.recognition.onend()");
                resolve();
            };

            this.recognition.onerror = event => {
                clearTimeout(this.stopRecordingTimeoutId);
                reject(new Error("Error during recording: " + event.error));
            };

            try {
                MAILogger.log("stopRecording -  this.recognition.stop()");
                this.recognition.stop();

            } catch (error) {
                clearTimeout(this.stopRecordingTimeoutId);
                MAILogger.error("Error - this.recognition.stop(): ", error);
                this.status = MAISpeechToTextInterface.STATUS.STANDBY;
            }

            // There are situations when the user starts voice recording,
            // but then remains silent for an extended period (e.g., several dozen seconds) and only then calls the stopRecording function,
            // in such cases, it happens that SpeechRecognition can hang.
            // The protection below with a timeout limit guards against such a situation
            // and enforces the termination of registration and text transcription (abort).
            this.stopRecordingTimeoutId = setTimeout(() => {
                this.status = MAISpeechToTextInterface.STATUS.TIMEOUT_ERROR;
                this.recognition.abort();
                MAILogger.warn("TIMEOUT - recognition.abort()");
                resolve();
            }, this.stopRecordingTimeout);

        });
    }


    /**
     * Retrieves the text transcribed from the audio recording.
     * @return {Promise<string>} Resolves with the transcribed text.
     */
    getText() {
        return new Promise((resolve, reject) => {
            MAILogger.log("getText(): ", this.transcript);
            resolve(this.transcript);
        });
    }

}