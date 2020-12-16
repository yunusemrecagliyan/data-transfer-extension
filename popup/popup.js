let sourceSiteData = $("#sourceSite");
let targetSiteData = $("#targetSite");

chrome.storage.local.get(["siteData"], ({ siteData }) => {
  if (siteData) {
    sourceSiteData.val(siteData.sourceSite);
    targetSiteData.val(siteData.targetSite);
  }
});

const saveButton = $("#saveButton").on("click", () => {
  // const targetAsArray = targetSiteData.val().split("/");
  // const targetEdited = targetAsArray[targetAsArray.length - 1];
  // const sourceAsArray = sourceSiteData.val().split("/");
  // const sourceEdited = sourceAsArray[targetAsArray.length - 1];
  console.log("button clicked");
  chrome.runtime.sendMessage({
    siteData: {
      sourceSite: sourceSiteData.val(),
      targetSite: targetSiteData.val(),
    },
    content_name: "popup",
  });
});
