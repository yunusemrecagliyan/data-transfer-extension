let selectedType;
const actionOnCol = $("#action-on-col");
const actionCol = $("#action-col");
const addBtn = $("#add-button");
const saveBtn = $("#save-button");

const listElements = $("#list-elemets");
let flows = [];

Array.prototype.move = function (from, to) {
  this.splice(to, 0, this.splice(from, 1)[0]);
};

function initFlows() {
  chrome.storage.local.get(["flowList"], ({ flowList }) => {
    if (flowList) {
      flows = flowList;
      fillFlows();
    }
  });
}
function fillFlows() {
  let flowRows = [];
  flows.forEach((flow, index) => {
    const flowTypeSelector = [
      { value: "click-type", name: "Tıkla" },
      { value: "data-transfer-type", name: "Veri Aktar" },
      { value: "repeated-type", name: "Tekrarlı İşlem" },
      { value: "text-type", name: "Yazı Yaz" },
    ].map((option) => {
      if (option.value === flow.type) {
        return `<option selected value=${option.value}>
                            ${option.name}
                          </option>`;
      } else {
        return `<option value=${option.value}>
                            ${option.name}
                          </option>`;
      }
    });

    const flowRow = `
   <div class="container card mt-4">
      <div class="row">
          <div class="col-1">
              <div class="d-flex flex-column py-4 justify-content-between align-items-center h-100 move-buttons">
                  <button class="btn btn-dark p-2 btn-up" data-index="${index}">
                    <svg class="bi" width="32" height="32" fill="currentColor">
                       <use xlink:href="../lib/svg/bootstrap-icons-1.1.0/bootstrap-icons.svg#arrow-up" />
                   </svg>
                  </button>
                  <span>${index}</span>
                  <button class="btn btn-dark p-2 btn-down" data-index="${index}">
                      <svg class="bi" width="32" height="32" fill="currentColor">
                          <use xlink:href="../lib/svg/bootstrap-icons-1.1.0/bootstrap-icons.svg#arrow-down" />
                      </svg>
                  </button>
              </div>
          </div>
          <div class="col-10 card-body">
              <div class="row align-items-center">
                  <div class="col form-group type-col">
                      <label for="flow-type">Akış Tipi</label>
                      <select class="custom-select flow-type">
                      <option>Tip Seçin</option>
                      ${flowTypeSelector}
                      </select>
                  </div>
              </div>
              <div>
                  <div class="row">
                      <div class="col form-group action-on-col">
                          <label for="action">Alan Seçici</label>
                          <input value="${flow.actionOn}" type="text" class="form-control action-on" disabled>
                      </div>
                      <div class="col form-group action-col">
                          <label for="action">İşlem</label>
                          <input value="${flow.action}" type="text" class="form-control action" disabled>
                      </div>
                  </div>
              </div>
          </div>

          <div class="d-flex flex-column justify-content-around align-items-center">

           <button class="btn btn-danger p-2 mx-auto delete" data-index="${index}">
                    <svg class="bi" width="24" height="24" fill="currentColor">
                      <use xlink:href="../../lib/svg/bootstrap-icons-1.1.0/bootstrap-icons.svg#trash"/>
                    </svg>
            </button>
              <button class="btn btn-secondary p-2 mx-auto edit" data-index="${index}">
                    <svg class="bi" width="24" height="24" fill="currentColor">
                      <use xlink:href="../../lib/svg/bootstrap-icons-1.1.0/bootstrap-icons.svg#pencil"/>
                    </svg>
            </button>
          </div>
      </div>
  </div>
  `;

    flowRows.push(flowRow);
  });
  $("#list-elements").html(flowRows.join("\n"));
  $(".btn-up").on("click", function () {
    const index = $(this).attr("data-index");
    flows.move(index, index - 1);
    fillFlows();
  });
  $(".btn-down").on("click", function () {
    const index = $(this).attr("data-index");
    flows.move(index, index + 1);
    fillFlows();
  });
  $(".delete").on("click", function () {
    const index = $(this).attr("data-index");
    flows.splice(index, 1);
    fillFlows();
  });
  $(".edit").on("click", function () {
    const index = $(this).attr("data-index");
    // TODO EDİT FUNCTIONALITY
    fillFlows();
  });
}

$("#flow-type").on("change", function () {
  selectedType = $(this).val();
  switch (selectedType) {
    case "click-type":
      actionOnCol.html(
        `
        <label for="action-on">Alan Seçici</label>
        <input type="text" class="form-control" id="action-on">
        `
      );
      break;
    case "data-transfer-type":
      chrome.storage.local.get(["mappingList"], ({ mappingList }) => {
        let mappingsHtml;
        mappingList.forEach((mapping) => {
          mappingsHtml += `<option value="${mapping.name}">${mapping.name}</option>\n`;
        });
        actionOnCol.html(`
          <label for="action-on">Eşleştirme Türü</label>
          <select class="custom-select" id="action-on">
            <option selected>Eşleştirme Seçin</option>
            ${mappingsHtml}
          </select>
          `);
      });
      actionCol.html(
        `
        <label for="action-on">İşlem</label>
        <input type="text" class="form-control" id="action" disabled>
        `
      );
      break;
    case "text-type":
      actionOnCol.html(
        `
        <label for="action-on">Alan Hedefi</label>
        <input type="text" class="form-control" id="action-on">
        `
      );
      actionCol.html(
        `
        <label for="action">İşlem</label>
        <input type="text" class="form-control" id="action">
        `
      );
      break;
    case "repeated-type":
      chrome.storage.local.get(
        ["repeatedMappingList"],
        ({ repeatedMappingList }) => {
          let mappingsHtml;
          repeatedMappingList.forEach((rml) => {
            mappingsHtml += `<option value="${rml.name}">${rml.name}</option>\n`;
          });
          actionOnCol.html(`
          <label for="action-on">Eşleştirme Türü</label>
          <select class="custom-select" id="action-on">
            <option selected>Eşleştirme Seçin</option>
            ${mappingsHtml}
          </select>
          `);
        }
      );
      actionCol.html(`
        <label for="action-on">Tıklama Hedefi</label>
        <input type="text" class="form-control" id="action">
      `);
      break;
    default:
      break;
  }
});

addBtn.on("click", add);
function add() {
  const flowRow = {
    type: selectedType,
    actionOn: $(actionOnCol.children()[1]).val(),
    action: $(actionCol.children()[1]).val(),
  };
  flows.push(flowRow);
  fillFlows();
}
saveBtn.on("click", save);
function save() {
  chrome.storage.local.set({ flowList: flows });
  chrome.storage.local.set({ flowLength: flows.length });
}
initFlows();
