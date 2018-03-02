
// jQuery "ready" function:
$(function () {

    //==================================================================================
    // Plotter-specific Events:
    //==================================================================================

    // Button events:
    $('#btn-plot-update').on('click', function (evt) {
        evt.preventDefault();

        queryData();
    });

    $('#btn-export-menu').on('click', function (evt) {
        evt.preventDefault();
        window.location.href = '/tools/export';
        return false;
    });

    //==================================================================================
    // HighCharts Initialization:
    //==================================================================================

    // High Chart:
    $('#cht-tool').tooltip();

    //$.getJSON('https://www.highcharts.com/samples/data/jsonp.php?filename=usdeur.json&callback=?', function (data) {    });

    // Initialize Highchart:
    $('#cht-tool').highcharts({
        boost: {
            enabled: false,
        },
        chart: {
            zoomType: 'x',
        },
        credits: {
            enabled: false
        },
        exporting: {
            enabled: true,
        },
        title: {
            text: ''
        },
        subtitle: {
            text: document.ontouchstart === undefined ?
                'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
        },
        xAxis: {
            type: 'datetime',
            labels: {
                format: '{value:%e-%b-%Y %H:%m}'
            },            //dateTimeLabelFormats: 'day'
        },
        yAxis: {},
        legend: {
            enabled: true
        },
        plotOptions: {
            series: {
                turboThreshold: 10000//set it to a larger threshold, it is by default to 1000
            },
            line: {
                marker: {
                    enabled: false
                }
            }
        },

        series: []
    });

});     // end jQuery "ready"


//==================================================================================
// Query data from server:
//==================================================================================
queryData = function () {

    // Acquire user selections:
    var loc_arr = [], owners = {};
    if (_flagLocChkbox) {
        $.each($('#lst-locs input:checked'), function (idx, elem) {
            loc_arr.push($(this).attr('id'));
        })

    } else {
        $.each($('select.sel-loc'), function (idx, elem) {
            var loc_id = $(this).val();
            if (loc_id !== '' && $.inArray(loc_id, loc_arr) === -1) {
                loc_arr.push(loc_id);
                owners[loc_id] = _objLocs[loc_id].buoyOwners;
            }
        })
    }

    var param_arr = [];

    if (_flagParChkbox) {
        $.each($('#lst-params input:checked'), function (idx, elem) {
            param_arr.push($(this).attr('id'));
        })
    } else {
        $.each($('select.sel-param'), function (idx, elem) {
            var param_id = $(this).val();
            if (param_id !== '' && $.inArray(param_id, param_arr) === -1) {
                param_arr.push(param_id);
            }
        })
    }

    date_start = $('#date-start').val();
    date_end = $('#date-end').val();
    avg_ivld = $('#sel-tavg').val();

    var d1 = new Date(date_start);
    var d2 = new Date(date_end);
    // Error handling:
    if (d1 >= d2) {
        showMessage(_strTitle, 'The selected end date must be later than the start date.');
        return;
    } else if (date_end.year !== date_end.year) {
        showMessage(_strTitle, 'The start and end date must occur within the same calendar year.');
        return;
    }

    if (loc_arr.length === 0 || param_arr.length === 0) {
        var hChart = $('#cht-tool').highcharts();
        removeAllSeries(hChart);
        showMessage(_strTitle, 'At least one location and one parameter must be selected for plotting.');
        return;
    }

    // Show preloader:
    $('.preloader').show();

    // AJAX call to Python CGI-enabled script: 
    $.ajax({
        url: '/ajax/getTSData',
        type: 'POST',
        data: {
            'data_type': $('#sel-datatype').val(),
            'locs': loc_arr.join('|'),
            'owners': JSON.stringify(owners),
            'params': param_arr.join('|'),
            'tperiod': $('#sel-tperiod').val(),
            'date_start': formatDate(date_start, "yyyy-mm-dd"),
            'date_end': formatDate(date_end, "yyyy-mm-dd"),
            'avg_ivld': avg_ivld,       // Averaging interval (in seconds)
        },
        dataType: 'json',
        success: function (objData) {

            // Plot data:
            plotData(objData);

            // Hide preloader:
            $('.preloader').fadeOut("slow");

            // Show dialog:
            $('#dlg-tool').dialog('open');

            //$('#dlg-tool').dialog('option', 'position', 'center');
        },
        fail: function () {
            alert('failed');
        }
    });
}

//==================================================================================
// Update Chart Data & Configuration:
//==================================================================================
plotData = function (objData) {

    var ichk = 0;

    // Reinitialize chart:
    var hChart = $('#cht-tool').highcharts();

    // Remove all series and Y axes:
    removeYAxes(hChart);
    axes_ct = -1;

    // Check if there are any data to plot (if not, show message):
    var point_ct = 0
    var objLoc = {};

    for (loc_id in objData) {
        objLoc = objData[loc_id];
        point_ct += objLoc.dattim.length;
    }

    if (point_ct === 0) {
        showMessage(_strTitle, 'No data were found for this date range for the selected location(s) and parameter(s). ' +
            'Please note that this viewer does not support NOAA NDBC buoys that are not directly supported in the GLOS DMAC.')
    }

    // Create chart series:
    var loc_ct = 0;
    var arrLocs = [];

    for (loc_id in objData) {
        objLoc = objData[loc_id];

        if (objLoc.dattim.length > 0) {
            arrLocs.push(loc_id);
            loc_ct += 1;

            // Add axis for each parameter:
            for (param_id in objLoc.params) {
                var objParam = objLoc.params[param_id];

                var seriesName = loc_id + ': ' + objParam.desc;

                var series_data = [];
                var unit = [];

                if ($('#sel-units').val() === 'met') {
                    unit = objLoc.params[param_id].units;
                    for (var t = 0; t < objLoc.dattim.length; t++) {
                        var dt = Date.parse(objLoc.dattim[t]);
                        var tsval = objParam.values[t];
                        if (parseFloat(tsval) === -9999.0) { tsval = null };
                        series_data.push([dt, tsval]);
                    }
                } else {
                    for (var t = 0; t < objLoc.dattim.length; t++) {
                        var dt = Date.parse(objLoc.dattim[t]);
                        if (parseFloat(tsval) === -9999.0) {
                            series_data.push([dt, null]);
                        } else {
                            [tsval, unit] = unitConversion(objParam.values[t], objParam.units);
                            series_data.push([dt, tsval])
                        }
                    }
                }

                // Add new Y-axis:
                if (loc_ct === 1) {
                    axes_ct += 1;

                    hChart.addAxis({            // New yAxis
                        id: param_id,
                        title: {
                            //text: objParam.desc + ' (' + objParam.units + ')'
                            text: objParam.desc + ' (' + unit + ')'
                        },
                        lineWidth: 0.5,
                        lineColor: 'black'
                    });
                }

                // Add the new series:
                if (series_data.length > 0) {
                    hChart.addSeries({
                        yAxis: param_id,
                        type: 'line',
                        name: seriesName,
                        //color: 'blue',
                        data: series_data
                    })
                }
            }
        }
    }

    // Update chart title:
    hChart.setTitle({ text: 'Site(s): ' + arrLocs.join(', ') });
}

//==================================================================================
// Chart Utility Functions:
//==================================================================================

function removeAllSeries(cht) {
    // Remove all series from a HighChart

    for (var i = cht.series.length - 1; i > -1; i--) {
        cht.series[i].remove();
    }
}

function removeYAxes(cht) {
    // Remove all Y axes from a HighChart

    removeAllSeries(cht);

    for (var i = (cht.yAxis.length - 1); i >= 0; i--) {
        cht.yAxis[i].remove();
    }
}
