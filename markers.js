//marker functions

var pg = require('pg').native;
var http = require('http');
var uuid = require('node-uuid');
var dateFormat = require('dateformat');


//create a marker
//POST /markers/create?LAT=__&LON=___&MARKERTYPE=____&TITLE=____&DESCRIPTION=____" 
exports.create = function(req, res) {
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		if (err )
			console.log(err);
		var uid = "'" + uuid.v4().toString() + "'";
		//note: x = lat, y = lon
		var point = "POINT ( " +parseFloat(req.body['LAT']) + ' , ' + parseFloat(req.body['LON']) + " )";
		var markerType = "'" + req.body['MARKERTYPE'] +"'";
		var created = "'" + dateFormat(new Date(), 'yyyy-mm-dd h:MM:ss') + "'";
		var modified = created;
		var ownerID = "'" + req.session.user_id + "'";//"'" + uuid.v4().toString()+ "'";
		var upVotes = 0;
		var downVotes = 0;
		var title = "'" + req.body['TITLE']+ "'";
		var des = "'" + req.body['DESCRIPTION']+ "'";

    var queryString = "INSERT INTO MARKERS (UID, POINT, MARKERTYPE, CREATED, MODIFIED,UPVOTES,DOWNVOTES,TITLE,DESCRIPTION,OWNERID)  VALUES (";
    queryString += uid;
    queryString +=", "
    queryString += point
    queryString += ", "
    queryString += markerType//SR note: dangerzone?
    queryString += ", "
    queryString += created
    queryString += ", "
    queryString += modified
    queryString += ", "
    queryString += "0"
    queryString += ","
    queryString += "0"
    queryString += ", "
    queryString += title
    queryString += ", "
    queryString += des
    queryString += ", "
    queryString += ownerID
    queryString += ")"
		client.query(queryString,
								[],
								function (error, rst){
			if (error){
					result ={result: "error", error:error};
          res.status(403);
				}
			else{
        result = {result:"success",uid:uid}
        //send off req to send out push notifications, we dont care what or when this returns
        var request = http.request({port: (process.env.PORT || 3000), method:'POST', path:'/notification/' + uid});
        request.write("LAT="+parseFloat(req.body['LAT'])+"&LON="+parseFloat(req.body['LAT']));
        request.end();
        
				done();
			}//else
      res.json(result);
		});//query
	})//pg
};//create

//edit a marker
//POST /markers/edit/:id 
exports.edit = function(req, res) {
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    if (err )
      console.log(err);
    var uid = req.params['id'];
    var ownerId = req.session.user_id;
    var modified = "'" + dateFormat(new Date(), 'yyyy-mm-dd h:MM:ss') + "'"
    var queryString = "UPDATE MARKERS SET MODIFIED=";
    queryString += modified;
    
    if (req.body['MARKERTYPE']) {
      var markerType = "'" + req.body['MARKERTYPE'] +"'";
      queryString += ", "
      queryString += "MARKERTYPE="
      queryString += markerType//SR note: dangerzone?
    }
    
    if (req.body['TITLE']){
      var title = "'" + req.body['TITLE']+ "'";
      queryString += ", "
      queryString += "TITLE="
      queryString += title
    }
    if (req.body['DESCRIPTION']){
      var des = "'" + req.body['DESCRIPTION']+ "'";    
      queryString += ", "
      queryString += "DESCRIPTION="
      queryString += des
    }
       
    queryString += ' WHERE UID = $1 AND OWNERID = $2';

    console.log(queryString);
    client.query(queryString,
                [uid,ownerId],
                function (error, rst){
      if (error){
          result = {result:"error",error:error};
          res.status(403);
        }
      else if (rst.count == 0){
        result = {result:"error", error:"no marker found"};
        res.status(403);
      }
      else{
        result = {result:"success"}
        done();
      }//else
      res.json(result);
    });//query
  })//pg
};//edit

//delete a marker
//POST /markers/delete/:id
//TODO need to also delete all votes associated with the marker
exports.delete = function(req, res) {
	var body = 'delete';
	var id = req.params['id'];
	var userId = "" + req.session.user_id 
	var result = new Array();
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		if (err )
			console.log(err);

		client.query('DELETE FROM MARKERS WHERE UID = $1 AND OWNERID = $2',[id, userId], function (error, rst){
			if (error){
					result = {result:"error",error:error}
          res.json(result);
          res.status(403);
          done(client)
          return
			}
      else if (rst.rowCount == 0){
        result = {result:"error", error:"no matching user and marker"}
        res.json(result);
        res.status(403);
        done(client);
        return
      }
			else{
        result = {result:"success",rowCount : rst.rowCount };
        client.query('DELETE FROM VOTES WHERE MARKERID = $1',[id], function (error, rst){
          if (error){
            result = {result:"error",error:error};
            res.json(result);
            res.status(403);            
          }
          else {
            client.query('DELETE FROM COMMENTS WHERE MARKERID = $1',[id], function (error, rst){
              if (error){
                result = {result:"error",error:error};
                res.status(403);
              }
              res.json(result);
              done();
            })//delete comments
          }//else          
        });//query DELETE VOTES       
			}//else			
		});//query DELETE MARKER
	});//pg
};//delete

//get marker details
exports.details = function(req, res) {
	var body = 'get details';
	var id = req.params['id'];
	console.log(req.session);	
	console.log(id)
	var result = new Array();
		pg.connect(process.env.DATABASE_URL, function(err, client, done) {
			if (err ){
				console.log(err);
				done(client);
				return;
			}	
			client.query("SELECT * FROM MARKERS WHERE UID = $1",[id], function (error, rst){
				if (error){
						result = {result:"error",error:error};
            res.status(403);
				}
        else if (rst.rowCount == 0){
          result = {result:"error",error:"marker not found"};
          res.status(403);
        }
				else{
					result = {result:"success",rowCount:rst.rowCount, rows:rst.rows}					
				}//else
        res.json(result);
        done();
			});//query
		});
};//details

//get markers
///markers/list?LAT1=__&LON1=___&LAT2=___&LON2=___
exports.list = function (req, res) {
	var body = 'get markers';
	var result = new Array();
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		if (err){
			console.log(err);
			done(client);
			return;
		}
    //note: x = lat, y = lon
		var queryString = "SELECT * FROM MARKERS"
		if (req.query && req.query['LAT1'] && req.query['LON1'] && req.query['LAT2'] && req.query['LON2']){
			queryString += " WHERE point <@ box '(("
			queryString += parseFloat(req.query['LAT1'])
			queryString += ","
			queryString += parseFloat(req.query['LON1'])
			queryString += "),("
			queryString += parseFloat(req.query['LAT2'])
			queryString += ","
			queryString += parseFloat(req.query['LON2'])
			queryString += "))'"
		}  
		var query = client.query(queryString, function (error, rst) {
			if (error){
				result = {result:"error",error:error};
        res.status(403);
      }
			else {
                            var comma;
                            for (var i = 0; i < rst.rows.length; i++) {
                                comma = rst.rows[i].point.indexOf(',');
                                rst.rows[i]['latitude'] = parseFloat(rst.rows[i].point.substr(1, comma - 1));
                                rst.rows[i]['longitude'] = parseFloat(rst.rows[i].point.substr(comma + 1, rst.rows[i].point.length - 2));
                            }
                            console.log(rst.rows[0]);
					result = {result:"success", rowCount:rst.rowCount, rows:rst.rows}				
			}//else
      res.json(result);
      done();
		});//query
	});//pg
};//list

//vote on a marker
//markers/vote/:id
exports.vote = function(req, res) {
	var body = 'vote';
  var markerId = req.params['id'];
  var userId = "" + req.session.user_id; 
  var vote = parseInt(req.query['VOTE']) 
  if (vote != -1 && vote != 1){
    res.json({result:"error", error:"one person, one vote (ie. vote must be -1 or 1)"});
    res.status(403);
    return;
  }
  //check if the user has already voted
  //  if so delete it
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    if (err )
      console.log(err);
    var previousVote = 0
    //check if they have already voted
    
    client.query('Select VOTE FROM VOTES WHERE MARKERID = $1 AND USERID = $2',[markerId, userId], function (error, rst){
      if (error){
        res.json({result:"error",error:error});
        res.status(403);
        done(client);
        return;
      }
      //if they did vote, 
      // check that they are not voting the same again
      // if not, delete the old vote
     else if (rst.rowCount > 0){
        previousVote = rst.rows[0].vote
        if (previousVote == vote){
          res.json({result:"error",error:"can not cast the same vote twice"});
          res.status(403);
          done(client);
          return;
        }

       client.query('DELETE FROM VOTES WHERE MARKERID = $1 AND USERID = $2',[markerId, userId], function (error, rst){
          if (error){
            res.json({result: "error",error:error});
            res.status(403);
            done(client);
            return;
          }
        });//query DELETE
      }
      
      var upvoteChange = 0;
      var downVoteChange = 0;
      if (previousVote == -1){
        upvoteChange = 1
        downVoteChange = -1
      }
      else if (previousVote == 1){
        upvoteChange = -1
        downVoteChange = 1
      }
      else if (vote == 1){
        upvoteChange = 1
      }
      else if (vote == -1){
        downVoteChange = 1
      }   
      client.query('UPDATE MARKERS SET UPVOTES = UPVOTES + $1, DOWNVOTES = DOWNVOTES + $2 WHERE UID = $3 RETURNING UPVOTES, DOWNVOTES',[upvoteChange, downVoteChange, markerId], function (error, rst){
        if (error){
          result = {result: "error",error:error}
          done(client)
          res.json(result);
          res.status(403);
          return
        }
        else if (rst.rowCount == 0){
          result = {result:"error", error:"No marker found"} 
          res.json(result);
          done(client)
          res.status(403);
          return
        }
        else{
            console.log(rst)
           var newUpVotes = rst.rows[0].upVotes
           var newDownVotes =rst.rows[0].downVotes
           //create new vote obj
          var uid = "" + uuid.v4().toString();
          client.query('INSERT INTO VOTES (UID, MARKERID, USERID, VOTE) VALUES ($1 , $2, $3, $4)',[uid,markerId, userId, vote], function (error, rst){
            if (error){
              result = {result: "error",error:error};
              res.status(403);              
              res.json(result);
              done(client)
            }
            else if (rst.rowCount == 0){
              result = {result:"error", error:"Failed to add new vote"} 
              res.json(result);
              res.status(403);
              done(client)
              return
            }
            else{
                var result = new Array();
                                client.query("SELECT * FROM MARKERS WHERE UID = $1",[markerId], function (error, rst){
                                        if (error){
                                                        result = {result:"error",error:error};
                    res.status(403);
                                        }
                else if (rst.rowCount == 0){
                  result = {result:"error",error:"marker not found"};
                  res.status(403);
                }
                                        else{
                                                result = {result:"success",rowCount:rst.rowCount, rows:rst.rows}					
                                        }//else
                res.json(result);
                done();
                                });//query
            }
          });//query INSERT
        }//else
       });//query UPDATE
    });//query   SELECT
  });//pg
};//vote


