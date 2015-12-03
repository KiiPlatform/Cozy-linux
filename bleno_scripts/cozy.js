var util = require('util');
var exec = require('child_process').exec;
var bleno = require('bleno');

var BlenoPrimaryService = bleno.PrimaryService;
var BlenoCharacteristic = bleno.Characteristic;
var BlenoDescriptor = bleno.Descriptor;

console.log('cozy');
// for edison
console.log(process.argv[2]);
// For UDOO Neo
function getCommand(ssid, bssid, passw, iface) {
    var cmd;
    if(process.argv[2]=="edison"){
      if(!passw)
        cmd = 'configure_edison --changeWiFi OPEN ' + ssid ;
      else
        cmd = 'configure_edison --changeWiFi WPA-PSK ' + ssid +' ' + passw ;
    }else{
      if(!passw)
        cmd = 'nmcli dev wifi connect ' + ssid + ' iface ' + iface;
      else
        cmd = 'nmcli dev wifi connect ' + ssid + ' password ' + passw + ' iface ' + iface;
    }

    return cmd;
}

function parseMessage(message) {
    var parsed;
    try {
       parsed = JSON.parse(message);
    }
    catch(e){
       console.log('Error parsing incoming message: ' + e);
       return null;
    }
    return parsed;
}

function jsonLength(jsonMsg){
  return Object.keys(jsonMsg).length;
}

var WifiConnectCharacteristic = function() {
  WifiConnectCharacteristic.super_.call(this, {
    uuid: '08590F7EDB05467E875772F6F66666D4',
    properties: ['write', 'writeWithoutResponse', 'notify'],
    descriptors: [
      new BlenoDescriptor({
        uuid: '2902',
        value: 'Connect to wifi with incoming parameters'
      })
    ]
  });
};

util.inherits(WifiConnectCharacteristic, BlenoCharacteristic);

WifiConnectCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
  console.log('WifiConnectCharacteristic data size is: ' + data.length);
  console.log('WifiConnectCharacteristic write request: ' + data.toString() + ' ' + offset + ' ' + withoutResponse);
  var jsonMsg = parseMessage(data);
  if (offset) {
    callback(this.RESULT_ATTR_NOT_LONG);
  } else if (jsonMsg == null || (jsonLength(jsonMsg) !== 3)) { // expecting 3 parameters
    callback(this.RESULT_INVALID_ATTRIBUTE_LENGTH);
  } else {
    var iface = 'wlan0';
    var ssid = jsonMsg.SSID; console.log('Got SSID: ' + ssid);
    var bssid = jsonMsg.BSSID; console.log('Got BSSID: ' + bssid);
    var passw = jsonMsg.password; console.log('Got password. Length: ' + passw.length);
    var cmd = getCommand(ssid, bssid, passw, iface);
    console.log('Executing: ' + cmd);
    exec(cmd, function(error, stdout, stderr) {
      if(error)
        console.log('Error: ' + error);
      else
        console.log('Success!');
      if (this.updateValueCallback) {
        console.log('Setting command result in calback...');
        if(error) {
           var errorMsg = '-1';
           this.updateValueCallback(new Buffer(errorMsg));
           console.log('...sent: ' + errorMsg);
        }
        else {
           var successMsg = '74:da:ea:98:4b:04'; //device id
           this.updateValueCallback(new Buffer(successMsg));
           console.log('...sent: ' + successMsg);
        }
      }
    }.bind(this));
    callback(this.RESULT_SUCCESS);
  }
};

function CozyService() {
  CozyService.super_.call(this, {
    uuid: 'E20A39F473F54BC4A12F17D1AD666661',
    characteristics: [
      new WifiConnectCharacteristic()
    ]
  });
}

util.inherits(CozyService, BlenoPrimaryService);

bleno.on('stateChange', function(state) {
  console.log('on -> stateChange: ' + state + ', address = ' + bleno.address);

  if (state === 'poweredOn') {
    bleno.startAdvertising('CozyDevice_UDOONeo', ['E20A39F473F54BC4A12F17D1AD666661']);
  } else {
    bleno.stopAdvertising();
  }
});

// Linux only events /////////////////
bleno.on('accept', function(clientAddress) {
  console.log('on -> accept, client: ' + clientAddress);

  bleno.updateRssi();
});

bleno.on('disconnect', function(clientAddress) {
  console.log('on -> disconnect, client: ' + clientAddress);
});

bleno.on('rssiUpdate', function(rssi) {
  console.log('on -> rssiUpdate: ' + rssi);
});
//////////////////////////////////////

bleno.on('mtuChange', function(mtu) {
  console.log('on -> mtuChange: ' + mtu);
});

bleno.on('advertisingStart', function(error) {
  console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

  if (!error) {
    bleno.setServices([
      new CozyService()
    ]);
  }
});

bleno.on('advertisingStop', function() {
  console.log('on -> advertisingStop');
});

bleno.on('servicesSet', function(error) {
  console.log('on -> servicesSet: ' + (error ? 'error ' + error : 'success'));
});
