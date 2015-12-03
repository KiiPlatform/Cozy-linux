var properties = require('properties');
var util = require('util');
var exec = require('child_process').exec;
var options = {
  path: true,
  variables: true,
  sections: true
};
var cmd = "configure_edison --changeWiFi WPA-PSK ";
exec(cmd, function(error, stdout, stderr) {
  if(error)
  console.log('Error: ' + error);
  
  setTimeout(function() {
    var cmd = "wpa_cli status > status";
    exec(cmd, function(error, stdout, stderr) {
      if(error)
        console.log('Error: ' + error);
        properties.parse ("status", options, function (error, p){
          if (error) return console.error (error);
          console.log (p);
        });
    }.bind(this));
  }, 3000);
}.bind(this));
