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
 * Class responsible for handling Text-to-Speech (TTS) operations.
 */
class MAITextToSpeech {
    /**
     * Constructor initializes the class properties and starts the TTS module initialization.
     * @param {Object} settings - Configuration settings for the TTS module.
     */
    constructor(settings) {
        /** @type {Object} - Configuration settings for the TTS module. */
        this.settings = settings;

        /** @type {Array} - Observers for handling errors from the TTS implementation. */
        this.errorObservers = [];

        /** @type {Array} - Observers for the TTS synthesis process. */
        this.speakObservers = [];

        /** @type {Array} - Observers to be notified upon TTS module initialization completion. */
        this.initObservers = [];

        /** @type {SpeechSynthesisVoice|null} - The selected voice for TTS. */
        this.voice = null;

        /** @type {number|null} - Timeout ID for TTS operations. */
        this.ttsTimeoutId = null;

        /** @type {string} - Text broken down into sentences for TTS processing. */
        this.textSentences = "";

        /** @type {boolean} - Indicates whether the TTS is active. */
        this.isTtsActive = false;

        this.isPauseActive = false;

        // Initialize the TTS module
        this.initialize();
    }

    /**
     * Initializes the TTS module, setting up the voice and notifying observers once ready.
     */
    initialize() {
        this.isPauseActive = false;

        MAILogger.log("MAITextToSpeech.initialize");
        if (typeof window.speechSynthesis !== "undefined") {

            // Helper function to assign a voice
            const assignVoice = (availableVoices) => {
                // Try to find the voice matching the settings
                let selectedVoice = availableVoices.find(voice => voice.name === this.settings.ttsVoice);

                if (!selectedVoice) {
                    // If the specified voice is not found, fallback to a default voice for the language
                    selectedVoice = availableVoices.find(voice => voice.lang.startsWith(this.ttsLanguage));
                }

                if (selectedVoice) {
                    this.voice = selectedVoice;
                }
            };

            // Check if voices are already available
            let availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                assignVoice(availableVoices);
                this.notifyInitObservers();
            }
            else {
                MAILogger.log("(availableVoices.length == 0)");
            }

            // If voices are not yet available, wait for them to be loaded
            window.speechSynthesis.onvoiceschanged = () => {
                MAILogger.log("window.speechSynthesis.onvoiceschanged");
                availableVoices = window.speechSynthesis.getVoices();
                assignVoice(availableVoices);

                MAILogger.log("MAITextToSpeech.initialize -> window.speechSynthesis.onvoiceschanged -> selectedVoice: " + this.voice);

                this.notifyInitObservers();
            };
        }
        else {
            MAILogger.log("(typeof window.speechSynthesis === 'undefined')");
        }
    }


    resetSettings() {
        MAILogger.log("MAITextToSpeech.resetSettings() -> initialize()");
        this.initialize();
    }


    /**
     * Initiates the speaking of the provided text using the browser's SpeechSynthesisUtterance.
     * @param {string} text - The text to be spoken.
     */
    speak(text) {
        // Create a self reference for access inside event handling functions,
        // as 'this' inside those functions should reference 'utterance', 
        // while 'self' will reference the instance of MAITextToSpeech
        const self = this;

        var utterance = new SpeechSynthesisUtterance();
        utterance.text = text;  // Set the text to be spoken

        // Apply settings to the utterance
        if (this.voice) utterance.voice = this.voice;
        utterance.lang = this.settings.ttsLanguage;
        utterance.rate = this.settings.ttsRate;
        utterance.pitch = this.settings.ttsPitch;

        // Event handler for when speaking starts
        utterance.onstart = function () {
            self.isTtsActive = true;
            self.notifySpeakObservers("start", this.text);
            MAILogger.log("speak - utterance.onstart: " + this.text);
            clearTimeout(self.ttsTimeoutId);
            // Keep the speech synthesis active by re-triggering every 5000ms
            self.ttsTimeoutId = setTimeout(() => self._keepSpeechSynthesisActive(), 5000);
        };

        // Event handler for when speaking ends
        utterance.onend = function () {
            // Finished speaking
            self.isTtsActive = false;
            clearTimeout(self.ttsTimeoutId);
            MAILogger.log("speak - utterance.onend: " + this.text);
            self.notifySpeakObservers("end", this.text)
        }

        this.isTtsActive = true;
        window.speechSynthesis.speak(utterance);  // Start speaking
    }

    /**
     * The code of this methods is inspired by the project 
     * https://github.com/C-Nedelcu/talk-to-chatgpt by C-Nedelcu,
     * licensed under the GNU Affero General Public License v3.0.
     * 
     * Workaround method to keep the speech synthesis active, addressing a Chromium bug.
     * (https://stackoverflow.com/questions/21947730/chrome-speech-synthesis-with-longer-texts)
     * @private
     */
    _keepSpeechSynthesisActive() {
        MAILogger.log("Keeping speech synthesis active...");
        window.speechSynthesis.pause();  // Pause and immediately resume to keep active
        window.speechSynthesis.resume();
        // Re-trigger this method every 5000ms
        this.ttsTimeoutId = setTimeout(() => this._keepSpeechSynthesisActive(), 5000);
    }


    /**
         * Pauses the ongoing Text-to-Speech (TTS) operation.
         */
    pause() {
        // Clear the timeout to stop keeping the synthesis active
        clearTimeout(this.ttsTimeoutId);
        MAILogger.log("MAITextToSpeech->pauseTts!");
        // Pause the speech synthesis
        window.speechSynthesis.pause();
        this.isPauseActive = true;
    }

    /**
     * Resumes the paused Text-to-Speech (TTS) operation.
     */
    resume() {
        MAILogger.log("MAITextToSpeech->resume");
        // Resume and keep the speech synthesis active
        this._keepSpeechSynthesisActive();
        //window.speechSynthesis.resume();
        this.isPauseActive = false;
    }

    /**
     * Stops the ongoing Text-to-Speech (TTS) operation.
     */
    stop(notifyObservers=true) {
        MAILogger.log("MAITextToSpeech->stop(notifyObservers), ", notifyObservers);
        try {
            window.speechSynthesis.pause();  // Pause the speech synthesis
            window.speechSynthesis.cancel();  // Cancel the ongoing speech synthesis
            clearTimeout(this.ttsTimeoutId);  // Clear the timeout to stop keeping the synthesis active
            this.isTtsActive = false;  // Set the TTS active flag to false
            this.isPauseActive = false;
            if (notifyObservers)
                this.notifySpeakObservers("stop");  // Notify observers that TTS has stopped
            
        } catch (error) {
            this.notifyErrorObservers(error);  // Notify error observers of the error
        }
    }


    /**
     * Stops the ongoing Text-to-Speech (TTS) operation, without notify observers.
     */
    abort() {
        MAILogger.log("MAITextToSpeech->abort() this: ", this);
        this.stop(false);   //stop without notify observers.
    }

    /**
     * Adds an error observer to be notified of errors.
     * @param {object} observer - The observer to be added.
     */
    addErrorObserver(observer) {
        // Add the observer to the error observers array
        this.errorObservers.push(observer);
    }

    /**
     * Notifies all error observers of an error.
     * @param {Error} error - The error to be notified about.
     */
    notifyErrorObservers(error) {
        MAILogger.log("MAITextToSpeech.notifyErrorObservers error:", error);

        this.errorObservers.forEach(observer => {
            // Call the handleError method on each observer with the error
            observer.handleError(error);
        });
    }


    /**
     * Adds an initialization observer.
     * @param {object} observer - The observer to be added.
     */
    addInitObserver(observer) {
        // Add the observer to the init observers array
        this.initObservers.push(observer);
    }

    /**
     * Notifies all initialization observers about the TTS initialization.
     */
    notifyInitObservers() {
        this.initObservers.forEach(observer => {
            // Call the onInitTts method on each observer
            observer.onInitTts();
        });
    }

    /**
     * Adds a speak observer to be notified of TTS events.
     * @param {object} observer - The observer to be added.
     */
    addSpeakObserver(observer) {
        this.speakObservers.push(observer);  // Add the observer to the speak observers array
    }

    /**
     * Notifies all speak observers of a TTS event.
     * @param {string} ttsEvent - The TTS event, e.g., "start", "stop", or "end".
     * @param {string} [text=''] - The text that was being read by TTS.
     */
    notifySpeakObservers(ttsEvent, text = '') {
        this.speakObservers.forEach(observer => {
            if (ttsEvent === 'start')
                observer.onSpeakStart(text);
            else if (ttsEvent === 'end')
                observer.onSpeakEnd(text);
            else if (ttsEvent === 'stop')
                observer.onSpeakStop(text);
        });
    }


    //jeśli jest w trakcie mówienia lub przetwarzania mowy zwraca true
    isActive() {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
            MAILogger.log('TTS: he speech synthesis is either speaking or has pending tasks.');
            return true;
        }
        MAILogger.log('TTS: The speech synthesis is idle.');
        return false;
    }


}

