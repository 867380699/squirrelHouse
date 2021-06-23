import db from './js/db.js';
import utils from './js/utils.js';

const bookmarkListContainerEl = document.getElementById('bookmark-list-container');
let iconMap = {};

const bookmarkClickCallback = function (event) {
  chrome.runtime.sendMessage(chrome.runtime.id, {type: 'openBookmark', data: event.currentTarget.dataset.url})
};

function createBookmarkElement(bookmark) {
  const itemEl = document.createElement('div');
  itemEl.classList.add('bookmark-item')
  itemEl.dataset.url = bookmark.url;

  const iconEl = document.createElement('img');
  iconEl.classList.add('favicon');
  iconEl.src = new URL(bookmark.url).origin + '/favicon.ico';
  const iconSrc = iconMap[new URL(bookmark.url).hostname];
  if (iconSrc) {
    iconEl.style.backgroundImage = `url(${iconSrc})`;
  }
  iconEl.onload = () => {
    iconEl.style.backgroundImage = null;
  }

  const titleEl = document.createElement('span');
  titleEl.classList.add('title');
  titleEl.textContent = bookmark.title;

  itemEl.appendChild(iconEl);
  itemEl.appendChild(titleEl);
  itemEl.addEventListener('click', bookmarkClickCallback);
  return itemEl;
}

function filterBookmark(bookmark, filter) {
  if (!filter) return true;
  return bookmark.title.toLowerCase().indexOf(filter) !== -1;
}

function initBookmarkList(bookmarkList, filter) {
  let fragment = document.createDocumentFragment();

  bookmarkList.forEach((bookmark) => {
    if (filterBookmark(bookmark, filter)) {
      fragment.appendChild(createBookmarkElement(bookmark));
    }
  })

  if (bookmarkListContainerEl.firstChild) {
    bookmarkListContainerEl.firstChild.remove();
  }
  const bookmarkListEl = document.createElement('div');
  bookmarkListEl.classList = ['bookmark-list'];
  bookmarkListEl.appendChild(fragment);
  bookmarkListContainerEl.appendChild(bookmarkListEl);
}

db.loadAllBookmark().then((bookmarks) => {
  initBookmarkList(bookmarks);
  db.loadAllIcons(bookmarks).then((result) => {
    // console.log('pop-loadAllIcon:', result);
    iconMap = result;
    initBookmarkList(bookmarks);
  });
  document.querySelector('#search-input').addEventListener('input', utils.debounce(function (event) {
    db.loadAllBookmark().then((bookmarks) => {
      initBookmarkList(bookmarks, event.srcElement.value);
    });
  }, 50));
})

document.getElementById('btn-add').addEventListener('click', (event)=>{
  chrome.runtime.sendMessage(chrome.runtime.id, {type: 'saveBookmark'}, {}, function(resp) {
    // console.log('pop-msg-callback:', resp);
    if (resp && resp.data) {
      switch (resp.data.type) {
        case 'create':
          bookmarkListContainerEl.firstChild.prepend(createBookmarkElement(resp.data.data));
          break;
        case 'update':
          const bookmarkListEl = bookmarkListContainerEl.firstChild;
          bookmarkListEl.insertBefore(bookmarkListEl.querySelector(`[data-url="${resp.data.data.url}"]`) , bookmarkListEl.firstChild);
          break;
      }
    }
  });
})

document.getElementById('btn-add-close').addEventListener('click', () => {
  chrome.runtime.sendMessage(chrome.runtime.id, {type: 'saveBookmark'}, {}, function(resp) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.remove(tabs[0].id);
    })
  })
});