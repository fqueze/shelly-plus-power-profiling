let startIndex = 0;
let powerValues = [[], [], [], []];  // Array for each of the 4 switches
let voltageValues = [];  // Voltage is typically shared
let scriptId = Shelly.getCurrentScriptId();

let notifyTimer = Timer.set(1000, true, function() {
  // Get system and script status synchronously
  let sysStatus = Shelly.getComponentStatus("sys");
  let scriptStatus = Shelly.getComponentStatus("script:" + scriptId);
  console.log("sys", sysStatus.ram_size, sysStatus.ram_free, sysStatus.ram_min_free, scriptStatus.mem_used, scriptStatus.mem_peak, scriptStatus.mem_free);

  // Collect data from all 4 switches synchronously
  for (let switchId = 0; switchId < 4; ++switchId) {
    let switchStatus = Shelly.getComponentStatus("switch:" + switchId);

    if (powerValues[switchId].length >= 100) {
      powerValues[switchId].splice(0, 1);
      if (switchId === 0) {
        voltageValues.splice(0, 1);
        ++startIndex;
      }
    }

    powerValues[switchId].push(switchStatus.apower);
    if (switchId === 0) {
      // Store voltage only from first switch to avoid duplicates
      voltageValues.push(switchStatus.voltage);
    }
  }
});

HTTPServer.registerEndpoint("power", function(req, res) {
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

  res.body = JSON.stringify(data);
  res.headers = [["Access-Control-Allow-Origin", "*"],
                 ["Content-Type", "application/json"]];
  res.send();
});
