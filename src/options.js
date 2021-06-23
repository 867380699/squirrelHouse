import {downloadObjectAsJson} from '@/js/utils.js';
import db from './js/db.js';

function exportJson() {
    db.loadAllBookmark().then(bookmarks => {
        downloadObjectAsJson(bookmarks.map(({title, url, timestamp}) => ({
            title,
            url,
            timestamp
        })), 'export');
    })
}

function importJson(file) {
    const fileReader = new FileReader();
    fileReader.onload = function ($event) {
        try {
            const data = JSON.parse($event.target.result);
            data.map(({title, url, timestamp}) => db.saveBookmark(title, url, timestamp))
        } catch (e) {
            console.log(e);
        }
    };
    fileReader.readAsText(file);
}

const fileInput = document.getElementById('file-input');

fileInput.addEventListener('change', () => importJson(fileInput.files[0]));

document.getElementById('btn-import').addEventListener('click', () => fileInput.click());
document.getElementById('btn-export').addEventListener('click', exportJson);