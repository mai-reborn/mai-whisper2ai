

//list of available languages (needed to replace the language code, e.g. en_US, with the full language name, e.g. "English")
const maiLanguagesList = [
    { code: 'af-ZA', name: 'Afrikaans (South Africa)' },
    { code: 'ar-AE', name: 'Arabic (U.A.E.)' },
    { code: 'ar-BH', name: 'Arabic (Bahrain)' },
    { code: 'ar-DZ', name: 'Arabic (Algeria)' },
    { code: 'ar-EG', name: 'Arabic (Egypt)' },
    { code: 'ar-IQ', name: 'Arabic (Iraq)' },
    { code: 'ar-JO', name: 'Arabic (Jordan)' },
    { code: 'ar-KW', name: 'Arabic (Kuwait)' },
    { code: 'ar-LB', name: 'Arabic (Lebanon)' },
    { code: 'ar-LY', name: 'Arabic (Libya)' },
    { code: 'ar-MA', name: 'Arabic (Morocco)' },
    { code: 'ar-OM', name: 'Arabic (Oman)' },
    { code: 'ar-QA', name: 'Arabic (Qatar)' },
    { code: 'ar-SA', name: 'Arabic (Saudi Arabia)' },
    { code: 'ar-SY', name: 'Arabic (Syria)' },
    { code: 'ar-TN', name: 'Arabic (Tunisia)' },
    { code: 'ar-YE', name: 'Arabic (Yemen)' },
    { code: 'az-AZ', name: 'Azeri (Cyrillic) (Azerbaijan)' },
    { code: 'be-BY', name: 'Belarusian (Belarus)' },
    { code: 'bg-BG', name: 'Bulgarian (Bulgaria)' },
    { code: 'bs-BA', name: 'Bosnian (Bosnia and Herzegovina)' },
    { code: 'ca-ES', name: 'Catalan (Spain)' },
    { code: 'cs-CZ', name: 'Czech (Czech Republic)' },
    { code: 'cy-GB', name: 'Welsh (United Kingdom)' },
    { code: 'da-DK', name: 'Danish (Denmark)' },
    { code: 'de-AT', name: 'German (Austria)' },
    { code: 'de-CH', name: 'German (Switzerland)' },
    { code: 'de-DE', name: 'German (Germany)' },
    { code: 'de-LI', name: 'German (Liechtenstein)' },
    { code: 'de-LU', name: 'German (Luxembourg)' },
    { code: 'dv-MV', name: 'Divehi (Maldives)' },
    { code: 'el-GR', name: 'Greek (Greece)' },
    { code: 'en-AU', name: 'English (Australia)' },
    { code: 'en-BZ', name: 'English (Belize)' },
    { code: 'en-CA', name: 'English (Canada)' },
    { code: 'en-CB', name: 'English (Caribbean)' },
    { code: 'en-GB', name: 'English (United Kingdom)' },
    { code: 'en-IE', name: 'English (Ireland)' },
    { code: 'en-IN', name: 'English (Indian)' },
    { code: 'en-JM', name: 'English (Jamaica)' },
    { code: 'en-NZ', name: 'English (New Zealand)' },
    { code: 'en-PH', name: 'English (Republic of the Philippines)' },
    { code: 'en-TT', name: 'English (Trinidad and Tobago)' },
    { code: 'en-US', name: 'English (United States)' },
    { code: 'en-ZA', name: 'English (South Africa)' },
    { code: 'en-ZW', name: 'English (Zimbabwe)' },
    { code: 'eo-EO', name: 'Esperanto' },
    { code: 'es-AR', name: 'Spanish (Argentina)' },
    { code: 'es-BO', name: 'Spanish (Bolivia)' },
    { code: 'es-CL', name: 'Spanish (Chile)' },
    { code: 'es-CO', name: 'Spanish (Colombia)' },
    { code: 'es-CR', name: 'Spanish (Costa Rica)' },
    { code: 'es-DO', name: 'Spanish (Dominican Republic)' },
    { code: 'es-EC', name: 'Spanish (Ecuador)' },
    { code: 'es-ES', name: 'Spanish (Spain)' },
    { code: 'es-GT', name: 'Spanish (Guatemala)' },
    { code: 'es-HN', name: 'Spanish (Honduras)' },
    { code: 'es-MX', name: 'Spanish (Mexico)' },
    { code: 'es-NI', name: 'Spanish (Nicaragua)' },
    { code: 'es-PA', name: 'Spanish (Panama)' },
    { code: 'es-PE', name: 'Spanish (Peru)' },
    { code: 'es-PR', name: 'Spanish (Puerto Rico)' },
    { code: 'es-PY', name: 'Spanish (Paraguay)' },
    { code: 'es-SV', name: 'Spanish (El Salvador)' },
    { code: 'es-UY', name: 'Spanish (Uruguay)' },
    { code: 'es-VE', name: 'Spanish (Venezuela)' },
    { code: 'et-EE', name: 'Estonian (Estonia)' },
    { code: 'eu-ES', name: 'Basque (Spain)' },
    { code: 'fa-IR', name: 'Farsi (Iran)' },
    { code: 'fi-FI', name: 'Finnish (Finland)' },
    { code: 'fo-FO', name: 'Faroese (Faroe Islands)' },
    { code: 'fr-BE', name: 'French (Belgium)' },
    { code: 'fr-CA', name: 'French (Canada)' },
    { code: 'fr-CH', name: 'French (Switzerland)' },
    { code: 'fr-FR', name: 'French (France)' },
    { code: 'fr-LU', name: 'French (Luxembourg)' },
    { code: 'fr-MC', name: 'French (Principality of Monaco)' },
    { code: 'gl-ES', name: 'Galician (Spain)' },
    { code: 'gu-IN', name: 'Gujarati (India)' },
    { code: 'he-IL', name: 'Hebrew (Israel)' },
    { code: 'hi-IN', name: 'Hindi (India)' },
    { code: 'hr-BA', name: 'Croatian (Bosnia and Herzegovina)' },
    { code: 'hr-HR', name: 'Croatian (Croatia)' },
    { code: 'hu-HU', name: 'Hungarian (Hungary)' },
    { code: 'hy-AM', name: 'Armenian (Armenia)' },
    { code: 'id-ID', name: 'Indonesian (Indonesia)' },
    { code: 'is-IS', name: 'Icelandic (Iceland)' },
    { code: 'it-CH', name: 'Italian (Switzerland)' },
    { code: 'it-IT', name: 'Italian (Italy)' },
    { code: 'ja-JP', name: 'Japanese (Japan)' },
    { code: 'ka-GE', name: 'Georgian (Georgia)' },
    { code: 'kk-KZ', name: 'Kazakh (Kazakhstan)' },
    { code: 'kn-IN', name: 'Kannada (India)' },
    { code: 'ko-KR', name: 'Korean (Korea)' },
    { code: 'kok-IN', name: 'Konkani (India)' },
    { code: 'ky-KG', name: 'Kyrgyz (Kyrgyzstan)' },
    { code: 'lt-LT', name: 'Lithuanian (Lithuania)' },
    { code: 'lv-LV', name: 'Latvian (Latvia)' },
    { code: 'mi-NZ', name: 'Maori (New Zealand)' },
    { code: 'mk-MK', name: 'FYRO Macedonian (Former Yugoslav Republic of Macedonia)' },
    { code: 'mn-MN', name: 'Mongolian (Mongolia)' },
    { code: 'mr-IN', name: 'Marathi (India)' },
    { code: 'ms-BN', name: 'Malay (Brunei Darussalam)' },
    { code: 'ms-MY', name: 'Malay (Malaysia)' },
    { code: 'mt-MT', name: 'Maltese (Malta)' },
    { code: 'nb-NO', name: 'Norwegian (Bokm?l) (Norway)' },
    { code: 'nl-BE', name: 'Dutch (Belgium)' },
    { code: 'nl-NL', name: 'Dutch (Netherlands)' },
    { code: 'nn-NO', name: 'Norwegian (Nynorsk) (Norway)' },
    { code: 'ns-ZA', name: 'Northern Sotho (South Africa)' },
    { code: 'pa-IN', name: 'Punjabi (India)' },
    { code: 'pl-PL', name: 'Polish (Poland)' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'pt-PT', name: 'Portuguese (Portugal)' },
    { code: 'qu-BO', name: 'Quechua (Bolivia)' },
    { code: 'qu-EC', name: 'Quechua (Ecuador)' },
    { code: 'qu-PE', name: 'Quechua (Peru)' },
    { code: 'ro-RO', name: 'Romanian (Romania)' },
    { code: 'ru-RU', name: 'Russian (Russia)' },
    { code: 'sa-IN', name: 'Sanskrit (India)' },
    { code: 'se-FI', name: 'Sami (Inari) (Finland)' },
    { code: 'se-NO', name: 'Sami (Southern) (Norway)' },
    { code: 'se-SE', name: 'Sami (Southern) (Sweden)' },
    { code: 'sk-SK', name: 'Slovak (Slovakia)' },
    { code: 'sl-SI', name: 'Slovenian (Slovenia)' },
    { code: 'sq-AL', name: 'Albanian (Albania)' },
    { code: 'sr-BA', name: 'Serbian (Cyrillic) (Bosnia and Herzegovina)' },
    { code: 'sr-SP', name: 'Serbian (Cyrillic) (Serbia and Montenegro)' },
    { code: 'sv-FI', name: 'Swedish (Finland)' },
    { code: 'sv-SE', name: 'Swedish (Sweden)' },
    { code: 'sw-KE', name: 'Swahili (Kenya)' },
    { code: 'syr-SY', name: 'Syriac (Syria)' },
    { code: 'ta-IN', name: 'Tamil (India)' },
    { code: 'ta-LK', name: 'Tamil (Sri Lankan)' },
    { code: 'te-IN', name: 'Telugu (India)' },
    { code: 'th-TH', name: 'Thai (Thailand)' },
    { code: 'tl-PH', name: 'Tagalog (Philippines)' },
    { code: 'tn-ZA', name: 'Tswana (South Africa)' },
    { code: 'tr-TR', name: 'Turkish (Turkey)' },
    { code: 'tt-RU', name: 'Tatar (Russia)' },
    { code: 'uk-UA', name: 'Ukrainian (Ukraine)' },
    { code: 'ur-PK', name: 'Urdu (Islamic Republic of Pakistan)' },
    { code: 'uz-UZ', name: 'Uzbek (Cyrillic) (Uzbekistan)' },
    { code: 'vi-VN', name: 'Vietnamese (Viet Nam)' },
    { code: 'xh-ZA', name: 'Xhosa (South Africa)' },
    { code: 'zh-CN', name: 'Chinese (Mainland)' },
    { code: 'zh-HK', name: 'Chinese (Hong Kong)' },
    { code: 'zh-MO', name: 'Chinese (Macau)' },
    { code: 'zh-SG', name: 'Chinese (Singapore)' },
    { code: 'zh-TW', name: 'Chinese (Taiwan)' },
    { code: 'zu-ZA', name: 'Zulu (South Africa)' },
];



/**
 * Class representing the settings module of the application.
 */
class MAISettings {
    languagesList = maiLanguagesList;  // Global variable defined outside the class



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
     * Constructs the settings module with default values.
     * 
     * @param {Object} i18n - The internationalization object.
     */
    constructor(i18n) {
        this.i18n = i18n;  // Assigning the internationalization object

        // Initializing default values
        let _navigatorLang;
        if (navigator.language !== null && navigator.language !== "")
            _navigatorLang = this.getFullLangugageCode(navigator.language);
        this.ttsLanguage = _navigatorLang || 'en-US';
        this.ttsVoice = '';

        this.previousTtsVoice = '';
        this.previousTtsLanguage = '';

        this.ttsRate = 1;
        this.ttsPitch = 1;
        this.ttsIgnoreCodeBlocks = true;
        this.sttAutosendTextPrompt = false;
        this.showButtonDescriptions = true;  // Show button description on hover (UI)

        this.openaiAPIkey = '';
        this.voiceToTextMode = 'webkit';

        // Reading and modifying this property should be done through this.isTtsAvailable() and this.setTtsAvailable(value) methods

        this.loadSettings();  // Load settings from localStorage

        this.initHTML();  // Load the HTML code of the settings window

        this.settingObservers = [];  // Observers (e.g., MAIInstance) that will be notified about settings updates
        this.initObservers = [];  // Observers to be notified upon module initialization
    }


    /**
         * Updates the text in the settings form to the active language version set in the browser.
         */
    updatei18nText() {
        $("#imai-settings-title-label").text(this.i18n.getTranslation("settings.title"));
        $("#imai-cfg-openai-api-key-label").text(this.i18n.getTranslation("settings.opeanai.apikey"));
        $("#imai-cfg-voice2text-mode-label").text(this.i18n.getTranslation("settings.voice2text.mode"));
        $("#imai-cfg-tts-language-label").text(this.i18n.getTranslation("settings.language"));
        $("#imai-cfg-tts-rate-label").text(this.i18n.getTranslation("settings.tts.rate"));
        $("#imai-cfg-tts-pitch-label").text(this.i18n.getTranslation("settings.tts.pitch"));
        $("#imai-cfg-tts-ignore-codeblocks-label").text(this.i18n.getTranslation("settings.ignore.codeblocks"));
        $("#imai-cfg-stt-autosend-text-prompt-label").text(this.i18n.getTranslation("settings.stt.autosend"));
        $('#imai-cfg-show-btn-descriptions-label').text(this.i18n.getTranslation("settings.button.descriptions"));
        $("#imai-cfg-settings-save").text(this.i18n.getTranslation("button.save"));
        $("#imai-cfg-settings-cancel").text(this.i18n.getTranslation("button.cancel"));
    }



    /**
     * Loads the HTML code for the settings window.
     */
    initHTML() {
        fetch(chrome.runtime.getURL('html/settings.html'))
            .then(response => response.text())
            .then(data => {
                jQuery("body").append(data);
                return true;
            })
            .then(() => {
                jQuery(document).ready(() => {
                    setTimeout(() => {
                        MAILogger.log('MAISettings.initHTML.setTimeout');
                        // Second language for quick selection in the plugin UI
                        const _lang = this.ttsLanguage.split(['-'])[0];
                        const _navigatorLang = this.getFullLangugageCode(navigator.language);

                        this.previousTtsLanguage = (_lang !== 'en') ? 'en-US' : (this.ttsLanguage !== _navigatorLang) ? _navigatorLang : "";
                        this.previousTtsVoice = '';
                        MAILogger.log('navigator.language: ' + _navigatorLang);

                        this.initEventHandlers();  // Important to initialize after adding HTML!
                        this.initAvailableVoices('imai-cfg-tts-language');  // Should work now
                        this.updatei18nText();  // Update translations of settings form text
                        //this.notifyInitObservers(); // Inform about the completion of initialization

                    }, 2000);
                });
            });
    }



    /**
     * Toggles between `ttsLanguage` and `previousTtsVoice`.
     */
    toggleLanguage() {
        let _lang = this.ttsLanguage;
        let _voice = this.ttsVoice;

        this.ttsLanguage = this.previousTtsLanguage;
        this.ttsVoice = this.previousTtsVoice;

        this.previousTtsLanguage = _lang;
        this.previousTtsVoice = _voice;

        MAILogger.log("settings.toggleLanguage: " + _lang + " >-< " + this.ttsLanguage);

        // Save and notify observers
        this.saveSettings();
    }



    /**
     * Finds the first entry whose full code starts with the given short code and returns the full code.
     *
     * @param {string} shortCode - The short language code e.g., "en".
     * @returns {string} - Returns the full language code if found, otherwise returns the short code.
     */
    getFullLangugageCode(shortCode) {
        // Find the first entry whose full code starts with the given short code
        const languageEntry = maiLanguagesList.find(entry => entry.code.startsWith(shortCode + "-"));
        return languageEntry ? languageEntry.code : shortCode;
    }



    /**
     * Returns the name of the language.
     *
     * @param {string} shortCode - The short language code e.g., "en".
     * @returns {string|null} - Returns the name of the language if found, otherwise returns null.
     */
    getLanguageName(shortCode) {
        // Find the first entry whose full code starts with the given short code
        const languageEntry = maiLanguagesList.find(entry => entry.code.startsWith(shortCode + "-"));
        return languageEntry ? languageEntry.name : null;
    }



    /**
     * Sets the availability of TTS for a new post and saves it in localStorage.
     * 
     * @param {boolean} value - The availability of TTS.
     */
    setTtsAvailable(value) {
        this.ttsAvailable = value;
        // Saves settings without notifying observers of the change in settings.
        this.saveSettings(false);
    }



    /**
     * Retrieves the availability of TTS (for new posts).
     * 
     * @returns {boolean} - The availability of TTS.
     */
    isTtsAvailable() {
        return this.ttsAvailable;
    }



    /**
     * Initializes event handlers for this instance.
     */
    initEventHandlers() {
        // Buttons in the settings window
        jQuery("#imai-cfg-settings-cancel").click(() => this.handleHideSettings());
        jQuery("#imai-cfg-settings-save").click(() => this.handleSaveSettings());
    }



    /**
     * Validates the settings.
     * 
     * @returns {boolean} - Returns true if the settings are valid, false otherwise.
     */
    validateSettings() {
        const voice2TextMode = $('#imai-cfg-voice2text-mode').val();
        const openaiAPIKey = $('#imai-cfg-openai-api-key').val();

        if (voice2TextMode === 'whisper' && !openaiAPIKey) {
            // Displays an error message
            $('#imai-cfg-error-message').text('Please provide an OpenAI API key to use the Whisper model.').show();
            return false;
        }

        // Hides the error message if everything is fine
        $('#imai-cfg-error-message').hide();

        return true;
    }



    /**
     * Handles the display of the settings form.
     */
    showSettings() {
        // Initializes form values
        this.loadSettings();

        // Sets form values
        $('#imai-cfg-tts-rate').val(this.ttsRate);
        $('#imai-cfg-tts-pitch').val(this.ttsPitch);
        $('#imai-cfg-tts-ignore-codeblocks').prop("checked", this.ttsIgnoreCodeBlocks);
        $('#imai-cfg-stt-autosend-text-prompt').prop("checked", this.sttAutosendTextPrompt);
        $('#imai-cfg-openai-api-key').val(this.openaiAPIkey);
        $('#imai-cfg-voice2text-mode').val(this.voiceToTextMode);
        $('#imai-cfg-show-btn-descriptions').prop("checked", this.showButtonDescriptions);

        // Sets the selected language and voice
        this.setCurrentlySelectedVoice('imai-cfg-tts-language', this.ttsLanguage, this.ttsVoice);
        MAILogger.log("settings.showSettings: lang: " + this.ttsLanguage + " | voice: " + this.ttsVoice);

        $('#cmai-overlay').fadeIn();
        jQuery("#imai-settings-container").show();
    }



    /**
     * Closes the settings window.
     */
    hideSettings() {
        $('#cmai-overlay').fadeOut();
        jQuery("#imai-settings-container").hide();
    }



    /**
     * Loads settings from localStorage.
     */
    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('MAI_settings'));
        if (settings) {
            Object.assign(this, settings);
        }
    }



    /**
     * Saves settings to localStorage.
     * @param {boolean} [notifyObservers=true] - If true, notifies observers.
     */
    saveSettings(notifyObservers = true) {
        localStorage.setItem('MAI_settings', JSON.stringify({
            ttsLanguage: this.ttsLanguage,
            ttsVoice: this.ttsVoice,
            previousTtsLanguage: this.previousTtsLanguage,
            previousTtsVoice: this.previousTtsVoice,
            ttsRate: this.ttsRate,
            ttsPitch: this.ttsPitch,
            ttsIgnoreCodeBlocks: this.ttsIgnoreCodeBlocks,
            sttAutosendTextPrompt: this.sttAutosendTextPrompt,
            openaiAPIkey: this.openaiAPIkey,
            voiceToTextMode: this.voiceToTextMode,
            ttsAvailable: this.ttsAvailable,
            showButtonDescriptions: this.showButtonDescriptions,
        }));

        if (notifyObservers) {
            // Notify observers about the settings change.
            this.notifySettingObservers();

            // Notify about initialization completion after settings change.
            this.notifyInitObservers();
        }
    }



    /**
     * Saves settings from the form.
     */
    handleSaveSettings() {
        if (this.validateSettings()) {
            const selectedOption = $('#imai-cfg-tts-language').val().split(';');
            let _selLang = selectedOption[0];
            let _selVoice = selectedOption[1];

            if (_selLang !== this.ttsLanguage) {
                // If the language has changed, remember the previous one to add it to the UI (quick access).
                this.previousTtsLanguage = this.ttsLanguage;
                this.previousTtsVoice = this.ttsVoice;
            }

            this.ttsLanguage = _selLang;
            this.ttsVoice = _selVoice;

            MAILogger.log('Settings.ttsVoice: ' + this.ttsVoice);

            this.ttsRate = parseFloat($('#imai-cfg-tts-rate').val());
            this.ttsPitch = parseFloat($('#imai-cfg-tts-pitch').val());
            this.ttsIgnoreCodeBlocks = $('#imai-cfg-tts-ignore-codeblocks').prop('checked');
            this.sttAutosendTextPrompt = $('#imai-cfg-stt-autosend-text-prompt').prop('checked');
            this.openaiAPIkey = $('#imai-cfg-openai-api-key').val();
            this.voiceToTextMode = $('#imai-cfg-voice2text-mode').val();
            this.showButtonDescriptions = $('#imai-cfg-show-btn-descriptions').prop('checked');

            // Save to localStorage.
            this.saveSettings();
            // Close the settings window.
            this.hideSettings();
        }
    }



    /**
     * Closes the settings window (settings).
     */
    handleHideSettings() {
        this.hideSettings();
    }





    /**
     * Retrieves the default voice for a given language.
     * @param {Array} voices - Array of available voices.
     * @param {string} language - Language code.
     * @returns {string|undefined} - The name of the default voice for the specified language or undefined if not found.
     */
    _getDefaultVoiceName(voices, language) {
        const formattedLanguage = language.toLowerCase();  // Convert to lowercase for consistency

        for (const voice of voices) {
            const voiceLangFormatted = voice.lang.toLowerCase();  // Convert to lowercase for consistency
            const langEntry = this.languagesList.find(entry => entry.code.toLowerCase() === formattedLanguage);  // Search considering both parts of the code
            if (langEntry && voiceLangFormatted === formattedLanguage) {
                MAILogger.log(`Default voice set to: ${voice.name}`);
                return voice.name;
            }
        }
    }






    /**
     * Initialization of available voices - called once after plugin load.
     * @param {string} selectElementId - The ID of the select element to populate.
     */
    initAvailableVoices(selectElementId) {
        let voices = window.speechSynthesis.getVoices();  // Get the list of available voices

        // Function to populate the select element with available voices
        const populateVoices = (voices, selectElementId) => {
            const $select = $(`#${selectElementId}`);
            if ($select.length === 0) {
                MAILogger.log('Element not found');
                return;
            }

            MAILogger.log('Element found');
            $select.empty();  // Clear any existing options

            // Sort voices by language code
            voices.sort((a, b) => a.lang.localeCompare(b.lang));

            // Iterate through each voice and create an option element for it
            voices.forEach((voice) => {
                const voiceLangFormatted = voice.lang.toLowerCase();
                // Search considering the full code
                const langEntry = this.languagesList.find(entry => entry.code.toLowerCase() === voiceLangFormatted);
                const fullLangName = langEntry ? langEntry.name : voiceLangFormatted;

                let optionText = `${voice.lang} - ${fullLangName} (${voice.name})`;

                const option = new Option(optionText, `${voice.lang};${voice.name}`);
                $select.append($(option));
            });
        };

        // Check if the list of voices has already been loaded
        if (voices.length === 0) {
            // If the list of voices is empty (which usually happens initially),
            // set a function to be called when the list of voices changes.
            // This event is triggered once the list of voices is ready for use.
            window.speechSynthesis.onvoiceschanged = () => {
                voices = window.speechSynthesis.getVoices();
                // Set the default voice (if not previously selected) based on the browser language
                if (this.ttsVoice === '')
                    this.ttsVoice = this._getDefaultVoiceName(voices, this.ttsLanguage);

                // Previous (or second language)
                if (this.previousTtsLanguage !== '')
                    this.previousTtsVoice = this._getDefaultVoiceName(voices, this.previousTtsLanguage);

                // Populate the select element with available voices
                populateVoices(voices, selectElementId);

                MAILogger.log("settings.initAvailableVoices: window.speechSynthesis.onvoiceschanged");
                // Notify about the completion of initialization
                this.notifyInitObservers();
            };
        } else {
            // If the list of voices is already available, immediately set the default voice (if not previously selected) 
            // and populate the select element
            if (this.ttsVoice === '')
                this.ttsVoice = this._getDefaultVoiceName(voices, this.ttsLanguage);
            populateVoices(voices, selectElementId);
            if (this.previousTtsLanguage !== '')
                this.previousTtsVoice = this._getDefaultVoiceName(voices, this.previousTtsLanguage);

            // Notify about the completion of initialization
            MAILogger.log("settings.initAvailableVoices");
            this.notifyInitObservers();
        }
        MAILogger.log("Voice: " + this.ttsVoice);
    }




    /**
     * Sets the currently selected voice.
     * @param {string} selectElementId - The ID of the select element.
     * @param {string} ttsLanguage - Text-to-Speech language code.
     * @param {string} ttsVoice - Text-to-Speech voice name.
     */
    setCurrentlySelectedVoice(selectElementId, ttsLanguage, ttsVoice) {
        const $select = $(`#${selectElementId}`);
        const selectedOptionValue = `${ttsLanguage};${ttsVoice}`;
        MAILogger.log("settings.setCurrentlySelectedVoice: ", selectedOptionValue);
        $select.val(selectedOptionValue);
    }



    // -------------------------------------------------------------------------------
    // Adding and notifying observers of configuration changes
    // -------------------------------------------------------------------------------



    /**
     * Adds an observer for settings changes.
     *
     * @param {object} observer - The observer to be notified of settings changes.
     */
    addSettingObserver(observer) {
        if (observer && typeof observer.onUpdateSettings === "function") {
            this.settingObservers.push(observer);
        } else {
            throw new Error('The observer must implement an onUpdateSettings method.');
        }
    }



    /**
     * Notifies observers of settings changes.
     */
    notifySettingObservers() {
        this.settingObservers.forEach(observer => {
            try {
                observer.onUpdateSettings(this);
            } catch (error) {
                MAILogger.log(`Error notifying observer: ${error.message}`);
            }
        });
        MAILogger.log("settings.notifySettingObservers: ", this.settingObservers);
    }



    /**
     * Adds an initialization observer.
     *
     * @param {object} observer - The observer to be notified of initialization.
     */
    addInitObserver(observer) {
        if (observer && typeof observer.onInitSettings === "function") {
            this.initObservers.push(observer);
        } else {
            throw new Error('The observer must implement an onInitSettings method.');
        }
    }



    /**
     * Notifies observers of initialization.
     */
    notifyInitObservers() {
        this.initObservers.forEach(observer => {
            try {
                observer.onInitSettings();
            } catch (error) {
                MAILogger.log(`Error notifying observer: ${error.message}`);
            }
        });
        MAILogger.log("settings.notifyInitObservers: ", this.initObservers);
    }

}