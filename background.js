let isScriptInjected = 0;
let sourceTabId = 0;
let currentFlow = 0;
let flowDone = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.content_name === "source") {
    flowDone = false;
    currentFlow = 0;
    chrome.storage.local.set({ sourceSingleData: message.sourceSingleData });
    chrome.storage.local.set({
      sourceRepeatedData: message.sourceRepeatedData,
    });
    chrome.storage.local.set({ currentFlowIndex: currentFlow });
    chrome.storage.local.set({ flowIsDone: flowDone });
    injectScriptsToTargetSite();
  } else if (message.content_name === "popup") {
    chrome.storage.local.set({ siteData: message.siteData });
    tryToInject();
  } else if (message.content_name === "incrementFlowIndex") {
    if (flowDone) {
      currentFlow = 0;
      return;
    }
    currentFlow++;
    chrome.storage.local.set({ currentFlowIndex: currentFlow });
  } else if (message.content_name === "zeroFlowIndex") {
    currentFlow = 0;
    flowDone = true;
    chrome.storage.local.set({ currentFlowIndex: currentFlow });
    chrome.storage.local.set({ flowIsDone: flowDone });
  }
});

chrome.tabs.onRemoved.addListener((tabid) => {
  if (tabid == sourceTabId) {
    sourceTabId = 0;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  var scripts = ["lib/js/jquery-3.5.1.min.js", "content/source/index.js"];

  chrome.storage.local.get(["siteData"], ({ siteData }) => {
    if (sourceTabId == 0 || sourceTabId == tabId) {
      if (changeInfo.status === "complete" && isScriptInjected !== 0) {
        tryToInject(scripts);
        isScriptInjected = 0;
      } else if (changeInfo.status === "loading") {
        isScriptInjected += 1;
      }
    }
  });
});

function injectScriptsToTargetSite() {
  chrome.storage.local.get(["siteData"], ({ siteData }) => {
    chrome.tabs.query({ url: `${siteData.targetSite}/*` }, (tabs) => {
      var updateProperties = { active: true };
      var scripts = [
        "lib/js/jquery-3.5.1.min.js",
        "lib/js/bililiteRange.js",
        "lib/js/jquery.sendkeys.js",
        "content/target/index.js",
      ];
      createOrUpdateTab(tabs, updateProperties, scripts, siteData);
    });
  });
}

function createOrUpdateTab(tabs, updateProperties, scripts, siteData) {
  tabs[0]?.id
    ? chrome.tabs.update(tabs[0].id, updateProperties, (tab) => {
        concatenateInjections(tab.id, scripts);
      })
    : chrome.tabs.create(
        {
          // TODO: 'https' i 'http' kabul edecek şekilde düzenle.
          url: `${siteData.targetSite}`,
          active: true,
        },
        (tab) => {
          concatenateInjections(tab.id, scripts);
        }
      );
}

function tryToInject() {
  var scripts = ["lib/js/jquery-3.5.1.min.js", "content/source/index.js"];
  chrome.storage.local.get(["siteData"], ({ siteData }) => {
    if (siteData) {
      chrome.tabs.query({ url: `${siteData.sourceSite}/*` }, (tabs) => {
        sourceTabId = tabs[0]?.id;
        concatenateInjections(tabs[0].id, scripts);
        chrome.tabs.insertCSS({ file: "content/css/sourceSite.css" });
      });
    }
  });
}

function concatenateInjections(id, ar, scrpt) {
  var i = ar.length;
  var idx = 0;

  function inject(idx) {
    idx++;
    if (idx <= i) {
      var f = ar[idx - 1];
      chrome.tabs.executeScript(id, { file: f }, function () {
        inject(idx);
      });
    } else {
      if (typeof scrpt === "undefined") return;
      chrome.tabs.executeScript(id, { file: scrpt });
    }
  }
  inject(idx);
}
