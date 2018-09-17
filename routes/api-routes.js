// Requiring our models and passport as we've configured it
var db = require("../models");
var passport = require("../config/passport");

module.exports = function(app) {
  // Using the passport.authenticate middleware with our local strategy.
  // If the user has valid login credentials, send them to the members page.
  // Otherwise the user will be sent an error
  app.post("/api/login", passport.authenticate("local"), function(req, res) {
    // Since we're doing a POST with javascript, we can't actually redirect that post into a GET request
    // So we're sending the user back the route to the members page because the redirect will happen on the front end
    // They won't get this or even be able to access this page if they aren't authed
    res.json("/members");
  });

  // Route for signing up a user. The user's password is automatically hashed and stored securely thanks to
  // how we configured our Sequelize User Model. If the user is created successfully, proceed to log the user in,
  // otherwise send back an error
  app.post("/api/signup", function(req, res) {
    console.log(req.body);
    db.User.create({
      email: req.body.email,
      password: req.body.password
    }).then(function() {
      res.redirect(307, "/api/login");
    }).catch(function(err) {
      console.log(err);
      res.json(err);
      // res.status(422).json(err.errors[0].message);
    });
  });

  // Route for logging user out
  app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
  });

  // Route for getting some data about our user to be used client side
  app.get("/api/user_data", function(req, res) {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      res.json({});
    } else {
      // Otherwise send back the user's email and id
      // Sending back a password, even a hashed password, isn't a good idea
      res.json({
        email: req.user.email,
        id: req.user.id
      });
    }
  });
  app.get("/api/top_scores/:gameId", function(req, res){
    var gameId = req.params.gameId;
    db.Score.findAll({
      limit:5,
      attributes:["gamescore"],
      where:{
        gameId:gameId
      },
      order:[["gameScore", "DESC"]]
    }).then(function(dbScores){
      res.json(dbScores);
    });
  });
  // users score &&& game title
  app.get("/api/userdata/:userId", function(req, res){
    db.Score.findAll(
      {
        where:{
          userId: req.params.userId
        },
        include:[db.Game],
        order:[["gameId", "ASC"]]
      }
    ).then(function(dbScore){
      var newArrayofScores =[];
      dbScore.forEach(function(item){
        var newObject ={
          gameTitle: item.Game.gameTitle,
          gameScore: item.gameScore
        };
        newArrayofScores.push(newObject);
      });
      res.json(newArrayofScores);
    });
  });
  app.post("/api/newscore/:id", function(req,res){
    db.Score.create({
      gameScore: req.body.gameScore,
      gameId:req.body.gameId,
      userId: req.body.userId
    }).then(function(dbScore){
      res.json(dbScore);
    });
  });
  app.post("/api/newChallenge/",function(req, res){
    var challenger = req.body.challengerId;
    var toBeChallenge = req.body.ToBeChallengeId;
    var post = req.body.post;
    var gameId = req.body.gameId;
    db.Challenge.create({
      post: post,
      challengerId: challenger,
      ToBeChallengeId: toBeChallenge,
      gameId: gameId
    }).then(function(dbChallege){
      res.json(dbChallege);
    });
  });
  app.get("/api/userdata/challenges/:challengerId", function(req, res){
    db.Challenge.findAll(
      {
        where:{
          challengerId: req.params.challengerId
        },
        order:[["createdAt", "ASC"]]
      }
    ).then(function(dbScore){
      res.json(dbScore);
    });
};