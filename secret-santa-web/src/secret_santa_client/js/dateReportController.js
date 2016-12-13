app.controller('dateReportController', function ($scope, $routeParams, $location, dateReport, eventUsers, dates, $q) {

    var self = this;
    self.eventId = $routeParams.id;

    var columns = 3;

    self.fail = false;
    self.success = false;
    self.totalAttendees = 0;

    self.dateData = [];

    self.formatDate = function (date) {
        return date.format('Do MMMM YYYY');
    };

    $q.all(
        eventUsers.query({id:self.eventId}, function(data){
          self.totalAttendees = data.length;
        })
    ).then(function(){
        dateReport.query({id: self.eventId}, function(data){
            //[{"date":"2016-12-08T00:00:00Z","name":"Aaron Rhodes"},{"date":"2016-12-06T00:00:00Z","name":"Aaron Rhodes"}]

            dates.query({id:self.eventId}, function(dates){
                var tempData = [];

                for (var i = 0; i < dates.length; i++){
                    tempData.push({ date: moment(dates[i]), names:[]});
                }

                for (var i = 0; i < data.length; i++)
                {
                    var dateItem = null;

                    for (var b = 0; b < tempData.length; b++)
                    {
                        if (tempData[b].date.diff(moment(data[i].date), 'days') === 0)
                        {
                            dateItem = tempData[b];
                            break;
                        }
                    }

                    if (!dateItem)
                    {
                        console.log('DATE NOT FOUND');
                    }
                    else
                        dateItem.names.push(data[i].name);
                }

                for (var i = 0; i < tempData.length; i+=columns)
                {
                    var tmp = [];

                    for (var b = i; (b < i + columns) && b < tempData.length; b++) {
                        tmp.push(tempData[b]);
                    }

                    self.dateData.push(tmp);
                }
            });
        });
    });

    self.getStyle = function(column){
        if (self.totalAttendees > 0) {
            var colours = [
                '#27AE60',
                '#F39C12',
                '#F39C12',
                '#D35400',
                '#D35400',
                '#E74C3C',
                '#C0392B',
                '#C0392B',
                '#C0392B',
                '#C0392B'
            ];

            var calc = parseInt((column.names.length / self.totalAttendees) * 100);
            return {
                'background-color' : colours[parseInt(calc / 10)],
                'text-align':'center',
                'font-size':'20px',
                'color':'white',
                'border':'1px solid white',
                'padding': '30px'
            };
        }
        else
        {
            return {
                'background-color': '#BDC3C7',
                'text-align':'center',
                'font-size':'20px',
                'color':'white',
                'border':'1px solid white',
                'padding': '30px'
            };
        }
    }
});