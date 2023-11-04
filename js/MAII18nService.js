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




class MAII18nService {
    constructor() {
        this.translations = {};  // This will hold the loaded translations as JSON objects loaded from the file by this.loadTranslations()
        this.isTranslationsLoaded = false;
        //this.loadTranslations();
    }

    /**
     * Attempts to load translations for the full language code.
     */
    loadTranslations() {
        return new Promise((resolve, reject) => {
            const defaultLang = 'en';
            let userLang = navigator.language || navigator.userLanguage || defaultLang;
            const extensionURL = chrome.runtime.getURL('/');
            const shortLang = userLang.split('-')[0];

            const loadTranslationFile = (langCode) => {
                const translationPath = `${extensionURL}translations/${langCode}.json`;
                return $.getJSON(translationPath);
            };

            loadTranslationFile(shortLang)
                .done((data) => {
                    this.translations = data;
                    this.isTranslationsLoaded = true;
                    resolve();  // Rozwiązanie Promise
                })
                .fail(() => {
                    loadTranslationFile(defaultLang)
                        .done((data) => {
                            this.translations = data;
                            this.isTranslationsLoaded = true;
                            resolve();  // Rozwiązanie Promise
                        })
                        .fail(() => {
                            MAILogger.error(`Failed to load default translation file: ${defaultLang}.json`);
                            this.isTranslationsLoaded = false;  
                            reject();  // Odrzucenie Promise
                        });
                });
        });
    }


    /**
     * Returns the translation corresponding to the given key.
     * Translations are defined in JSON files (e.g., "/translations/en.json")
     * @param {string} key - The key for the translation text
     * @returns {string} - The translated text or the key itself if translation is not found
     */
    getTranslation(key) {
        // Check if translations have been loaded and if the key exists
        if (this.translations && this.translations.hasOwnProperty(key)) {
            return this.translations[key];
        }

        // If the key does not exist or translations have not yet been loaded, return the key itself
        MAILogger.error(`Translation not found for key: ${key}`);
        return key;
    }
}
