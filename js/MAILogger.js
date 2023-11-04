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



class MAILogger {

    /**
     * It might be beneficial to encapsulate the environment checking logic into a separate method
     * to avoid code duplication in the 'log' and future logging methods.
     */
    static isDevelopmentEnvironment() {
        return (globalThis.MAI_APP_ENV || 'production') === 'development';
    }

    /**
     * Logs messages only in a development environment.
     * @param  {...any} args - Arguments to be logged.
     */
    static log(...args) {
        if (this.isDevelopmentEnvironment()) {
            console.log(...args);
        }
    }

    /**
     * Logs errors. Additional code may be placed here, for example, sending errors to an external service.
     * @param  {...any} args - Arguments to be logged as errors.
     */
    static error(...args) {
        // Additional code for handling errors could be placed here
        console.error(...args);
    }

    /**
     * Method for logging warnings. Can be useful for logging situations that are not errors but may require attention.
     * @param  {...any} args - Arguments to be logged as warnings.
     */
    static warn(...args) {
        console.warn(...args);
    }

    /**
     * Method for logging information. Can be used to log information that is neither errors nor significant events but may be useful.
     * @param  {...any} args - Arguments to be logged as information.
     */
    static info(...args) {
        console.info(...args);
    }

    /**
     * Sets the logging level to enable or disable different types of logging in different environments.
     * @param {string} level - Logging level ('development', 'production', etc.)
     */
    static setLogLevel(level) {
        globalThis.MAI_APP_ENV = level;
    }

}
