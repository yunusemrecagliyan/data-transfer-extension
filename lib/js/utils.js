function splitAddress(addressString) {}
function removeDates(addressString) {
  let addressMutation = "";
  if (typeof addressString !== "string") {
    return addressMutation;
  }
  addressMutation = addressString.replace(
    /(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]/gi,
    ""
  );
  addressMutation = addressMutation.replace(
    /^((0?[13578]|10|12)(-|\/)(([1-9])|(0[1-9])|([12])([0-9]?)|(3[01]?))(-|\/)((19)([2-9])(\d{1})|(20)([01])(\d{1})|([8901])(\d{1}))|(0?[2469]|11)(-|\/)(([1-9])|(0[1-9])|([12])([0-9]?)|(3[0]?))(-|\/)((19)([2-9])(\d{1})|(20)([01])(\d{1})|([8901])(\d{1})))$/,
    ""
  );
  addressMutation = addressMutation.replace(/ {1,}|&nbsp;/g, " ");
  return addressMutation;
}
