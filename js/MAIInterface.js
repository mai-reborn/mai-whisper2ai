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
 * Handles the UI interface and the application state for the mai_ | Whisper to ChatGPT extension.
 * 
 * @class MAIInterface
 */
class MAIInterface {

    /**
     * Enumeration representing various states of the extension.
     * @readonly
     * @enum {number}
     */
    static STATUS = Object.freeze({
        INITIALIZATION: 1,  // Initialization of the application is in progress
        STANDBY: 2,         // Ready state
        REC_ON: 3,          // Sound recording is in progress
        TRANSCRIPTION_IN_PROGRESS: 4,  // Transcription of the recording is in progress
        TTS_ON: 5,          // TTS of the new post is in progress
        TTS_ALL_ON: 6,      // TTS of the entire thread or selected fragment is in progress
        TTS_PAUSE: 7        // Pause state
    });


    /**
     * Creates an instance of MAIInterface.
     */
    constructor() {


        /**
             * Application internationalization.
             * Example usage: this.i18n.getTranslation("button.rec.on");
             * @type {MAII18nService}
             */
        this.i18n = new MAII18nService();

        // Injection/initialization of CSS & HTML    
        //this.initStyles();
        //this.initHTML();

        this.status = MAIInterface.STATUS.INITIALIZATION;



        /**
             * The previous state of the application.
             * Important for the STATUS_TTS_PAUSE state, as the pause can suspend either "STATUS_TTS_ON" or "STATUS_TTS_ALL_ON".
             * @type {number}
             */
        this.previousState = MAIInterface.STATUS.STANDBY;

        /**
             * Flags representing the initialization status of various components.
             * The application will remain in the initialization state (STATUS_INITIALIZATION)
             * until:
             * 1) MAISettings module confirms the loading of settings, available languages list,
             * 2) TTS confirms voice initialization,
             * 3) The microphone state is set.
             * @type {boolean}
             */
        this.initMicrophone = false;
        this.initTts = false;
        this.initSettings = false;
        this.initPageAdapter = false;

        this.hideInitLogsTomeoutId = null;
        

        // Interval ID for the function checking the correct initialization of the plugin modules (settings, tts...) 
        this.initIntervalId = null;



        // Flag representing whether initialization is complete.
        this.initComplete = false;



        // Flag representing whether the info page is loaded.
        this.infoPgLoaded = false;


        // Flag representing whether the donate page is loaded.
        this.donatePgLoaded = false;


        // Was a double click performed on the ttsAllOn button?
        this.ttsAllOnButtonDoubleClick = false;

        this.isInitializationLogsHidden = false;

        this.i18n.loadTranslations()
            .then(() => {
                // The translations have been loaded, now we can initialize the styles and HTML
                this.initStyles();
                this.initHTML();

                this.settings = new MAISettings(this.i18n);

                // Adding a settings change observer
                this.settings.addSettingObserver(this);
                // Adding an initialization observer
                this.settings.addInitObserver(this);

                // Setting a delay before triggering the initialization process
                setTimeout(() => this.initialization(), 2000);
                setTimeout(() => this.loadDonatePg(), 2000);
                setTimeout(() => this.loadInfoPg(), 2000);
            })
            .catch(() => {
                // Error handling if translations cannot be loaded
                MAILogger.error("Error during initialization, failed to load translation files.")
            });


        //version
        let manifest = chrome.runtime.getManifest();
        this.version = manifest.version;
    }




    /**
    * This method initializes various components and checks the availability of the microphone.
    * It sets up observers for error handling and other events, and initiates the module initialization check.
    */
    initialization() {

        // Is initialization complete?
        this.initComplete = false;

        // Is the microphone available?
        this.isMicAvailable = false;
        this.checkMicAvailable();


        /**
             * @type {MAISpeechToText}
             */
        this.speechToText = new MAISpeechToText(this.settings);
        // Adding an error observer
        this.speechToText.addErrorObserver(this);
        //this.speechToText.addRecordingObservers(this);


        /**
             * @type {MAIPageAdapter}
             */
        let pageAdapterManager = new MAIPageAdapterManager(this.settings);
        this.pageAdapter = pageAdapterManager.getPageAdapter();

        // Adding event observers in application modules
        this.pageAdapter.addErrorObserver(this);
        this.pageAdapter.addNewPostObserver(this);
        this.pageAdapter.addSpeakObserver(this);
        this.pageAdapter.addInitObserver(this);


        // Also observes TTS errors to display them in the application UI
        this.pageAdapter.tts.addErrorObserver(this);

        // Adding a TTS initialization observer
        this.pageAdapter.tts.addInitObserver(this);

        // Waits for module initialization
        this.checkModuleInitialization();

        setTimeout(() => {
            this.makeControlBoxDraggable();
        }, 2000);
    }





    /**
     * Method checking the correct initialization of plugin modules (settings, tts...).
     * Until their initialization is confirmed, the plugin will remain in the STATUS_INITIALIZATION state.
     */
    checkModuleInitialization() {
        this.setAppStatus(MAIInterface.STATUS.INITIALIZATION);

        MAILogger.log("checkModuleInitialization");
        jQuery("#imai-init-title").text(this.i18n.getTranslation("statusInitTitle"));
        jQuery("#imai-init-log").empty();

        let ttsInitTimeOutId = null;

        let i = 0;
        // Interval with which the function checking the correct initialization of the plugin modules (settings, tts...) is launched
        this.initIntervalId = setInterval(() => {
            MAILogger.log("checkModuleInitialization...");
            if (i < 10) {
                i++;
                jQuery("#imai-init-dots").append(".");
            }
            else {
                i = 0;
                jQuery("#imai-init-dots").empty();
            }


            // Check if Text-To-Speech (TTS) is initialized. If not, attempt to initialize it.
            if (!this.initTts && ttsInitTimeOutId === null) {
                // Set a timeout to initialize TTS after 2 seconds
                ttsInitTimeOutId = setTimeout(() => {
                    // Double check if TTS is still not initialized
                    if (!this.initTts) {
                        this.pageAdapter.tts.initialize();  // Initialize TTS
                        MAILogger.log("ttsInitTimeOutId - this.pageAdapter.tts.initialize");
                    }
                }, 2000);  // Wait for 2 seconds before initialization

                // Reset the timeout ID after 3 seconds, allowing for re-initialization attempts
                setTimeout(() => {
                    ttsInitTimeOutId = null;
                }, 3000);  // Reset after 3 seconds
            }




            // If all modules are already initialized
            if (this.initMicrophone
                && this.initTts
                && this.initSettings
                && this.initPageAdapter) {

                // Turns off the interval
                clearInterval(this.initIntervalId);
                this.initIntervalId = null;

                this.initComplete = true;
                this.setAppStatus(MAIInterface.STATUS.STANDBY);

                // Hides the initialization logs window (with a delay of 4 seconds) and UI button animation
                this.hideInitializationLogs(4000, true);

                $('.cmai-controls-init').removeClass('cmai-controls-init');

                this.updateUI();
                //this.runMexicanWaveAnimation();
            }
        }, 200);
    }






    /**
     * Makes the control box draggable within the UI.
     */
    makeControlBoxDraggable() {
        jQuery("#imai-header").mousedown(function (e) {
            // Reset the "right" and "left" CSS property when you start dragging
            let computedStyle = window.getComputedStyle(jQuery("#imai-control-box")[0]);
            let leftInPixels = parseFloat(computedStyle.left);
            jQuery("#imai-control-box").css({ 'right': '', 'left': leftInPixels + 'px' });

            let dragData = {
                pageX0: e.pageX,
                pageY0: e.pageY,
                offset0: jQuery("#imai-control-box").offset()
            };

            const handle_dragging = (e) => {
                let left = dragData.offset0.left + (e.pageX - dragData.pageX0);
                let top = dragData.offset0.top + (e.pageY - dragData.pageY0);
                jQuery("#imai-control-box").offset({ top: top, left: left });
            };

            const handle_mouseup = () => {
                // Find the distance from the right edge of the browser window
                let right = $(window).width() - (jQuery("#imai-control-box").offset().left + jQuery("#imai-control-box").outerWidth());

                // Convert to percentage of window width
                let rightPercent = 100 * right / $(window).width();

                // Set the CSS property "right" as percentage and "left" as auto
                jQuery("#imai-control-box").css({ 'right': rightPercent + '%', 'left': 'auto' });

                jQuery('body').off('mousemove', handle_dragging).off('mouseup', handle_mouseup);
            };

            jQuery('body').on('mouseup', handle_mouseup).on('mousemove', handle_dragging);
        });
    }




    /**
     * Updates the user interface, e.g., after a language version change.
     */
    updateUI(hideInitLogs = false) {
        // Main language version
        jQuery("#imai-lang-1").attr("data-mailang", this.settings.ttsLanguage);
        jQuery("#imai-lang-1").attr("data-maivoice", this.settings.ttsVoice);
        let _lang = this.settings.ttsLanguage.split(['-'])[0];
        jQuery("#imai-lang-1").text(_lang);
        jQuery("#imai-lang-1").show();

        // Second (previous) language version
        if (this.settings.previousTtsLanguage !== '') {
            jQuery("#imai-lang-2").attr("data-mailang", this.settings.previousTtsLanguage);
            jQuery("#imai-lang-2").attr("data-maivoice", this.settings.previousTtsVoice);
            let _lang = this.settings.previousTtsLanguage.split(['-'])[0];
            jQuery("#imai-lang-2").text(_lang);
            jQuery("#imai-lang-2").show();
        }

        if (hideInitLogs)
            this.hideInitializationLogs(0, false);
    }



    /**
     * Checks the availability of the microphone.
     */
    checkMicAvailable() {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
                this.isMicAvailable = true;
                this.toggleMicButtons();
                this.onInitMicrophone();
            })
            .catch(error => {
                // Microphone is unavailable / turned off
                this.isMicAvailable = false;
                this.toggleMicButtons();
                // Notifies about the finished attempt to initialize the microphone
                this.onInitMicrophone();
                //this.handleError(error);
            });
    }




    /**
     * Toggles the visibility of microphone buttons based on the availability of the microphone.
     */
    toggleMicButtons() {
        if (this.isMicAvailable) {
            $('.cmai-btn[data-mai="recON"]').show();
            $('.cmai-btn[data-mai="recOFF"]').hide();
        } else {
            $('.cmai-btn[data-mai="recON"]').hide();
            $('.cmai-btn[data-mai="recOFF"]').show();
        }
    }





    /**
     * Handles the action of turning on the recording, or if already recording, stops the recording,
     * processes the audio for transcription, and injects the transcribed text into the appropriate place on the page.
     */
    async handleRecOn() {
        try {
            // If voice recording is in progress - stops it and performs STT transcription
            if (this.status === MAIInterface.STATUS.REC_ON) {

                this.setAppStatus(MAIInterface.STATUS.TRANSCRIPTION_IN_PROGRESS);

                // Inserts a 2-second delay to allow time to record sound without cutting off the end of the statement...
                MAILogger.log("handleRecOn - WAIT 2sec");
                await new Promise((resolve) => {
                    setTimeout(resolve, 2000);
                });

                try {
                    await this.speechToText.stopRecording();
                } catch (error) {
                    MAILogger.error("Error stopping recording:", error);
                }

                let text = "";
                try {
                    text = await this.speechToText.getText();
                } catch (error) {
                    MAILogger.error("Error getting text:", error);
                }

                MAILogger.log("Transcription of recording:" + text);

                // Injects the speech transcription text in the appropriate place on the page (depending on the page, which is handled by pageAdapter, e.g., ChatGPT prompt form)
                try {
                    this.pageAdapter.injectTranscription(text);
                } catch (error) {
                    MAILogger.error("Error injectTranscription:", error);
                }

                // Transitions to standby state
                this.setAppStatus(MAIInterface.STATUS.STANDBY);

                // Activates voice recording
            } else {
                // If the "webkit" method is selected in the settings but it's not the Chrome browser
                if (this.settings.voiceToTextMode === 'webkit' && !this.isBrowserInList(['Chrome'])) {
                    // Display message that 'webkit' is not supported in this browser
                    MAILogger.error(this.i18n.getTranslation("messageWebkitUnavailable"));
                    this.showErrorMessage(this.i18n.getTranslation("messageWebkitUnavailable"));
                }
                else { // Turn on recording
                    this.setAppStatus(MAIInterface.STATUS.REC_ON);
                }
            }
        } catch (error) {
            this.toggleMicButtons();
            //this.handleError(error);
        }
    }




    /**
     * Handles the click of the RecOFF button (e.g., if the microphone was turned off, then turned on and you need to activate the recording option - check if the mic is already available)
     */
    handleRecOFF() {
        this.checkMicAvailable();
    }



    /**
     * Handles the action of the "ttsOn" button click.
     */
    handleTtsOn() {
        MAILogger.log("handleTtsOn.status: " + this.status);

        // Disables TTS (OFF) for new posts, if it was enabled
        if (this.status === MAIInterface.STATUS.STANDBY && this.settings.isTtsAvailable()) {
            MAILogger.log("handleTtsOn:  ttsAvailable = false");

            this.settings.setTtsAvailable(false);
            this.setButtonState({
                speechON: 'hidden',
                speechOFF: 'ready'
            });

            // Stops checking for new posts
            this.pageAdapter.stopCheckingNewPost();

            // Interrupts ongoing TTS and transitions to standby state
        } else if (this.status === MAIInterface.STATUS.TTS_ON && this.settings.isTtsAvailable()) {
            this.setButtonState({
                speechON: 'ready',
                speechOFF: 'hidden'
            });

            // Restores the STATUS_STANDBY of the application
            // and startCheckingNewPos() (in setAppStatus method)
            this.setAppStatus(MAIInterface.STATUS.STANDBY);
        }
    }



    /**
     * Re-enables TTS.
     */
    handleTtsOFF() {
        MAILogger.log("handleTtsOFF");
        // Enables TTS availability and standby status
        this.settings.setTtsAvailable(true);
        this.pageAdapter.startCheckingNewPost();
        this.setAppStatus(MAIInterface.STATUS.STANDBY);

    }



    /**
     * Handles the action of the "ttsAllOn" button click.
     */
    handleTtsAllOn() {
        // If it is in standby state, transitions to STATUS_TTS_ALL_ON
        MAILogger.log("handleTtsAllOn");
        if (this.status === MAIInterface.STATUS.STANDBY) {
            this.setAppStatus(MAIInterface.STATUS.TTS_ALL_ON);

            // If the application is in STATUS_TTS_ALL_ON, returns to STATUS_STANDBY (and ends TTS there)
        } else if (this.status === MAIInterface.STATUS.TTS_ALL_ON) {
            // Transitions to standby mode
            //this.setAppStatus(MAIInterface.STATUS.STANDBY);

            //this.pageAdapter.stopTextAndSendToSpeaker();
            //przejście do standby będzie w procedurze obsługi zdarzenia this.onSpeakStop()
            //!!!! Tak jak powyżej było ale sprawiało problemy, 
            // lepiej więc może wymusić zatrzymanie PageAdaptera i TTS
            // a następnie przejść do standby ???
            this.pageAdapter.stopTextAndSendToSpeaker();
            this.setAppStatus(MAIInterface.STATUS.STANDBY);
        }
    }



    /**
     * Handles the action of the "pause" button click.
     */
    handlePause() {
        this.setAppStatus(MAIInterface.STATUS.TTS_PAUSE);
        /*
        if (this.status === MAIInterface.STATUS.TTS_ON || this.status === MAIInterface.STATUS.TTS_ALL_ON) {
            this.setAppStatus(MAIInterface.STATUS.TTS_PAUSE);
        } else if (this.status === MAIInterface.STATUS.TTS_PAUSE) {
            this.setAppStatus(this.previousState);
        }
        */
    }



    /**
     * Displays the settings window.
     */
    handleShowSettings() {
        this.settings.showSettings();
    }




    /**
     * Loads (and injects into the page code) the CSS code of the plugin.
     */
    initStyles() {
        fetch(chrome.runtime.getURL('css/styles.css'))
            .then(response => response.text())
            .then(data => {
                const styleElement = document.createElement('style');
                styleElement.type = 'text/css';
                styleElement.innerHTML = data;
                document.head.appendChild(styleElement);
            });
    }



    /**
     * Loads (and injects into the page code) the HTML code of the plugin.
     */
    initHTML() {
        MAILogger.log("MAIInterface.initHTML()");

        fetch(chrome.runtime.getURL('html/interface.html'))
            .then(response => response.text())
            .then(data => {
                jQuery("body").append(data);
                this.initEventHandlers(); // Important to initialize after adding HTML!

                // Pobierz obecny URL i zmień wszystkie znaki na małe litery
                const currentURL = window.location.href.toLowerCase();

                // Sprawdź, czy URL zawiera "openai.com"
                if (currentURL.includes("openai.com".toLowerCase())) {
                    $('#imai-app-title').text(this.i18n.getTranslation("appTitleChatgpt"));
                }
                // Sprawdź, czy URL zawiera "Claude.ai"
                else if (currentURL.includes("Claude.ai".toLowerCase())) {
                    $('#imai-app-title').text(this.i18n.getTranslation("appTitleClaude"));
                }

            });
    }


    /**
     * Attaches event handlers - click actions on UI buttons.
     */
    initEventHandlers() {
        MAILogger.log("MAIInterface.initEventHandlers()");
        let timer = 0;
        let delay = 200;  // czas w milisekundach
        let preventSingleClick = false;

        jQuery(".cmai-btn[data-mai='speechALL']").on('click', () => {
            if (preventSingleClick) {
                preventSingleClick = false;
                return;
            }

            timer = setTimeout(() => {
                if (preventSingleClick) return;
                // Kod dla pojedynczego kliknięcia
                this.ttsAllOnButtonDoubleClick = false;
                this.handleTtsAllOn();
            }, delay);
        }).on('dblclick', () => {
            clearTimeout(timer);
            preventSingleClick = true;
            // Kod dla podwójnego kliknięcia
            this.ttsAllOnButtonDoubleClick = true;
            this.handleTtsAllOn();

            setTimeout(() => {
                preventSingleClick = false;
            }, delay);
        });



        jQuery(".cmai-btn[data-mai='recON']").click(() => this.handleRecOn());
        jQuery(".cmai-btn[data-mai='recOFF']").click(() => this.handleRecOFF());
        jQuery(".cmai-btn[data-mai='speechON']").click(() => this.handleTtsOn());
        jQuery(".cmai-btn[data-mai='speechOFF']").click(() => this.handleTtsOFF());
        jQuery(".cmai-btn[data-mai='pause']").click(() => this.handlePause());
        jQuery(".cmai-btn[data-mai='settings']").click(() => this.handleShowSettings());

        if (this.settings.showButtonDescriptions) {
            jQuery(".cmai-btn[data-mai='recON']").hover(
                () => this.showButtonDescription(this.i18n.getTranslation("buttonRecOn")),
                () => this.hideButtonDescription()
            );

            jQuery(".cmai-btn[data-mai='recOFF']").hover(
                () => this.showButtonDescription(this.i18n.getTranslation("buttonRecOff")),
                () => this.hideButtonDescription()
            );

            jQuery(".cmai-btn[data-mai='transcriptionInProgress']").hover(
                () => this.showButtonDescription(this.i18n.getTranslation("buttonRecTranscription")),
                () => this.hideButtonDescription()
            );

            jQuery(".cmai-btn[data-mai='speechON']").hover(
                () => this.showButtonDescription(this.i18n.getTranslation("buttonTtsOn")),
                () => this.hideButtonDescription()
            );

            jQuery(".cmai-btn[data-mai='speechOFF']").hover(
                () => this.showButtonDescription(this.i18n.getTranslation("buttonTtsOff")),
                () => this.hideButtonDescription()
            );

            jQuery(".cmai-btn[data-mai='speechALL']").hover(
                () => this.showButtonDescription(this.i18n.getTranslation("buttonTtsAllOn")),
                () => this.hideButtonDescription()
            );

            jQuery(".cmai-btn[data-mai='pause']").hover(
                () => this.showButtonDescription(this.i18n.getTranslation("buttonTtsPause")),
                () => this.hideButtonDescription()
            );

            jQuery(".cmai-btn[data-mai='settings']").hover(
                () => this.showButtonSettingsDescription(this.i18n.getTranslation("buttonSettings")),
                () => this.hideButtonDescription()
            );
        }

        // Second lang button
        jQuery("#imai-lang-2").click((event) => {
            // Reading values from data-mailang and data-maivoice attributes
            const _lang = jQuery(event.target).attr("data-mailang");
            const _voice = jQuery(event.target).attr("data-maivoice");

            // Entering initialization mode
            this.initTts = false;
            this.initSettings = false;

            // Changing language
            this.settings.toggleLanguage();

        });

        /* Info btn */
        jQuery("#imai-info-btn").click((event) => {
            this.showInfoPg();
        });



        /* Donate btn */
        jQuery("#imai-donate-btn").click((event) => {
            this.showDonatePg();
        });


        //dodaje opisy przycisków
        /*
        jQuery(".cmai-btn[data-mai='recON']").attr('title', this.i18n.getTranslation("buttonRecOnTitle"));
        jQuery(".cmai-btn[data-mai='recOFF']").attr('title', this.i18n.getTranslation("buttonRecOffTitle"));
        jQuery(".cmai-btn[data-mai='transcriptionInProgress']").attr('title', this.i18n.getTranslation("buttonRecTranscriptionTitle"));
        jQuery(".cmai-btn[data-mai='speechON']").attr('title', this.i18n.getTranslation("buttonTtsOnTitle"));
        jQuery(".cmai-btn[data-mai='speechOFF']").attr('title', this.i18n.getTranslation("buttonTtsOffTitle"));
        jQuery(".cmai-btn[data-mai='speechALL']").attr('title', this.i18n.getTranslation("buttonTtsAllOnTitle"));
        jQuery(".cmai-btn[data-mai='pause']").attr('title', this.i18n.getTranslation("buttonTtsPauseTitle"));
        jQuery(".cmai-btn[data-mai='settings']").attr('title', this.i18n.getTranslation("buttonSettingsTitle"));
        */
    }





    /**
     * Displays an error message in the UI window.
     * @param {string} message - The error message to be displayed.
     */
    showErrorMessage(message) {
        // Display the error in the UI
        jQuery("#imai-error-message").text(message);
        jQuery("#imai-error-close-btn").text(this.i18n.getTranslation("messageErrorClosebtn"));
        jQuery("#imai-error-close-btn").click(() => { this.hideErrorMessage(); });
        jQuery("#imai-error-box").slideDown(400);
    }



    /**
     * Hides the error message.
     */
    hideErrorMessage() {
        jQuery("#imai-error-box").slideUp(400, function () {
            // Clear the text after the animation ends
            jQuery("#imai-error-message").empty();
        });
    }



    /**
     * Displays a message in the UI window.
     * @param {string} message - The message to be displayed.
     */
    showMessage(message) {
        jQuery("#imai-message").text(message);
        jQuery("#imai-message").show();  // Fixed method call with ()
    }



    /**
     * Hides the message.
     */
    hideMessage() {
        jQuery("#imai-message").empty();
        jQuery("#imai-message").hide();
    }



    /**
     * Displays initialization logs.
     * @param {string} log - The log message to be displayed.
     */
    showInitializationLogs(log) {
        MAILogger.log("showInitializationLogs.log: ", log);
        jQuery("#imai-init-box").stop(true, true).slideDown(400);
        if (log !== null && log !== "")
            jQuery("#imai-init-log").append("- " + log + "<br>");

        this.isInitializationLogsHidden = false;
    }



    /**
     * Closes/Clears the initialization logs window.
     * @param {number} [delay=0] - Delay in closing the window in milliseconds.
     * @param {boolean} [withAnimation=false] - Whether to close the window with animation.
     */
    hideInitializationLogs(delay = 0, withAnimation = false) {
        // Waits for the specified delay, then closes and clears the initialization logs window
        jQuery("#imai-init-box").stop(true, true).delay(delay).slideUp(400, () => {
            // Clear the text after the animation ends
            jQuery("#imai-init-log").empty();
            this.isInitializationLogsHidden = true;
        });


        this.hideInitLogsTomeoutId = null;

        if (withAnimation)
            this.runMexicanWaveAnimation();
    }



    /**
     * Displays the button description on hover.
     * @param {string} text - The description text to be displayed.
     */
    showButtonDescription(text) {
        // Closes/Clears the logs window if they were displayed
        if (this.initComplete && !this.isInitializationLogsHidden) {
            this.hideInitializationLogs(0);
            MAILogger.log("showButtonDescription.hideInitializationLogs");
        }

        //jQuery("#imai-button-description").attr('style', '');
        // Displays the button description;
        jQuery("#imai-button-description").stop(true, false).text(text).slideDown(400);
    }



    /**
     * Hides the button description.
     */
    hideButtonDescription() {
        jQuery("#imai-button-description")
            .stop(true, true) // Stops the current animations and clears the queue
            .delay(4000) // Adds a delay of 4000 milliseconds (4 seconds)
            .slideUp(400, function () {
                // Clear the text after the animation ends
                jQuery(this).empty();
                jQuery(this).attr('style', '');
            });
    }



    /**
     * Displays the button description on hover.
     * @param {string} text - The description text to be displayed.
     */
    showButtonSettingsDescription(text) {
        // Closes/Clears the logs window if they were displayed
        if (this.initComplete && !this.isInitializationLogsHidden) {
            this.hideInitializationLogs(0);
        }
        // Displays the button description
        text = text
            + this.i18n.getTranslation("statusInitSttMethod") + ": " + this.settings.voiceToTextMode + '\n'
            + this.i18n.getTranslation("statusInitLang") + ": " + this.settings.ttsLanguage + '\n'
            + this.i18n.getTranslation("statusInitVoice") + ": " + this.settings.ttsVoice + '\n'
            + this.i18n.getTranslation("settingsTtsRate") + ": " + this.settings.ttsRate + '\n'
            + this.i18n.getTranslation("settingsTtsPitch") + ": " + this.settings.ttsPitch + '\n'
            + this.i18n.getTranslation("settingsIgnoreCodeblocks") + ": " + this.settings.ttsIgnoreCodeBlocks + '\n'
            + this.i18n.getTranslation("settingsSttAutosend") + ": " + this.settings.sttAutosendTextPrompt + '\n'
            + this.i18n.getTranslation("appVersion") + ": " + this.version + '\n';

        text = text.replace(/\n/g, '<br>')
            + '<div class="clear: both"></div>';

        jQuery("#imai-button-description").attr('style', '');
        jQuery("#imai-button-description").stop(true, false).html(text).slideDown(400);
    }





    /**
     * Sets the application status and the corresponding button states.
     * @param {string} status - The status to set.
     */
    setAppStatus(status) {
        MAILogger.log("MAIInterface.setAppStatus(status), ", status);

        // Saves the current status before updating it
        if (this.status !== MAIInterface.STATUS.TTS_PAUSE)
            this.previousState = this.status;

        this.status = status;

        // Determines the visibility of the recording buttons based on microphone availability
        var _recOnBtnStatus = (this.isMicAvailable) ? 'visible' : 'hidden';
        var _recOffBtnStatus = (this.isMicAvailable) ? 'hidden' : 'visible';

        // Determines the visibility of the speech buttons based on TTS availability
        var _speechOnBtnStatus = (this.settings.isTtsAvailable()) ? 'visible' : 'hidden';
        var _speechOffBtnStatus = (this.settings.isTtsAvailable()) ? 'hidden' : 'visible';

        // Stops checking for new posts if not in a relevant status
        if (this.status !== MAIInterface.STATUS.STANDBY && this.status !== MAIInterface.STATUS.TTS_ON && this.status !== MAIInterface.STATUS.TTS_PAUSE) {
            MAILogger.log("MAIInterface.setAppStatus() -> stopCheckingNewPost() - 1");
            this.pageAdapter.stopCheckingNewPost(false); //stop without reset
        }

        switch (status) {
            case MAIInterface.STATUS.INITIALIZATION:
                // Application is initializing...
                MAILogger.log("Handling status: INITIALIZATION");

                this.setButtonState({
                    recON: 'disabled',
                    recOFF: 'hidden',
                    transcriptionInProgress: 'hidden',
                    speechON: 'disabled',
                    speechOFF: 'hidden',
                    speechALL: 'disabled',
                    pause: 'disabled',
                    settings: 'ready',
                });
                break;

            // Ready state     

            case MAIInterface.STATUS.STANDBY:
                MAILogger.log("Handling status: Standby");

                this.setButtonState({
                    recON: _recOnBtnStatus,
                    recOFF: _recOffBtnStatus,
                    transcriptionInProgress: 'hidden',
                    speechON: _speechOnBtnStatus,
                    speechOFF: _speechOffBtnStatus,
                    speechALL: 'ready',
                    pause: 'disabled',
                    settings: 'ready',
                });

                // Checks microphone availability
                this.checkMicAvailable();

                // resets pageAdapter settings, and if TTS was running, stops it (without notifications)
                let startCheckingNewPost = (this.settings.isTtsAvailable()) ? true : false;

                MAILogger.log("MAIInteface.setAppStatus(), STATUS.STANDBY, -> pageAdapter.resetSettings(startCheckingNewPost), ", startCheckingNewPost);
                this.pageAdapter.resetSettings(startCheckingNewPost);

                break;


            // Voice recording 
            case MAIInterface.STATUS.REC_ON:
                // Code for status "RecOn"
                MAILogger.log("Handling status: RecOn");
               // Determines the visibility of the speech buttons based on TTS availability
               var _speechOnBtnStatus = (this.settings.isTtsAvailable()) ? 'disabled' : 'hidden';
               var _speechOffBtnStatus = (this.settings.isTtsAvailable()) ? 'hidden' : 'disabled';

                this.setButtonState({
                    recON: 'active',
                    recOFF: 'hidden',
                    transcriptionInProgress: 'hidden',
                    speechON: _speechOnBtnStatus,
                    speechOFF: _speechOffBtnStatus,
                    speechALL: 'disabled',
                    pause: 'disabled',
                    settings: 'disabled',
                });

                // Calls the function to start recording
                this.speechToText.startRecording();
                break;

            // Transcribing the recorded voice
            case MAIInterface.STATUS.TRANSCRIPTION_IN_PROGRESS:
                MAILogger.log("Handling status: TranscriptionInProgress");

                // Determines the visibility of the speech buttons based on TTS availability
                var _speechOnBtnStatus = (this.settings.isTtsAvailable()) ? 'disabled' : 'hidden';
                var _speechOffBtnStatus = (this.settings.isTtsAvailable()) ? 'hidden' : 'disabled';

                this.setButtonState({
                    recON: 'hidden',
                    recOFF: 'hidden',
                    transcriptionInProgress: 'visible',
                    speechON: _speechOnBtnStatus,
                    speechOFF: _speechOffBtnStatus,
                    speechALL: 'disabled',
                    pause: 'disabled',
                    settings: 'disabled',
                });
                break;

            // Text-to-speech for a new post    
            case MAIInterface.STATUS.TTS_ON:
                MAILogger.log("Handling status: TtsOn");

                // Determines the visibility of the recording buttons based on microphone availability
                var _recOnBtnStatus = (this.isMicAvailable) ? 'disabled' : 'hidden';
                var _recOffBtnStatus = (this.isMicAvailable) ? 'hidden' : 'disabled';

                // Determines the visibility of the speech buttons based on TTS availability
                var _speechOnBtnStatus = (this.settings.isTtsAvailable()) ? 'disabled' : 'hidden';
                var _speechOffBtnStatus = (this.settings.isTtsAvailable()) ? 'hidden' : 'disabled';

                this.setButtonState({
                    recON: _recOnBtnStatus,
                    recOFF: _recOffBtnStatus,
                    transcriptionInProgress: 'hidden',
                    speechON: 'active',
                    speechOFF: 'hidden',
                    speechALL: 'disabled',
                    pause: 'ready',
                    settings: 'disabled',
                });

                break;



            // Text-to-speech for the entire thread or a selected segment 
            case MAIInterface.STATUS.TTS_ALL_ON:
                MAILogger.log("Handling status: TtsAllOn");

                // Determines the visibility of the recording buttons based on microphone availability
                var _recOnBtnStatus = (this.isMicAvailable) ? 'disabled' : 'hidden';
                var _recOffBtnStatus = (this.isMicAvailable) ? 'hidden' : 'disabled';

                // Determines the visibility of the speech buttons based on TTS availability
                var _speechOnBtnStatus = (this.settings.isTtsAvailable()) ? 'disabled' : 'hidden';
                var _speechOffBtnStatus = (this.settings.isTtsAvailable()) ? 'hidden' : 'disabled';

                this.setButtonState({
                    recON: _recOnBtnStatus,
                    recOFF: _recOffBtnStatus,
                    transcriptionInProgress: 'hidden',
                    speechON: _speechOnBtnStatus,
                    speechOFF: _speechOffBtnStatus,
                    speechALL: 'active',
                    pause: 'ready',
                    settings: 'disabled',
                });

                /*
                // Resumes TTS if transitioning from TTS_PAUSE
                if (this.previousState === MAIInterface.STATUS.TTS_PAUSE) {
                    this.pageAdapter.tts.resume();
                }
                //else
                //    this.pageAdapter.resetSettings();
                */

                MAILogger.log("this.pageAdapter.getTextAndSendToSpeaker();");
                // Calls the method to retrieve text from the page and send it to the TTS speaker
                if (this.ttsAllOnButtonDoubleClick) {
                    MAILogger.log("MAIInterface.ttsAllOnButtonDoubleClick -> this.pageAdapter.getLastPostAndSendToSpeaker();");
                    this.pageAdapter.getLastPostAndSendToSpeaker();
                }
                else
                    this.pageAdapter.getTextAndSendToSpeaker();

                this.ttsAllOnButtonDoubleClick = false;
                break;


            // Pause for TTS (text-to-speech)
            case MAIInterface.STATUS.TTS_PAUSE:
                // Code for status "TtsPause"
                // Sets button states based on whether the previous state was TTS_ON or TTS_ALL_ON

                // Determines the visibility of the speech buttons based on TTS availability
                var _speechOnBtnStatus = (this.previousState === MAIInterface.STATUS.TTS_ON) ? 'paused' : (this.settings.isTtsAvailable()) ? 'disabled' : 'hidden';
                var _speechOffBtnStatus = (this.previousState !== MAIInterface.STATUS.TTS_ON && !this.settings.isTtsAvailable()) ? 'disabled' : 'hidden';
                var _speechAllBtnStatus = (this.previousState === MAIInterface.STATUS.TTS_ALL_ON) ? 'paused' : 'disabled';

                MAILogger.log("STATUS_TTS_PAUSE, speechOnStatus: " + _speechOnBtnStatus + " speechAllStatus: " + _speechAllBtnStatus);

                // Updates button states for the current status
                this.setButtonState({
                    recON: _recOnBtnStatus,
                    recOFF: _recOffBtnStatus,
                    transcriptionInProgress: 'hidden',
                    speechON: _speechOnBtnStatus,
                    speechOFF: _speechOffBtnStatus,
                    speechALL: _speechAllBtnStatus,
                    pause: 'active',
                    settings: 'disabled',
                });

                if (!this.pageAdapter.tts.isPauseActive)
                    //wstrzymuje syntezę mowy (text-to-speech)
                    this.pageAdapter.tts.pause();
                else {
                    //wznawia syntezę mowy (text-to-speech)
                    this.pageAdapter.tts.resume();
                    this.status = this.previousState;

                    //przywraca stan przycisków UI sprzed pauzy
                    var _speechOnBtnStatus = (this.previousState === MAIInterface.STATUS.TTS_ON) ? 'active' : (this.settings.isTtsAvailable()) ? 'disabled' : 'hidden';
                    var _speechOffBtnStatus = (this.previousState !== MAIInterface.STATUS.TTS_ON && !this.settings.isTtsAvailable()) ? 'disabled' : 'hidden';
                    var _speechAllBtnStatus = (this.previousState === MAIInterface.STATUS.TTS_ALL_ON) ? 'active' : 'disabled';

                    this.setButtonState({
                        recON: _recOnBtnStatus,
                        recOFF: _recOffBtnStatus,
                        transcriptionInProgress: 'hidden',
                        speechON: _speechOnBtnStatus,
                        speechOFF: _speechOffBtnStatus,
                        speechALL: _speechAllBtnStatus,
                        pause: 'ready',
                        settings: 'disabled',
                    });
                }
                //this.setAppStatus(this.previousState);
                // If TTS (or TTS All) was ongoing, pauses it
                //this.pageAdapter.tts.pause();

                break;


            default:
                MAILogger.error("Unknown status:", this.status);
                break;
        }
    }







    /**
     * Updates the state of specified buttons.
     * Button states: 'active', 'disabled', 'hidden', 'visible', 'ready', 'paused'.
     * 'paused' - for speechON or speechALL.
     * Example:
     * setButtonState({
     *   recON: 'active',
     *   recOFF: 'hidden',
     *   speechON: 'ready'
     * });
     *
     * @param {object} buttonStates - An object where keys are button names and values are desired states.
     */
    setButtonState(buttonStates) {
        // Iterate through each buttonState entry
        Object.keys(buttonStates).forEach((buttonName) => {
            // Get the state and the jQuery object of the button
            const state = buttonStates[buttonName];
            const $button = $(`[data-mai="${buttonName}"]`);

            // Log if button does not exist and continue the loop
            if (!$button.length) {
                MAILogger.log(buttonName + " DOES NOT EXIST!");
                return;
            }

            // Remove existing state classes, reset 'disabled' property, and show button if it was hidden
            $button.removeClass('cmai-btn-active cmai-btn-disable cmai-btn-paused')
                .prop('disabled', false)
                .show();

            // Set new state class, 'disabled' property or hide/show button as needed
            switch (state) {
                case 'active':
                    $button.addClass('cmai-btn-active');
                    break;
                case 'disabled':
                    $button.addClass('cmai-btn-disable').prop('disabled', true);
                    break;
                case 'paused':
                    $button.addClass('cmai-btn-paused');
                    break;
                case 'hidden':
                    $button.hide();
                    break;
                case 'visible':
                    $button.show();
                    break;
                // For 'ready' state, we've already removed extra classes and shown the button (keeping "cmai-btn" class)
                default:
                    break;
            }
        });
    }




    /**
     * Event Handlers for MAIPageAdapter and TTS events
     */



    /**
     * Handles the event triggered by MAIPageAdapter object when text reading starts.
     */
    onSpeakStart() {
        MAILogger.log("MAIInterface.onSpeakStart");
        if (this.status === MAIInterface.STATUS.STANDBY) {
            // Reading the latest post
            MAILogger.log("MAIInterface.STATUS.TTS_ON");
            // Transition to TTS_ON status
            this.setAppStatus(MAIInterface.STATUS.TTS_ON);
        }
    }



    /**
     * Handles the event triggered by MAIPageAdapter object when text reading ends.
     */
    onSpeakEnd() {
        MAILogger.log("MAIInterface.onSpeakEnd");
        // Transition to STANDBY status
        this.setAppStatus(MAIInterface.STATUS.STANDBY);
    }



    /**
     * Handles the event triggered by MAIPageAdapter object when text reading is interrupted.
     */
    onSpeakStop() {
        MAILogger.log("MAIInterface.onSpeakStop");
        // Transition to STANDBY status
        this.setAppStatus(MAIInterface.STATUS.STANDBY);
    }


    /**
     * Handles configuration updates and notifications about the changes.
     */
    onUpdateSettings() {
        MAILogger.log("MAIInteface.onUpdateSettings()");
        // Update STT (speech-to-text) - STT method might have changed
        this.speechToText.onUpdateSettings(this.settings);
        // Update TTS settings if voice settings have changed
        MAILogger.log("MAIInteface.onUpdateSettings() -> tts.resetSettings() ");
        this.pageAdapter.tts.resetSettings();

        // Update the user interface (language version menu)
        this.updateUI(true);

        if (this.hideInitLogsTomeoutId === null) {
            this.hideInitLogsTomeoutId = setTimeout(() => {
                this.hideInitializationLogs(2000, false);
            }, 2000);
        }
    }



    /**
     * Handles notifications about new posts on the page.
     * If conditions are met, it may read the new post using TTS.
     */
    onNewPost() {
        MAILogger.log("onNewPost");
        this.setAppStatus(MAIInterface.STATUS.TTS_ON);
        // Triggers double click on pause to initiate
        // sound synthesis (occasionally it doesn't work without this)
        //this.triggerPause2Clicks();
    }



    /**
     * Handles notifications about microphone initialization.
     */
    onInitMicrophone() {
        MAILogger.log("MAIInterface.onInitMicrophone");
        if (!this.initMicrophone) {
            this.initMicrophone = true;
            let _micLogText = (this.isMicAvailable) ? this.i18n.getTranslation("statusInitMicOn") : this.i18n.getTranslation("statusInitMicOff");
            this.showInitializationLogs(_micLogText);
        }
    }



    /**
     * Notification about TTS initialization.
     */
    onInitTts() {
        MAILogger.log("MAIInterface.onInitTts");
        if (!this.initTts) {
            this.initTts = true;
            this.showInitializationLogs(this.i18n.getTranslation("statusInitTtsReady"));
        }
    }


    /**
     * Handles initialization of settings.
     */
    onInitSettings() {
        MAILogger.log("MAIInterface.onInitSettings");
        if (!this.initSettings) {
            this.initSettings = true;
            //this.showInitializationLogs(this.i18n.getTranslation("statusInitSettingsLoaded"));
            this.showInitializationLogs(this.i18n.getTranslation("statusInitSttMethod") + ": " + this.settings.voiceToTextMode);
            this.showInitializationLogs(this.i18n.getTranslation("statusInitLang") + ": " + this.settings.ttsLanguage);
            this.showInitializationLogs(this.i18n.getTranslation("statusInitVoice") + ": " + this.settings.ttsVoice);

            // Resetting settings if TTS isn't initialized
            //this.pageAdapter.tts.resetSettings();
            //MAILogger.log("onInitSettings -> this.pageAdapter.resetSettings");

            // Updating interface (language version menu)
            //this.updateUI();
        }
    }



    /**
     * Handles initialization of the page adapter.
     */
    onInitPageAdapter() {
        if (!this.initPageAdapter) {
            MAILogger.log("MAIInterface.onInitPageAdapter() -> pageAdapter.resetSettings()");
            this.pageAdapter.resetSettings();
            this.initPageAdapter = true;
            this.showInitializationLogs(this.i18n.getTranslation("statusInitPageadapterReady"));
        }
    }


    // Po wymyszonym zakończeniu nagrywania (np. przekroczony timeout)
    // przywraca domyślny stan przycisków
    onForceStopRecording() {
        MAILogger.log("onForceStopRecording");
        if (this.status === MAIInterface.STATUS.REC_ON)
            this.handleRecOn();
    }

    /**
     * Displays error messages.
     * (Errors from "observed" objects of other classes of the plugin are also handled)
     * @param {Error} error - Reported error
     */
    handleError(error) {
        let errorMessage = "";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        } else {
            errorMessage = 'Unknown error';
        }

        MAILogger.error("MAIInterface handleError: ", errorMessage);
        this.showErrorMessage(errorMessage);
        // Transition to STANDBY status
        this.setAppStatus(MAIInterface.STATUS.STANDBY);
    }








    /**
    * Executes a Mexican Wave animation on UI buttons once after plugin initialization.
    */
    runMexicanWaveAnimation() {
        // Fetch all buttons with class 'cmai-btn' and filter to retain only visible ones
        const visibleButtons = $('.cmai-controls .cmai-btn').filter(function () {
            return $(this).css('display') !== 'none';
        });

        // Create an array of 'data-mai' attributes for visible buttons
        const buttonsDataMaiAttributes = visibleButtons.map(function () {
            return $(this).attr('data-mai');
        }).get();  // Convert to plain JavaScript array

        buttonsDataMaiAttributes.forEach((attribute, index) => {
            setTimeout(() => {
                const button = $(`[data-mai="${attribute}"]`);

                // Add 'animating' class to button
                button.addClass('animating');

                // Remove 'animating' class after animation completes
                setTimeout(() => {
                    button.removeClass('animating');
                }, 500);  // animation duration in milliseconds, consistent with CSS
            }, index * 500);  // animation delay for each button
        });
    }





    /**
     * Method simulating a double-click on pause button, due to occasional bug/feature(?) of TTS function initiating sound synthesis only upon clicking.
     */
    triggerPause2Clicks() {
        MAILogger.log("MAIInterface.triggerPause2Clicks");
        setTimeout(() => {
            jQuery(".cmai-btn[data-mai='pause']").click();
        }, 100);

        setTimeout(() => {
            jQuery(".cmai-btn[data-mai='pause']").click();
        }, 150);
    }



    /**
     * Returns true if the browser belongs to the provided list, e.g., isBrowserInList(['Chrome', 'Brave']).
     *
     * @param {Array} browserList - Array containing browser names.
     * @returns {boolean} 
     */
    isBrowserInList(browserList) {
        const userAgent = navigator.userAgent.toLowerCase();
        return browserList.some(browser => {
            const lowerBrowser = browser.toLowerCase();
            if (lowerBrowser === 'chrome' && userAgent.includes('chrome') && !userAgent.includes('edg')) {
                return true;
            }
            if (lowerBrowser === 'brave' && userAgent.includes('brave')) {
                return true;
            }
            if (lowerBrowser === 'edge' && userAgent.includes('edg')) {
                return true;
            }
            if (lowerBrowser === 'opera' && userAgent.includes('opr')) {
                return true;
            }
            if (lowerBrowser === 'vivaldi' && userAgent.includes('vivaldi')) {
                return true;
            }
            if (lowerBrowser === 'chromium' && userAgent.includes('chromium')) {
                return true;
            }
            // Add more cases for other browsers if necessary
            return false;
        });
    }





    /**
     * Loads the content of a file from a specified path.
     * @param {string} filepath - The path to the file.
     * @returns {Promise<string|null>} - A Promise that resolves to the content of the file, or null if an error occurs.
     */
    _loadFile(filepath) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: chrome.runtime.getURL(filepath),
                type: 'GET',
                success: function (data) {
                    resolve(data);
                },
                error: function () {
                    resolve(null);
                }
            });
        });
    }

    /**
     * Asynchronously loads and displays the donation page. 
     * The content of the page is loaded based on the user's language settings.
     * If the donation page is already loaded, it simply displays the page.
     * @returns {Promise<void>}
     */
    async loadDonatePg() {
        if (!this.donatePgLoaded) {

            const langCode = navigator.language.includes('-') ?
                navigator.language.split('-')[0] :
                navigator.language;

            let filePath = `html/donate_${langCode}.html`;

            let data = await this._loadFile(filePath);

            if (data === null) {
                filePath = 'html/donate_en.html';
                data = await this._loadFile(filePath);
            }

            if (data !== null) {
                jQuery("body").append(data);
                jQuery("#imai-donate-overlay").click(() => this.hideDonatePg());
                jQuery("#imai-donate-button-close").text(this.i18n.getTranslation("buttonClose"));
                jQuery("#imai-donate-button-close").click(() => this.hideDonatePg());
                this.donatePgLoaded = true;
            }
        }
    }


    async showDonatePg() {
        if (!this.donatePgLoaded) {
            await this.loadDonatePg();
            this.donatePgLoaded = true;
        }

        if (this.donatePgLoaded) {
            jQuery('#imai-donate-overlay').fadeIn();
            jQuery("#imai-donate-container").show();
        }
    }



    /**
     * Hides the donation page by fading out the overlay and hiding the container.
     */
    hideDonatePg() {
        $('#imai-donate-overlay').fadeOut();
        jQuery("#imai-donate-container").hide();
    }




    /**
     * Asynchronously loads and displays the information page.
     * The content of the page is loaded based on the user's language settings.
     * If the information page is already loaded, it simply displays the page.
     * @returns {Promise<void>}
     */
    async loadInfoPg() {
        if (!this.infoPgLoaded) {
    
            const langCode = navigator.language.includes('-') ?
                navigator.language.split('-')[0] :
                navigator.language;
    
            let filePath = `html/info_${langCode}.html`;
    
            try {
                let data = await this._loadFile(filePath);
    
                if (data === null) {
                    filePath = 'html/info_en.html';
                    data = await this._loadFile(filePath);
                }
    
                if (data !== null) {
                    jQuery("body").append(data);
                    jQuery("#imai-info-overlay").click(() => this.hideInfoPg());
                    jQuery("#imai-info-button-close").text(this.i18n.getTranslation("buttonClose"));
                    jQuery("#imai-info-button-close").click(() => this.hideInfoPg());
                    this.infoPgLoaded = true;
                }
            } catch (error) {
                MAILogger.error('Error loading info page:', error);
            }
        }
    }
    


    async showInfoPg() {
        if (!this.infoPgLoaded) {
            await this.loadInfoPg();
            this.infoPgLoaded = true;
        }

        if (this.infoPgLoaded) {
            jQuery('#imai-info-overlay').fadeIn();
            jQuery("#imai-info-container").show();
        }
    }


    /**
     * Hides the information page by fading out the overlay and hiding the container.
     */
    hideInfoPg() {
        $('#imai-info-overlay').fadeOut();
        jQuery("#imai-info-container").hide();
    }



}
