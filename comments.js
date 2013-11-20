//api calls for comments
var pg = require('pg').native;
var uuid = require('node-uuid');
var dateFormat = require('dateformat');
//

//create comment
//post /comments/create/:markerId body: TEXT
// url:/markers/create/:markerId?TEXT=____
exports.create = function (req, res) {
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		if( err ) {
			console.log( err );			
		}
		
		var newCommentId = "'" + uuid.v4().toString() + "'";
		var text = "'" + req.body['TEXT'] + "'";
		var creatorId = "'" + req.session.user_id + "'";
		var created = "'" + dateFormat(new Date(), 'yyyy-mm-dd h:MM:ss') + "'";
		var markerId = "'" + req.params['markerId'] + "'";
		
		var queryString = "INSERT INTO COMMENTS (UID, TEXT, CREATORID, CREATED, MARKERID) VALUES (";
			queryString += newCommentId;
			queryString += ", ";
			queryString += text;
			queryString += ", ";
			queryString += creatorId;
			queryString += ", ";
			queryString += created;
			queryString += ", ";
			queryString += markerId;
			queryString += ")";
		
		client.query( queryString, [], function( error, rst ) {
			if( error ){
				result = {result: "error", error:error };				
				res.status(403);
			}
			else {
				result = {result: "success", commentid:newCommentId, msg:rst };
				done();
			}
			res.json(result);
		});// query

	});// pg	
};

//delete
//POST /comments/delete/:id
exports.delete = function (req, res) {
	var commentId = req.params['id'];

	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		if( err ) {
			console.log( err );			
		}
		

		var queryStr = "DELETE FROM COMMENTS WHERE UID = '" +commentId +"' AND CREATORID = '"+req.session.user_id +"'";
		client.query( queryStr,[], function(error, rst){
			if( error ) {
				result = {result: "error", error:error };
				res.status(403);
			}
			else if (rst.rowCount == 0 ){
				result = {result:"error", error:"comment & owner not found."}
				res.status(403);
			}
			else {
				result = {result: "success", msg:"done" };
			}
			res.json(result);
			done(client);
		}); 			
	});// pg
};//Delete

//get comments for a marker
exports.list = function (req, res) {
	var id = req.params['markerId'];
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		if( err ) {
			console.log( err );			
		}
		var queryString = "SELECT C.*, C.UID AS COMMENTID, U.UNAME, U.EMAIL, U.UID FROM COMMENTS AS C, USERS as U WHERE MARKERID =";
		queryString += "'" + id + "'";
		queryString += " AND U.UID = C.CREATORID";
		client.query(queryString, [], function(error, rst){
			if( error ) {
				result = {result: "error", error:error };
				res.status(403);
			}
			else if (rst.rowCount == 0 ){
				result = {result:"error", error:"No comments found for marker."}
				res.status(403);
			}
			else {	
				result = {result: "success", rowCount:rst.rowCount, rows:rst.rows};
			}
			res.json(result);
			done(client);
		}); 			
	});// pg
};

