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
class MAIClaudeAiAdapter extends MAIPageAdapter {

    /**
    * Creates an instance of MAIClaudeAiAdapter.
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
            const element = jQuery('.max-w-3xl .ProseMirror');

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

        // Find the first element with class "max-w-3xl"
        const threadContainer = $(".max-w-3xl").first();
        // Find all elements with class "contents" under "max-w-3xl"
        const allPosts = threadContainer.find(".contents");
        // Filter out elements that are not direct descendants or have specific parent classes
        const topLevelPosts = allPosts.filter(function () {
            return $(this).parents(".contents").length === 0 && $(this).parents(".text-stone-500.justify-between.items-stretch").length === 0;
        });

        // If the requested post number exists, return it, otherwise return null
        const nthPost = (topLevelPosts.length >= n) ? topLevelPosts.eq(n - 1) : null;

        return nthPost;
    }



    /**
     * Counts the total number of posts in the conversation. Similar to _getNthPost, this method relies on the HTML structure
     * and CSS classes to identify posts.
     *
     * @returns {number} - The total number of posts in the conversation.
     */
    _getPostCount() {
        // Find the first element with class "max-w-3xl"
        const threadContainer = $(".max-w-3xl").first();
        // Find all elements with class "contents" under "max-w-3xl"
        const allPosts = threadContainer.find(".contents");
        // Filter out elements that are not direct descendants or have specific parent classes
        const topLevelPosts = allPosts.filter(function () {
            return $(this).parents(".contents").length === 0 && $(this).parents(".text-stone-500.justify-between.items-stretch").length === 0;
        });

        //MAILogger.log("_getPostCount: ", topLevelPosts.length)

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
        if (nthPost === null || !nthPost) {
            return false;
        }

        // Find the closest ancestor with the class "col-start-2" for the nth post
        const closestColStart2 = nthPost.closest('.col-start-2');

        // Find the preceding sibling of closestColStart2 with class "items-end col-start-1"
        const prevItemsEnd = closestColStart2.prev('.items-end.col-start-1');

        // Check if the preceding sibling exists
        if (prevItemsEnd.length > 0) {
            //MAILogger.log("isPostBotResponse? - YES! ", n);
            return true; // This is a bot response
        }

        //MAILogger.log("isPostBotResponse? - NO ", n);
        return false; // This is a user response
    }



    /**
     * Scrolls the closest scroll container to the element with class "cmai-highlight-text",
     * ensuring that the highlighted text is visible on the screen with a margin.
     */
    scrollToHighlightedText() {
        const MARGIN = 250;  // Top and bottom margin

        // Find the element with class "cmai-highlight-text"
        const highlightedElement = $(".cmai-highlight-text");

        // If the element does not exist, exit the function
        if (!highlightedElement.length) {
            MAILogger.warn('Highlighted element not found.');
            return;
        }

        // Find the closest scroll container
        let closestScrollContainer = highlightedElement.closest('.h-screen');

        // If the closest scroll container does not exist, exit the function
        if (!closestScrollContainer.length) {
            MAILogger.warn('Scroll container not found.');
            return;
        }

        // Find the nested content container
        let contentContainer = highlightedElement.closest('div.auto-rows-max');

        // If the content container does not exist, exit the function
        if (!contentContainer.length) {
            MAILogger.warn('Content container not found.');
            return;
        }

        // Compute the element's position within the content container
        const elementPositionWithinContent = highlightedElement.offset().top - contentContainer.offset().top;

        // Compute the target scroll position by subtracting the margin
        let scrollTo = elementPositionWithinContent - MARGIN;

        // Logging the computed scrollTo value
        MAILogger.log("scrollTo = ", scrollTo);

        // Animate the scrolling of the closest scroll container to the computed target scroll position
        closestScrollContainer.animate({
            scrollTop: scrollTo,
        }, 1000);
    }


    

    /**
     * Injects a transcription text into a specific DOM element, handling placeholders, and setting focus and selection on the injected text.
     * 
     * @param {string} text - The transcription text to be injected.
     */

    injectTranscription(text) {
        // Find the prompt-input element
        const promptInputElement = $('.max-w-3xl .ProseMirror');

        if (text === "" || !promptInputElement.length)
            return;

        MAILogger.log("injectTranscription: " + text);

        // Check for an element with attribute "data-placeholder" within the found element
        const placeholderElement = promptInputElement.find('[data-placeholder]');

        // If exists, remove it
        if (placeholderElement.length) {
            placeholderElement.remove();
        }

        // Paste new text within <p></p> tags
        const newTextElement = $('<p></p>').html(text);

        // Append the new element to the existing content
        promptInputElement.append(newTextElement);

        // Set focus on the "ProseMirror" element
        promptInputElement.focus();

        // Retrieve the native DOM element from the jQuery object
        const nativeElement = promptInputElement.get(0);

        // Create a range and set it at the end of the pasted element
        const range = document.createRange();
        const selection = window.getSelection();

        range.setStart(newTextElement.get(0), 1);
        range.setEnd(newTextElement.get(0), 1);

        // Remove any existing selections
        selection.removeAllRanges();

        // Add the new range to the selection
        selection.addRange(range);

        // Set the selection on the pasted text
        selection.extend(newTextElement.get(0).childNodes[0], 0);

        MAILogger.log("CLAUDE button.click()????");
        if (this.settings.sttAutosendTextPrompt) {
            MAILogger.log("CLAUDE button.click()");
            jQuery("fieldset.z-10 button").click();
        }

    }

}