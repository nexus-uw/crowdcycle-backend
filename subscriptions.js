//api calls for subscriptions

var pg = require('pg').native;
var uuid = require('node-uuid');

//create
//POST /subscriptions/create
exports.create = function (req, res) {
  var uid = uuid.v4().toString();
  var userId = req.session.user_id;
  var deviceId = req.body['DEVICEID'];
  var types = req.body['TYPES'];
  var zoneId = uuid.v4().toString();
  var zoneType = req.body['ZONETYPE'];
  var lat1 = parseFloat(req.body['LAT1']);
  var lon1 = parseFloat(req.body['LON1']);
  var lat2 = parseFloat(req.body['LAT2']);
  var lon2 = parseFloat(req.body['LON2']);
  var radius = parseFloat(req.body['RADIUS']);

  var isCircle = zoneType == "circle";
  var errMsg = "";
  if (!types)
    errMsg += "TYPES required. ";
  if (!deviceId)
    errMsg += "DEVICEID required. ";
  if (!zoneType || (zoneType != "circle" && zoneType != "box"))
    errMsg += "invalid ZONETYPE, must be one of either: circle, box. ";
  if (isCircle && (!lat1 || !lon1 || !radius))
    errMsg += "POINT and RADIUS required. "
  if (isCircle && radius && radius <= 0)
    errMsg += "RADIUS must be > 0. ";
  if (!isCircle && (!lat1 || !lon1 || !lat2 || !lon2))
    errMsg += "BOX required. ";
  if (errMsg.length > 0){
    res.json ({result:"error", error:errMsg});
    res.status(403);
    return;  
  }
  
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    if (err )
      console.log(err);

    client.query('INSERT INTO SUBSCRIPTIONS (UID, USERID,  DEVICEID,  TYPES, ZONETYPE,  ZONEID) VALUES ($1, $2, $3, $4, $5, $6)', 
      [uid,userId, deviceId,types,zoneType, zoneId ],
      function (error, rst){
        var result = ""
        if (error){
          result = {result : "error", error:error};
          res.status(403);
        }else{
          result = {result: "success", uid:uid};
          
          var queryString = 'INSERT INTO ';
          queryString += isCircle ? 'CIRCLESUBZONES' : 'BOXSUBZONES';
          queryString += ' (UID, SUBID, ';
          queryString += isCircle ? 'CIRCLE' : 'BOX';
          queryString += ') VALUES ( '
          queryString += "'" + zoneId + "'" + ', ';
          queryString += "'" + uid + "'" + ', ';
          if (isCircle)
            queryString += "'((" + lat1 + "," + lon1 + ")," + radius + ")'";
          else 
            queryString += "'((" + lat1 + "," + lon1 + "),(" + lat2 + "," + lon2 + "))'";
          queryString += ')';
          console.log (queryString);
                    
          client.query(queryString,[], function (err, rst){
            if (err){
              res.json({result:"error", error:err });
              res.status(403);
              done(client);
            }
            res.json(result);
            done();
          });//query INSERT subzone*/          
        }        
      });//query INSERT sub
  });//pg
};//CREATE

//delete
//POST /subscriptions/delete/:id
exports.delete = function (req, res) {
  var uid = req.params['id'];
  var userId = req.session.user_id;
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    if (err )
      console.log(err);

    client.query('DELETE FROM SUBSCRIPTIONS WHERE UID = $1 AND USERID = $2 RETURNING ZONETYPE', 
      [uid, userId],
      function (error, rst){
        var result = "";
        if (error){
          res.json({result:"error", error:err });
          res.status(403);
          done(); 
        }
        else if (rst.rowCount == 0){
          res.json({result:"error", error:"subscription and owner not found."});
          res.status(403);
          done();
        }
        else{
          result = {result:"success"}
          var queryString = 'DELETE FROM ';
          queryString += (rst.rows[0].zoneType == 'circle') ? 'CIRCLESUBZONES' : 'BOXSUBZONES'; 
          queryString += ' WHERE SUBID = $1';
          client.query(queryString, [uid],
            function (error, rst){
             if (error){
              result = {result:"error", error:error};
              res.status(403);
            }
            res.json(result);
            done();              
            });//delete ___subzones
          }//else
        });//delete subscriptions
      });//pg
};//delete

//list
exports.list = function (req, res) {
  res.end('todo ');
};

//get all subscriptions for a user
exports.user = function (req, res) {
  var userId = req.session.user_id ;//|| 'b8a96f0b-5b34-4722-af52-fc3d77f9e60c';
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    if (err )
      console.log(err);
    //todo, this is broken. SR july 11
    client.query("SELECT * FROM SUBSCRIPTIONS JOIN BOXSUBZONES ON (SUBSCRIPTIONS.ZONEID = BOXSUBZONES.UID) WHERE USERID = $1", 
      [userId],
      function (error, rst){
        if (error){
          res.json({result:"error", error:error});
          res.status(403);
        }
        else{
          var resultCount = rst.rowCount;
          var circleCount = resultCount;
          var result = rst.rows;
          console.log(rst.rows)

          client.query("SELECT * FROM SUBSCRIPTIONS JOIN CIRCLESUBZONES ON (SUBSCRIPTIONS.ZONEID = CIRCLESUBZONES.UID) WHERE USERID = $1", 
          [userId],
          function (err, rs){
            if (err){
              res.json({result:"error", error:err});
              res.status(403);
            }
            else{
              resultCount += rs.rowCount;
              res.json({result:"success", rowCount:resultCount, boxCount: rs.rowCount, boxes: rs.rows, circleCount: circleCount, circles:result});              
              //SR TODO: can strip certain columns from this
            }
            done(client);
          });//query select
        }//else
      });//query select
  });//pg  
};//user
