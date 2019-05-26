// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

var ipcRenderer = require('electron').ipcRenderer;
ipcRenderer.on('init-data', function (event, data) {
    //alert(data.streamName);
    cloudwatchlogs.getLogEvents({logGroupName:data.groupName,logStreamName:data.streamName}, function(err, data) {
        $("#includedLoader").remove();
        if(err){
            console.log(err.stack);
            return;
        }
        console.log(data.events[0]);
        var totalMaxMemUsed = 0;
        var totalMemSize = 0;
        var totalDuration = 0;
        var totalBilledDuration = 0;
        var sNo = 1;
        for(i=0; i<data.events.length; i++) {
            var event = data.events[i];
            if(event.message.indexOf("REPORT") > -1){
                var message = event.message;
                var reqId = message.split("RequestId:")[1];
                reqId = reqId.split("Duration:")[0];
                var duration = message.split("Duration:")[1];
                 duration = duration.split("Billed")[0];
                 duration = duration.split(" ms")[0];
                var billedDuration = message.split("Billed Duration:")[1];
                 billedDuration = billedDuration.split("Memory Size:")[0];
                 billedDuration = billedDuration.split(" ms")[0];

                var memorySize = message.split("Memory Size:")[1];
                 memorySize = memorySize.split("Max Memory Used:")[0];
                 memorySize = memorySize.split(" MB")[0];

                var maxMemoryUsed = message.split("Max Memory Used:")[1];
                 maxMemoryUsed = maxMemoryUsed.split(" MB")[0];

                 totalMaxMemUsed += Number(maxMemoryUsed);
                totalMemSize += Number(memorySize);
                totalDuration += Number(duration);
                totalBilledDuration += Number(billedDuration);

                $("#dataTable tbody").append(`<tr>
                        <td>${(sNo)}</td>
                        <td>${reqId}</td>
                        <td>${duration}</td>
                        <td>${billedDuration}</td>
                        <td>${memorySize}</td>
                        <td>${maxMemoryUsed}</td>
                    </tr>`);
                sNo++;
            }

        }
        $("#dataTable tbody").append(`<tr style="font-weight: bold">
                        <td>Totals</td>
                        <td></td>
                        <td>${totalDuration}</td>
                        <td>${totalBilledDuration}</td>
                        <td>${totalMemSize}</td>
                        <td>${totalMaxMemUsed}</td>
                    </tr>`);

    });

    $("#homeBtn").click(function () {
        ipcRenderer.send('goto-home',$(this).data('index'))
    })

});

var AWS = require('aws-sdk');
AWS.config.credentials = {accessKeyId:"AKIAI3SLJSMYWVDUKLNA", secretAccessKey:'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'};
AWS.config.region = "us-east-2"
var cloudwatchlogs = new AWS.CloudWatchLogs();



//REPORT RequestId: 0d938cb6-9bdf-4a2e-a61c-a2770f0fb7a9	Duration: 2.54 ms	Billed Duration: 100 ms Memory Size: 128 MB	Max Memory Used: 19 MB
