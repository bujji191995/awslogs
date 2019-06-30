// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var fs = require('fs');
var ipcRenderer = require('electron').ipcRenderer;
var metricTypes = {'s3':[{val:"AR", name:"All Requests"},{val:"GR", name:"Get Requests"}] , 'lam':[{val:"inv", name:"Invocations"}]};
var uCount = ["AR","inv"];
var mSec = [];
var byt = [];
var sStat = ["AR","inv"];
var stats = ["Average","All","Sum"];
var AWS = require('aws-sdk');
//var credentials = {accessKeyId:"accessKeyId", secretAccessKey:'secretAccessKey'};
var credentials = {accessKeyId:"AKIAIKAQBWLUFasaKKJQ4XA", secretAccessKey:'6hsGzMmhCyR1PX7TeaajVu+QuF3zV2BD1+tBir5gqu'};
var region = "us-east-2"
AWS.config.credentials = credentials;
AWS.config.region = region;

ipcRenderer.on('init-data', function (event) {
    console.log("init  data  for metrics");
    $("#awslogsBtn").click(function () {
        ipcRenderer.send("change-page","dashboard.html")
    })
});
ipcRenderer.on('updatedCredentials', function (event, data) {
    credentials = data.credentials;
    region = data.region;
    $("#accss").val(credentials.accessKeyId);
    $("#scrt").val(credentials.secretAccessKey);
    $("#rgn").val(region);

    AWS.config.credentials = credentials;
    AWS.config.region = region;
    cloudwatchlogs = new AWS.CloudWatchLogs();
});
















