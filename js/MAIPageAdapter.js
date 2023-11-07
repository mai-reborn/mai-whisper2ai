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
 * Provides an interface with methods common to pages handled by the application.
 */

class MAIPageAdapter {

    /**
     * Enumeration representing various states
     * @readonly
     * @enum {number}
     */
    static STATUS = Object.freeze({
        STANDBY: 1,  // ready state
        CHECKING_NEW_POST: 2,         // checking for a new post in the thread (during an interval)
        READING_ALL_POSTS: 3,           // reading all posts in the thread
        READING_SELECTED_TEXT: 4,          // reading the selected text
    });


    /**
     * Constructor initializes class properties and any necessary setup.
     */

    constructor(settings) {
        this.lastPostNumber = 0; // Last post number in the thread
        this.currentPostNumber = 0; // Currently read (TTS) post number in the thread

        this.errorObservers = []; // Observers handling class errors
        this.newPostObservers = []; // Observers to be notified when a new thread appears
        this.speakObservers = []; // Speech synthesis observers, notified upon TTS completion or interruption
        this.initObservers = [];  // Observers to be notified upon module initialization

        // Defining delimiters for chunking text
        // String.fromCharCode(10) represents the newline character '\n'
        this.chunkDelimiters = [
            '.', '!', '?', '…', '。', '．', '！', '？',
            ';', ':', ': ', String.fromCharCode(10)
        ];

        this.additionalChunkDelimiters = [];
        this.maxChunkLength = 250; // Max number of characters per chunk
        this.minChunkLength = 50;  // Min number of characters per chunk

        // Set maximum recursion depth for the highlightNode method
        this.maxHighlightRecursionDepth = 200;


        this.settings = settings;
        this.status = MAIPageAdapter.STATUS.STANDBY;

        this.checkingTimeoutId = null;  // Identifier of the interval for checking a new post (allows termination of the interval)
        this.sendChunkTimeoutId = null; // Identifier of the interval for sending post chunks to be read
        this.urlCheckTimeoutId = null; // Identifier of the function called with setTimeout, after changing the chat subpage (when another thread from chat history is selected)

        // State variables for reading the entire thread (from the first post to the last)
        //this.currentPost = null;    // Current post (a css class ".cmai-current-post" is added to highlight read text fragments)
        this.currentPostNumber = this.getFirstPostNumber(); // Number of the first post in the thread

        this.currentChunksSpeakCount = 0; // Number of already read chunks (if equal to the number of chunks to be read, can start reading a new post)

        // State variables for detecting the latest post on the page
        this.newPost = null;    // Current post
        this.newPostSentences = []; // Array with the post text divided into sentences
        this.newPostNextSentence = 0; // Number of the next sentence in the current post

        this.newPostWasDetected = false; //czy był wykryty w tym wątku nowy post

        this.sentenceBuffer = [];

        // Additional variables
        this.allPostCount = 0   // Current number of all posts in the thread

        // State variables for reading selected text or the entire thread
        this.selectedText = null;    // Selected text
        this.textChunks = [];    // Array with selected text divided into chunks
        this.textChunkIndex = 0; // Index of the current chunk

        // TTS - text to speech
        this.tts = new MAITextToSpeech(this.settings);
        this.tts.addErrorObserver(this);
        this.tts.addSpeakObserver(this);

        this.lastChangeTimestamp = null;

        // Identifiers of the interval and timeout of selected text (during reading)
        this.selectTextIntervalId = null;
        this.selectTextTimeOutId = null;

        // Last noted post length, used in the method detecting new post and reading sentences generated (dynamically) by chat
        // If code block skipping option is enabled in the "speak" function,
        // it still counts their length to know if the post is still being generated
        // or should stop checking in the interval and return to the previous mode
        this.lastNotedPostLength = 0;


        // In the interval, it checks if another thread from the chat history has not been selected
        // if so - resets the settings related to the chat thread
        this.lastUrl = location.href;
        this.urlCheckInterval = setInterval(() => {
            if (this.lastUrl !== location.href) {
                this.lastUrl = location.href;

                // Code executed after URL change

                // Last remembered number of posts in the thread
                let prevAllPostCount = this.allPostCount;

                // Current number of posts in the thread
                // (If the chat is still loading, this might not be accurate)
                let allPostCount = this._getPostCount();

                let prevLastPost = null; // Last remembered post

                // Logging information
                MAILogger.log("MAIPageAdapter.urlCheckInterval -> status: ", this.status);
                MAILogger.log("MAIPageAdapter.urlCheckInterval -> prevAllPostCount: ", prevAllPostCount);
                MAILogger.log("MAIPageAdapter.urlCheckInterval -> allPostCount: ", allPostCount);

                // If the URL change is due to a thread change in the chat (e.g., selecting a different thread from the history or creating a new chat),
                // then settings (of PageAdapter) must be reset.
                // Note: URL change doesn't always mean this. For instance, ChatGPT only changes the URL after the first response in a new chat.
                if (
                    (prevAllPostCount === 0 && allPostCount === 0) ||
                    (prevAllPostCount > 2) || // Definitely a thread change to an old chat thread from history (reset required)
                    ((allPostCount - prevAllPostCount) > 1) || // Definitely a thread change (reset required)
                    (prevAllPostCount !== 0 && (prevLastPost = this._getNthPost(prevAllPostCount)) === null) && // If there were previous posts and now it can't load any, it means a new thread is loading (reset required)
                    (allPostCount > 0 && prevLastPost !== this._getNthPost(allPostCount)) // If there are already some posts in the thread, it checks if the last (previous) post is different from the current last post (i.e., it's a new thread and a reset is required)
                ) {
                    MAILogger.log("MAIPageAdapter.urlCheckInterval -> RESET!!!");

                    // notifies MAIInterface to reset the UI and return to standby
                    // the interface switching to STANDBY mode will reset the PageAdapter (call the resetSettings() method
                    this.notifySpeakObservers("stop", "");
                }
            }
        }, 100);

        this.initialize();
    }





    /**
     * Initializes the page adapter
     */
    initialize() {
        this.notifyInitObservers();
    }




    /**
         * Adds an error observer to be notified of error events.
         * @param {Object} observer - The observer to be added.
         */
    addErrorObserver(observer) {
        this.errorObservers.push(observer);
    }



    /**
     * Notifies all registered error observers of an error event.
     * @param {Error} error - The error to be passed to the observers.
     */
    notifyErrorObservers(error) {
        this.errorObservers.forEach(observer => observer.handleError(error));
    }



    /**
     * Adds a new post observer to be notified of new post events.
     * @param {Object} observer - The observer to be added.
     */
    addNewPostObserver(observer) {
        this.newPostObservers.push(observer);
    }



    /**
     * Notifies all registered new post observers of a new post event.
     */
    notifyNewPostObservers() {
        this.newPostObservers.forEach(observer => observer.onNewPost());
    }



    /**
     * Adds a speak observer to be notified of TTS (Text-to-Speech) events.
     * @param {Object} observer - The observer to be added.
     */
    addSpeakObserver(observer) {
        this.speakObservers.push(observer);
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
        MAILogger.log("pageAdapter.notifyInitObservers() ");
        this.initObservers.forEach(observer => {
            try {
                observer.onInitPageAdapter();
            } catch (error) {
                MAILogger.log(`Error notifying observer: ${error.message}`);
            }
        });
    }




    /**
     * Notifies all registered speak observers of a TTS (Text-to-Speech) event.
     * @param {string} ttsEvent - The TTS event type ("start", "end", "stop").
     * @param {string} [text=''] - The text being read by TTS.
     */
    notifySpeakObservers(ttsEvent, text = '') {
        MAILogger.log("pageAdapter.notifySpeakObservers(ttsEvent, text), " + "ttsEvent = " + ttsEvent + " text = " + text);

        this.speakObservers.forEach(observer => {
            switch (ttsEvent) {
                case "start":
                    observer.onSpeakStart(text);
                    break;
                case "end":
                    observer.onSpeakEnd(text);
                    break;
                case "stop":
                    observer.onSpeakStop(text);
                    break;
                default:
                    console.error(`Unknown TTS event: ${ttsEvent}`);
            }
        });
    }





    /**
         * Retrieves the number of the last post in the thread.
         * @returns {number} - The number of the last post, returns 0 as this method should be overridden by subclasses.
         */
    getLastPostNumber() {
        return 0;
    }



    /**
     * Retrieves the text (excluding HTML tags) from the selected portion on the page.
     * @returns {string|null} - The selected text or null if no text is selected.
     */
    getSelectedText() {
        let selectedText = null;

        if (window.getSelection) {
            selectedText = window.getSelection().toString();
        } else if (document.selection && document.selection.type !== "Control") {
            selectedText = document.selection.createRange().text;
        }

        return selectedText;
    }



    /**
     * Retrieves the content of the post at the index specified by this.currentPostNumber.
     * This is a placeholder method and should be overridden by subclasses.
     * @throws {Error} - Throws an error stating the method is not implemented.
     */
    getPost() {
        throw new Error("Not implemented");
    }



    /**
     * Injects text into the page.
     * This is a placeholder method and should be overridden by subclasses.
     * @param {string} text - The text to be injected.
     * @throws {Error} - Throws an error stating the method is not implemented.
     */
    injectTranscription(text) {
        throw new Error("Not implemented");
    }



    /**
     * Splits a given text into chunks based on specified delimiters.
     * @param {string} text - The text to be split into chunks.
     * @param {boolean} [withAdditionalDelimiters=false] - Flag indicating whether to include additional delimiters.
     * @returns {string[]} - An array of chunks extracted from the text.
     */
    splitIntoChunks(text, withAdditionalDelimiters = false) {
        //MAILogger.log("splitIntoChunks: " + text);

        // Ensure text is iterable and non-null
        if (text == null || typeof text[Symbol.iterator] !== 'function') {
            MAILogger.error("splitIntoChunks: Provided text is not iterable.");
            return [];
        }

        let chunks = [];
        let currentChunk = "";
        let delimiters = (withAdditionalDelimiters)
            ? [...this.chunkDelimiters, ...this.additionalChunkDelimiters]
            : this.chunkDelimiters;

        for (const char of text) {
            currentChunk += char;

            // Split chunk on specified delimiters
            if (delimiters.includes(char)) {
                if (char === String.fromCharCode(10) || currentChunk.length >= this.minChunkLength) {
                    const trimmedChunk = currentChunk.trim();
                    if (trimmedChunk) {  // Ensure chunk is non-empty
                        chunks.push(trimmedChunk);
                    }
                    currentChunk = "";
                }
            }
            // Split chunk if maxChunkLength is reached
            else if (currentChunk.length >= this.maxChunkLength) {
                let lastSpaceIndex = currentChunk.lastIndexOf(' ');

                if (lastSpaceIndex !== -1) {
                    const trimmedChunk = currentChunk.substring(0, lastSpaceIndex).trim();
                    if (trimmedChunk) {  // Ensure chunk is non-empty
                        chunks.push(trimmedChunk);
                    }
                    currentChunk = currentChunk.substring(lastSpaceIndex + 1);
                } else {
                    const trimmedChunk = currentChunk.trim();
                    if (trimmedChunk) {  // Ensure chunk is non-empty
                        chunks.push(trimmedChunk);
                    }
                    currentChunk = "";
                }
            }
        }

        // Handle any remaining text
        if (currentChunk) {
            const trimmedChunk = currentChunk.trim();
            if (trimmedChunk) {  // Ensure chunk is non-empty
                chunks.push(trimmedChunk);
            }
        }

        //MAILogger.log("splitIntoChunk.chunks: ", chunks);
        return chunks;
    }




    /**
     * Finds the closest common ancestor node encompassing the entire selected text, or returns null if no text is selected.
     * @returns {Node|null} - The closest common ancestor node or null if no text is selected.
     */
    _findSelectedTextCommonAncestor() {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return null;

        let anchorNode = selection.anchorNode;
        let focusNode = selection.focusNode;



        /**
             * Recursive helper function to get an array of ancestor nodes for a given node.
             * @param {Node} node - The node for which to find ancestor nodes.
             * @param {Node[]} [ancestors=[]] - An array to populate with ancestor nodes.
             * @returns {Node[]} - An array of ancestor nodes.
             */
        const getAncestors = (node, ancestors = []) => {
            if (node.parentNode) {
                ancestors.push(node.parentNode);
                getAncestors(node.parentNode, ancestors);
            }
            return ancestors;
        };

        const anchorAncestors = getAncestors(anchorNode);
        const focusAncestors = getAncestors(focusNode);

        // Find the closest common ancestor for both nodes
        for (const ancestor of anchorAncestors) {
            if (focusAncestors.includes(ancestor)) {
                return ancestor;
            }
        }

        return null;  // No common ancestor (which is rare)
    }




    /**
     * Recursively traverses nodes on the page and highlights the specified text.
     * Example:
     * highlightNode($("#text-container-id"), "text fragment to highlight");
     * @param {jQuery} $node - The jQuery element representing the node to start searching from.
     * @param {string} textToHighlight - The text to be highlighted.
     * @param {number} [currentDepth=0] - The current recursion depth.
     */
    highlightNode($node, textToHighlight, currentDepth = 0) {

        // Guard against too deep recursion
        if (currentDepth > this.maxHighlightRecursionDepth) {
            console.error('Exceeded maximum recursion depth');
            return;
        }

        // Guard against empty string
        if (!textToHighlight || textToHighlight.length === 0) {
            return;
        }

        // If no further nodes found
        if (!$node || $node.length === 0) return;

        const self = this;  // Store the context 'this'
        const nodeType = $node[0].nodeType;

        if (nodeType === Node.TEXT_NODE) { // Text node
            const nodeText = $node.text();
            const indexOfMatch = nodeText.indexOf(textToHighlight);

            if (indexOfMatch > -1) {
                const nativeNode = $node[0];
                const matchedText = nativeNode.splitText(indexOfMatch);
                matchedText.splitText(textToHighlight.length);
                const $highlight = $('<span class="cmai-highlight-text"></span>');
                $(matchedText).before($highlight);
                $highlight.append(matchedText);

                // Scroll to highlighted text
                // Give the browser time to render then scroll
                setTimeout(() => {
                    this.scrollToHighlightedText();
                }, 0); // You may increase the delay time if needed

            }
        } else if (nodeType === Node.ELEMENT_NODE) { // Element node
            const combinedText = $node.text();
            const indexOfMatch = combinedText.indexOf(textToHighlight);

            if (indexOfMatch > -1) {
                $node.contents().each(function () {
                    const $this = $(this);
                    const thisText = $this.text();
                    if (textToHighlight.startsWith(thisText)) {
                        textToHighlight = textToHighlight.substring(thisText.length);
                        self.highlightNode($this, thisText, currentDepth + 1);
                    } else {
                        self.highlightNode($this, textToHighlight, currentDepth + 1);
                    }
                });
            } else {
                $node.contents().each(function () {
                    self.highlightNode($(this), textToHighlight, currentDepth + 1); // Use 'self' instead of 'this', and increment depth by 1 in recursive calls
                });
            }
        }
    }




    /**
     * Removes the text highlighting from a specified node and its descendants.
     * @param {jQuery} $node - The jQuery object representing the node from which to remove the highlighting.
     */
    removeHighlight($node) {
        if (!$node || $node.length === 0) return;  // Exit the function if the node is null or undefined

        const removeHighlightRecursively = (node) => {
            if (node.nodeType === 1 && $(node).hasClass('cmai-highlight-text')) {  // Check if the node is an element and has the highlight class
                $(node).contents().unwrap();  // Unwrap the contents of the node to remove the highlight
            } else if (node.nodeType === 1) {  // Check if the node is an element
                Array.from(node.childNodes).forEach(removeHighlightRecursively);  // Recur through child nodes
            }
        };

        removeHighlightRecursively($node[0]);  // Call the recursive function with the native DOM node
    }



    /**
     * Scrolls the view to the highlighted text on the page.
     */
    scrollToHighlightedText() {
    }





    /**
     * Highlights text within a DOM element from a specified start to end position.
     * @param {HTMLElement} domElement - The DOM element within which to highlight text.
     * @param {number} start - The start position of the text to highlight.
     * @param {number} end - The end position of the text to highlight.
     */
    selectTextInDomElement(domElement, start, end) {
        let charIndex = 0;
        const range = document.createRange();
        const sel = window.getSelection();
        let foundStart = false;
        const maxDepth = 20;  // Maximum recursion depth



        /**
             * Recursive function to traverse the DOM tree and set the range for text selection.
             * @param {Node} node - The current node in the DOM tree.
             * @param {number} depth - The current depth of recursion.
             * @returns {boolean} - Returns true if the end position is found, otherwise false.
             */
        function selectTextInNode(node, depth) {
            if (depth > maxDepth) return;  // Exit the recursion if the maximum depth is exceeded

            if (node.nodeType === Node.TEXT_NODE) {
                const nextCharIndex = charIndex + node.length;
                if (!foundStart && start >= charIndex && start <= nextCharIndex) {
                    range.setStart(node, start - charIndex);
                    foundStart = true;
                }
                if (foundStart && end >= charIndex && end <= nextCharIndex) {
                    range.setEnd(node, end - charIndex);
                    return true;  // End position found
                }
                charIndex = nextCharIndex;
            } else {
                for (let i = 0, len = node.childNodes.length; i < len; ++i) {
                    if (selectTextInNode(node.childNodes[i], depth + 1)) {
                        return true;
                    }
                }
            }
            return false;
        }

        // Initiate the recursive text selection
        if (selectTextInNode(domElement, 0)) {
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }




    /**
     * Searches for a specified text within a DOM element and returns its start and end positions.
     * @param {HTMLElement} domElement - The DOM element within which to search for the text.
     * @param {string} textToFind - The text to search for.
     * @returns {Object} - An object containing the start and end positions of the text.
     */
    findTextPosition(domElement, textToFind) {

        if (!domElement || !textToFind) {
            return { startPosition: -1, endPosition: -1 };
        }

        let fullText = '';
        let startPosition = -1;
        let endPosition = -1;

        /**
             * Recursive function to collect text from text nodes within a DOM element.
             * @param {Node} node - The current node in the DOM tree.
             */
        function collectTextNodes(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                fullText += node.nodeValue;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                Array.from(node.childNodes).forEach(childNode => collectTextNodes(childNode));
            }
        }

        collectTextNodes(domElement);

        const index = fullText.indexOf(textToFind);
        if (index > -1) {
            startPosition = index;
            endPosition = index + textToFind.length;
        }

        return { startPosition, endPosition };
    }






    /**
     * Resets the default settings and re-initializes the application state.
     */
    resetSettings(withCheckingNewPost = false) {
        MAILogger.log("MAIPageAdapter.resetSettings(withCheckingNewPost), ", withCheckingNewPost);
        clearTimeout(this.checkingTimeoutId);
        clearTimeout(this.sendChunkTimeoutId);

        //this.status = MAIPageAdapter.STATUS.STANDBY;

        this.checkingTimeoutId = null;  // Identifier of the interval for checking a new post (allows termination of the interval)
        this.sendChunkTimeoutId = null;  // Identifier of the interval for sending post chunks to be read

        // State variables for reading the entire thread (from the first post to the last)
        //this.currentPost = null;
        this.currentPostNumber = this.getFirstPostNumber();

        this.selectedText = null;    // Selected text
        this.textChunks = [];    // Array with selected text divided into chunks
        this.textChunkIndex = 0;  // Index of the current chunk

        this.currentChunksSpeakCount = 0;  // Number of already read chunks

        // State variables for detecting the latest post on the page
        this.newPost = null;
        this.newPostSentences = [];
        this.newPostNextSentence = 0;

        this.allPostCount = 0;

        this.sentenceBuffer = [];
        this.lastChangeTimestamp = null;

        // Stop TTS if active
        if (this.tts.isActive()) {
            try {
                MAILogger.log("MAIPageAdapter.resetSettings() -> this.tts.stop()");
                this.tts.abort(); //stop without notify observers
            }
            catch (error) {
                MAILogger.error("ERROR MAIPageAdapter.resetSettings() -> this.tts.stop(): ", error);
            }
        }


        MAILogger.log("MAIPageAdapter.resetSettings() -> stopCheckingNewPost(false)  - without resetSettings");
        // Stop without resetSettings
        this.stopCheckingNewPost(false);

        // Starts after 2 sec. checking New Post
        if (withCheckingNewPost && this.settings.isTtsAvailable()) {
            MAILogger.log("MAIPageAdapter.resetSettings() -> startCheckingNewPost()");
            this.startCheckingNewPost();
        }

        // Removes CSS classes added during text reading with TTS
        $(".cmai-current-post").removeClass("cmai-current-post");
        $(".cmai-highlight-text").removeClass("cmai-highlight-text");
        $(".cmai-selected-text").removeClass("cmai-selected-text");

    }




    /**
     * Sends the next chunks of text from the textChunks array to the speaker at intervals.
     * @private
     */
    _sendChunkToSpeaker() {
        MAILogger.log("_sendChunkToSpeaker: nr" + this.textChunkIndex + " -  " + this.textChunks[this.textChunkIndex]);

        // If there are chunks to be sent to the speaker
        if (this.textChunkIndex < this.textChunks.length) {
            this.tts.speak(this.textChunks[this.textChunkIndex]);
            this.textChunkIndex++;

            // It will send the next chunks recursively at timed intervals...
            this.sendChunkTimeoutId = setTimeout(() => {
                this._sendChunkToSpeaker();
            }, 2000);
        }
        // If all chunks have been sent, resets the index and stops the interval
        else {
            MAILogger.log("END _sendChunkToSpeaker???");
            this.textChunkIndex = 0;
            clearTimeout(this.sendChunkTimeoutId);
        }
    }

    /**
     * Reads the post at number this.currentPostNumber (each post is divided into chunks),
     * and sends it to be read by TTS. 
     * Upon completion of reading a given text, the MAITextToSpeech object triggers the onSpeakEnd event.
     * If termination is enforced (e.g., by clicking on a UI button), 
     * the onSpeakStop event is triggered.
     */
    getTextAndSendToSpeaker() {
        this.selectedText = this._getSelectedText();

        // Reads only the selected text fragment
        if (this.selectedText !== null && this.selectedText !== "") {
            this.status = MAIPageAdapter.STATUS.READING_SELECTED_TEXT;
            this._getSelectedTextAndSendToSpeaker();
        }
        // Reads all the posts from the webpage in sequence
        else {
            this.status = MAIPageAdapter.STATUS.READING_ALL_POSTS;
            this.allPostCount = this._getPostCount();
            this._getPostAndSendToSpeaker();
        }
    }






    /**
     * Finds the last post in the conversation and sends it to the speaker for text-to-speech conversion.
     * The method uses getLastPostNumber to get the number of the last post, updates the current post number,
     * and then sends the post to the speaker.
     */
    getLastPostAndSendToSpeaker() {
        var lastPostNumber = this._getPostCount();
        MAILogger.log("getLastPostAndSendToSpeaker: " + lastPostNumber);
        if (lastPostNumber > 0) {
            this.currentPostNumber = lastPostNumber;
            this.status = MAIPageAdapter.STATUS.READING_ALL_POSTS;
            this._getPostAndSendToSpeaker();
        }
    }



    /**
     * Retrieves the post at number this.currentPostNumber and sends it to TTS.
     * @private
     */
    _getPostAndSendToSpeaker() {
        MAILogger.log("_getPostAndSendToSpeaker: nr." + this.currentPostNumber);

        // Reads the next post in the thread
        let currentPostElement = this._getNthPost(this.currentPostNumber)

        //-----
        let postContent = "";

        if (currentPostElement !== null) {

            postContent = currentPostElement.html();

            // Replace </p> and </li> with new line character and remove <p> and <li> tags
            postContent = postContent.replace(/<\/p>/g, String.fromCharCode(10))
                .replace(/<\/li>/g, String.fromCharCode(10))
                .replace(/<p>/g, '')
                .replace(/<li>/g, '');

            if (this.settings.ttsIgnoreCodeBlocks) {
                // Remove all <pre></pre> blocks from the post content
                let tempDiv = $("<div>");
                tempDiv.html(postContent);
                tempDiv.find("pre").remove();
                postContent = tempDiv.text();
            } else {
                // Set post content as plain text, removing all HTML tags
                postContent = $(postContent).text();
            }
        }

        this.currentChunksSpeakCount = 0;  // Resets the chunk counter
        this.textChunkIndex = 0;  // Resets the chunk index

        if (currentPostElement !== null && postContent.length !== 0) {
            // Adds a CSS class to the current post
            currentPostElement.addClass("cmai-current-post");

            // Splits the post into chunks and sends them to be read sequentially
            this.textChunks = this.splitIntoChunks(postContent);

            // Sends the post chunks to be read (sends them asynchronously, with a set interval)
            this._sendChunkToSpeaker();
        } else {
            MAILogger.log("_getPostAndSendToSpeaker: didn't find a post to read :(");
            // Notifies observers about the end of reading...
            this.onSpeakStop("");
        }
    }


    /**
     * Retrieves the text selected on the page, splits it into chunks, and sends it to TTS.
     * @private
     */
    _getSelectedTextAndSendToSpeaker() {
        MAILogger.log("MAIPageAdapter._getSelectedTextAndSendToSpeaker()");

        if (this.selectedText === null) return;

        let selectedTextNode = this._findSelectedTextCommonAncestor();
        if (selectedTextNode) {
            // Adds a CSS class to the current post
            $(selectedTextNode).addClass("cmai-current-post");
        }

        // Trims the text to n-characters to prevent reading, for example, the entire page selected by ctrl + a
        // This function is meant for reading shorter texts
        const maxLength = 1000;  // Maximum text length
        this.selectedText = this.selectedText.toString();

        // Trimming the text to maxLength characters
        if (this.selectedText.length > maxLength) {
            this.selectedText = this.selectedText.substring(0, maxLength);
        }

        // Resets the counter for the number of read text chunks
        this.currentChunksSpeakCount = 0;

        MAILogger.log("MAIPageAdapter._getSelectedTextAndSendToSpeaker: " + this.selectedText);

        // Splits the text into chunks and sends them to be read sequentially
        this.textChunks = this.splitIntoChunks(this.selectedText);

        // Sends the text chunks to be read (sends them asynchronously, with a set interval)
        this._sendChunkToSpeaker();

        // Sets the current post number to the next one (or null if there is no next post):
        // this.currentPostNumber = this.getNextPostNumber(this.currentPostNumber);
    }


    /**
     * Stops text reading (which was initiated by getTextAndSendToSpeaker).
     * Forced TTS stoppage will also trigger the handling of the onSpeakStop() event.
     */
    stopTextAndSendToSpeaker() {
        MAILogger.log("MAIPageAdapter.stopTextAndSendToSpeaker()");

        // Stop the interval sending chunks to TTS
        clearTimeout(this.sendChunkTimeoutId);

        // Stop TTS without notify observers
        this.tts.abort();

        // Reset the module state to standby
        MAILogger.log("MAIPageAdapter.stopTextAndSendToSpeaker() -> resetSettings()");
        this.resetSettings(false);
    }




    /**
     * Retrieves the nth post from the conversation. The method identifies posts based on the HTML structure and CSS classes.
     *
     * @param {number} n - The index of the post to retrieve (1-indexed).
     * @returns {jQuery|null} - A jQuery object representing the nth post, or null if the post does not exist.
     */
    _getNthPost(n) {
        return null;
    }





    /**
     * Returns the number of the first post (not necessarily starting from 1).
     * @returns {number|null} - The number of the first post, or null if no post could be found.
     */
    getFirstPostNumber() {
        return 1;
    }





    /**
     * Initiates the checking for a new post on the page.
     */
    startCheckingNewPost() {
        this.status = MAIPageAdapter.STATUS.CHECKING_NEW_POST;
        MAILogger.log("STATUS_CHECKING_NEW_POST");

        if (this.checkingTimeoutId !== null)
            return;

        this.checkingTimeoutId = setTimeout(() => {
            var postCount = this._getPostCount();
            MAILogger.log("startCheckingNewPost - postCount: " + postCount + " this.allPostCount: " + this.allPostCount);

            this.allPostCount = postCount;
            this.newPost = null; // Set current message to null

            this._checkingNewPost();
        }, 50);
    }




    /**
     * Stops the interval for detecting a new post.
     */
    stopCheckingNewPost(withReset = true) {
        MAILogger.log("MAIPageAdapter.stopCheckingNewPost(withReset), ", withReset);
        if (this.checkingTimeoutId !== null) {
            // Stop the interval in which the method checking for a new post _checkingNewPost() was being called
            clearInterval(this.checkingTimeoutId);
            this.checkingTimeoutId = null;
        }

        // Reset the module state to standby
        if (withReset) {
            MAILogger.log("MAIPageAdapter.stopCheckingNewPost() -> resetSettings()");
            this.resetSettings();
        }
    }



    /**
     * Notifies observers about a new sentence to read.
     * @param {string} sentence - The new sentence to be read.
     */
    notifyNewSentencesObservers(sentence) {
        for (const observer of this.newPostObservers) {
            observer.newSentenceToSay(sentence);
        }
    }



    /**
     * Checks if the nth post is a bot response.
     *
     * @param {number} n - The index of the post to check.
     * @returns {boolean} - Returns true if it is a bot response, false otherwise.
     */
    isPostBotResponse(n) {
        return false;
    }





    /**
     * Continuously checks for a new post in the thread.
     * This method is triggered at intervals initiated by this.startCheckingNewPost(),
     * and the interval can be halted by this.stopCheckingNewPost().
     */
    _checkingNewPost() {
        // Check for new messages by counting the posts
        this.status = MAIPageAdapter.STATUS.CHECKING_NEW_POST;
        var postCount = this._getPostCount();
        MAILogger.log("_checkingNewPost postCount: " + postCount + " this.allPostCount:" + this.allPostCount);

        // If an old thread has just loaded, with multiple posts,
        // and the difference between the last remembered post count "this.allPostCount" and the new current post count "postCount"
        // is greater than 2, it means that this is not a new post to read, but an old post loaded by the page.
        if (postCount > 0 && (postCount - this.allPostCount) > 2) {
            MAILogger.log("_checkingNewPost (NOT NEW POST!)");
            this.allPostCount = postCount;
        }


        // A real difference in these variables now indicates a new post detection
        let isBotResponse = this.isPostBotResponse(postCount);
        if (postCount > this.allPostCount && isBotResponse) {
            // New post in the thread detected
            MAILogger.log("New message detected, post number " + postCount);
            this.allPostCount = postCount;
            this.newPost = this._getNthPost(postCount);
            //MAILogger.log("newPost: " + this.newPost.text());

            this.newPostSentences = [];  // Reset list of parts already spoken
            this.newPostNextSentence = 0;

            // Reset lastChangeTimestamp when a new post is detected
            this.lastChangeTimestamp = null;

            this.notifyNewPostObservers();
        }

        // Split the current post into parts (sentences) if a new post is found
        if (this.newPost && this.newPost.length) {
            MAILogger.log("New message (BOT RESPONSE): " + postCount);
            this.newPost = this._getNthPost(postCount);
            var currentPost = this.newPost;
            var currentHtml = currentPost.html();
            var currentText = currentPost.text() + "";

            // Fetch the entire text of the post, including code blocks
            var currentFullText = currentPost.text() + "";
            var currentFullTextLength = currentFullText.length;


            // Check if the post length has changed
            if (this.lastNotedPostLength !== currentFullTextLength) {
                this.lastNotedPostLength = currentFullTextLength;
                this.lastChangeTimestamp = Date.now();  // Reset the timer
            }


            // Remove code blocks if the setting is enabled
            if (this.settings.ttsIgnoreCodeBlocks) {
                var tempDiv = jQuery("<div>").html(currentHtml);
                tempDiv.find("pre").remove();
                currentHtml = tempDiv.html();
            }

            // Replace </p> and </li> with new line character and remove <p> and <li> tags
            currentHtml = currentHtml.replace(/<\/p>/g, String.fromCharCode(10))
                .replace(/<\/li>/g, String.fromCharCode(10))
                .replace(/<p>/g, '')
                .replace(/<li>/g, '');

            currentText = jQuery('<div>').html(currentHtml).text();

            var newSentences = this.splitIntoChunks(currentText, true);
            if (newSentences !== null && JSON.stringify(newSentences) !== JSON.stringify(this.newPostSentences)) {
                MAILogger.log("newSentences:" + newSentences);

                // There is a new part of a sentence!
                var nextRead = this.newPostNextSentence;

                // Update lastChangeTimestamp
                this.lastChangeTimestamp = Date.now();

                for (let i = nextRead; i < newSentences.length; i++) {
                    this.newPostNextSentence = i + 1;

                    if (newSentences.length >= i - 1 && newSentences[i - 1] !== undefined) {
                        var lastPart = newSentences[i - 1];
                        MAILogger.log("Speak: " + lastPart);

                        this.tts.speak(lastPart);
                    }
                }

                this.newPostSentences = [...newSentences];
            }

            // Check if enough time has passed since the last change
            // If the post length is the same and 3 seconds have passed
            if (this.lastChangeTimestamp && Date.now() - this.lastChangeTimestamp > 3000) {
                // Assume the post is complete
                MAILogger.log("Assume the post is complete");
                this.lastChangeTimestamp = null;

                if (newSentences !== null && newSentences.length > 0 && newSentences[newSentences.length - 1]) {
                    MAILogger.log("Speak last new sentence: " + newSentences[newSentences.length - 1]);
                    this.tts.speak(newSentences[newSentences.length - 1]);
                } else {
                    // If newSentences is an empty array
                    MAILogger.log("newSentences is an empty array - notifySpeakObservers - stop");
                    this.tts.notifySpeakObservers('stop');
                }

                MAILogger.log("END _checkingNewPost");
            }
        }

        // Set the method to be called again after a short delay
        this.checkingTimeoutId = setTimeout(() => {
            this._checkingNewPost();
        }, 100);
    }






    //---------------------------------------------------------------------------
    // TTS Event Handling
    //---------------------------------------------------------------------------

    /**
     * Handler for the notification from MAITextToSpeech class about the start of text reading.
     * @param {string} text - The text that is being read.
     */
    onSpeakStart(text) {
        // Logging the start of speech with the current status
        MAILogger.log("MAIPageAdapter.onSpeakStart, status: ", this.status);
        MAILogger.log("MAIPageAdapter.onSpeakStart.text: ", text);

        // If there's an ongoing interval for text selection, clear it
        if (this.selectTextIntervalId !== null) {
            clearInterval(this.selectTextIntervalId);
            this.selectTextIntervalId = null;
        }

        // Highlighting the text being read on the page using a method 
        // that involves inserting HTML tags and CSS
        // This is done if the status is READING_ALL_POSTS
        if (this.status === MAIPageAdapter.STATUS.READING_ALL_POSTS)
            this.highlightNode(jQuery(".cmai-current-post:last"), text);

        // If in the mode of reading a new post (dynamically generated by chat),
        // a different method of highlighting the read text is chosen (using the browser's API)
        // This is done if the status is CHECKING_NEW_POST
        else if (this.status === MAIPageAdapter.STATUS.CHECKING_NEW_POST) {
            let startPosition = -1, endPosition = -1;

            // Finding the positions of the text within the new post
            if (this.newPost && this.newPost.length > 0) {
                MAILogger.log("MAIPageAdapter.onSpeakStart, this.newPost[0]: ", this.newPost[0]);

                const positions = this.findTextPosition(this.newPost[0], text);
                startPosition = positions.startPosition;
                endPosition = positions.endPosition;

                MAILogger.log("startPosition, endPosition: (" + startPosition + ", " + endPosition + ")");

                // If the text is not found, ignore
                if (startPosition === -1 || endPosition === -1) {
                    return;
                }
            }
            else {
                MAILogger.log("MAIPageAdapter.onSpeakStart -> return; (not (this.newPost && this.newPost.length > 0)");
                return;
            }

            // Highlighting the text at an interval since during the dynamic generation of chat responses,
            // the selection is cleared every now and then - the interval "maintains" this selection by running every 20ms
            this.selectTextIntervalId = setInterval(() => {
                if (this.newPost && this.newPost[0]) {
                    this.selectTextInDomElement(this.newPost[0], startPosition, endPosition);
                } else {
                    clearInterval(this.selectTextIntervalId);
                }
            }, 100);


            // Setting a time limit after which the highlighting done in the interval will be stopped
            const timeLimit = 10000; // 10 seconds in milliseconds
            this.selectTextTimeOutId = setTimeout(() => {
                clearInterval(this.selectTextIntervalId);
                this.selectTextIntervalId = null;

                // Clearing the text selection
                var sel = window.getSelection();
                sel.removeAllRanges();
            }, timeLimit);
        }

        // Notify any observers about the start of speech
        // this.notifySpeakObservers("start", text);
    }



    /**
     * Handler for forced stopping of TTS reading from MAITextToSpeech object.
     * @param {string} text - The text that was being read.
     */
    onSpeakStop(text) {
        // Logging the stopping of speech
        MAILogger.log("MAIPageAdapter.onSpeakStop(text): ", text);

        // If there's an ongoing interval for text selection, clear it
        if (this.selectTextIntervalId !== null) {
            clearInterval(this.selectTextIntervalId);
            this.selectTextIntervalId = null;

            clearTimeout(this.selectTextTimeOutId);
            this.selectTextTimeOutId = null;

            // Clearing any text selection on the page
            var sel = window.getSelection();
            sel.removeAllRanges();
        }

        // Returning to standby mode
        MAILogger.log("MAIPageAdapter.onSpeakStop() -> resetSettings()");
        this.resetSettings();

        // Informing MAIInterface about the stopping of reading
        this.notifySpeakObservers("stop", text);
    }




    /**
     * Handler for the notification from MAITextToSpeech object about the end of text reading.
     * @param {string} text - The text that was being read.
     */
    onSpeakEnd(text) {
        MAILogger.log("MAIPageAdapter.onSpeakEnd(text): ", text);
        // If there's an ongoing interval for text selection, clear it
        if (this.selectTextIntervalId !== null) {
            clearInterval(this.selectTextIntervalId);
            this.selectTextIntervalId = null;

            clearTimeout(this.selectTextTimeOutId);
            this.selectTextTimeOutId = null;

            // Clearing any text selection on the page
            var sel = window.getSelection();
            sel.removeAllRanges();
        }

        // Incrementing the counter for read chunks
        this.currentChunksSpeakCount++;
        MAILogger.log("MAIPageAdapter.onSpeakEnd - status: ", this.status);

        // Removing the highlight from the read text
        this.removeHighlight(jQuery(".cmai-current-post:last"));

        // If in the mode of reading the entire thread
        if (this.status === MAIPageAdapter.STATUS.READING_ALL_POSTS) {
            MAILogger.log("this.status === MAIPageAdapter.STATUS.READING_ALL_POSTS");

            // If all chunks have been read, fetch the next post (if available)
            if (this.currentChunksSpeakCount >= this.textChunks.length) {
                this.currentPostNumber++;
                this.currentChunksSpeakCount = 0;  // Resetting the read chunks counter

                MAILogger.log("MAIPageAdapter.onSpeakEnd: read next post no. " + this.currentPostNumber);

                $(".cmai-current-post").removeClass("cmai-current-post");

                // Fetch and send the next post text (if available) to the speaker for reading
                if (this.currentPostNumber <= this.allPostCount) {
                    MAILogger.log("MAIPageAdapter.onSpeakEnd(): starts reading next post no.: " + this.currentPostNumber);
                    this._getPostAndSendToSpeaker();
                } else {
                    // All posts have been read, end and inform MAIInterface
                    MAILogger.log("MAIPageAdapter.onSpeakEnd() [END STATUS_READING_ALL_POSTS] - whole thread read ");

                    // Returning to standby mode
                    MAILogger.log("MAIPageAdapter.onSpeakEnd(), STATUS.READING_ALL_POSTS, -> resetSettings()");
                    this.resetSettings();

                    // Informing MAIInterface about the end of reading
                    this.notifySpeakObservers("end", text);
                }
            }
        }

        // If in the mode of reading a new post (chat response)
        else if (this.status === MAIPageAdapter.STATUS.CHECKING_NEW_POST) {
            MAILogger.log("onSpeakEnd: this.status === MAIPageAdapter.STATUS.CHECKING_NEW_POST + status: " + this.status);

            // If all chunks have been read, fetch the next post (if available)
            if (this.currentChunksSpeakCount >= this.newPostSentences.length) {

                MAILogger.log("END??? this.currentChunksSpeakCount: ", this.currentChunksSpeakCount);
                MAILogger.log("END??? this.newPostSentences.length: ", this.newPostSentences.length);

                this.currentChunksSpeakCount = 0;  // Resetting the read chunks counter

                $(".cmai-current-post").removeClass("cmai-current-post");

                // All posts have been read, end and inform MAIInterface
                MAILogger.log("MAIPageAdapter.onSpeakEnd: [END CHECKING_NEW_POST] - whole post read ");

                // Returning to standby mode
                MAILogger.log("MAIPageAdapter.onSpeakEnd(), STATUS.CHECKING_NEW_POST, -> resetSettings()");
                this.resetSettings();

                // Informing MAIInterface about the end of reading
                this.notifySpeakObservers("end", text);

            }
        }

        // If finished reading selected text on the page
        else if (this.status === MAIPageAdapter.STATUS.READING_SELECTED_TEXT) {

            // If all chunks have been read, return to standby
            if (this.currentChunksSpeakCount >= this.textChunks.length) {
                this.currentChunksSpeakCount = 0;  // Resetting the read chunks counter

                $(".cmai-selected-text").removeClass("cmai-selected-text");

                // All posts have been read, end and inform MAIInterface
                MAILogger.log("MAIPageAdapter.onSpeakEnd: [END STATUS_READING_SELECTED_TEXT] - all selected text read ");

                // Returning to standby mode
                MAILogger.log("MAIPageAdapter.onSpeakEnd(), STATUS.READING_SELECTED_TEXT, -> resetSettings()");
                this.resetSettings();

                // Informing MAIInterface about the end of reading
                this.notifySpeakObservers("end", text);

            }
        }
    }


}
