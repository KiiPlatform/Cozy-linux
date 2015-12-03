var util = require('util');
var exec = require('child_process').exec;
var bleno = require('../index');

var BlenoPrimaryService = bleno.PrimaryService;
var BlenoCharacteristic = bleno.Characteristic;
var BlenoDescriptor = bleno.Descriptor;

console.log('cozy');

// For UDOO Neo
function getCommand(ssid, bssid, passw, iface) {
    var cmd;
    if(!passw){
      cmd = 'nmcli dev wifi connect ' + ssid + ' iface ' + iface;
    }
    else{
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

var StaticReadOnlyCharacteristic = function() {
  StaticReadOnlyCharacteristic.super_.call(this, {
    uuid: 'fffffffffffffffffffffffffffffff1',
    properties: ['read'],
    value: new Buffer('value'),
    descriptors: [
      new BlenoDescriptor({
        uuid: '2901',
        value: 'user description'
      })
    ]
  });
};
util.inherits(StaticReadOnlyCharacteristic, BlenoCharacteristic);

var DynamicReadOnlyCharacteristic = function() {
  DynamicReadOnlyCharacteristic.super_.call(this, {
    uuid: 'fffffffffffffffffffffffffffffff2',
    properties: ['read']
  });
};

util.inherits(DynamicReadOnlyCharacteristic, BlenoCharacteristic);

DynamicReadOnlyCharacteristic.prototype.onReadRequest = function(offset, callback) {
  var result = this.RESULT_SUCCESS;
  var data = new Buffer('dynamic value');

  if (offset > data.length) {
    result = this.RESULT_INVALID_OFFSET;
    data = null;
  } else {
    data = data.slice(offset);
  }

  callback(result, data);
};

var LongDynamicReadOnlyCharacteristic = function() {
  LongDynamicReadOnlyCharacteristic.super_.call(this, {
    uuid: 'fffffffffffffffffffffffffffffff3',
    properties: ['read']
  });
};

util.inherits(LongDynamicReadOnlyCharacteristic, BlenoCharacteristic);

LongDynamicReadOnlyCharacteristic.prototype.onReadRequest = function(offset, callback) {
  var result = this.RESULT_SUCCESS;
  var data = new Buffer(512);

  for (var i = 0; i < data.length; i++) {
    data[i] = i % 256;
  }

  if (offset > data.length) {
    result = this.RESULT_INVALID_OFFSET;
    data = null;
  } else {
    data = data.slice(offset);
  }

  callback(result, data);
};

var WriteOnlyCharacteristic = function() {
  WriteOnlyCharacteristic.super_.call(this, {
    uuid: '08590F7EDB05467E875772F6F66666D4',
    properties: ['write', 'writeWithoutResponse', 'notify'],
    descriptors: [
      new BlenoDescriptor({
        uuid: '2902',
        value: 'Connect to wifi'
      })
    ]
  });
};

util.inherits(WriteOnlyCharacteristic, BlenoCharacteristic);

WriteOnlyCharacteristic.prototype.onWriteRequest = function(data, offset, withoutResponse, callback) {
  console.log('WriteOnlyCharacteristic write request: ' + data.toString() + ' ' + offset + ' ' + withoutResponse);
  
  var jsonMsg = parseMessage(data);
  if (offset) {
    callback(this.RESULT_ATTR_NOT_LONG);
  } else if (jsonLength(jsonMsg) !== 3) {
    callback(this.RESULT_INVALID_ATTRIBUTE_LENGTH);
  } else {
    var iface = 'wlan0';
    var ssid = jsonMsg.SSID; console.log('Got SSID: ' + ssid);
    var bssid = jsonMsg.BSSID; console.log('Got BSSID: ' + bssid);
    var passw = jsonMsg.password; console.log('Got password. Length: ' + passw.length);
    var cmd = getCommand(ssid, bssid, passw, iface);
    console.log('Executing: ' + cmd);
    exec(cmd, function(error, stdout, stderr) {
      console.log(stdout + '. Error: ' + error);
      if (this.updateValueCallback) {
        if(error)
           this.updateValueCallback(new Buffer('-2'));
        else
           this.updateValueCallback(new Buffer('3'));
      }
    }.bind(this));
    callback(this.RESULT_SUCCESS);
  }

};

var NotifyOnlyCharacteristic = function() {
  NotifyOnlyCharacteristic.super_.call(this, {
    uuid: 'fffffffffffffffffffffffffffffff5',
    properties: ['notify']
  });
};

util.inherits(NotifyOnlyCharacteristic, BlenoCharacteristic);

NotifyOnlyCharacteristic.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {
  console.log('NotifyOnlyCharacteristic subscribe');

  this.counter = 0;
  this.changeInterval = setInterval(function() {
    var data = new Buffer(4);
    data.writeUInt32LE(this.counter, 0);

    console.log('NotifyOnlyCharacteristic update value: ' + this.counter);
    updateValueCallback(data);
    this.counter++;
  }.bind(this), 5000);
};

NotifyOnlyCharacteristic.prototype.onUnsubscribe = function() {
  console.log('NotifyOnlyCharacteristic unsubscribe');

  if (this.changeInterval) {
    clearInterval(this.changeInterval);
    this.changeInterval = null;
  }
};

NotifyOnlyCharacteristic.prototype.onNotify = function() {
  console.log('NotifyOnlyCharacteristic on notify');
};

var IndicateOnlyCharacteristic = function() {
  IndicateOnlyCharacteristic.super_.call(this, {
    uuid: 'fffffffffffffffffffffffffffffff6',
    properties: ['indicate']
  });
};

util.inherits(IndicateOnlyCharacteristic, BlenoCharacteristic);

IndicateOnlyCharacteristic.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {
  console.log('IndicateOnlyCharacteristic subscribe');

  this.counter = 0;
  this.changeInterval = setInterval(function() {
    var data = new Buffer(4);
    data.writeUInt32LE(this.counter, 0);

    console.log('IndicateOnlyCharacteristic update value: ' + this.counter);
    updateValueCallback(data);
    this.counter++;
  }.bind(this), 1000);
};

IndicateOnlyCharacteristic.prototype.onUnsubscribe = function() {
  console.log('IndicateOnlyCharacteristic unsubscribe');

  if (this.changeInterval) {
    clearInterval(this.changeInterval);
    this.changeInterval = null;
  }
};

IndicateOnlyCharacteristic.prototype.onIndicate = function() {
  console.log('IndicateOnlyCharacteristic on indicate');
};

function CozyService() {
  CozyService.super_.call(this, {
    uuid: 'E20A39F473F54BC4A12F17D1AD666661',
    characteristics: [
      //new StaticReadOnlyCharacteristic(),
      //new DynamicReadOnlyCharacteristic(),
      //new LongDynamicReadOnlyCharacteristic(),
      new WriteOnlyCharacteristic()//,
      //new NotifyOnlyCharacteristic(),
      //new IndicateOnlyCharacteristic()
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
