app.controller('dateReportController', function ($scope, $routeParams, $location, dateReport, eventUsers, $q) {

    var self = this;
    self.eventId = $routeParams.id;

    self.fail = false;
    self.success = false;
    self.totalAttendees = 0;

    self.dateData = [];

    $q.all(
        eventUsers.query({id:self.eventId}, function(data){
          self.totalAttendees = data.length;
        })
    ).then(function(){
        dateReport.query({id: self.eventId}, function(data){
            //[{"date":"2016-12-08T00:00:00Z","name":"Aaron Rhodes"},{"date":"2016-12-06T00:00:00Z","name":"Aaron Rhodes"}]

            var tempData = [];

            for (var i = 0; i < data.length; i++)
            {
                var dateItem = null;

                for (var b = 0; b < tempData.length; b++)
                {
                    if (tempData[b].date === data[i].date)
                    {
                        dateItem = tempData[b];
                        break;
                    }
                }

                if (!dateItem)
                {
                    dateItem = tempData[tempData.push({ date: data[i].date, names : [] }) - 1];
                }

                dateItem.names.push(data[i].name);
            }

            for (var i = 0; i < tempData.length; i+=4)
            {
                var tmp = [];

                for (var b = i; (b < i + 4) && b < tempData.length; b++) {
                    tmp.push(tempData[b]);
                }

                self.dateData.push(tmp);
            }
        });
    });

    self.getStyle = function(column){
        if (self.totalAttendees > 0) {
            var colours = [
                '#C0392B',
                '#C0392B',
                '#D35400',
                '#D35400',
                '#E67E22',
                '#E67E22',
                '#F39C12',
                '#F39C12',
                '#27AE60',
                '#27AE60'
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