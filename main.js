var express = require('express')
 , markers = require('./markers')
 , users = require('./users')
 , comments = require('./comments')
 , subscriptions = require('./subscriptions')
 , notifications = require('./notification.js')
 , http = require('http')
 , path = require('path')
 , pg = require('pg').native;

var store = new express.session.MemoryStore;
var app = express();
// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({secret:'secret', store:store}));//sr: need some proper values here later
app.use(app.router);
			
// development only
if ('development' == app.get('env')) {
   app.use(express.errorHandler());
}

function checkAuth(req, res, next) {
	if (!req.session.user_id) {
		console.log('not auth')
		res.send('You are not authorized to view this page');
	 } else {
	   next();
	 }
};

app.post('/login', function (req, res) {
	var post = req.body;
	//TODO put user login stuff here
	pg.connect(process.env.DATABASE_URL, function(err, client, done){
	if( err ){
		console.log(err);
		done(client);
		return;
	}
	client.query("SELECT UID FROM USERS WHERE EMAIL = $1 AND PSWD = $2", [post.user, post.password], function (error, rst){
		if( error ){
			result = {result:"error",error:error};
			res.json(result);
		}
		else if (rst.rowCount == 0){
			res.json({result:'Bad user/pass'});
                        res.status(401);
		}
		else {
			req.session.user_id = rst.rows[0].uid;
			res.json({result:'success', uid:rst.rows[0].uid});
		}//else
		done(client);		
	});// client query
});// pgconnect
});

app.get('/logout', function (req, res) {
	delete req.session.user_id;
	res.json({result:'success'});
});

//since Heroku will spin down single instance apps, we need a simple request that can be sent on app load to wake up the server without having to care about the response time
app.post('/', function (req,res){
	res.send('i am awake');
});
app.get('/', function (req,res){
	res.send('i am awake');
});

app.post('/markers/create',checkAuth, markers.create);
app.post('/markers/edit/:id',checkAuth, markers.edit);
app.get('/markers/vote/:id',checkAuth, markers.vote);//todo restore auth
app.get('/markers/list',markers.list);
app.get('/markers/details/:id',markers.details);
app.post('/markers/delete/:id',checkAuth, markers.delete);

app.post('/users/create', users.create);
app.post('/users/edit/:id',checkAuth, users.edit);
app.get('/users/list',checkAuth, users.list);
app.post('/users/delete/:id',checkAuth, users.delete);
app.get('/users/details/:id', checkAuth, users.details);

app.post('/comments/create/:markerId',checkAuth, comments.create); 
app.post('/comments/delete/:id',checkAuth, comments.delete);
app.get('/comments/list/:markerId',comments.list);

app.post('/subscriptions/create',checkAuth, subscriptions.create);
app.post('/subscriptions/delete/:id', checkAuth,  subscriptions.delete);
app.get('/subscriptions/user',checkAuth, subscriptions.user);

app.post('/notifcation/:markerId', notifications.send)

app.use(function(err, req, res, next){
	  console.error(err.stack);
	  res.send(500, 'Something broke!');
});

http.createServer(app).listen(app.get('port'), function(){
	  console.log('Express server listening on port ' + app.get('port'));
});
