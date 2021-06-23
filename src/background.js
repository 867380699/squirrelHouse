import db from './js/db.js';

function saveBookmark() {
  return new Promise((resolve, reject)=>{
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      console.log('api-save', tabs);
      const tab = tabs[0];
      db.saveBookmark(tab.title, tab.url).then((result)=>{
        console.log(result);
        resolve(result);
      });
    });
  });
}

function openBookmark(url) {
  chrome.tabs.create({
    url
  }, function(tab) {
    db.removeBookmarkByUrl(url);
    console.log('open bookmark: ', tab);
  })
}


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('bg-msgReceived', message);
  switch(message.type) {
    case 'saveBookmark':
      saveBookmark().then((bookmark)=>{
        console.log('bg-sendMsg:', bookmark);
        sendResponse({data: bookmark});
      });
      break;
    case 'openBookmark':
      if (message.data) {
        openBookmark(message.data);
      }
      break;
    default:
      break;
  }
  return true;
});