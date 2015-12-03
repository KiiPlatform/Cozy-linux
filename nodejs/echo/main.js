var bleno = require('bleno');

var BlenoPrimaryService = bleno.PrimaryService;

var EchoCharacteristic = require('./characteristic');
var wpa_supplicant = require('wireless-tools/wpa_supplicant');

var options = {
  interface: 'wlan0',
  ssid: 'synclore_guest',
  passphrase: '',
  driver: 'wext'
};


console.log('bleno - echo');

bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state);

  if (state === 'poweredOn') {
    bleno.startAdvertising('echo', ['E20A39F473F54BC4A12F17D1AD666661']);
  } else {
    bleno.stopAdvertising();
  }
});

bleno.on('advertisingStart', function(error) {
  console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

  if (!error) {
    wpa_supplicant.enable(options, function(err) {
      // connected to the wireless network
      if (!err) {
        console.log(err);
      }else{
        console.log('connected');
      }
    });
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
