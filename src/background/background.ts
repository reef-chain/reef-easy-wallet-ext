chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason !== "install" && details.reason !== "update") return;
  console.log("Background: install/update", details);
});

chrome.runtime.onStartup.addListener(() => {
  console.log("Background: startup");
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Background: onMessage", msg, sender);
  sendResponse("From the background Script");
});

chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  console.log("Background: onMessageExternal", msg, sender);
  sendResponse("From the background Script");
});
