
/* Includes */
var express = require("express");
var bodyParser = require("body-parser");
var mongo = require("mongodb"),
	MongoClient = mongo.MongoClient,
	ObjectId = mongo.ObjectId;

var assert = require("assert");
var cookieParser = require("cookie-parser");

const ST_PREGAME = 0, ST_RUNNING = 1, ST_POSTGAME = 2;


var db;

MongoClient.connect("mongodb://localhost:27017/search", function(err, database)
{
	assert.equal(null, err);
	db = database;
	console.log("Database ready.");
});

var app = express();

/* Static Routes */
app.use(express.static("public"));
app.use("/bower",express.static("bower_components"));

/* Request Body Parsing */
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/* Signed Cookies */
app.use(cookieParser("the mystery of the ages"));

app.all("*", function(req, res, next)
{
	if (req.signedCookies.session)
	{
		db.collection("users").find({_id:new ObjectId(req.signedCookies.session.user)}, { password: 0 }).each(function(err, user)
		{
			if (user)
			{
				req.user = user;
				next(); return false;
			}
			else
			{
				console.log(req.signedCookies.session);
				next();
			}
		});
	}
	else
	{
		next();
	}
});

/* Login / Register */
app.post("/api/login", function(req, res)
{
	db.collection("users").find({email:req.body.email}).each(function(err, user)
	{
	
		if (user == null)
		{
			res.json({Result: "Error", Message: "Invalid Username or Password"});
			return;
		}
	
		// validate password
		if (user.password != req.body.password)
		{
			res.json({ Result: "Error", Message: "Invalid Username or Password"});
			return false;
		}
		
		// set cookie
		res.cookie("session", { user: user._id }, { signed: true });
		res.json({
			Result: "Success", User: { name: user.name, email: user.email }
		});
		return false;
	});
});

app.post("/api/register", function(req, res)
{
	// TODO validate not already in system
	var users = db.collection("users");
	users.insertOne({
		email: req.body.email,
		password: req.body.password,
		name: req.body.name
	}, function(err, r)
	{
		assert.equal(null, err);
		assert.equal(1, r.insertedCount);
	
		users.find({email:req.body.email}).each(function(err, doc)
		{
			res.cookie("session", { user: doc._id }, {signed: true });
			res.json({
				Result: "Success", User: { name: doc.name, email: doc.email }
			});
			return false;
		});
	});
});

app.get("/logout", function(req, res)
{
	res.clearCookie("session");
	res.redirect("/");
});

app.get("/api/status", function(req, res)
{
	if (req.user)
	{
		res.json({ User: {
			name: req.user.name,
			email: req.user.email
		}});
	}
	else
	{
		res.json({ Result: "Error", Message: "Not logged in." });
	}
});

app.post("/api/game/create", function(req, res)
{
	if (req.user)
	{
		// TODO validate
		
		var game = {
			title: req.body.title,
			owner: req.user._id,
			create: new Date(),
			state: ST_PREGAME
		};
		
		db.collection("games").insertOne(game, function(err, r)
		{
			res.json({ Result: "Success" });
		});
	}
	else
	{
		res.json({ Result: "Error", Message: "Not logged in." });
	}
});

app.get("/api/game/list", function(req, res)
{
	var games = [];
	db.collection("games").find({ $or: [ {state: ST_PREGAME}, {state: ST_RUNNING}] }, { title: 1, create: 1, state: 1 }).each(function(err, game)
	{
		if (game)
		{
			games[games.length] = game;
		}
		else
		{
			res.json( {Result: "Success", games: games });
		}
	});
});

app.get("/api/game/info/:game_id", function(req, res)
{
	db.collection("games").find({ _id: new ObjectId(req.params.game_id)}).each(function(err, game)
	{
		if (game)
		{
			res.json({ Result: "Success", game: game });
			return false;
		}
		res.json({ Result: "Error", Message: "Invalid Id" });
	});
});

app.listen(3000, function()
{
	console.log("Server ready.");
});
