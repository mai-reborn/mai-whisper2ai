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
 * Abstract class serving as an interface for implementing Speech-to-Text (STT) functionality.
 * This class defines the basic structure and error handling capabilities for STT implementations.
 */
class MAISpeechToTextInterface {

    static STATUS = Object.freeze({
        STANDBY: 1,        
        START_RECORDING: 2,
        STOP_RECORDING: 3,
        TIMEOUT_ERROR: 4,
    });

    
    /**
     * Constructor initializes an empty array for error observers.
     */
    constructor() {
        // Observers for handling errors from the STT implementation. 
        this.errorObservers = [];
        this.recordingObservers = [];
        this.status = MAISpeechToTextInterface.STATUS.STANDBY;
    }

    /**
     * Adds an error observer to be notified of errors.
     * @param {Object} observer - The observer to be notified of errors.
     */
    addErrorObserver(observer) {
        this.errorObservers.push(observer);
    }

    /**
     * Notifies all registered error observers of an error.
     * @param {Error} error - The error to be reported to observers.
     */
    notifyErrorObservers(error) {
        for (const observer of this.errorObservers) {
            observer.handleError(error);
        }
    }


    //Dodaj obserwatorów nagrywania
    addRecordingObservers(observer) {
        this.recordingObservers.push(observer);
    }


    //powiadom obserwatorów nagrywania aby wykonali odpowiednią akcję
    notifyRecordingObservers(action = 'forceStopRec') {
        /*
        if (action === 'forceStopRec') {
            for (const observer of this.recordingObservers) {
                observer.onForceStopRecording();
            }
        }
        */
    }


    /**
     * Starts recording audio for transcription.
     * To be implemented by subclasses.
     */
    startRecording() { }

    /**
     * Stops recording audio.
     * To be implemented by subclasses.
     */
    stopRecording() { }

    /**
     * Retrieves the transcribed text.
     * To be implemented by subclasses.
     * @returns {string} - The transcribed text.
     */
    getText() { }
}
