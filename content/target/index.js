async function sendMappingsAsKeys(targetSelector, dataToTransfer, message) {
  const target = $(targetSelector);
  target.val("");
  //target.sendkeys("{selectall}");
  //target.sendkeys("{del}");
  //target.sendkeys(dataToTransfer.trim());
  target.val(dataToTransfer);
  if (message) {
    chrome.runtime.sendMessage({
      content_name: message,
    });
  }
}

async function flowClickType(clickTarget, message) {
  document.querySelector(clickTarget).click();
  if (message) {
    chrome.runtime.sendMessage({
      content_name: message,
    });
  }
}

function customTimeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runRepeatedAction(repeatedData, actionList, actionIndex) {
  if (Array.isArray(actionList)) {
    for await (const action of actionList) {
      if (action.type === "click-type") {
        const repeatedInterval = [];
        repeatedInterval.push(
          setInterval(async () => {
            if ($(action.actionOn).length) {
              repeatedInterval.map((interval) => clearInterval(interval));
              await flowClickType(action.actionOn);
            }
          }, 25)
        );
      } else if (action.type === "text-type") {
        let textCurrent = action.actionOn.replace("?row?", actionIndex);
        const repeatedInterval = [];
        repeatedInterval.push(
          setInterval(async () => {
            if ($(textCurrent).length) {
              repeatedInterval.map((interval) => clearInterval(interval));
              await sendMappingsAsKeys(textCurrent, action.action);
            }
          }, 25)
        );
      }

      for await (const sel of repeatedData.selectors) {
        await customTimeout(5);

        let currentSelector = await sel.selector
          .replace("?row?", actionIndex)
          .replace("\\\\", "")
          .replace("\\\\", "");
        console.log(await currentSelector);

        await customTimeout(5);
        console.log(await currentSelector);

        await (async () => {
          if (currentSelector !== "") {
            if ($(currentSelector).length) {
              console.log($(currentSelector));
              await sendMappingsAsKeys(currentSelector, sel.value);
            }
          }
        })();
      }
    }
  }
}

async function runFlow(flowIndex) {
  chrome.storage.local.get(
    ["flowList", "flowIsDone"],
    ({ flowList, flowIsDone }) => {
      if (flowIsDone) {
        return;
      }
      const flowInterval = [];
      flowInterval.push(
        setInterval(async () => {
          if (flowList[flowIndex].type === "click-type") {
            if ($(flowList[flowIndex].actionOn).length) {
              flowClickType(flowList[flowIndex].actionOn, "incrementFlowIndex");
              flowInterval.map((interval) => clearInterval(interval));
            }
          } else if (flowList[flowIndex].type === "data-transfer-type") {
            chrome.storage.local.get(
              ["sourceSingleData"],
              ({ sourceSingleData }) => {
                const dataToTransfer = sourceSingleData.filter(
                  (dt) => dt.name.split(".")[0] === flowList[flowIndex].actionOn
                );
                chrome.storage.local.get(
                  ["mappingList"],
                  async ({ mappingList }) => {
                    const mapping = mappingList.find(
                      (m) => m.name === dataToTransfer[0].name.split(".")[0]
                    );
                    if (mapping.hasOwnProperty("targetSelectors")) {
                      for await (const dtt of dataToTransfer) {
                        const targetSelector =
                          mapping.targetSelectors[dtt.name.split(".")[1]];
                        await sendMappingsAsKeys(
                          targetSelector.selector,
                          dtt.data
                        );
                      }
                      chrome.runtime.sendMessage({
                        content_name: "incrementFlowIndex",
                      });
                      flowInterval.map((interval) => clearInterval(interval));
                    } else {
                      if ($(targetSelector).length) {
                        sendMappingsAsKeys(
                          mapping.targetSiteCss,
                          dataToTransfer.data,
                          "incrementFlowIndex"
                        );
                        flowInterval.map((interval) => clearInterval(interval));
                      }
                    }
                  }
                );
              }
            );
          } else if (flowList[flowIndex].type === "repeated-type") {
            chrome.storage.local.get(
              ["sourceRepeatedData", "repeatedMappingList"],
              async ({ sourceRepeatedData, repeatedMappingList }) => {
                flowInterval.map((interval) => clearInterval(interval));
                const a = setInterval(async () => {
                  for await (const rml of repeatedMappingList) {
                    for await (const [
                      index,
                      repeatedData,
                    ] of sourceRepeatedData.entries()) {
                      if (repeatedData.name === rml.name) {
                        if ($(flowList[flowIndex].action[0].actionOn).length) {
                          clearInterval(a);
                          await customTimeout(1000);
                          await runRepeatedAction(
                            repeatedData,
                            flowList[flowIndex].action,
                            index
                          );
                        }
                      }
                    }
                  }
                }, 25);
              }
            );
            chrome.runtime.sendMessage({
              content_name: "incrementFlowIndex",
            });
          } else if (flowList[flowIndex].type === "text-type") {
            if ($(flowList[flowIndex].actionOn).length) {
              flowInterval.map((interval) => clearInterval(interval));
              sendMappingsAsKeys(
                flowList[flowIndex].actionOn,
                flowList[flowIndex].action,
                "incrementFlowIndex"
              );
            }
          }
        }, 150)
      );
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
