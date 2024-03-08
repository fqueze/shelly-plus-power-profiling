let startIndex = 0;
let values = [];
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
        if (values.length >= 600) {
          values.splice(0, 1);
          ++startIndex;
        }
        values.push(res.apower);
      }
    }
  );
});

HTTPServer.registerEndpoint("power", function(req, res) {
  let data = {start_index: startIndex, power_values: values};
  if (req.query) {
    let alreadyReceived = parseInt(req.query);
    if (alreadyReceived > startIndex &&
        alreadyReceived <= startIndex + values.length) {
      data = {
        start_index: alreadyReceived,
        power_values: values.slice(alreadyReceived - startIndex)
      };
    }
  }
  res.body = JSON.stringify(data);
/* version that removes the old data once it has been received
  if (req.query) {
    let alreadyReceived = parseInt(req.query);
    if (alreadyReceived > startIndex &&
        alreadyReceived <= startIndex + values.length) {
      let toRemove = alreadyReceived - startIndex
      values.splice(0, toRemove);
      startIndex += toRemove;
    }
  }
  res.body = JSON.stringify({start_index: startIndex, power_values: values});
*/
  res.headers = [["Access-Control-Allow-Origin", "*"],
                 ["Content-Type", "application/json"]];
  res.send();
});
