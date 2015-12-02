var bleno = require('bleno');

var BlenoPrimaryService = bleno.PrimaryService;

var EchoCharacteristic = require('./characteristic');

console.log('bleno - echo');

bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    bleno.startAdvertising('echo', ['E20A39F473F54BC4A12F17D1AD666661']);
  } else {
    bleno.stopAdvertising();
  }
});
var WiFiControl = require('wifi-control');

  //  Initialize wifi-control package with verbose output
  WiFiControl.init({
    debug: true
  });

  //  Try scanning for access points:
  WiFiControl.scanForWiFi( function(err, response) {
    if (err) console.log(error);
    console.log(response);
  });
  
bleno.on('advertisingStart', function(error) {
  console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

  if (!error) {
    bleno.setServices([
      new BlenoPrimaryService({
        uuid: 'E20A39F473F54BC4A12F17D1AD666661',
        characteristics: [
          new EchoCharacteristic()
        ]
      })
    ]);
  }
});
