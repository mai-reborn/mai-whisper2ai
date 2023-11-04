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
 * Implementation for Whisper Speech to Text.
 * @extends MAISpeechToTextInterface
 */
class MAIWhisperSpeechToText extends MAISpeechToTextInterface {

    /**
     * Initializes default values for the class.
     * @param {Object} settings - The settings for speech recognition.
     */
    constructor(settings, recordingTimeout = 120000) {
        super();  // to have access to methods and properties of the base class (MAISpeechToTextInterface)

        this.settings = settings;

        
        this.recordingTimeout = recordingTimeout;
        this.recordingTimeoutId = null;  // to store the startRecordingTimeoutId ID 

        this.status = MAISpeechToTextInterface.STATUS.STANDBY;

        this.resetMedia();
    }

    // Resets properties used for voice recording,
    // to prevent them from being appended to a new recording
    // if the previous one was interrupted by a TimeOut for example
    resetMedia() {
        this.recorder = null;
        this.audioBlob = null;
        this.audioChunks = [];
        this.mediaStream = null;
    }


    /**
     * Begins recording audio for speech recognition.
     */
    startRecording() {
        this.status = MAISpeechToTextInterface.STATUS.START_RECORDING;
        this.resetMedia();

        MAILogger.log("startRecording has been called");

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                MAILogger.log("Availability of MediaRecorder:", typeof MediaRecorder !== "undefined");

                this.mediaStream = stream;  // Here we add mediaStream

                if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                    MAILogger.log('Opus codec is supported');
                } else {
                    MAILogger.log('Opus codec is NOT supported');
                }

                // Initializing MediaRecorder
                const options = { mimeType: 'audio/webm;codecs=opus' };
                this.recorder = new MediaRecorder(stream, options);

                if (this.recorder) {
                    MAILogger.log("recorder has been initialized");
                } else {
                    MAILogger.log("Error: recorder has not been initialized");
                }

                this.recorder.ondataavailable = event => {
                    this.audioChunks.push(event.data);
                };

                this.recorder.start();


                // Timeout, for instance, in case the user started recording
                // and forgot to stop
                this.recordingTimeoutId = setTimeout(() => {
                    // If startRecording is still ongoing and the timeout has been exceeded,
                    // force the recording to stop
                    if (this.status === MAISpeechToTextInterface.STATUS.START_RECORDING) {
                        this.status = MAISpeechToTextInterface.STATUS.TIMEOUT_ERROR;
                        let errorMessage = "Timeout Error";
                        try {
                            this.recorder.stop();
                            this.audioChunks = [];  // Resetting the audioChunks array

                            // Stopping the media stream
                            if (this.mediaStream)
                                this.mediaStream.getTracks().forEach(track => track.stop());

                            this.recorder = new MediaRecorder(stream, options);

                        } catch (error) {
                            errorMessage += " " + error;
                        }
                        this.notifyErrorObservers(errorMessage);
                        MAILogger.warn(errorMessage);
                    }
                }, this.recordingTimeout);


            })
            .catch(error => {
                clearTimeout(this.recordingTimeoutId);  // clear the timeout
                MAILogger.error('Failed to access the microphone!', error.message);
                this.notifyErrorObservers(error);
            });

    }


    /**
     * Stops recording audio and stores the recording in this.audioBlob.
     * @return {Promise} Resolves when the recording is successfully stopped.
     */
    stopRecording() {
        this.status = MAISpeechToTextInterface.STATUS.STOP_RECORDING;
        clearTimeout(this.recordingTimeoutId);  // clear the timeout

        return new Promise((resolve, reject) => {  // Creating a Promise
            MAILogger.log("stopRecording - Attempting to stop recording.");
            this.recorder.stop();

            this.recorder.onstop = () => {
                this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm;codecs=opus' });
                this.audioChunks = [];  // clears the buffer which held the sound samples as they're no longer needed

                if (this.mediaStream) {  // Here we check if mediaStream exists
                    this.mediaStream.getTracks().forEach(track => track.stop());
                    MAILogger.log("mediaStream track.stop");
                } else {
                    MAILogger.error("mediaStream is undefined");
                }

                resolve();  // Resolve the Promise
            };

            this.recorder.onerror = (event) => {
                reject(new Error("Error during recording: " + event.error));
            };
        });
    }


    /**
     * Retrieves the text transcribed from the audio recording by sending it to OpenAI's Whisper API.
     * @return {Promise<string>} Resolves with the transcribed text.
     */
    getText() {
        return new Promise((resolve, reject) => {
            const formData = new FormData();

            // Splits the full language code into parts, using dash as separator
            const _lang = this.settings.ttsLanguage.split(['-'])[0];

            formData.append('model', 'whisper-1');
            formData.append('file', this.audioBlob, 'my-audio-file.webm');
            formData.append('language', _lang);

            fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + this.settings.openaiAPIkey
                },
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    MAILogger.log(data);
                    resolve(data.text);

                    this.audioBlob = null;
                })
                .catch(error => {
                    this.audioBlob = null;
                    MAILogger.error('ERROR MAIWhisperSpeechToText.getText: ', error.message);

                    reject(error);
                });
        });
    }




}