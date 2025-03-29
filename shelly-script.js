let startIndex = 0;
let powerValues = [];
let voltageValues = [];
let pending = false;
let notifyTimer = Timer.set(1000, true, function() {
  if (pending)
    return;
  pending = true;
  Shelly.call(
    "Switch.GetStatus", { id: 0 },
    function(res, err_code, err_msg, ud) {
      pending = false;
      if (res) {
        if (powerValues.length >= 300) {
          powerValues.splice(0, 1);
          voltageValues.splice(0, 1);
          ++startIndex;
        }
        powerValues.push(res.apower);
        voltageValues.push(res.voltage);
      }
    }
  );
});

HTTPServer.registerEndpoint("power", function(req, res) {
  let data = {start_index: startIndex,
              power_values: powerValues,
              voltage_values: voltageValues};
  if (req.query) {
    let alreadyReceived = parseInt(req.query);
    if (alreadyReceived > startIndex &&
        alreadyReceived <= startIndex + powerValues.length) {
      data = {
        start_index: alreadyReceived,
        power_values: powerValues.slice(alreadyReceived - startIndex),
        voltage_values: voltageValues.slice(alreadyReceived - startIndex)
      };
    }
  }
  res.body = JSON.stringify(data);
/* version that removes the old data once it has been received
  if (req.query) {
    let alreadyReceived = parseInt(req.query);
    if (alreadyReceived > startIndex &&
        alreadyReceived <= startIndex + powerValues.length) {
      let toRemove = alreadyReceived - startIndex
      powerValues.splice(0, toRemove);
      voltageValues.splice(0, toRemove);
      startIndex += toRemove;
    }
  }
  res.body = JSON.stringify({start_index: startIndex,
                             power_values: powerValues,
                             voltage_values: voltageValues});
*/
  res.headers = [["Access-Control-Allow-Origin", "*"],
                 ["Content-Type", "application/json"]];
  res.send();
});
