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
      this.defaultLang = 'en';
      this.userLang = navigator.language.split('-')[0]; // Only the language code ('en', 'pl', etc.)
      this.loadTranslations();
    }
  
    /**
     * Load the Chrome i18n translations for the user's language.
     */
    loadTranslations() {
        return new Promise((resolve, reject) => {
          // Chrome provides the i18n API for handling translations
          if (chrome.i18n) {
            this.isTranslationsLoaded = true;
            resolve('Translations loaded successfully.');
          } else {
            MAILogger.error('Chrome i18n API is not available.');
            this.isTranslationsLoaded = false;
            reject(new Error('Chrome i18n API is not available.'));
          }
        });
      }
      
  
    /**
     * Returns the translation for the given key using Chrome's i18n API.
     * @param {string} key - The key for the translation text
     * @returns {string} - The translated text or the key itself if translation is not found
     */
    getTranslation(key) {
      // Use Chrome's i18n API to get the translated message
      if (this.isTranslationsLoaded) {
        const message = chrome.i18n.getMessage(key);
        if (message) {
          return message;
        } else {
            MAILogger.error(`Translation not found for key: ${key}`);
        }
      }
      // If the i18n API is not loaded or the key doesn't exist, return the key itself
      return key;
    }
  }
  