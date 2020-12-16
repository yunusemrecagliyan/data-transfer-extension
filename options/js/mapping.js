let mappings = [];
let currentElementId;

function init() {
  chrome.storage.local.get(["mappingList"], ({ mappingList }) => {
    if (!mappingList) return;
    mappings = mappingList;
    fillTable();
  });
}

function fillTable() {
  const tableData = [];

  var table = "";

  mappings.forEach((element, index) => {
    table += `<tr>
                <td>${element.name}</td>
                <td >${element.sourceSiteCss}</td>
                <td >${element.targetSiteCss}</td>
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
function add() {
  mappings.push({
    name: $("#name").val(),
    sourceSiteCss: $("#source-css").val(),
    targetSiteCss: $("#target-css").val(),
  });

  $("#name").val("");
  $("#source-css").val("");
  $("#target-css").val("");

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

$("#save-button").on("click", () => save());
$("#add").on("click", () => add());
$("#edit").on("click", () => edit());
