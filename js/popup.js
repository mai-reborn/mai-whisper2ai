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


document.addEventListener('DOMContentLoaded', function () {
    const langCode = navigator.language.includes('-') ?
        navigator.language.split('-')[0] :
        navigator.language;

    // Path to the language HTML files
    var filePath = `/html/info_${langCode}.html`;

    fetch(filePath)
        .then(response => {
            if (!response.ok) {
                // If the file does not exist, use the default language (en)
                throw new Error('File not found, falling back to default language');
            }
            return response;
        })
        .catch(error => {
            console.error('Error:', error);
            // In case of error, we load the English version
            return fetch('/html/info_en.html');
        })
        .then(response => response.text())
        .then(data => {
            document.getElementById('imai-popup-container').innerHTML = data;
        })
        .catch(error => {
            console.error('Error while loading default language:', error);
        });
});
