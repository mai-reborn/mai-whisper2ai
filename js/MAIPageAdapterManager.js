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
 * Manages page adapters to handle interactions with different web pages.
 */
class MAIPageAdapterManager {
    /**
     * Creates a new instance of MAIPageAdapterManager.
     * @param {Object} settings - The settings for managing page adapters.
     */
    constructor(settings) {
        this.settings = settings;
        // Reading the current URL
        this.url = window.location.href;  
    }

    /**
     * Gets the appropriate page adapter based on the current URL.
     * @return {Object} An instance of a page adapter, either MAIChatGPTAdapter or MAIClaudeAiAdapter, based on the current URL.
     */
    getPageAdapter() {
        if (this.url.includes("chat.openai.com")) {
            return new MAIChatGPTAdapter(this.settings);
        } 
       else if (this.url.includes("claude.ai/")) {
            return new MAIClaudeAiAdapter(this.settings);
        }
    }
}
