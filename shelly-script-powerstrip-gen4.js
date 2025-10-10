let startIndex = 0;
let powerValues = [[], [], [], []];  // Array for each of the 4 switches
let voltageValues = [];  // Voltage is typically shared
let pending = [false, false, false, false];  // Track pending status for each switch

let notifyTimer = Timer.set(1000, true, function() {
  // Collect data from all 4 switches
  for (let switchId = 0; switchId < 4; switchId++) {
    if (pending[switchId])
      continue;

    pending[switchId] = true;

    Shelly.call(
      "Switch.GetStatus", { id: switchId },
      function(res, err_code, err_msg) {
        if (res) {
          let id = res.id;
          pending[id] = false;
          if (powerValues[id].length >= 100) {
            powerValues[id].splice(0, 1);
            if (id === 0) {
              voltageValues.splice(0, 1);
              ++startIndex;
            }
          }

          powerValues[id].push(res.apower);
          if (id === 0) {
            // Store voltage only from first switch to avoid duplicates
            voltageValues.push(res.voltage);
          }
        }
      }
    );
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
