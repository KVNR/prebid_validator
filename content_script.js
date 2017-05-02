// Returns pbjs object
function injectScript(file, node)
{
    var th = document.getElementsByTagName(node)[0];
    var s = document.createElement('script');
    s.setAttribute('type', 'text/javascript');
    s.setAttribute('src', file);
    th.appendChild(s);
}

injectScript(chrome.extension.getURL('/check_pbjs.js'), 'body');


// Listen for messages
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse)
{
    if (message.text === 'Give me the DOM!')
    {
        // Call the specified callback, passing
        // the web-page's DOM content as argument
        sendResponse(document.all[0].outerHTML);
    }
});
