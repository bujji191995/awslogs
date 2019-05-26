// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

var ipcRenderer = require('electron').ipcRenderer;
ipcRenderer.on('init-data', function (event) {

    //alert('00')
   function updateUI() {
       $("#includedLoader").hide();
       $("#log-groups tbody").empty();
       for(var i=0; i<logGroups.length ; i++){
           $("#log-groups tbody").append(`
        <tr>
            <td>${i+1}</td>
            <td>
                ${logGroups[i].displayName}
          </td>
          <td></td>
          <td></td>
         </tr>
    `)
           if(logGroups[i].streams){
               for(var j=0; j<logGroups[i].streams.length ; j++){
                   $("#log-groups tbody").append(`
                    <tr>
                        <td>${i+1}.${j+1}</td>
                        <td></td>
                        <td style="text-align: center">
                            ${logGroups[i].streams[j].logStreamName}
                      </td>
                      <td style="text-align: center">
                            <a data-index="${i}_${j}" class="stream btn btn-primary text-light">View Events</a>
                      </td>
                     </tr>
                `)
               }
           }
       }


       $(".stream").click(function () {
           // alert($(this).data('index'));
           var gId = $(this).data('index');
           var lgId = gId.split("_")[0];
           var streamId = gId.split("_")[1];
           ipcRenderer.send('change-page',{groupName:logGroups[lgId].name, streamName:logGroups[lgId].streams[streamId].logStreamName})
       })
   }


    $("#saveLambdaBtn").click(function () {
        var lName = $("#lambda").val();
       // ipcRenderer.send('addLogGroup',{groupName:logGroups[lgId].name, streamName:logGroups[lgId].streams[streamId].logStreamName})
        ipcRenderer.send('addLogGroup',lName);
        $("#includedLoader").show();
    })

    ipcRenderer.on('updatedLogGroup', function (event, data) {
        logGroups = data;
        updateUI();
    })

//{name:"/aws/lambda/LambdaRequest1", displayName:"Lambda Request1",streams:[]},


});

var logGroups = [

];











