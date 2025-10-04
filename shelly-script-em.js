let startIndex = 0;
let powerValues = [];
let voltageValues = [];
let freqValues = [];
let pfValues = [];
let pending = false;
let notifyTimer = Timer.set(1000, true, function() {
  if (pending)
    return;
  pending = true;
  Shelly.call(
    "EM1.GetStatus", { id: 1 },
    function(res, err_code, err_msg, ud) {
      pending = false;
      if (res) {
        if (powerValues.length >= 150) {
          powerValues.splice(0, 1);
          voltageValues.splice(0, 1);
          freqValues.splice(0, 1);
          pfValues.splice(0, 1);
          ++startIndex;
        }
        powerValues.push(res.act_power);
        voltageValues.push(res.voltage);
        freqValues.push(res.freq);
        pfValues.push(res.pf);
      }
    }
  );
});

HTTPServer.registerEndpoint("power", function(req, res) {
  let data = {start_index: startIndex,
              power_values: powerValues,
              voltage_values: voltageValues,
              freq_values: freqValues,
              pf_values: pfValues};
  if (req.query) {
    let alreadyReceived = parseInt(req.query);
    if (alreadyReceived > startIndex &&
        alreadyReceived <= startIndex + powerValues.length) {
      data = {
        start_index: alreadyReceived,
        power_values: powerValues.slice(alreadyReceived - startIndex),
        voltage_values: voltageValues.slice(alreadyReceived - startIndex),
        freq_values: freqValues.slice(alreadyReceived - startIndex),
        pf_values: pfValues.slice(alreadyReceived - startIndex)
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
