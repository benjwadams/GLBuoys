﻿function ADCPfig(stationID) {

    $.getJSON('../static/Buoy_tool/json/45026_adcp.json', function (jsonObj) {
        var Dates = [];
        var Data = [];
        var Depth = [];

        // jsonObj variable now contains the data structure and can
        // be accessed as jsonObj.name and jsonObj.country.

        //Find out which strings have values and only save those depths and associated values.
        //for (h = 0; h < jsonObj.thermistorDepths.length; h++){
        //	if (!isNaN(jsonObj.thermistorValues[h][0])){
        //		Depth.push(Math.round(jsonObj.thermistorDepths[h]));
        //		Data.push(jsonObj.thermistorValues[h]);
        //	}
        //}
        $.each(jsonObj, function (key, value) {
            if (key == "obsDates") {
                Dates.push(value);
            }
        });

        var series = [];
        var valueFixed = [];
        var h = 0;
        var seriesLen = Dates[0].length;
        var depthCount = jsonObj.ADCP_Depths.length

        //Go through each depth for each date. Invert the depth assignment since UV001, VV001 would actually be bottom depth. 
        for (j = 0; j < Dates[0].length; j++) {
            for (i = 0; i < depthCount; i++) {
                if (i == 0 && j == 0) {
                    series[h] = [Date.parse(Dates[0][j]), jsonObj.ADCP_Depths[depthCount - 1], jsonObj.ADCP_Speed[j].toFixed(1), jsonObj.ADCP_Dir[j].toFixed(1)];
                    h += 1;
                }
                else if (j == 0) {
                    series[h] = [Date.parse(Dates[0][j]), jsonObj.ADCP_Depths[depthCount - i - 1], jsonObj.ADCP_Speed[i * seriesLen].toFixed(1), jsonObj.ADCP_Dir[i * seriesLen].toFixed(1)];
                    h += 1;
                }
                else if (i == 0) {
                    series[h] = [Date.parse(Dates[0][j]), jsonObj.ADCP_Depths[depthCount - 1], jsonObj.ADCP_Speed[(j)].toFixed(1), jsonObj.ADCP_Dir[j].toFixed(1)];
                    h += 1;
                }
                else {
                    series[h] = [Date.parse(Dates[0][j]), jsonObj.ADCP_Depths[depthCount - i - 1], jsonObj.ADCP_Speed[(i * seriesLen) + j].toFixed(1), jsonObj.ADCP_Dir[(i * seriesLen) + j].toFixed(1)];
                    h += 1;
                }
            }
        }

        ADCP_Highchart(series, Dates[0], jsonObj.ADCP_Depths)
    });

						
        //}
    //}
    
    //http_request.open("Get", data_file, true)
    //http_request.send()
}


function ADCP_Highchart(data, DateString, depths) {
    
    //Add max value of 50 at depth -1 on the last date
    data.push([data[data.length - 1][0], -1, 50, 360]);
    console.log(data);

    var H = Highcharts;
    H.seriesTypes['vector'].prototype.drawLegendSymbol = function (legend, item) {
        var options = legend.options,
            symbolHeight = legend.symbolHeight,
            square = options.squareSymbol,
            symbolWidth = square ? symbolHeight : legend.symbolWidth,
            path = this.arrow.call({
                lengthMax: 1,
                options: {
                    vectorLength: Math.abs(item.options.vectorLength)
                }
            }, {
                    length: 1
                });
        item.legendLine = this.chart.renderer.path(path)
            .addClass('highcharts-point')
            .attr({
                zIndex: 3,
                translateY: symbolWidth / 2,
                rotation: 270,
                'stroke-width': 2,
                'stroke': 'black'
            }).add(item.legendGroup);
    }

    var options = {

        chart: {
            renderTo: 'ADCP_Chart',
            type: 'vector',
            zoomType: 'x',
            spacing: [7, 0, 0, 0]
        },
				
        title: {
            text: 'Current Speed and Direction',
            style: { display: 'none'}
        },

        legend: {
            title: {
                text: 'Speed (cm/s)'
            }
        },

        credits: {
            enabled: false
        },

        navigation: {
            buttonOptions: {
                verticalAlign: 'top',
                y: -10,
                symbolSize: 15,
            }
        },

        xAxis: {
            type: 'datetime',
            offset: 0,
            padding: 0,
            tickWidth: 1,
            //categories: DateString,
            labels: {
                formatter: function () {
					//return this.value
                    return Highcharts.dateFormat('%m/%d %H:%M', this.value);
                }
            },
            pointStart: Highcharts.dateFormat('%m/%d %H:%M', data[0][0]),
            tickInterval: 6 * 3600 * 1000,
        },

        yAxis: {
            //categories: depths,
            name: 'water depth ('+depthUnits+')',
            endOnTick: false,
            gridLineWidth: 1,
            offset: 0,
            reversed: true,
            title: {
                text: 'Water Depth (' + depthUnits + ')',
                margin: 3,
            },
            labels: {
                formatter: function () {
				    return this.value
                },
                x: -5,
            },
            min: depths[0],
            max: depths[depths.length - 1] + depths[0]
        },

        tooltip: {
            formatter: function () {
                var date = Highcharts.dateFormat('%m\\%d\\%y %H:%M', (this.point.x));
                var Depth = this.point.y.toFixed(1);
                try {
                    return 'Date: <b>' + date + '</b><br />Depth: <b>' + Depth + ' ' + depthUnits + '</b><br />Speed: <b>' + this.point.length + ' ' + speedUnits + '</b><br />Direction: <b>' + this.point.direction + '°</b>';
								} catch (err) {
                    return 'Date: <b>' + date + '</b><br />Depth: <b>' + Depth + ' ' + depthUnits + '</b><br />Speed: <b>NA</b><br />Direction: <b>NA';
								}
            }
        },

        series: [{
            name: '50',
            color: Highcharts.getOptions().colors[1],
            data: data,
            showInLegend: true,
            vectorLength: -30,
            },
            {vectorLength: 24,
                name: '40',
                type: 'vector',
                color: Highcharts.getOptions().colors[1],
            },
            {
                vectorLength: 18,
                name: '30',
                type: 'vector',
                color: Highcharts.getOptions().colors[1],
            },
            {
                vectorLength: 12,
                name: '20',
                type: 'vector',
                color: Highcharts.getOptions().colors[1],
            },
            {
                vectorLength: 6,
                name: '10',
                type: 'vector',
                color: Highcharts.getOptions().colors[1],
        }],
    };
  var chart = new Highcharts.Chart(options);
}