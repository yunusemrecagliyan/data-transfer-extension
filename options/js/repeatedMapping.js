let repeatedMappings = [];
let currentElementId;
let targetFieldCount = $("#column-count");
function init() {
  chrome.storage.local.get(
    ["repeatedMappingList"],
    ({ repeatedMappingList }) => {
      console.log(repeatedMappingList);
      if (!repeatedMappingList) return;
      repeatedMappings = repeatedMappingList;
      fillTable();
    }
  );
}

function fillTable() {
  var table = "";

  repeatedMappings.forEach((element, index) => {
    let targetSelectorRow = "";
    element.targetSelectors.forEach((ts, index) => {
      targetSelectorRow += `
      <div class="row" id="target-selector-${index}">
        <div class="col style="display:inline-block; float:none;">
          ${ts.name}
        </div>
        <div class="col style="display:inline-block; float:none;">
          ${ts.selector}
        </div>
      </div>\n
      `;
    });
    table += `<tr>
                <td>${element.name}</td>
                <td>${element.startCss}</td>
                <td><textarea rows="4" class="form-control" readonly>${element.endCondition}</textarea></td>
                <td id="target-selectors-${index}">
                  <div class="row">
                    <div class="col" style="display:inline-block; float:none; font-weight: 500;">
                      İsim
                    </div>
                    <div class="col" style="display:inline-block; float:none; font-weight: 500;">
                      Seçici
                    </div>
                  </div>
                  ${targetSelectorRow}
                </td>
                <td class="align-middle">
                  <button class="btn delete" id="${index}">
                    <svg class="bi" width="24" height="24" fill="currentColor">
                      <use xlink:href="../../lib/svg/bootstrap-icons-1.1.0/bootstrap-icons.svg#trash"/>
                    </svg>
                  </button>
                  <button class="btn edit" dataKey="${index}" data-toggle="modal" data-target="#editModal">
                    <svg class="bi" width="24" height="24" fill="currentColor">
                      <use xlink:href="../../lib/svg/bootstrap-icons-1.1.0/bootstrap-icons.svg#pencil"/>
                    </svg>
                  </button>
                </td>
              </tr>`;
  });
  $(".table-body").html(table);

  $(".delete")
    .on("click", function () {
      const currentElementId = $(this).attr("id");
      repeatedMappings.splice(currentElementId, 1);
      fillTable();
    })
    .on("mouseenter", function () {
      $(this).html(`<div>
                  <svg class="bi" width="24" height="24" fill="currentColor">
                    <use xlink:href="../../lib/svg/bootstrap-icons-1.1.0/bootstrap-icons.svg#trash-fill"/>
                  </svg>
                </div>`);
    })
    .on("mouseleave", function () {
      $(this).html(`<div>
                  <svg class="bi" width="24" height="24" fill="currentColor">
                    <use xlink:href="../../lib/svg/bootstrap-icons-1.1.0/bootstrap-icons.svg#trash"/>
                  </svg>
                </div>`);
    });
  $(".edit")
    .on("click", function () {
      currentElementId = $(this).attr("dataKey");
      openEditModal(currentElementId);
    })
    .on("mouseenter", function () {
      $(this).html(`<div>
                <svg class="bi" width="24" height="24" fill="currentColor">
                  <use xlink:href="../../lib/svg/bootstrap-icons-1.1.0/bootstrap-icons.svg#pencil-fill"/>
                </svg>
              </div>`);
    })
    .on("mouseleave", function () {
      $(this).html(`<div>
                <svg class="bi" width="24" height="24" fill="currentColor">
                  <use xlink:href="../../lib/svg/bootstrap-icons-1.1.0/bootstrap-icons.svg#pencil"/>
                </svg>
              </div>`);
    });
}
function openEditModal(index) {
  $("#edit-name").val(repeatedMappings[index].name);
  $("#edit-row-start-selector").val(repeatedMappings[index].startCss);
  $("#edit-row-start-condition").val(repeatedMappings[index].startCondition);
  $("#edit-row-end-condition").val(repeatedMappings[index].endCondition);
  $("#edit-column-count").val(repeatedMappings[index].targetSelectors.length);
  let editTargetSelectorRow = "";
  repeatedMappings[index].targetSelectors.forEach((ts, index) => {
    console.log(ts);
    editTargetSelectorRow += `
      <div class="row mt-2">
        <div class="col-2">
          ${index}
        </div>
        <input value="${ts.name}" class="col form-control mr-2 edit-target-name" type="text" disabled/>
        <input value="${ts.selector}" class="col form-control mr-2 edit-target-selector" type="text" disabled/>
      </div>\n
      `;
  });
  $("#edit-disabled-target-selectors").append(editTargetSelectorRow);
}
function edit() {
  let targetSelector = [];
  const names = $(".edit-target-name");
  const selector = $(".edit-target-selector");

  names.map((i, val) => {
    console.log(val, i);
    targetSelector.push({
      name: $(val).val(),
      selector: $(selector[i]).val(),
    });
  });

  repeatedMappings.splice(currentElementId, 1, {
    name: $("#edit-name").val(),
    startCss: $("#edit-row-start-selector").val(),
    startCondition: $("#edit-row-start-condition").val(),
    endCondition: $("#edit-row-end-condition").val(),
    targetSelectors: targetSelector,
  });

  console.log(repeatedMappings);
  $("#edit-name").val("");
  $("#edit-row-start-selector").val("");
  $("#edit-row-start-condition").val("");
  $("#edit-row-end-condition").val("");
  $("#edit-column-count").val("");
  appendColumnSelectors("#edit-target-selector-fields", 0);

  names.val("");
  selector.val("");

  fillTable();
}
function add() {
  let targetSelector = [];
  const names = $(".target-name");
  const selector = $(".target-selector");

  names.map((i, val) => {
    console.log(val, i);
    targetSelector.push({
      name: $(val).val(),
      selector: $(selector[i]).val(),
    });
  });

  repeatedMappings.push({
    name: $("#name").val(),
    startCss: $("#row-start-selector").val(),
    startCondition: $("#row-start-condition").val(),
    endCondition: $("#row-end-condition").val(),
    targetSelectors: targetSelector,
  });

  console.log(repeatedMappings);
  $("#name").val("");
  $("#row-start-selector").val("");
  $("#row-start-condition").val("");
  $("#row-end-condition").val("");
  $("#column-count").val("");
  appendColumnSelectors("#add-target-selector-fields", 0);

  names.val("");
  selector.val("");

  fillTable();
}

function appendColumnSelectors(selector, columnCount) {
  let targetSelectorHtml = "";
  for (let colIndex = 0; colIndex < columnCount; colIndex++) {
    targetSelectorHtml += `
    <div class="row mt-2">
      <div class="col-2">
        ${colIndex}
      </div>
      <input class="col form-control mr-2 target-name" type="text"/>
      <input class="col form-control mr-2 target-selector" type="text"/>

    </div>
    \n
    `;
  }
  console.log("im here");
  $(selector).html(targetSelectorHtml);
}

function save() {
  chrome.storage.local.set({ repeatedMappingList: repeatedMappings });
  fillTable();
}

init();
targetFieldCount.on("keyup", function (e) {
  appendColumnSelectors("#add-target-selector-fields", e.target.value);
});

$("#save-button").on("click", () => save());
$("#add").on("click", () => add());
$("#edit").on("click", () => edit());
