let mappings = [];
let currentElementId;

$("#import-input").on("change", (event) => {
  const file = event.target.files[0];
  const fr = new FileReader();
  const importedMapping = [];
  fr.onload = function (e) {
    let lines = e.target.result;
    importedMapping.push(JSON.parse(lines));
  };
  fr.readAsText(file);
  fr.onloadend = function (e) {
    mappings = JSON.parse(e.target.result);
    fillTable();
  };
});

function init() {
  chrome.storage.local.get(["mappingList"], ({ mappingList }) => {
    if (!mappingList) return;
    mappings = mappingList;
    fillTable();
    $("#export-button")
      .attr(
        "href",
        "data:'text/json;charset=utf-8," +
          encodeURIComponent(JSON.stringify(mappings))
      )
      .attr("download", `mapping.json`);
  });
}

function fillTable() {
  var table = "";

  mappings.forEach((element, index) => {
    let slctrs = "";
    if (Array.isArray(element.targetSelectors)) {
      console.log(element.targetSelectors);
      $.each(element.targetSelectors, (key, val) => {
        slctrs += `
      <div class="row">
        <div class="col">${key}</div>
        <div class="col">${val.selector}</div>
      </div>
      `;
      });
    } else {
      console.log(element.targetSelectors);

      slctrs += `<div class="row">
        <div class="col">${element.targetSelectors}</div>
      </div>`;
    }

    table += `<tr>
                <td>${element.name}</td>
                <td>${element.sourceSiteCss}</td>
                <td><textarea class="form-control" rows="4" readonly>${
                  element.sourceStartCondition
                }</textarea></td>
                <td>
                  <textarea class="form-control" rows="4" readonly>${
                    element.sourceEndCondition
                  }</textarea>
                </td>
                <td>
                  <div class="row">
                    <div class="col">İsim</div>
                    <div class="col">Seçici</div>
                  </div>
                  ${slctrs}
                </td>
                <td>${
                  typeof element.targetSelectors === "object"
                    ? "Adres"
                    : "Normal"
                }</td>
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
    console.log(element);
  });

  $(".table-body").html(table);

  $(".delete")
    .on("click", function () {
      const currentElementId = $(this).attr("id");
      mappings.splice(currentElementId, 1);
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
  $("#edit-name").val(mappings[index].name);
  $("#edit-source-css").val(mappings[index].sourceSiteCss);
  $("#edit-target-css").val(mappings[index].targetSiteCss);
}
function edit() {
  mappings.splice(currentElementId, 1, {
    name: $("#edit-name").val(),
    sourceSiteCss: $("#edit-source-css").val(),
    targetSiteCss: $("#edit-target-css").val(),
  });
  $("#edit-name").val("");
  $("#edit-source-css").val("");
  $("#edit-target-css").val("");

  fillTable();
}

const personalInfo = {
  name: { selector: "", value: "" },
  surname: { selector: "", value: "" },
  turkishId: { selector: "", value: "11111111111" },
  street: { selector: "", value: "" },
  apartmentName: { selector: "", value: "" },
  apartmentNumber: { selector: "", value: "" },
  doorNumber: { selector: "", value: "" },
  neighbourhood: { selector: "", value: "" },
  district: { selector: "", value: "" },
  city: { selector: "", value: "" },
  country: { selector: "", value: "TÜRKİYE" },
  postCode: { selector: "", value: "" },
};

$("#field-type").on("change", function () {
  const fieldType = $(this).val();
  if (fieldType === "normal-field") {
    $("#target-selectors").html(`
      <label for="target-css" class="col-form-label">Hedef Site Seçicisi:</label>
      <input class="form-control" id="target-css"></input>
    `);
  } else {
    // TODO: burayı daha genel birşey olması için adres ve isim ayrı ayrı açılmalı
    let targetSelectorsInputs = "";
    $.each(personalInfo, function (key, val, index) {
      targetSelectorsInputs += `
      <div class="row mt-2">
        <label for="${key}" class="col-4">${key}</label>
        <input id="${key}-selector" value="${val.selector}" class="col form-control mr-2" type="text"/>
        <input id="${key}-value" value="${val.value}" class="col form-control mr-2" type="text"/>
      </div>\n
      `;
    });
    $("#target-selectors").html(targetSelectorsInputs);
  }
});

function add() {
  $.each(personalInfo, function (key, val) {
    personalInfo[key].selector = $(`#${key}-selector`).val();
    personalInfo[key].value = $(`#${key}-value`).val();
  });
  mappings.push({
    name: $("#name").val(),
    sourceSiteCss: $("#source-css").val(),
    sourceStartCondition: $("#source-start-condition").val(),
    sourceEndCondition: $("#source-end-condition").val(),
    targetSelectors:
      $("#field-type").val() === "address-field"
        ? personalInfo
        : $("#target-css").val(),
  });

  $("#name").val("");
  $("#source-css").val("");
  $("#source-start-css").val("");
  $("#source-end-condition").val("");
  $("#field-type").val("normal-field");
  $("#target-css").val("");

  console.log(mappings);

  fillTable();
}

function openNewRowModal() {
  console.log("Yeni Satır Modalı Açıldı");
  return;
}

function save() {
  chrome.storage.local.set({ mappingList: mappings });
  fillTable();
}

init();

function customTimeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

$("#save-button").on("click", () => save());
$("#add").on("click", () => add());
$("#edit").on("click", () => edit());
