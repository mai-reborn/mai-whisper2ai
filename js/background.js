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


// Manual check for updates availability
chrome.runtime.requestUpdateCheck(function(status) {
    if (status == "update_available") {
        console.log("(mai_ | Whisper to ChatGPT and Claude.ai) New update is available!");
    } else if (status == "no_update") {
        console.log("(mai_ | Whisper to ChatGPT and Claude.ai) No updates available.");
    } else if (status == "throttled") {
        console.log("(mai_ | Whisper to ChatGPT and Claude.ai) Too many attempts to check for updates. Try again later.");
    }
});

// Listener that will be triggered when an update is installed
chrome.runtime.onUpdateAvailable.addListener(function(details) {
    console.log("(mai_ | Whisper to ChatGPT and Claude.ai) New version installed: " + details.version);
    chrome.runtime.reload();  // Reload the extension to apply the new update
});
