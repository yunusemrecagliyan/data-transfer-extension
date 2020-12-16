let globalSourceData;
let isPageFullyLoaded = false;

function runFlow(flowIndex) {
  let tryCount = 0;
  chrome.storage.local.get(
    ["flowList", "flowIsDone"],
    ({ flowList, flowIsDone }) => {
      if (flowIsDone) {
        return;
      }
      const flowInterval = setInterval(() => {
        tryCount++;

        if (flowList[flowIndex].type === "click-type") {
          if ($(flowList[flowIndex].actionOn).length) {
            console.log(flowList[flowIndex].type);
            $(flowList[flowIndex].actionOn).trigger("click");
            chrome.runtime.sendMessage({
              content_name: "incrementFlowIndex",
            });
            clearInterval(flowInterval);
          }
        } else if (flowList[flowIndex].type === "data-transfer-type") {
          console.log("transfer");
          chrome.storage.local.get(
            ["sourceSingleData"],
            ({ sourceData: sourceSingleData }) => {
              const dataToTransfer = sourceSingleData.find(
                (dt) => dt.name === flowList[flowIndex].actionOn
              );
              console.log(dataToTransfer);
              chrome.storage.local.get(["mappingList"], ({ mappingList }) => {
                const targetSelector = mappingList.find(
                  (m) => m.name === dataToTransfer.name
                ).targetSiteCss;
                if ($(targetSelector).length) {
                  $(targetSelector).val("");
                  $(targetSelector).sendkeys("{selectall}");
                  $(targetSelector).sendkeys("{del}");
                  $(targetSelector).sendkeys(dataToTransfer.data);
                  chrome.runtime.sendMessage({
                    content_name: "incrementFlowIndex",
                  });
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
                sourceRepeatedData.map((rd, index) => {
                  if (rd.name === rml.name) {
                    aa(rd, flowList[flowIndex].action, index);
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
            $(flowList[flowIndex].actionOn).val("");
            $(flowList[flowIndex].actionOn).sendkeys("{selectall}");
            $(flowList[flowIndex].actionOn).sendkeys("{del}");
            $(flowList[flowIndex].actionOn).sendkeys(
              flowList[flowIndex].action
            );
            chrome.runtime.sendMessage({
              content_name: "incrementFlowIndex",
            });
            clearInterval(flowInterval);
          }
        }
      }, 100);
    }
  );
}

runFlow(0);

function aa(rd, butonName, index) {
  rd.selectors.map((sel, selIndex) => {
    let interval = setInterval(() => {
      let currentSelector = sel.selector.replace("?row?", index);
      if (!currentSelector) {
        return;
      }
      let yy = $(currentSelector);
      console.log(yy);
      if (yy) {
        console.log(yy);

        //document.querySelector(currentSelector).value = "";
        yy.sendkeys("{selectall}");
        yy.sendkeys("{del}");
        yy.sendkeys(sel.value);
        if (rd.selectors.length - 1 === selIndex) {
          console.log(rd.selectors.length - 1, selIndex);
          $(butonName).trigger("click");
        }
        clearInterval(interval);
      }
    }, 1000);
  });
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

$(window).on("focus", function (_) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes["flowIsDone"]) {
      console.log("selam");
    }
  });
});
