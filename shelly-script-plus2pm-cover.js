let startIndex = 0;
let powerValues = [];
let voltageValues = [];
let positionValues = [];
let scriptId = Shelly.getCurrentScriptId();
let requiredFreeMemory = 3 * 1024; // 3KB.
let minFreeRatio = 0.3;
let valueSize = 28; // 28 bytes of memory used per value we add to an array.

function logMemory(message) {
  if (message)
    console.log(message);
  // Get system and script status synchronously
  let sysStatus = Shelly.getComponentStatus("sys");
  let scriptStatus = Shelly.getComponentStatus("script:" + scriptId);
  console.log("sys", sysStatus.ram_size, sysStatus.ram_free, sysStatus.ram_min_free,
              scriptStatus.mem_used, scriptStatus.mem_peak, scriptStatus.mem_free);
}

function canStoreOneMoreSample(valueCount) {
  let sampleSize = valueCount * valueSize;
  let status = Shelly.getComponentStatus("script:" + scriptId);
  let totalSize = status.mem_used + status.mem_free;
  let available = status.mem_free - sampleSize;
  return available >= requiredFreeMemory && available >= totalSize * minFreeRatio;
}

let notifyTimer = Timer.set(1000, true, function() {
  logMemory("timer");
  // In cover mode the Plus2PM exposes a single power-metered cover:0
  // component. apower/voltage are the combined values for the cover.
  let res = Shelly.getComponentStatus("cover:0");
  if (!canStoreOneMoreSample(3)) {
    powerValues.splice(0, 1);
    voltageValues.splice(0, 1);
    positionValues.splice(0, 1);
    ++startIndex;
  }
  powerValues.push(res.apower);
  voltageValues.push(res.voltage);
  // current_pos is null until the cover has been calibrated.
  positionValues.push(res.current_pos);
  logMemory("timer: done");
});

HTTPServer.registerEndpoint("power", function(req, res) {
  logMemory("power request");

  let data = {start_index: startIndex,
              power_values: powerValues,
              voltage_values: voltageValues,
              position_values: positionValues};
  if (req.query) {
    let alreadyReceived = parseInt(req.query);
    if (alreadyReceived > startIndex &&
        alreadyReceived <= startIndex + powerValues.length) {
      data = {
        start_index: alreadyReceived,
        power_values: powerValues.slice(alreadyReceived - startIndex),
        voltage_values: voltageValues.slice(alreadyReceived - startIndex),
        position_values: positionValues.slice(alreadyReceived - startIndex)
      };
    }
  }
  logMemory("power request: created data object");

  res.body = JSON.stringify(data);
  logMemory("power request: serialized JSON");

  res.headers = [["Access-Control-Allow-Origin", "*"],
                 ["Content-Type", "application/json"]];
  res.send();
  logMemory("power request: sent");
});
