// Content script for HTML Scraper Tool
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getHTML') {
    const html = document.documentElement.outerHTML;
    sendResponse({ html: html });
  }
});
