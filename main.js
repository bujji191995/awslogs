// Modules to control application life and create native browser window
// ipc main = register events, trigger events
const {app, BrowserWindow, ipcMain} = require('electron')
require('electron-reload')(__dirname);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow;
var page2load = "home";
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
  mainWindow.webContents.on('did-finish-load', () => {
        if(page2load == "home"){
            mainWindow.webContents.send('init-data');
            mainWindow.webContents.send('updatedLogGroup',logGroups);
        }else{
          mainWindow.webContents.send('init-data',currGroup);
        }

  });

    ipcMain.on('change-page', (event, arg) => {
        //mainWindow = new BrowserWindow({width: 800, height: 600})
        currGroup = arg;
        page2load = "events";
        mainWindow.loadFile('log-events.html');
        //mainWindow.on('closed',onMainWindowClose );
       /* mainWindow.webContents.on('did-finish-load', () => {
          var lgId = arg.split("_")[0];
          var streamId = arg.split("_")[1];
          mainWindow.webContents.send('init-data',{groupName:logGroups[lgId].name, streamName:logGroups[lgId].streams[streamId].name});
        });*/
    });

    ipcMain.on('goto-home', (event) => {
        //mainWindow = new BrowserWindow({width: 800, height: 600})
        page2load = "home";
        mainWindow.loadFile('dashboard.html');
        //mainWindow.on('closed',onMainWindowClose );
});


}
function onMainWindowClose() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
}



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

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
    loadData();

    
});

ipcMain.on('addcred', (event, creds) => {

    credentials.accessKeyId = creds.accsskey;
    credentials.secretAccessKey = creds.scrtkey;
    region = creds.rgn;
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
var credentials = {accessKeyId:"AKIAJLI3MJ5HIYRPBJFA", secretAccessKey:'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'};
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
            console.log(data.logStreams);           // successful response
            logGroup.streams = data.logStreams;
        }
        currGroup++;
        if(!logGroups[currGroup]){
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



