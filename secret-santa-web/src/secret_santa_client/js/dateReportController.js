app.controller('dateReportController', function ($scope, $routeParams, $location, dateReport) {

    var self = this;
    self.eventId = $routeParams.id;

    self.fail = false;
    self.success = false;

    self.dateData = [];

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