//notification

var pg = require('pg').native;
var Pusher = require('pusher');
var pusher = new Pusher({
   appId: process.env.PusherAppId,
  key: process.env.PusherKey,
  secret: process.env.PusherSecret
});

//sends off Pusher notification messages to users who have an overlaping subscription zone
//POST /notification/send/:markerId
//params LAT, LON
exports.send = function(req, res) {
 	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    if (err )
      console.log(err);
    var markerId = req.params['markerId'];
    var lat = parseFloat(req.body['LAT']);
    var lon = parseFloat(req.body['LON']);
    var point = "POINT'(" +lat + ',' + lon + ")'";
    var queryString1 = 'SELECT USERID FROM SUBSCRIPTIONS JOIN BOXSUBZONES ON (SUBSCRIPTIONS.ZONEID = BOXSUBZONES.UID AND '+point+' <@ BOXSUBZONES.BOX) UNION SELECT USERID FROM SUBSCRIPTIONS JOIN CIRCLESUBZONES ON (SUBSCRIPTIONS.ZONEID = CIRCLESUBZONES.UID AND '+point+'<@ CIRCLESUBZONES.CIRCLE )';

    client.query(queryString1, [], function (error, rst){
      if( error ){
        console.log(error);
      }    
      else {
        console.log(rst.rows)
        for (var i =0; i < rst.rows.length; i++){
          pusher.trigger(rst.rows[i].userid,'new_marker',{'markerId':markerId, 'latitude':lat, 'longitude':lon})  
        }      
      }//else
    });//query
  });//pg
  res.send('ish')
};//send

