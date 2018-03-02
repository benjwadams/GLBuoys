
// jQuery "ready" function:
$(function () {

    //==================================================================================
    // Export Page Events:
    //==================================================================================

    // Download file:
    $('#btn-download').on('click', function (evt) {
        evt.preventDefault();
        // download csv/excel file
        downloadData();
    });


    //==================================================================================
    // Data Download:
    //==================================================================================
    // can't use ajax to open the file download prompt, a known issue ?
    // use: 
    // window.location = "download.action?para1=value1...."
    //https://stackoverflow.com/questions/4545311/download-a-file-by-jquery-ajax

    function downloadData() {

        // Get date information:
        date_start = $('#date-start').val();
        date_end = $('#date-end').val();

        var d1 = new Date(date_start);
        var d2 = new Date(date_end);

        // Get location/parameter strings:
        var locs = getReqParam('locs');
        var params = getReqParam('params');

        // Error handling:
        if (d1 >= d2) {
            showMessage(_strTitle, 'The selected end date must be later than the start date.');
            return;
        } else if (date_end.year !== date_end.year) {
            showMessage(_strTitle, 'The start and end date must occur within the same calendar year.');
            return;
        }

        if (locs.length === 0 || params.length === 0) {
            showMessage(_strTitle, 'At least one location and one parameter must be selected for plotting.');
            return;
        }

        // Submit GET request:
        window.location = "download_data" +
            "?ftype=" + getReqParam('ftype') +
            "&units=" + getReqParam('units') +
            "&data_type=" + getReqParam('data_type') +
            "&locs=" + locs +
            "&params=" + params +
            "&tperiod=" + getReqParam('tperiod') +
            "&date_start=" + getReqParam('date_start') +
            "&date_end=" + getReqParam('date_end') +
            //"&owner=" + owner +
            "&avg_ivld=" + getReqParam('avg_ivld');
        return;

    }




});     // end jQuery "ready"