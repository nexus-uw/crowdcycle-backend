//api calls for Users
var pg = require('pg').native;
var uuid = require('node-uuid');
var dateFormat = require('dateformat');

//create user
//post /users/create body: UNAME, PSWD, EMAIL
exports.create = function (req, res){
  
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		if (err )
			console.log(err);
			//TODO: salt and hash passwords
	    var newID = uuid.v4();
	    var params =  [newID,req.body['UNAME'], req.body['PSWD'], dateFormat(new Date(), 'yyyy-mm-dd h:MM:ss')  , req.body['EMAIL']];	    	    
	    
	    client.query("select COUNT(EMAIL) from USERS where EMAIL = ($1)",[req.body['EMAIL']] , function (error, rst){
			if (error){
				res.json({result:"error",error:error});
				res.status(400);
				done();
				return;
			}
			else if (rst.rows[0].count > 0){
				res.json({result:"error", msg:"email already exists"});
				res.status(400);
				done();
				return;
			}	
			else {
				client.query("INSERT INTO USERS (UID, UNAME, PSWD, JOINED, EMAIL) VALUES ($1, $2, $3, $4, $5)",params , function (error, rst){			
					if (error){
							result = {result: "error", error:error}
                                                    res.status(400);
						}
					else{
                                                req.session.user_id = newID;
						result = {result:"success", uid:newID, msg:rst}
						done();
					}//else
					res.json(result);
				});//query
			}		
		});//query
	})//pg
};//create

//edit user
//post /users/edit/:id
exports.edit = function (req, res){
  var id = req.params['id'];
  if (id != req.session.user_id){
    res.json( {result : "error", error: "User tyring to edit another account."} );
    res.status(404);
    return;
  }
  if (!req.body['UNAME'] && !req.body['PSWD']){
    res.json( {result : "error", error: "No changes given."} )
    res.status(403);
    return;
  }
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		if (err ) 
			console.log(err);
    
    var hitIt = false;//did we already hit that?
    var queryString = "UPDATE USERS SET "
    if (req.body['UNAME']){
      queryString += "UNAME = "
      queryString += "'"+req.body['UNAME']+"'"
      hitIt = true
    } 
    if (req.body['PSWD']){
      if (hitIt)
        queryString += ", "
      queryString += "PSWD = "
      queryString += "'"+req.body['PSWD']+"'"
      hitIt = true
    }	  
    queryString += " WHERE UID = $1"
		client.query(queryString ,[id] , function (error, rst){
			if (error){
					result = {result: "error", error:error}
					res.status(403);
			}
      else if (rst.rowCount == 0){
        result = {result: "error", error:"user not found."}
        res.status(403);
      }
			else{
				result = {result:"success", msg:rst}				
			}//else
			res.json(result);
      done();
		});//query
	})//pg
};//edit

//list users (option to match given list of UIDs)
//GET /users/list
exports.list = function (req, res){
	pg.connect(process.env.DATABASE_URL, function(err, client, done){
		if( err ){
			console.log( err );
			done( client );
			return;			
		}// if
		client.query("SELECT uid,uname,joined, email FROM USERS", function (error, rst){
			if (error){
					result = {result: "error", error:error}
					res.status(403);
				}
			else{
				result = {result:"success", rowCount:rst.rowCount, rows:rst.rows}
				done();
			}//else
			res.json(result);
		})//query		
	}); // pg	
};//list

//delete the user
//post /users/delete/:id
exports.delete = function (req, res){
	var body = 'delete';
	var id = req.params['id'];
	if (id != req.session.user_id){
		res.json({ result:"error", error:"User tyring to delete another account."});
		res.status(403);
		return;
	}
	var result = new Array();
	pg.connect(process.env.DATABASE_URL, function(err, client, done){
		if( err ) {
			console.log( err );			
		}
		client.query('DELETE FROM USERS WHERE UID = $1', [id], function( error, rst){
			if( error ) {
				result = {result: "error", error:error};
			}
			else if (rst.rowCount == 0){
				result = {result : "error", error:"user not found."}
			}
			else {
				result = {result : "success", rowCount: rst.rowCount, rows:rst.rows};				
			}
			done();
			res.json(result);
		});// client
	});// post
};// delete user

//get user details
//get /users/details/:id
exports.details = function ( req, res ){
	var result = new Array();
	var id = req.params['id'];		
	var body = 'get details';

	pg.connect(process.env.DATABASE_URL, function(err, client, done){
		if( err ){
			console.log(err);
			done(client);
			res.json(500, { error: 'Something went wrong connecting PG'});
			res.status(403);
			return;
		}
		client.query("SELECT uid,uname,joined, email FROM USERS WHERE UID = $1", [id], function (error, rst){
			
			if( error ){
				result = {result:"error",error:error};
				res.status(403);
			}
			else if (rst.rowCount == 0){
				result = {result : "error", error:"user not found."}
				res.status(403);
			}
			else {
				result = {result:"success", rowCount: rst.rowCount, rows:rst.rows}
				done();
			}//else
			res.json( result );
		});// client query
	});// pgconnect
};
