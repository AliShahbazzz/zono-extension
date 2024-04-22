// chrome.action.onClicked.addListener((tab) => {
//   chrome.scripting.executeScript({
//     target: { tabId: tab.id },
//     files: ["content.js"],
//   });
// });

// chrome.runtime.onMessageExternal.addListener(
//   (request, sender, sendResponse) => {
//     console.log("Received message from " + sender + ": ", request);
//     sendResponse({ received: true }); //respond however you like
//   }
// );
