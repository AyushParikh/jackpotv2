const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const passport = require("passport");

// Load input validation
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");

// Load User model
const User = require("../../models/User");

// @route POST api/users/register
// @desc Register user
// @access Public
router.post("/register", (req, res) => {
  // Form validation

  const { errors, isValid } = validateRegisterInput(req.body);

  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      return res.status(400).json({ email: "Email already exists" });
    } else {
      const newUser = new User({
        name: req.body.name,
        email: (req.body.email).toLowerCase(),
        password: req.body.password
      });

      // Hash password before saving in database
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
  });
});

router.post("/getbalance", (req, res) => {
  const _id = req.body.id;

  User.findOne({ _id }).then(user => {
    // Check if user exists

    if (!user) {
      return res.status(404).json({ idnotfound: "Id not found" });
    }

    return res.status(200).json({balance : user.balance})
  });

});

router.post("/updatebalance", (req, res) => {
  const _id = req.body.id;
  const amount = req.body.amount;
  User.updateOne({ _id }, {$inc: {balance:Math.round(amount*100)/100}}, function (err, user) {
    if (err){
      return res.status(404).json({ idnotfound: "Id not found" });
    } else {
      return res.status(200).json({success : _id +" has been updated."});
    }
  })
});


// @route POST api/users/login
// @desc Login user and return JWT token
// @access Public
router.post("/login", (req, res) => {
  // Form validation
  const { errors, isValid } = validateLoginInput(req.body);

  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }

  const email = (req.body.email).toLowerCase();
  const password = req.body.password;

  // Find user by email
  User.findOne({ email }).then(user => {
    // Check if user exists
    if (!user) {
      return res.status(404).json({ emailnotfound: "Email not found" });
    }

    // Check password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // User matched
        // Create JWT Payload
        const payload = {
          id: user.id,
          name: user.name,
          balance: user.balance
        };

        // Sign token
        jwt.sign(
          payload,
          keys.secretOrKey,
          {
            expiresIn: 31556926 // 1 year in seconds
          },
          (err, token) => {
            res.json({
              success: true,
              token: "Bearer " + token
            });
          }
        );
      } else {
        
        return res
          .status(400)
          .json({ passwordincorrect: "Password incorrect" });
      }
    });
  });
});

function subBal(_id, amount){
  amount=amount*-1;
  User.updateOne({ _id }, {$inc: {balance:Math.round(amount*100)/100}}, function (err, user) {
    if (err){
      console.log("Id not found")
    } else {
      console.log(_id +" has been updated.")
    }
  })
}

function addBal(_id, amount){
  User.updateOne({ _id }, {$inc: {balance:Math.round(amount*100)/100}}, function (err, user) {
    if (err){
      console.log("Id not found")
    } else {
      console.log(_id +" has been updated.")
    }
  })
}

function calcWinner(players, jackpot){
	console.log(players);
	var number = Math.ceil((Math.random() * jackpot*100));
	var i = 0;
	while( number>0){
		number -= players[i][1];
		i++;
	}

	console.log(players[i-1][0]);
	return players[i-1][0];
}

const webSocketPort = 3001;
var time = 30;
var total_pot = 0;
var players = [];
var WebSocketServer = require("ws").Server, wss = new WebSocketServer({ port : webSocketPort });
wss.on('close', function(){
	console.log("disconnected");
});

wss.onmessage = function(event) {

};

wss.on('connection', (ws, req) => {
	//ws.send(time + " seconds left till next Jackpot!");
	ws.uuid = req.url.replace('/?token=', '')
	ws.on('message', (event) => {
		var data = event.split(",");
		data[1]=Math.ceil(parseFloat(data[1]) * 100);
		players.push(data);
		subBal(data[0], Math.round(parseFloat(data[1]))/100  );
		total_pot += parseFloat(data[1])/100;
		// wss_log.broadcast(data[0], data[1]/100)
	});
})

wss.broadcast = function (time, pot, winner) {
	if (winner != 0){
		//fs.writeFile('current_game.txt', "", function (err) { });
		for (let ws of this.clients){
			if (ws.uuid == winner){
				ws.send("You won $" + Math.round(total_pot*0.99*100)/100 + "!");
			} else {
				ws.send("You lost.");
			}
		}
	} else {
		for (let ws of this.clients){
			ws.send(time + " seconds left till next Jackpot! ($" + pot + ")");
		}
	}
	
}

setInterval(()=>{
	console.log(time + " seconds left till next Jackpot!");
	wss.broadcast(time,Math.round(total_pot*100)/100,0);
	if (time == 0){
		if (players.length>0){
			var winner = calcWinner(players,Math.round(total_pot*100)/100);
			addBal(winner,Math.round(total_pot*0.99*100)/100);
			wss.broadcast(time,total_pot,winner);
			//wss_games.broadcast(winner, total_pot);
		}
		total_pot = 0;
		players = [];
		time = 30;
	} else {
		time -= 1;
	}
}, 1000);



module.exports = router;
