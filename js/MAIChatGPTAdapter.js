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
 * Adapter for the ChatGPT page.
 * @extends MAIPageAdapter
 */
class MAIChatGPTAdapter extends MAIPageAdapter {

    /**
    * Creates an instance of MAIChatGPTAdapter.
    * @param {Object} settings - Configuration settings for the adapter.
    */
    constructor(settings) {
        super(settings);
        //this.initialize();
    }


    /**
     * Initializes the page adapter by setting up an interval to check for the existence of a specific DOM element
     * Once the element is found, it notifies the initialization observers and clears the interval.
     */
    initialize() {
        // Set up an interval to check for the DOM element every 100 milliseconds
        this.intervalId = setInterval(() => {
            // Check if the element with id="prompt-textarea" exists in the DOM
            const element = jQuery('.ProseMirror [contenteditable="false"]');

            if (element !== null) {
                // If the element exists, notify the initialization observers and clear the interval
                this.notifyInitObservers();
                clearInterval(this.intervalId);
            }
        }, 100);  // Interval is set to 100 milliseconds
    }



    /**
     * Retrieves the selected text (without HTML tags).
     * This method is defined in the base class MAIPageAdapter.
     * @returns {*} - The selected text.
     */
    _getSelectedText() {
        return super.getSelectedText();
    }


    /**
     * Retrieves the nth post from the conversation. The method identifies posts based on the HTML structure and CSS classes.
     *
     * @param {number} n - The index of the post to retrieve (1-indexed).
     * @returns {jQuery|null} - A jQuery object representing the nth post, or null if the post does not exist.
     */
    _getNthPost(n) {
        if (n <= 0)
            return null;

        const nthPost = $('div[role="presentation"] .items-start.gap-3').eq(n - 1);
        if (nthPost.length === 0) {
            return null;
        }
        return nthPost;
    }



    /**
     * Counts the total number of posts in the conversation. Similar to _getNthPost, this method relies on the HTML structure
     * and CSS classes to identify posts.
     *
     * @returns {number} - The total number of posts in the conversation.
     */
    _getPostCount() {
        const allPosts = jQuery('div[role="presentation"] .items-start.gap-3');

        const topLevelPosts = allPosts.filter(function () {
            // Check if the element is on the first level (doesn't have a parent with class 'items-start')
            return jQuery(this).parents('.items-start').length === 0;
        });

        // Return the number of first-level posts
        return (topLevelPosts.length === 0) ? 0 : topLevelPosts.length;
    }



    /**
     * Checks if the nth post is a bot response.
     *
     * @param {number} n - The index of the post to check.
     * @returns {boolean} - Returns true if it is a bot response, false otherwise.
     */
    isPostBotResponse(n) {
        // Get the nth post using the helper method _getNthPost
        const nthPost = this._getNthPost(n);

        // Return false if the nth post is not found
        if (!nthPost) {
            return false;
        }

        //Bot replies have class .markdown
        if (nthPost.find('.markdown').length === 0) {
            //MAILogger.log("isPostBotResponse? - NO ", n);
            return false;
        }

        //MAILogger.log("isPostBotResponse? - YES! ", n);
        return true;
    }



    /**
     * Scrolls the view to the highlighted text within the conversation.
     * This method calculates the total height of all posts from the beginning of the conversation
     * up to the post containing the highlighted text, and then scrolls to the position
     * of the highlighted text within that post.
     */
    scrollToHighlightedText() {
        // Retrieve all conversation turns as an array of elements
        const conversationTurns = Array.from(document.querySelectorAll('div[data-testid^="conversation-turn-"]'));
        let totalHeight = 0;  // The cumulative height of posts from the first post to the post with the highlighted text
        let found = false;  // A flag to indicate whether the post with the highlighted text has been found
        let selPostHeight = 0;  // The height of the post containing the highlighted text

        // Iterate through each conversation turn to calculate the total height up to the post with the highlighted text
        for (let i = 0; i < conversationTurns.length; i++) {
            const turn = conversationTurns[i];
            // Accumulate the height of each post until the post with the highlighted text is found
            if (!found) {
                totalHeight += turn.offsetHeight;
            }
            // If the current post contains the highlighted text, set the flag to true and store the height of this post
            if (turn.querySelector('.cmai-highlight-text')) {
                found = true;
                selPostHeight = turn.offsetHeight;
                const testId = turn.getAttribute("data-testid");
                MAILogger.log("Current post with sel element: ", testId);
                MAILogger.log("Current post with sel element height: ", turn.offsetHeight);
                break;
            }
        }

        const highlightEl = document.querySelector('.cmai-highlight-text');  // The highlighted text element
        // Find the closest scroll container to the highlighted text element
        let closestScrollContainer = highlightEl.closest('[class^="react-scroll-to-bottom"]');
        const positionTop = $('.cmai-highlight-text').position().top;  // The position of the highlighted text within its post

        // Calculate the scroll position to bring the highlighted text into view
        // Adjusting by 100 pixels to account for any fixed headers or other UI elements
        let scrollTo = totalHeight - selPostHeight + positionTop - 100;

        MAILogger.log("Scrolling to: ", scrollTo);
        // Animate the scroll to the calculated position over 1 second
        $(closestScrollContainer).animate({
            scrollTop: scrollTo,
        }, 1000);
    }




    /**
     * Methods injectTranscription() and _setTextareaValue() 
     * are used to place text (transcription) in the ChatGPT prompt field,
     * The code of these two methods is inspired by the project 
     * https://github.com/C-Nedelcu/talk-to-chatgpt by C-Nedelcu,
     * licensed under the GNU Affero General Public License v3.0.
     */

    /**
     * Injects the transcription text into the chat prompt field.
     * @param {string} text - The transcription text to be injected.
     */
    injectTranscription(text) {
        if (text === "")
            return;

        // Focus on the textarea
        jQuery("#prompt-textarea").focus();
        const existingText = jQuery("#prompt-textarea").val();

        // Check if there's already existing text
        this.startPosition = existingText ? existingText.length + 1 : 0; // Starting index of the selection
        if (!existingText) this._setTextareaValue(text);
        else this._setTextareaValue(existingText + " " + text);

        // Adjust the height as needed
        const fullText = existingText + " " + text;
        const rows = Math.ceil(fullText.length / 88);
        const height = rows * 24;
        jQuery("#prompt-textarea").css("height", height + "px");

        // Enable the send button
        jQuery("#prompt-textarea").closest("div").find("button").prop("disabled", false);
        // Auto-send the message if autosend is enabled
        if (this.settings.sttAutosendTextPrompt) {
            jQuery("#prompt-textarea").closest("div").find("button").click();
        }
    }

    /**
     * Sets the value of the textarea to the specified text.
     * @param {string} text - The text to set as the value of the textarea.
     */
    _setTextareaValue(text) {
        const textarea = jQuery("#prompt-textarea")[0];

        /**
         * Sets the native value of the specified element to the specified value.
         * @param {HTMLElement} element - The element whose value is to be set.
         * @param {string} value - The value to set.
         */
        const setNativeValue = (element, value) => {
            let valueSetter = null;

            // Search for the 'set' method in the prototype chain
            let obj = element;
            while (!valueSetter && obj) {
                const descriptor = Object.getOwnPropertyDescriptor(obj, 'value');
                if (descriptor && descriptor.set) {
                    valueSetter = descriptor.set;
                }
                obj = Object.getPrototypeOf(obj);
            }

            // If the 'set' method is found, set the value
            if (valueSetter) {
                valueSetter.call(element, value);
            } else {
                MAILogger.error('The "set" method for the "value" property of the specified element was not found.');
            }
        }

        setNativeValue(textarea, text);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));

        // Highlight the newly added text in the prompt field
        const endPosition = this.startPosition + text.length; // Ending index of the selection
        textarea.setSelectionRange(this.startPosition, endPosition);
    }

}