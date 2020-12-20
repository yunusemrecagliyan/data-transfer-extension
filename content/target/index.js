function sendMappingsAsKeys(targetSelector, dataToTransfer, message) {
  const target = $(targetSelector);
  // target.sendkeys("{selectall}");
  // target.sendkeys("{del}");
  // target.sendkeys(dataToTransfer);
  target.val(dataToTransfer);
  console.log(targetSelector);
  if (message) {
    chrome.runtime.sendMessage({
      content_name: message,
    });
  }
}

function flowClickType(clickTarget, message) {
  $(clickTarget).trigger("click");
  if (message) {
    chrome.runtime.sendMessage({
      content_name: message,
    });
  }
}

function runRepeatedAction(repeatedData, actionList, actionIndex) {
  let index = 0;
  let interval = setInterval(() => {
    if (index === actionList.length - 1) {
      clearInterval(interval);
    }
    let action = actionList[index];
    if (action.type === "click-type") {
      flowClickType(action.actionOn);
    } else if (action.type === "text-type") {
      let textCurrent = action.actionOn.replace("?row?", actionIndex);
      sendMappingsAsKeys(textCurrent, action.action);
    }
    index++;
  }, 500);

  repeatedData.selectors.map((sel, selIndex) => {
    let interval = [];
    interval.push(
      setInterval(() => {
        let currentSelector = sel.selector.replace("?row?", actionIndex);
        if (!currentSelector) {
          return;
        }
        let target = $(currentSelector);
        if (target.length) {
          // target.sendkeys("{selectall}");
          // target.sendkeys("{del}");
          // target.sendkeys(sel.value);
          target.val(sel.value);
          console.log("çalıştı");
          clearInterval(interval);
        } else {
          interval.map((i) => clearInterval(i));
          console.log("bitti");
        }
      }, 1000)
    );
  });
}

function runFlow(flowIndex) {
  chrome.storage.local.get(
    ["flowList", "flowIsDone"],
    ({ flowList, flowIsDone }) => {
      if (flowIsDone) {
        return;
      }
      const flowInterval = setInterval(() => {
        console.log(flowList);
        if (flowList[flowIndex].type === "click-type") {
          if ($(flowList[flowIndex].actionOn).length) {
            flowClickType(flowList[flowIndex].actionOn, "incrementFlowIndex");
            clearInterval(flowInterval);
          }
        } else if (flowList[flowIndex].type === "data-transfer-type") {
          chrome.storage.local.get(
            ["sourceSingleData"],
            ({ sourceData: sourceSingleData }) => {
              const dataToTransfer = sourceSingleData.find(
                (dt) => dt.name === flowList[flowIndex].actionOn
              );
              chrome.storage.local.get(["mappingList"], ({ mappingList }) => {
                const targetSelector = mappingList.find(
                  (m) => m.name === dataToTransfer.name
                ).targetSiteCss;
                if ($(targetSelector).length) {
                  sendMappingsAsKeys(
                    targetSelector,
                    dataToTransfer.data,
                    "incrementFlowIndex"
                  );
                  clearInterval(flowInterval);
                }
              });
            }
          );
        } else if (flowList[flowIndex].type === "repeated-type") {
          chrome.storage.local.get(
            ["sourceRepeatedData", "repeatedMappingList"],
            ({ sourceRepeatedData, repeatedMappingList }) => {
              clearInterval(flowInterval);
              repeatedMappingList.map((rml) => {
                sourceRepeatedData.map((repeatedData, index) => {
                  if (repeatedData.name === rml.name) {
                    runRepeatedAction(
                      repeatedData,
                      flowList[flowIndex].action,
                      index
                    );
                  }
                });
              });
            }
          );
          chrome.runtime.sendMessage({
            content_name: "incrementFlowIndex",
          });
        } else if (flowList[flowIndex].type === "text-type") {
          if ($(flowList[flowIndex].actionOn).length) {
            sendMappingsAsKeys(
              flowList[flowIndex].actionOn,
              flowList[flowIndex].action,
              "incrementFlowIndex"
            );
            clearInterval(flowInterval);
          }
        }
      }, 100);
    }
  );
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes["flowList"]) {
    if (changes["flowList"].newValue !== changes["flowList"].oldValue) {
      chrome.storage.local.get(["flowLength"], ({ flowLength }) => {
        runFlow(0);
      });
    }
  } else if (
    areaName === "local" &&
    changes["currentFlowIndex"] &&
    changes["currentFlowIndex"].newValue !==
      changes["currentFlowIndex"].oldValue
  ) {
    chrome.storage.local.get(
      ["currentFlowIndex", "flowLength"],
      ({ currentFlowIndex, flowLength }) => {
        if (currentFlowIndex < flowLength && currentFlowIndex >= 0) {
          runFlow(currentFlowIndex);
        } else {
          chrome.runtime.sendMessage({ content_name: "zeroFlowIndex" });
        }
      }
    );
  }
});

runFlow(0);
