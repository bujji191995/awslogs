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
ipcRenderer.on('init-metricsdata', function(event) {
            // Metric Drop down change
            $("#includedLoader").hide();
            $("#chsrvc").change(function () {
                $('#metric').empty();
                $('#metric').append("<option value='none'>Chose a value</option>");
                for(var i=0; i<metricTypes[$(this).val()].length; i++){
                    var op = metricTypes[$(this).val()];
                    $('#metric').append("<option value='"+op[i].val+"'>"+op[i].name+"</option>");
                }
            });

            $("#metric").change(function(){
                console.log($(this).val())
              if(uCount.indexOf($(this).val()) > -1)
              {
                 var mUnit = "Count";
                 if(sStat.indexOf($(this).val())> -1)
                 {
                 stats = [];
                 stats.push("Sum");
                 }
                 for(var i=0; i<stats.length; i++){
                
                    $('#stat').append("<option value='"+stats[i]+"'>"+stats[i]+"</option>");
                }
                
              }
            });

              $("#submitmetrics").click(function()
              {
                $("#includedLoader").show();
                if($('#chsrvc').val() == 'S3')
                {
               
                var params = {
                    Dimensions: [
                      {
                        Name: 'BucketName',
                        Value: 'praveen' /* required */
                      },

                      {
                        Name: 'FilterId',
                        Value: 'EntireBucket' /* required */
                      }
                    ],
                    MetricName: $('#metrics').val(),
                    Namespace: 'AWS/S3',
                    statistics : stats,
                    unit: 'Count',
                    startTime:getdate2Timestamp(new Date('01-01-2019 01:00')),
                    endTime:getdate2Timestamp(new Date('01-04-2019 01:00'))
                  };
                  
                  cw.listMetrics(params, function(err, data) {
                    $("#includedLoader").hide();
                    if (err) {
                      console.log("Error", err);
                    } else {
                      console.log("Metrics", JSON.stringify(data.Metrics));
                    }
                  });

                }

                else{
                    $("#includedLoader").show();
                    var AWS = require('aws-sdk');
                    //var credentials = {accessKeyId:"accessKeyId", secretAccessKey:'secretAccessKey'};
                    var credentials = {accessKeyId:"accessKeyId", secretAccessKey:'secretAccessKey'};
                    var region = "us-east-2"
                    AWS.config.credentials = credentials;
                    AWS.config.region = region;
                    var cw = new AWS.CloudWatch()
                    
                   

                    var params = {
                        Dimensions: [
                          {
                            Name: 'FunctionName',
                            Value: 'LambdaRequest1' /* required */
                          },
    
 
                        ],
                        MetricName: $('#metrics').val(),
                        Namespace: 'AWS/Lambda',
                       /* statistics : stats,
                        unit: 'Count',
                        startTime:getdate2Timestamp(new Date('01-01-2019 01:00')),
                        endTime:getdate2Timestamp(new Date('01-04-2019 01:00'))*/
                      };
                      
                      cw.listMetrics(params, function(err, data) {
                        $("#includedLoader").hide();
                        if (err) {
                          console.log("Error", err);
                        } else {
                          console.log("Metrics", JSON.stringify(data.Metrics));
                        }
                      });
                }

              });
})
ipcRenderer.on('init-data', function (event) {
    // aws lambda input
    console.log("init  data:");
    fs.readFile('data/globalSettings.json', 'utf8', function readFileCallback(err, data){
        if (err){
            console.log(err);
        } else {
            credentials = JSON.parse(data).credentials; //now it an object
            region = JSON.parse(data).region; //now it an object
        }
    });

    $("#saveLambdaBtn").click(function () {

    })
    $("#saveLambdaNameBtn").click(function () {
        var lName = $("#lambdaName").val();
        ipcRenderer.send('addLogGroup',lName);
        $("#lambdaName").val("");
        $("#lnContainer").animate({height: "toggle", padding:"toggle"});
    })
    // aws credential enter
    $("#saveawsBtn").click(function () {
        var accsskey = $("#accss").val();
        var scrtkey = $("#scrt").val();
        var rgn = $("#rgn").val();
       // ipcRenderer.send('addLogGroup',{groupName:logGroups[lgId].name, streamName:logGroups[lgId].streams[streamId].logStreamName})
       credentials.accessKeyId = accsskey;
       credentials.secretAccessKey = scrtkey;
       region = rgn;
       //createaws();
       ipcRenderer.send('addcred',{accsskey:accsskey,scrtkey:scrtkey,rgn:rgn});
       //$("#includedLoader").show();
    })
    ipcRenderer.on('updatedLogGroupList', function (event, data) {
        logGroups = data;
        logGroups.reverse();
        $("#lambdaList").empty();
        for(var i=0; i<logGroups.length; i++){
            $("#lambdaList").append('<li style="padding: 0" data-l-name="'+logGroups[i].name+'" class="list-group-item"><a style="float:left; height: 63px; width: 100px; display: none; padding: 0; border-radius: 0; line-height: 63px;" class="btn btn-danger delete-confirm"><i class="fa fa-times"></i></a><div style="margin: 20px">'+logGroups[i].displayName+'<a class="deleteLambda pull-right danger"><i class="fa fa-trash" aria-hidden="true"></i></a></div></li>');
        }
        $(".deleteLambda").click(function () {
            var cdBtn = $(this).parent().parent().find(".delete-confirm");
            cdBtn.animate({width:"toggle"});
            cdBtn.click(function () {
                var lName = $(this).parent().data('lName');
                // alert(lName);
                $(this).parent().animate({height:0},300, function () {
                    $(this).remove();
                    ipcRenderer.send('removeLogGroup',lName);
                });
            })
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


    ipcRenderer.on('updatedLogGroup', function (event, data) {
        logGroups = data;
       // alert("---"+logGroups.length)
       // alert("-22--"+logGroups[currGroup].streams[currStream])
        if(logGroups.length > 0 && logGroups[currGroup].streams[currStream]){
            $("#includedLoader").show();
            getData(logGroups[currGroup].name, {groupName:logGroups[currGroup].name, streamName:logGroups[currGroup].streams[currStream].logStreamName});
        }else{
            $("#includedLoader").hide();
        }
        $(".timeRadio").click(function () {
            if(timeType == $(this).val()){
                return;
            }
            timeType = $(this).val();
            currGroup = 0;
            currStream = 0;
            logs = [];
            getData(logGroups[currGroup].name, {groupName:logGroups[currGroup].name, streamName:logGroups[currGroup].streams[currStream].logStreamName});
        });


        $("#submitBtn").click(function () {
            //alert($(this).val());
            currGroup = 0;
            currStream = 0;
            logs = [];
            getData(logGroups[currGroup].name, {groupName:logGroups[currGroup].name, streamName:logGroups[currGroup].streams[currStream].logStreamName});
        });


        $('#btn-export').on('click', function(){
            $('<table>').append(table.$('tr').clone()).table2excel({
                name: "AWS Logs Data",
                filename: "aws_logs_data" //do not include extension
            });
        });
        $('#datetimepicker1').datetimepicker();

    })

    ipcRenderer.on('showAlert', function (event, message) {
        $("#includedLoader").hide();
        alert(message);
    })

    $("#chartType").change(function () {
        var selVal =  $(this).val();
        $(".chartType").hide();
        $("#"+selVal).show();

    })
});

var logGroups = [

];


var AWS = require('aws-sdk');
//var credentials = {accessKeyId:"accessKeyId", secretAccessKey:'secretAccessKey'};
var credentials = {accessKeyId:"AKIAIKAQBWLUFasaKKJQ4XA", secretAccessKey:'6hsGzMmhCyR1PX7TeaajVu+QuF3zV2BD1+tBir5gqu'};
var region = "us-east-2"
AWS.config.credentials = credentials;
AWS.config.region = region;
var cloudwatchlogs = new AWS.CloudWatchLogs();
var logs = [];
var currGroup = 0;
var currStream = 0;
var dataFound = false;
var timestore = [];
function getData(lambda ,data) {
    AWS.config.credentials = credentials;
    if(!credentials || !region || region ==""){
        console.log("Please enter the AWS credentials");
        return;
    }
    $("#includedLoader").show();
    var lambdatemp = lambda;
    console.log("lambda name:"+lambda);
    cloudwatchlogs.getLogEvents({logGroupName:data.groupName,logStreamName:data.streamName,
        startTime:getdate2Timestamp(new Date($('#startTime').val())),
        endTime:getdate2Timestamp(new Date($('#endTime').val()))}, function(err, data) {
            console.log("group name:"+data);
            //console.log("stream name:"+data.streamName);
            $("#includedLoader").hide();
            if(err){
                console.log(err.stack);
                return;
            }
            console.log(JSON.stringify(data));
            // New addition
            if(data.events.length > 0){
                dataFound = true;
            }

            for(i=0; i<data.events.length; i++) {
                var event = data.events[i];
                console.log(event.message);
                var message = event.message;
                if(message.indexOf("START") > -1){
                    //START RequestId: 0d0c0074-e53a-491c-89c8-4c5f96b7d306 Version: $LATEST
                    var reqId = message.split("RequestId:")[1];
                    reqId = reqId.split(" Version:")[0];
                    reqId = reqId.trim();
                    if(!logs[reqId]){
                        logs[reqId] = {RequestId:reqId, lambdaName:lambda};
                    }
                    logs[reqId]["startTime"] = event.timestamp;
                    logs['invocations'] = logs['invocations']?logs['invocations']:[];
                    var tKey = timestamp2date(event.timestamp);
                    logs['invocations'][tKey] = logs['invocations'][tKey]?logs['invocations'][tKey]:{};
                    logs['invocations'][tKey]['reqs'] = logs['invocations'][tKey]['reqs']?logs['invocations'][tKey]['reqs']:[];
                    logs['invocations'][tKey]['reqs'].push(reqId);

                    logs[lambda] = logs[lambda]?logs[lambda]:[];
                    logs[lambda]['invocations'] = logs[lambda]['invocations']?logs[lambda]['invocations']:0;
                    logs[lambda]['invocations'] = logs[lambda]['invocations']+1;


                }else if(message.indexOf("END") > -1){
                    reqId = message.split("RequestId:")[1];
                    reqId = reqId.trim();
                    //reqId = reqId.split("Version:")[0];
                    if(!logs[reqId]){
                        logs[reqId] = {RequestId:reqId};
                    }
                    logs[reqId]["endTime"] = event.timestamp;
                }else if(message.indexOf("REPORT") > -1){

                    reqId = message.split("RequestId:")[1];
                    reqId = reqId.split("Duration:")[0];
                    reqId = reqId.trim();
                    if(!logs[reqId]){
                        logs[reqId] = {RequestId:reqId};
                    }
                    var duration = message.split("Duration:")[1];
                    duration = duration.split("Billed")[0];
                    duration = duration.split(" ms")[0];
                    logs[reqId]['duration'] = duration;

                    var billedDuration = message.split("Billed Duration:")[1];
                    billedDuration = billedDuration.split("Memory Size:")[0];
                    billedDuration = billedDuration.split(" ms")[0];
                    logs[reqId]['billedDuration'] = billedDuration;

                    var memorySize = message.split("Memory Size:")[1];
                    memorySize = memorySize.split("Max Memory Used:")[0];
                    memorySize = memorySize.split(" MB")[0];
                    logs[reqId]['memorySize'] = memorySize;

                    var maxMemoryUsed = message.split("Max Memory Used:")[1];
                    maxMemoryUsed = maxMemoryUsed.split(" MB")[0];
                    logs[reqId]['maxMemoryUsed'] = maxMemoryUsed;

                    logs[lambda] = logs[lambda]?logs[lambda]:[];
                    logs[lambda]['duration'] = logs[lambda]['duration']?logs[lambda]['duration']:0;
                    logs[lambda]['duration'] = logs[lambda]['duration']+Number(duration);

                    logs[lambda]['memoryUsed'] = logs[lambda]['memoryUsed']?logs[lambda]['memoryUsed']:0;
                    logs[lambda]['memoryUsed'] = logs[lambda]['memoryUsed']+Number(maxMemoryUsed);

                    for(var key in logs['invocations']){
                       var reqs = logs['invocations'][key]['reqs'];
                       if(reqs.indexOf(reqId) > -1){
                           logs['invocations'][key]['duration'] = logs['invocations'][key]['duration']?logs['invocations'][key]['duration']:0;
                           logs['invocations'][key]['duration'] = logs['invocations'][key]['duration']+Number(duration);

                           logs['invocations'][key]['memoryUsed'] = logs['invocations'][key]['memoryUsed']?logs['invocations'][key]['memoryUsed']:0;
                           logs['invocations'][key]['memoryUsed'] = logs['invocations'][key]['memoryUsed']+Number(maxMemoryUsed);


                           logs['invocations'][key]['maxmemory'] = logs['invocations'][key]['maxmemory']?logs['invocations'][key]['maxmemory']:0;
                           logs['invocations'][key]['maxmemory'] = logs['invocations'][key]['maxmemory']+Number(memorySize);


                           break;
                       }
                    }

                    /// new grahs //////////////////////

                    for(var key in logs['invocations']){
                        var reqs = logs['invocations'][key]['reqs'];
                        if(reqs.indexOf(reqId) > -1){
                            logs['invocations'][key]['duration1'] = logs['invocations'][key]['duration1']?logs['invocations'][key]['duration1']:0;
                            logs['invocations'][key]['duration1'] = logs['invocations'][key]['duration1']+Number(duration);

                            logs['invocations'][key]['billedDuration1'] = logs['invocations'][key]['billedDuration1']?logs['invocations'][key]['billedDuration1']:0;
                            logs['invocations'][key]['billedDuration1'] = logs['invocations'][key]['billedDuration1']+Number(billedDuration);




                            break;
                        }
                     }
                }

            }
            console.log("Logs : "+logs);

            timestore[startTime] = logs;
            currStream++;
            if(logGroups[currGroup] && logGroups[currGroup].streams.length > currStream){
                getData(logGroups[currGroup].name, {groupName:logGroups[currGroup].name, streamName:logGroups[currGroup].streams[currStream].logStreamName});
            }else{
                currStream = 0;
                currGroup++;
                if(logGroups.length > currGroup && logGroups[currGroup].streams && logGroups[currGroup].streams.length > 0){
                    getData(logGroups[currGroup].name, {groupName:logGroups[currGroup].name, streamName:logGroups[currGroup].streams[currStream].logStreamName});
                }else{
                    if(!dataFound){
                        alert("Data not found!");

                    }else{
                        populateUI();
                    }

                }
            }

    });
}
var timeType = "hour";
function timestamp2date(unix_timestamp) {
    // Create a new JavaScript Date object based on the timestamp
    // multiplied by 1000 so that the argument is in milliseconds, not seconds.
    var date = new Date(unix_timestamp);
    var day = date.getDate();
    var month = date.getMonth()+1;
    var year = date.getFullYear();
    // Hours part from the timestamp
    var hours = date.getHours();
    // Minutes part from the timestamp
    var minutes = "0" + date.getMinutes();
    // Seconds part from the timestamp
    var seconds = "0" + date.getSeconds();
    // Will display time in 10:30:23 format
    if(timeType == "hour"){
        var formattedTime = month+"/"+day+"/"+year+" "+hours;// + ':' + minutes.substr(-2);
    }else{
        formattedTime = month+"/"+day+"/"+year+" "+hours + ':' + minutes.substr(-2);
    }
    return formattedTime;
}

//new Date("2017-09-15 00:00:00.000")
function  getdate2Timestamp(input) {
    //alert(new Date().getTime())

    var unixTimestamp = input.getTime();//Math.round(input.getTime()/1000);
    console.log(unixTimestamp);
    return unixTimestamp;
}



var chartData = [];

var backgroundColorsDuration = [];
var backgroundColorsMemory = [];

var backgroundColors = [];
var borderColor = [];

var borderColorDuration = [];
var borderColorMemory = [];
var datapoints1 = [];
var datapoints2 = [];
var datapoints3 = [];
var datapoints4 = [];
var datapoints5 = [];
var datapoints6 = [];
var datapoints7 = [];

function populateCharts() {
    chartData = [];

   /* var chartParent = $("#timeChart").parent();
    $("#timeChart").remove();
    chartParent.append('<canvas id="timeChart" width="400" height="120"></canvas>');*/

    var chartParent = $("#lambdaChart").parent();
    $("#lambdaChart").remove();
    chartParent.append('<canvas id="lambdaChart" width="400" height="120"></canvas>');

    /*chartParent = $("#durchart").parent();
    $("#durchart").remove();
    chartParent.append('<canvas id="durchart" width="400" height="280"></canvas>');*/

    /*chartParent = $("#memchart").parent();
    $("#memchart").remove();
    chartParent.append('<canvas id="memchart" width="400" height="120"></canvas>');*/

   // function2();


    for(var key in logs) {
        if (!chartData[logs[key].lambdaName]) {
            chartData[logs[key].lambdaName] = {
                totalMaxMemUsed: 0,
                totalMemSize: 0,
                totalDuration: 0,
                totalBilledDuration: 0
            };
        }
        chartData[logs[key].lambdaName].invocations += Number(logs[key].invocations);
        chartData[logs[key].lambdaName].totalMaxMemUsed += Number(logs[key].maxMemoryUsed);
        chartData[logs[key].lambdaName].totalMemSize += Number(logs[key].memorySize);
        chartData[logs[key].lambdaName].totalDuration += Number(logs[key].duration);
        chartData[logs[key].lambdaName].totalBilledDuration += Number(logs[key].billedDuration);
       
    }
    var invocationsData = [];
    var labels = [];
    backgroundColorsDuration = [];
    backgroundColorsMemory = [];
    backgroundColors = [];
    borderColor = [];
    borderColorDuration = [];
    borderColorMemory = [];
    var duration = [];
    var memoryUsed = [];
    var duration1 = [];
    var maxmemory = [];
    var billedduration1 = [];
    
    for(var key in logs['invocations']){
        labels.push(key);
        //datapoints1.push({x:key},);
        invocationsData.push(logs['invocations'][key]['reqs'].length);
        duration.push(logs['invocations'][key]['duration']/logs['invocations'][key]['reqs'].length);
        memoryUsed.push(logs['invocations'][key]['memoryUsed']/logs['invocations'][key]['reqs'].length);
        datapoints1.push({label:key,y:logs['invocations'][key]['memoryUsed']/logs['invocations'][key]['reqs'].length});
        datapoints2.push({label:key,y:logs['invocations'][key]['maxmemory']/logs['invocations'][key]['reqs'].length});
        datapoints3.push({label:key,y:logs['invocations'][key]['billedDuration1']/logs['invocations'][key]['reqs'].length});
        datapoints4.push({label:key,y:logs['invocations'][key]['duration']/logs['invocations'][key]['reqs'].length});
        datapoints5.push({label:key,y:logs['invocations'][key]['reqs'].length});
        datapoints6.push({label:key,y:logs['invocations'][key]['duration']/logs['invocations'][key]['reqs'].length});
        datapoints7.push({label:key,y:logs['invocations'][key]['memoryUsed']/logs['invocations'][key]['reqs'].length});
        duration1.push(logs['invocations'][key]['duration1']);
        maxmemory.push(logs['invocations'][key]['maxmemory']);
        billedduration1.push(logs['invocations'][key]['billedDuration1']);

        backgroundColors.push('rgba(230, 25, 25, 0.84)'); //rgba(255, 99, 132, 0.5)');
        backgroundColorsDuration.push('rgba(20, 43, 218, 1)'); // rgba(54, 162, 235, 0.5)
        backgroundColorsMemory.push('rgba(41, 93, 5, 0.98)'); // 255, 206, 86, 0.5

        borderColor.push('rgba(255,99,132,1)');
        borderColorDuration.push('rgba(54, 162, 235, 1)');
        borderColorMemory.push('rgba(255, 206, 86, 1)');
    }

   // Invctns();
   // exetime();
   // memory();

   
    var ctx = document.getElementById("timeChart").getContext('2d');
    ctx.clearRect(0,0,$("#timeChart").width(), $("#timeChart").height() );

    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels, // ["10AM","11AM"]
            datasets: [{
                label: 'Invocations',
                data: invocationsData, // [10,5]
                backgroundColor: backgroundColors,
                borderColor: borderColor,
                borderWidth: 1
            },
            {
                label: 'Duration (ms)',
                data: duration,
                backgroundColor: backgroundColorsDuration,
                borderColor: borderColorDuration,
                borderWidth: 1
            },
            {
                label: 'Memory (MB)',
                data: memoryUsed,
                backgroundColor: backgroundColorsMemory,
                borderColor: borderColorMemory,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    }
    );

   /* function Invctns(){
        // console.log(datapoints1);
         //$("#timeChart").CanvasJSChart( {
         var chart1 = new CanvasJS.Chart("timeChart",{
             //type: 'line',
             axisY: {
                 title: "Invocations/Duration/Memory"
             },
             axisX: {
                     title: "Elapsed Time"
             },
             exportEnabled: true,
             data: [
                 {
                 type: "column",
                 legendText: "Invocations", //change it to column, spline, line, pie, etc
                 dataPoints: datapoints5
                 },
                  {
                     type: "column",
                     legendText: "Duration (ms)", //change it to column, spline, line, pie, etc
                     dataPoints: datapoints6
                 },

                 {
                    type: "column",
                    legendText: "Memory Used (MB)", //change it to column, spline, line, pie, etc
                    dataPoints: datapoints7
                }
             ]
         })
        chart1.render();
        addExportFeature(chart1, "exportCsvBtnContainer2", false);
    }*/

    var ctx = document.getElementById("durchart").getContext('2d');
    ctx.clearRect(0,0,$("#durchart").width(), $("#durchart").height());
    alert(ctx);
    var myChart1 = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels, // ["10AM","11AM"]
            datasets: [{
                label: 'Duration',
                data: duration1,
                backgroundColor: backgroundColorsDuration,
                borderColor: borderColorDuration,
                borderWidth: 1
            },
            {
                label: 'Billed Duration',
                data: billedduration1,
                backgroundColor: backgroundColorsMemory,
                borderColor: borderColorMemory,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });

    /*function exetime(){
        // console.log(datapoints1);
        var chart1 = new CanvasJS.Chart("durchart",{
         //type: 'line',
 
         axisY: {
             title: "Duration(ms)"
         },
         axisX: {
                 title: "Elapsed Time"
         },

         exportEnabled: true,
         data: [
             {
             type: "area",
             legendText: "Billed Duration(ms)", //change it to column, spline, line, pie, etc
             dataPoints: datapoints3
         },
          {
             type: "area",
             legendText: "Duration (ms)", //change it to column, spline, line, pie, etc
             dataPoints: datapoints4
         }
 
         ]
     })

     chart1.render();

    // exporting code
    addExportFeature(chart1, "exportCsvBtnContainer1", false);
 };*/

 /*function addExportFeature (chart, chartToolBar, addAlways = true){
    var toolBar = document.getElementById(chartToolBar);
    if(chart.get("exportEnabled" ) || addAlways){
        var exportCSV = document.createElement('div');
    var text = document.createTextNode("Save as CSV");
    exportCSV.setAttribute("style", "padding: 12px 8px; background-color: white; color: black")
    exportCSV.appendChild(text);

    exportCSV.addEventListener("mouseover", function(){
          exportCSV.setAttribute("style", "padding: 12px 8px; background-color: #2196F3; color: white")
    });
    exportCSV.addEventListener("mouseout", function(){
          exportCSV.setAttribute("style", "padding: 12px 8px; background-color: white; color: black")
    });
    exportCSV.addEventListener("click", function(){
          downloadCSV({ filename: "chart-data.csv", chart: chart })
    });
        toolBar.appendChild(exportCSV);
  }
}*/


/*else {
var exportCSV = document.createElement('button');	
var text = document.createTextNode("Save as CSV");	
exportCSV.appendChild(text);
exportCSV.addEventListener("click", function(){
      downloadCSV({ filename: "chart-data.csv", chart: chart })
});
document.body.appendChild(exportCSV)
//}*/


function convertChartDataToCSV(args) {  
var result, ctr, keys, columnDelimiter, lineDelimiter;
var data = [];

data = args.data || null;
if (data == null || !data.length) {
return null;
}

columnDelimiter = args.columnDelimiter || ',';
lineDelimiter = args.lineDelimiter || '\n';

keys = Object.keys(data[0]);

result = '';
result += keys.join(columnDelimiter);
result += lineDelimiter;

data.forEach(function(item) {
ctr = 0;
keys.forEach(function(key) {
  if (ctr > 0) result += columnDelimiter;
  result += item[key];
  ctr++;
});
result += lineDelimiter;
});
return result;
}
function downloadCSV(args) {
var data, filename, link;
var csv = "";
for(var i = 0; i < args.chart.options.data.length; i++){
  csv += convertChartDataToCSV({
    data: args.chart.options.data[i].dataPoints
  });
}
if (csv == null) return;

filename = args.filename || 'chart-data.csv';

if (!csv.match(/^data:text\/csv/i)) {
  csv = 'data:text/csv;charset=utf-8,' + csv;
}

data = encodeURI(csv);
link = document.createElement('a');
link.setAttribute('href', data);
link.setAttribute('download', filename);
document.body.appendChild(link); // Required for FF
  link.click(); 
  document.body.removeChild(link);   
}

    var ctx = document.getElementById("memchart").getContext('2d');
    ctx.clearRect(0,0,$("#memchart").width(), $("#memchart").height());
    
    var myChart2 = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels, // ["10AM","11AM"]
            datasets: [{
                label: 'MemoryUsed',
                data: memoryUsed,
                backgroundColor: backgroundColorsDuration,
                borderColor: borderColorDuration,
                borderWidth: 1
            },
            {
                label: 'MaxMemory',
                data: maxmemory,
                backgroundColor: backgroundColorsMemory,
                borderColor: borderColorMemory,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });

   
   // var ctx = document.getElementById("memchart").getContext('2d');
    //ctx.clearRect(0,0,$("#memchart").width(), $("#memchart").height());

   /* function memory(){
       // console.log(datapoints1);
   // $("#memchart").CanvasJSChart( {
        //type: 'line',

        var chart = new CanvasJS.Chart("memchart",{
        axisY: {
            title: "Memory (MB)"
		},
		axisX: {
                title: "Elapsed Time"
        },
        exportEnabled: true,
		data: [
            {
            type: "area",
            legendText: "Memory Utilized (MB)", //change it to column, spline, line, pie, etc
            dataPoints: datapoints1
        },
         {
            type: "line",
            legendText: "Max Memory Allocated (MB)", //change it to column, spline, line, pie, etc
            dataPoints: datapoints2
        }

        ]
    });

    chart.render();

    // exporting code
    addExportFeature(chart, "exportCsvBtnContainer", false);

    };*/

    function addExportFeature (chart, chartToolBar, addAlways = true){
        var toolBar = document.getElementById(chartToolBar);
        if(chart.get("exportEnabled" ) || addAlways){
            var exportCSV = document.createElement('div');
        var text = document.createTextNode("Save as CSV");
        exportCSV.setAttribute("style", "padding: 12px 8px; background-color: white; color: black")
        exportCSV.appendChild(text);
    
        exportCSV.addEventListener("mouseover", function(){
              exportCSV.setAttribute("style", "padding: 12px 8px; background-color: #2196F3; color: white")
        });
        exportCSV.addEventListener("mouseout", function(){
              exportCSV.setAttribute("style", "padding: 12px 8px; background-color: white; color: black")
        });
        exportCSV.addEventListener("click", function(){
              downloadCSV({ filename: "chart-data.csv", chart: chart })
        });
        toolBar.appendChild(exportCSV);
      }
    }
    

/*else {
	var exportCSV = document.createElement('button');	
	var text = document.createTextNode("Save as CSV");	
  exportCSV.appendChild(text);
  exportCSV.addEventListener("click", function(){
      	downloadCSV({ filename: "chart-data.csv", chart: chart })
  });
  document.body.appendChild(exportCSV)
//}*/
	

function convertChartDataToCSV(args) {  
  var result, ctr, keys, columnDelimiter, lineDelimiter;
  var data = [];

  data = args.data || null;
  if (data == null || !data.length) {
    return null;
  }

  columnDelimiter = args.columnDelimiter || ',';
  lineDelimiter = args.lineDelimiter || '\n';

  keys = Object.keys(data[0]);

  result = '';
  result += keys.join(columnDelimiter);
  result += lineDelimiter;

  data.forEach(function(item) {
    ctr = 0;
    keys.forEach(function(key) {
      if (ctr > 0) result += columnDelimiter;
      result += item[key];
      ctr++;
    });
    result += lineDelimiter;
  });
  return result;
}
function downloadCSV(args) {
    var data, filename, link;
    var csv = "";
    for(var i = 0; i < args.chart.options.data.length; i++){
      csv += convertChartDataToCSV({
        data: args.chart.options.data[i].dataPoints
      });
    }
    if (csv == null) return;
  
    filename = args.filename || 'chart-data.csv';
  
    if (!csv.match(/^data:text\/csv/i)) {
      csv = 'data:text/csv;charset=utf-8,' + csv;
    }
    
    data = encodeURI(csv);
    link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute('download', filename);
    document.body.appendChild(link); // Required for FF
      link.click(); 
      document.body.removeChild(link);   
  }

//convertChartDataToCSV(chart);

//downloadCSV(chart);
    
//convertChartDataToCSV();
//downloadCSV();

   // var ctx = document.getElementById("memchart"); // 
   // ctx.clearRect(0,0,$("#memchart").width(), $("#memchart").height());
   
    
  /* function function2(){
   // console.log(datapoints1);
   $("#memchart").CanvasJSChart( {

        animationEnabled: true,
        theme: "light2",
        title:{
            text: "Memory Util"
        },

        axisY: {
            title: "Memory",
           // valueFormatString: "#0",
          //  suffix: "K",
          //  prefix: "£"
        },
        legend: {
            cursor: "pointer",
           // itemclick: toogleDataSeries
        },
        toolTip: {
            shared: true
        },
        data: [ {

            type: "area",
		    name: "Memory Used",
		    markerSize: 5,
		    showInLegend: true,
		   // xValueFormatString: "MMMM",
		   // yValueFormatString: "#0",
           // labels: labels, // ["10AM","11AM"]
            datapoints : datapoints1},
                            
          {

            type: "area",
            name: "Max Memory",
            markerSize: 5,
            showInLegend: true,
           // xValueFormatString: "MMMM",
           // yValueFormatString: "#0",
        // labels: labels, // ["10AM","11AM"]
        datapoints : datapoints2},
                    ]
                
                })
            };  */
                
    /* $("#memchart").CanvasJSChart(myChart2);
                           
                function toogleDataSeries(e) {
                    if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                        e.dataSeries.visible = false;
                    } else {
                        e.dataSeries.visible = true;
                    }
                    e.chart.render();
                }
   }*/


 
    
    

    $('#lambdaListHeader').empty();
    var lambdaOptionsStr = "<select id=\"lambdaList\" class=\"selectpicker\" multiple>";
    for(var i=0; i<logGroups.length; i++){
        var displayName = logGroups[i].displayName;
        lambdaOptionsStr += "<option selected>"+displayName+"</option>";
        logGroups[i].index = i;
        logGroups[i].selected = true;
    }
    lambdaOptionsStr += "</select>";
    $('#lambdaListHeader').append(lambdaOptionsStr);
    $('#lambdaList').selectpicker();

    $('#lambdaList').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
        for(var j=0; j<logGroups.length; j++){
            if(logGroups[j].index == clickedIndex){
                logGroups[j].selected = isSelected;
            }
        }
       // drawLambdaChart();
    });

    drawLambdaChart();

}

var lambdaList = [];
var table = null;

function drawLambdaChart() {
    var chartParent = $("#lambdaChart").parent();
    $("#lambdaChart").remove();
    chartParent.append('<canvas id="lambdaChart" width="400" height="120"></canvas>');
    var ctx = document.getElementById("lambdaChart").getContext('2d');
    ctx.clearRect(0,0,$("#lambdaChart").width(), $("#lambdaChart").height() );

    var lambdaLabels = [];
    var lambdaDurations = []
    var lambdaInvocations = []
    var lambdaMemory = []
    lambdaList = [];
    for(var i=0; i<logGroups.length; i++){
        lambdaList.push(logGroups[i].name);
        if(!logGroups[i].selected){
            continue;
        }
        var lambda = logGroups[i].name;
        var displayName = logGroups[i].displayName;
        lambdaLabels.push(displayName);

        lambdaDurations.push(logs[lambda]['duration']);
        lambdaInvocations.push(logs[lambda]['invocations']);
        lambdaMemory.push(logs[lambda]['memoryUsed']);
    }
    var myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: lambdaLabels,
            datasets: [{
                label: 'Invocations',
                data: lambdaInvocations,
                backgroundColor: backgroundColors,
                borderColor: borderColor,
                borderWidth: 1
            },
                {
                    label: 'Duration (ms)',
                    data: lambdaDurations,
                    backgroundColor: backgroundColorsDuration,
                    borderColor: borderColorDuration,
                    borderWidth: 1
                },
                {
                    label: 'Memory (MB)',
                    data: lambdaMemory,
                    backgroundColor: backgroundColorsMemory,
                    borderColor: borderColorMemory,
                    borderWidth: 1
                }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });
}




function populateUI() {
    //$("#dataTable").remove();
    populateCharts();

    var sNo = 1;
    var totalMaxMemUsed = 0;
    var totalMemSize = 0;
    var totalDuration = 0;
    var totalBilledDuration = 0;


    $("#dataTable").remove();
    $("#dataTableContainer").append(`
    <table id="dataTable" class="table table-striped" style="max-height: 400px; overflow-y: scroll; font-size: 10px;">
              <thead>
              </thead>
              <tbody>
              </tbody>
            </table>
`);

    var indx = 0;
    for(var key in logs){
        if(key == "invocations" || lambdaList.indexOf(key) > -1){
            continue;
        }
        if(indx == 0){
            $("#dataTable thead").append(`<tr>
         
          <th>Name</th>
          <th>Request Id</th>
          <th>Start Time</th>
          <th>End Time</th>
          <th>Duration</th>
          <th>Billed Duration</th>
          <th>Memory Size</th>
          <th>Memory Used</th>
          </tr>`);
        }
        indx++;
        var startDate = new Date(logs[key].startTime);
        var endDate = new Date(logs[key].endTime);
        totalMaxMemUsed += Number(logs[key].maxMemoryUsed);
        totalMemSize += Number(logs[key].memorySize);
        totalDuration += Number(logs[key].duration);
        totalBilledDuration += Number(logs[key].billedDuration);
        /*$("#dataTable tbody").append(`<tr>
                        <td>${(logs[key].lambdaName.split("/")[3])}</td>
                        <td>${logs[key].RequestId}</td>
                        <td>${startDate.toLocaleString()}</td>
                        <td>${endDate.toLocaleString()}</td>
                       
                        <td>${logs[key].duration}</td>
                        <td>${logs[key].billedDuration}</td>
                        <td>${logs[key].memorySize}</td>
                        <td>${logs[key].maxMemoryUsed}</td>
                    </tr>`);*/


    }
    /*$("#dataTable tbody").append(`<tr style="font-weight: bold">
                        <td>Totals</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td>${totalDuration}</td>
                        <td>${totalBilledDuration}</td>
                        <td>${totalMemSize}</td>
                        <td>${totalMaxMemUsed}</td>
                    </tr>`);
                    */

    //$("#dataTableModal").modal();

     table = $('#dataTable').DataTable();
}









