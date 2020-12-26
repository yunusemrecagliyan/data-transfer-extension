function transferData() {
  const sourceSingleData = [];
  const sourceRepeatedData = [];

  chrome.storage.local.get(
    ["repeatedMappingList", "mappingList", "programmedMappingList"],
    ({ repeatedMappingList, mappingList }) => {
      if (!repeatedMappingList) return;
      repeatedMappingList.map((rml) => {
        let row = 0;
        let cssSelector = "";
        let repeatedFieldIndex = 0;
        let hasFoundRepeatedFields = false;
        let startIndex = 0;
        if (rml.startCondition) {
          while (true) {
            cssSelector = rml.startCss
              .replace("?row?", repeatedFieldIndex + 1)
              .replace("?column?", repeatedFieldIndex + 1);
            repeatedFieldIndex++;
            if ($(cssSelector).html() == rml.startCondition) {
              hasFoundRepeatedFields = true;
              startIndex = repeatedFieldIndex;
              break;
            } else if ($(cssSelector).html() === undefined) {
              break;
            }
          }
        }
        let index = repeatedFieldIndex;

        while (true) {
          var rowData = [];
          let elementIndex = 0;
          for (
            index;
            index < repeatedFieldIndex + rml.targetSelectors.length;
            index++
          ) {
            const currentIndex =
              row * rml.targetSelectors.length +
              (elementIndex + startIndex) +
              1;
            const element = rml.targetSelectors[elementIndex];
            elementIndex++;
            cssSelector = rml.startCss
              .replace("?row?", row + 1)
              .replace("?column?", currentIndex);
            // console.log({
            //   name: element.name,
            //   value: $(cssSelector).text(),
            //   selector: element.selector,
            // });
            rowData.push({
              name: element.name,
              value: $(cssSelector).text(),
              selector: element.selector,
            });
          }
          repeatedFieldIndex = index;

          sourceRepeatedData.push({ name: rml.name, selectors: rowData });
          if (
            $(cssSelector).text() == rml.endCondition ||
            $(cssSelector).html().match(rml.endCondition)
          ) {
            break;
          }
          row++;
        }
      });

      for (let index = 0; index < mappingList.length; index++) {
        const mapping = mappingList[index];
        if (typeof mapping.targetSelectors === "object") {
          let start;
          let end;
          $(mapping.sourceSiteCss).each(function (index) {
            if ($(this).html() === mapping.sourceStartCondition) start = this;
          });
          $(mapping.sourceSiteCss).each(function (index) {
            if ($(this).html() === mapping.sourceEndCondition) end = this;
          });
          const data = $(start).nextUntil($(end));
          let cityAndDistrict = "";
          let address = [];
          data.each(function (index) {
            if (index == 1) {
              const fullname = $(this).text().split(/\s/);
              const surname = fullname.pop();
              mapping.targetSelectors["surname"].value = surname;
              mapping.targetSelectors["name"].value = fullname.join(" ");
            } else if (data.length - 2 === index) {
              $(this).text().trim().replace(/\s/, "") != ""
                ? (mapping.targetSelectors["turkishId"].value = $(this).text())
                : (mapping.targetSelectors["turkishId"].value =
                    mapping.targetSelectors["turkishId"].value);
            } else {
              address.push($(this).text());
              cityAndDistrict += $(this).text();
            }
          });
          // mapping.targetSelectors["neighbourhood"].value = address[0];
          // mapping.targetSelectors["street"].value = address[1].split(" ");

          const splittedAdress = removeUnnecesery(cityAndDistrict).split(" ");
          mapping.targetSelectors["city"].value = splittedAdress.filter(
            (adr, index) => {
              if (iller.indexOf(adr) >= 0) {
                mapping.targetSelectors["district"].value =
                  splittedAdress[index - 1];
                return adr;
              }
            }
          )[0];
          address = address.map((element) => {
            if (typeof element === "string") {
              element = element.replace(/\s+|&nbsp;/gm, " ");
              element = element.trim();
            }
            return element.toLowerCase();
          });
          const districtIndex = address.indexOf(
            mapping.targetSelectors["district"].value.toLowerCase()
          );
          address.splice(districtIndex, address.length - districtIndex - 1);
          address = address.filter((e) => removeUnnecesery(e) !== "");
          mapping.targetSelectors["neighbourhood"].value = address[0];

          const street = address[1];
          let streetMatches;
          const addressRegexMatcher = /(?<neighbourhood>\w.+(?:mah|mahalle|mh))?(?<avenue>\w.+(?:cadde|cad|cd))?(?<street>\w.+(?:sokak|sok|sk))?/gim;
          const apartmentRegexMatcher = /(?<=\s)(no:)?(?<apartmentNumber>\d.+)(\/)(?<doorNumber>\w.?)(?<=\s?)/gim;
          if (typeof street === "string") {
            const streetLikeAddresses = addressRegexMatcher.exec(street);
            const apartmentAdresses = apartmentRegexMatcher.exec(street);

            mapping.targetSelectors["neighbourhood"].value =
              streetLikeAddresses.groups.neighbourhood ??
              mapping.targetSelectors["neighbourhood"].value;
            mapping.targetSelectors["street"].value =
              streetLikeAddresses.groups.street;
            mapping.targetSelectors["apartmentNumber"].value =
              apartmentAdresses.groups.apartmentNumber;
            mapping.targetSelectors["doorNumber"].value =
              apartmentAdresses.groups.doorNumber;
          }
          console.log(mapping);
          for (const data in mapping.targetSelectors) {
            sourceSingleData.push({
              name: mapping.name + "." + data,
              data: mapping.targetSelectors[data].value,
            });
          }
          console.log(sourceSingleData);

          // (?<Mahalle>\w.+(?:mah|mahalle|mh))
          // (?<Cadde>\w.+(?:cadde|cad|cd))
          // (?<Sokak>\w.+(?:sokak|sok|sk))
          // (?<=\s)(no:)?(?<apartmentNumber>\d.+)(\/)(?<doorNumber>\w.?)(?<=\s?)
        } else {
          sourceSingleData.push({
            name: mapping.name,
            data: $(mapping.sourceSiteCss).text(),
          });
        }
      }
      // console.log("sourceSingleData:", sourceSingleData);
      // console.log("sourceRepeatedData:", sourceRepeatedData);
      chrome.runtime.sendMessage({
        content_name: "source",
        sourceSingleData: sourceSingleData,
        sourceRepeatedData: sourceRepeatedData,
      });
    }
  );
}

function removeUnnecesery(addressString) {
  let addressMutation = "";
  if (typeof addressString !== "string") {
    return addressMutation;
  }
  addressMutation = addressString.replace(
    /(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]/gi,
    ""
  );
  addressMutation = addressMutation.replace(
    /([0-2][0-9]|(3)[0-1])[-|\/](((0)[0-9])|((1)[0-2]))[-|\/]\d{4}/gm,
    ""
  );
  addressMutation = addressMutation.trim();
  addressMutation = addressMutation.replace(/\s+|&nbsp;/gm, " ");
  return addressMutation;
}

setTimeout(() => {
  const transferCardSmall = $(`
	<button class="mini-button">
		Veri Transfer Programı
	</button>
	`);
  const transferCard = $(
    `<div class="transfer-card">
		<div class="flex" style="width: 100%; justify-content: flex-end;">
			<button class="minimize-card">
				<svg style="width:1.5rem; height:1.5rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
				</svg>
			</button>
		</div>
		<div class="logo">
			<img class="logo-image" src="chrome-extension://__MSG_@@extension_id__/content/assets/logo.png" alt="">
		</div>
		<div class="flex col">
			<div class="brand">GÜNE<span>Ş</span>AHİN</div>
			<div class="alt-text">TİCARET VE PAZARLAMA</div>
		</div>
		<div class="flex col program">
			<span>VERI</span>
			<span>AKTARIM</span>
			<span>PROGRAMI</span>
		</div>
		<div class="flex col action">
			<a id="button">
				<svg width="370" height="123" viewBox="0 0 370 123" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="59.5" cy="63.5" r="59.5" fill="url(#paint0_linear)" />
					<path fill-rule="evenodd" clip-rule="evenodd"
						d="M38.23 32.23C38.4622 31.9972 38.7381 31.8125 39.0418 31.6865C39.3455 31.5604 39.6711 31.4955 40 31.4955C40.3288 31.4955 40.6544 31.5604 40.9581 31.6865C41.2618 31.8125 41.5377 31.9972 41.77 32.23L71.7699 62.23C72.0028 62.4622 72.1875 62.7381 72.3135 63.0418C72.4395 63.3456 72.5044 63.6712 72.5044 64C72.5044 64.3288 72.4395 64.6545 72.3135 64.9582C72.1875 65.2619 72.0028 65.5378 71.7699 65.77L41.77 95.77C41.3005 96.2394 40.6638 96.5032 40 96.5032C39.3361 96.5032 38.6994 96.2394 38.23 95.77C37.7605 95.3006 37.4968 94.6639 37.4968 94C37.4968 93.3361 37.7605 92.6994 38.23 92.23L66.465 64L38.23 35.77C37.9971 35.5378 37.8124 35.2619 37.6864 34.9582C37.5604 34.6545 37.4955 34.3289 37.4955 34C37.4955 33.6712 37.5604 33.3456 37.6864 33.0418C37.8124 32.7381 37.9971 32.4622 38.23 32.23Z"
						fill="white" />
					<path fill-rule="evenodd" clip-rule="evenodd"
						d="M58.23 32.23C58.4622 31.9972 58.7381 31.8125 59.0418 31.6865C59.3455 31.5604 59.6711 31.4955 60 31.4955C60.3288 31.4955 60.6544 31.5604 60.9581 31.6865C61.2618 31.8125 61.5377 31.9972 61.77 32.23L91.77 62.23C92.0028 62.4622 92.1875 62.7381 92.3135 63.0418C92.4396 63.3456 92.5044 63.6712 92.5044 64C92.5044 64.3288 92.4396 64.6545 92.3135 64.9582C92.1875 65.2619 92.0028 65.5378 91.77 65.77L61.77 95.77C61.3005 96.2394 60.6638 96.5032 60 96.5032C59.3361 96.5032 58.6994 96.2394 58.23 95.77C57.7605 95.3006 57.4968 94.6639 57.4968 94C57.4968 93.3361 57.7605 92.6994 58.23 92.23L86.465 64L58.23 35.77C57.9971 35.5378 57.8124 35.2619 57.6864 34.9582C57.5604 34.6545 57.4955 34.3289 57.4955 34C57.4955 33.6712 57.5604 33.3456 57.6864 33.0418C57.8124 32.7381 57.9971 32.4622 58.23 32.23Z"
						fill="white" />
					<path fill-rule="evenodd" clip-rule="evenodd"
						d="M308.5 0H86.1633C112.031 0 133 27.5345 133 61.5C133 95.4655 112.031 123 86.1633 123H308.5C342.466 123 370 95.4655 370 61.5C370 27.5345 342.466 0 308.5 0Z"
						fill="url(#paint1_linear)" />
					<path
						d="M165.625 43.3125C163.333 43.3125 161.469 42.5625 160.031 41.0625C158.594 39.5521 157.875 37.5365 157.875 35.0156V34.4844C157.875 32.8073 158.193 31.3125 158.828 30C159.474 28.6771 160.37 27.6458 161.516 26.9062C162.672 26.1562 163.922 25.7812 165.266 25.7812C167.464 25.7812 169.172 26.5052 170.391 27.9531C171.609 29.401 172.219 31.474 172.219 34.1719V35.375H160.766C160.807 37.0417 161.292 38.3906 162.219 39.4219C163.156 40.4427 164.344 40.9531 165.781 40.9531C166.802 40.9531 167.667 40.7448 168.375 40.3281C169.083 39.9115 169.703 39.3594 170.234 38.6719L172 40.0469C170.583 42.224 168.458 43.3125 165.625 43.3125ZM165.266 28.1562C164.099 28.1562 163.12 28.5833 162.328 29.4375C161.536 30.2812 161.047 31.4688 160.859 33H169.328V32.7812C169.245 31.3125 168.849 30.1771 168.141 29.375C167.432 28.5625 166.474 28.1562 165.266 28.1562ZM181.594 34.5156H173.969V32.1562H181.594V34.5156ZM185.844 43V28.3281H183.172V26.0938H185.844V24.3594C185.844 22.5469 186.328 21.1458 187.297 20.1562C188.266 19.1667 189.635 18.6719 191.406 18.6719C192.073 18.6719 192.734 18.7604 193.391 18.9375L193.234 21.2812C192.745 21.1875 192.224 21.1406 191.672 21.1406C190.734 21.1406 190.01 21.4167 189.5 21.9688C188.99 22.5104 188.734 23.2917 188.734 24.3125V26.0938H192.344V28.3281H188.734V43H185.844ZM205.984 43C205.818 42.6667 205.682 42.0729 205.578 41.2188C204.234 42.6146 202.63 43.3125 200.766 43.3125C199.099 43.3125 197.729 42.8438 196.656 41.9062C195.594 40.9583 195.062 39.7604 195.062 38.3125C195.062 36.5521 195.729 35.1875 197.062 34.2188C198.406 33.2396 200.292 32.75 202.719 32.75H205.531V31.4219C205.531 30.4115 205.229 29.6094 204.625 29.0156C204.021 28.4115 203.13 28.1094 201.953 28.1094C200.922 28.1094 200.057 28.3698 199.359 28.8906C198.661 29.4115 198.312 30.0417 198.312 30.7812H195.406C195.406 29.9375 195.703 29.125 196.297 28.3438C196.901 27.5521 197.714 26.9271 198.734 26.4688C199.766 26.0104 200.896 25.7812 202.125 25.7812C204.073 25.7812 205.599 26.2708 206.703 27.25C207.807 28.2188 208.38 29.5573 208.422 31.2656V39.0469C208.422 40.599 208.62 41.8333 209.016 42.75V43H205.984ZM201.188 40.7969C202.094 40.7969 202.953 40.5625 203.766 40.0938C204.578 39.625 205.167 39.0156 205.531 38.2656V34.7969H203.266C199.724 34.7969 197.953 35.8333 197.953 37.9062C197.953 38.8125 198.255 39.5208 198.859 40.0312C199.464 40.5417 200.24 40.7969 201.188 40.7969ZM216.875 22V26.0938H220.031V28.3281H216.875V38.8125C216.875 39.4896 217.016 40 217.297 40.3438C217.578 40.6771 218.057 40.8438 218.734 40.8438C219.068 40.8438 219.526 40.7812 220.109 40.6562V43C219.349 43.2083 218.609 43.3125 217.891 43.3125C216.599 43.3125 215.625 42.9219 214.969 42.1406C214.312 41.3594 213.984 40.25 213.984 38.8125V28.3281H210.906V26.0938H213.984V22H216.875ZM233.859 41.3281C232.734 42.651 231.083 43.3125 228.906 43.3125C227.104 43.3125 225.729 42.7917 224.781 41.75C223.844 40.6979 223.37 39.1458 223.359 37.0938V26.0938H226.25V37.0156C226.25 39.5781 227.292 40.8594 229.375 40.8594C231.583 40.8594 233.052 40.0365 233.781 38.3906V26.0938H236.672V43H233.922L233.859 41.3281ZM249.25 28.6875C248.812 28.6146 248.339 28.5781 247.828 28.5781C245.932 28.5781 244.646 29.3854 243.969 31V43H241.078V26.0938H243.891L243.938 28.0469C244.885 26.5365 246.229 25.7812 247.969 25.7812C248.531 25.7812 248.958 25.8542 249.25 26V28.6875ZM261.734 43C261.568 42.6667 261.432 42.0729 261.328 41.2188C259.984 42.6146 258.38 43.3125 256.516 43.3125C254.849 43.3125 253.479 42.8438 252.406 41.9062C251.344 40.9583 250.812 39.7604 250.812 38.3125C250.812 36.5521 251.479 35.1875 252.812 34.2188C254.156 33.2396 256.042 32.75 258.469 32.75H261.281V31.4219C261.281 30.4115 260.979 29.6094 260.375 29.0156C259.771 28.4115 258.88 28.1094 257.703 28.1094C256.672 28.1094 255.807 28.3698 255.109 28.8906C254.411 29.4115 254.062 30.0417 254.062 30.7812H251.156C251.156 29.9375 251.453 29.125 252.047 28.3438C252.651 27.5521 253.464 26.9271 254.484 26.4688C255.516 26.0104 256.646 25.7812 257.875 25.7812C259.823 25.7812 261.349 26.2708 262.453 27.25C263.557 28.2188 264.13 29.5573 264.172 31.2656V39.0469C264.172 40.599 264.37 41.8333 264.766 42.75V43H261.734ZM256.938 40.7969C257.844 40.7969 258.703 40.5625 259.516 40.0938C260.328 39.625 260.917 39.0156 261.281 38.2656V34.7969H259.016C255.474 34.7969 253.703 35.8333 253.703 37.9062C253.703 38.8125 254.005 39.5208 254.609 40.0312C255.214 40.5417 255.99 40.7969 256.938 40.7969ZM273.984 38.7656L277.922 26.0938H281.016L274.219 45.6094C273.167 48.4219 271.495 49.8281 269.203 49.8281L268.656 49.7812L267.578 49.5781V47.2344L268.359 47.2969C269.339 47.2969 270.099 47.099 270.641 46.7031C271.193 46.3073 271.646 45.5833 272 44.5312L272.641 42.8125L266.609 26.0938H269.766L273.984 38.7656ZM293.797 43C293.63 42.6667 293.495 42.0729 293.391 41.2188C292.047 42.6146 290.443 43.3125 288.578 43.3125C286.911 43.3125 285.542 42.8438 284.469 41.9062C283.406 40.9583 282.875 39.7604 282.875 38.3125C282.875 36.5521 283.542 35.1875 284.875 34.2188C286.219 33.2396 288.104 32.75 290.531 32.75H293.344V31.4219C293.344 30.4115 293.042 29.6094 292.438 29.0156C291.833 28.4115 290.943 28.1094 289.766 28.1094C288.734 28.1094 287.87 28.3698 287.172 28.8906C286.474 29.4115 286.125 30.0417 286.125 30.7812H283.219C283.219 29.9375 283.516 29.125 284.109 28.3438C284.714 27.5521 285.526 26.9271 286.547 26.4688C287.578 26.0104 288.708 25.7812 289.938 25.7812C291.885 25.7812 293.411 26.2708 294.516 27.25C295.62 28.2188 296.193 29.5573 296.234 31.2656V39.0469C296.234 40.599 296.432 41.8333 296.828 42.75V43H293.797ZM289 40.7969C289.906 40.7969 290.766 40.5625 291.578 40.0938C292.391 39.625 292.979 39.0156 293.344 38.2656V34.7969H291.078C287.536 34.7969 285.766 35.8333 285.766 37.9062C285.766 38.8125 286.068 39.5208 286.672 40.0312C287.276 40.5417 288.052 40.7969 289 40.7969ZM173.5 91.9688H161.172L158.828 99H151.352L164.055 64.875H170.57L183.344 99H175.867L173.5 91.9688ZM163.07 86.2734H171.602L167.312 73.5L163.07 86.2734ZM197.219 85.3125L193.562 89.25V99H186.531V64.875H193.562V80.3438L196.656 76.1016L205.352 64.875H214L201.883 80.0391L214.352 99H205.984L197.219 85.3125ZM242.688 70.5703H232.234V99H225.203V70.5703H214.891V64.875H242.688V70.5703ZM263.172 91.9688H250.844L248.5 99H241.023L253.727 64.875H260.242L273.016 99H265.539L263.172 91.9688ZM252.742 86.2734H261.273L256.984 73.5L252.742 86.2734ZM288.836 86.5078H283.234V99H276.203V64.875H288.883C292.914 64.875 296.023 65.7734 298.211 67.5703C300.398 69.3672 301.492 71.9062 301.492 75.1875C301.492 77.5156 300.984 79.4609 299.969 81.0234C298.969 82.5703 297.445 83.8047 295.398 84.7266L302.781 98.6719V99H295.234L288.836 86.5078ZM283.234 80.8125H288.906C290.672 80.8125 292.039 80.3672 293.008 79.4766C293.977 78.5703 294.461 77.3281 294.461 75.75C294.461 74.1406 294 72.875 293.078 71.9531C292.172 71.0312 290.773 70.5703 288.883 70.5703H283.234V80.8125Z"
						fill="white" />
					<defs>
						<linearGradient id="paint0_linear" x1="60" y1="123" x2="60" y2="4"
							gradientUnits="userSpaceOnUse">
							<stop stop-color="#69A484" />
							<stop offset="1" stop-color="#658473" />
						</linearGradient>
						<linearGradient id="paint1_linear" x1="228" y1="123" x2="228" y2="-6.36521e-07"
							gradientUnits="userSpaceOnUse">
							<stop stop-color="#6AA685" />
							<stop offset="1" stop-color="#658171" />
						</linearGradient>
					</defs>
				</svg>

			</a>
		</div>
		<div class="small-brand">GÜNEŞAHİN</div>
		<div>Dijital Dönüşüm</div>
	</div>`
  );

  $("body").addClass("position-relative").append(transferCard);
  $("body").append(transferCardSmall);
  transferCardSmall.hide().on("click", () => {
    $(transferCardSmall).hide();
    $(transferCard).show();
  });
  $(".minimize-card").on("click", () => {
    $(transferCard).hide();
    $(transferCardSmall).show();
  });

  $(".logo-image").attr(
    "src",
    chrome.runtime.getURL("content/assets/logo.png")
  );
  $("#button").on("click", transferData);
}, 300);
var iller = [
  "ADANA",
  "ADIYAMAN",
  "AFYONKARAHİSAR",
  "AĞRI",
  "AMASYA",
  "ANKARA",
  "ANTALYA",
  "ARTVİN",
  "AYDIN",
  "BALIKESİR",
  "BİLECİK",
  "BİNGÖL",
  "BİTLİS",
  "BOLU",
  "BURDUR",
  "BURSA",
  "ÇANAKKALE",
  "ÇANKIRI",
  "ÇORUM",
  "DENİZLİ",
  "DİYARBAKIR",
  "EDİRNE",
  "ELAZIĞ",
  "ERZİNCAN",
  "ERZURUM",
  "ESKİŞEHİR",
  "GAZİANTEP",
  "GİRESUN",
  "GÜMÜŞHANE",
  "HAKKARİ",
  "HATAY",
  "ISPARTA",
  "MERSİN",
  "İSTANBUL",
  "İZMİR",
  "KARS",
  "KASTAMONU",
  "KAYSERİ",
  "KIRKLARELİ",
  "KIRŞEHİR",
  "KOCAELİ",
  "KONYA",
  "KÜTAHYA",
  "MALATYA",
  "MANİSA",
  "KAHRAMANMARAŞ",
  "MARDİN",
  "MUĞLA",
  "MUŞ",
  "NEVŞEHİR",
  "NİĞDE",
  "ORDU",
  "RİZE",
  "SAKARYA",
  "SAMSUN",
  "SİİRT",
  "SİNOP",
  "SİVAS",
  "TEKİRDAĞ",
  "TOKAT",
  "TRABZON",
  "TUNCELİ",
  "ŞANLIURFA",
  "UŞAK",
  "VAN",
  "YOZGAT",
  "ZONGULDAK",
  "AKSARAY",
  "BAYBURT",
  "KARAMAN",
  "KIRIKKALE",
  "BATMAN",
  "ŞIRNAK",
  "BARTIN",
  "ARDAHAN",
  "IĞDIR",
  "YALOVA",
  "KARABüK",
  "KİLİS",
  "OSMANİYE",
  "DÜZCE",
];
