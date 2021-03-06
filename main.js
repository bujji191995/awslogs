// Modules to control application life and create native browser window
// ipc main = register events, trigger events
const {app, BrowserWindow, ipcMain} = require('electron')
const path = require('path')
require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', 'data', 'electron'),
    hardResetMethod: 'exit',
    ignored: /data|[\/\\]\./,
    argv: []
});
var fs = require('fs');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow;
var page2load = "dashboard.html";
var currGroup;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600})
  // and load the index.html of the app.
  mainWindow.loadFile('dashboard.html')
  //mainWindow.loadFile('awsmetrics.html')
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
  // Emitted when the window is closed.
  mainWindow.on('closed',onMainWindowClose )
  mainWindow.webContents.openDevTools();
  mainWindow.webContents.on('did-finish-load', function (){
        console.log("init in main")
        if(page2load == "dashboard.html"){
            mainWindow.webContents.send('init-data');
            mainWindow.webContents.send('updatedCredentials',{credentials:credentials,  region:region});
            mainWindow.webContents.send('updatedLogGroupList',logGroups);
            //mainWindow.webContents.send('updatedLogGroup',logGroups);
            loadData();
        }else{
            mainWindow.webContents.send('updatedCredentials',{credentials:credentials,  region:region});
             mainWindow.webContents.send('init-data',currGroup);
        }
  });

    ipcMain.on('change-page', function(event, arg){
        //mainWindow = new BrowserWindow({width: 800, height: 600})
        page2load = arg;
        mainWindow.loadFile(page2load);
    });

    ipcMain.on('goto-home', (event) => {
        //mainWindow = new BrowserWindow({width: 800, height: 600})
        page2load = "dashboard.html";
        mainWindow.loadFile('dashboard.html');
        //mainWindow.on('closed',onMainWindowClose );
});


}
function onMainWindowClose() {
    mainWindow = null
}



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', loadStorageData)
function loadStorageData() {
    fs.readFile('data/globalSettings.json', 'utf8', function readFileCallback(err, data){
        if (err){
            console.log(err);
        } else {
            credentials = JSON.parse(data).credentials; //now it an object
            region = JSON.parse(data).region; //now it an object
            console.log(credentials, region)
            createaws();
        }
        fs.readFile('data/logGroups.json', 'utf8', function readFileCallback(err, data){
            if (err){
                console.log(err);
            } else {
                logGroups = JSON.parse(data); //now it an object
            }
            createWindow();
        });
    });
}



// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.



ipcMain.on('addLogGroup', (event, groupName) => {
    if(checkLambdaExist(groupName)){
        console.log();
        mainWindow.webContents.send('showAlert',"Lambda already exist!");
        return;
    }
    logGroups.push({name:"/aws/lambda/"+groupName, displayName:groupName,streams:[]});
    fs.writeFile('data/logGroups.json', JSON.stringify(logGroups), 'utf8', function (err) {
        console.log("err :",err);
    });
    //loadData();
    mainWindow.webContents.send('updatedLogGroupList',logGroups);
});


ipcMain.on('removeLogGroup', (event, groupName) => {
    var group2Remove = false;
    for(var i =0; i<logGroups.length; i++){
        if(logGroups[i].name == groupName){
            logGroups.splice(i, 1);
            group2Remove = true;
            break;
        }
    }
    if(group2Remove){
        fs.writeFile('data/logGroups.json', JSON.stringify(logGroups), 'utf8', function (err) {
            console.log("err :",err);
        });
    }
    return;
})

ipcMain.on('addcred', (event, creds) => {

    credentials.accessKeyId = creds.accsskey;
    credentials.secretAccessKey = creds.scrtkey;
    region = creds.rgn;
    fs.writeFile('data/globalSettings.json', JSON.stringify({credentials:credentials,region:region}), 'utf8', function (err) {
        console.log("err :",err);
    });
    createaws();
    
});


function checkLambdaExist(name) {
    for(var i=0; i<logGroups.length; i++){
        if(logGroups[i].displayName == name){
            return true;
        }
    }

    return false;
}



var AWS = require('aws-sdk');   
var credentials = {accessKeyId:"accessKeyId", secretAccessKey:'secretAccessKey'};
var region = "us-east-2"
var cloudwatchlogs;
function createaws (){
    AWS.config.credentials = credentials;
    AWS.config.region = region;
    cloudwatchlogs = new AWS.CloudWatchLogs();
    //awsmetrics = new Amazon.CloudWatch.awsmetrics();
}

createaws();


var currGroup = 0;
function getLogStreamsForLogGroups(logGroup) {
    var params = {
        logGroupName: logGroup.name, /* required */
        descending: true
    };
    console.log(credentials);
    cloudwatchlogs.describeLogStreams(params, function(err, data) {
       console.log("on Response"); // an error occurred
        if (err){
            console.log(err, err.stack); // an error occurred
        }else{
            console.log(JSON.stringify(data));           // successful response
            logGroup.streams = data.logStreams;
        }
        currGroup++;
        if(!logGroups[currGroup]){
           mainWindow.webContents.send('updatedCredentials',{credentials:credentials,  region:region});
           mainWindow.webContents.send('updatedLogGroup',logGroups);
        }else{
            getLogStreamsForLogGroups(logGroups[currGroup]);
        }
    });
}


function loadData() {
    currGroup = 0;
    if(logGroups.length > 0){
       // mainWindow.webContents.send('updatedLogGroup',logGroups);
       getLogStreamsForLogGroups(logGroups[currGroup]);
    }
}



var logGroups = [

];



