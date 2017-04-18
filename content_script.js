
// Listen for messages
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.text === 'Give me the DOM!') {
        // Call the specified callback, passing
        // the web-page's DOM content as argument
        sendResponse(document.all[0].outerHTML);
    }
});
