let startIndex = 0;
let powerValues = [[], [], [], []];  // Array for each of the 4 switches
let voltageValues = [];  // Voltage is typically shared
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

  // Check if we need to remove old data before adding new samples
  // We're adding 5 values per timer: 4 power values + 1 voltage value
  if (!canStoreOneMoreSample(5)) {
    // Remove oldest samples from all arrays
    for (let switchId = 0; switchId < 4; ++switchId) {
      if (powerValues[switchId].length > 0) {
        powerValues[switchId].splice(0, 1);
      }
    }
    if (voltageValues.length > 0) {
      voltageValues.splice(0, 1);
      ++startIndex;
    }
  }

  // Collect data from all 4 switches synchronously
  for (let switchId = 0; switchId < 4; ++switchId) {
    let switchStatus = Shelly.getComponentStatus("switch:" + switchId);
    powerValues[switchId].push(switchStatus.apower);
    if (switchId === 0) {
      // Store voltage only from first switch to avoid duplicates
      voltageValues.push(switchStatus.voltage);
    }
  }

  logMemory("timer: done");
});

HTTPServer.registerEndpoint("power", function(req, res) {
  logMemory("power request");

  let data = {
    start_index: startIndex,
    power_values: powerValues,
    voltage_values: voltageValues
  };

  if (req.query) {
    let alreadyReceived = parseInt(req.query);
    if (alreadyReceived > startIndex &&
        alreadyReceived <= startIndex + powerValues[0].length) {
      let sliceStart = alreadyReceived - startIndex;

      data = {
        start_index: alreadyReceived,
        power_values: [
          powerValues[0].slice(sliceStart),
          powerValues[1].slice(sliceStart),
          powerValues[2].slice(sliceStart),
          powerValues[3].slice(sliceStart)
        ],
        voltage_values: voltageValues.slice(sliceStart)
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
