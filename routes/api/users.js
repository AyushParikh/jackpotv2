const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const passport = require("passport");
const fs = require('fs');
const readline = require('readline');
const { exec } = require("child_process");
// Load input validation
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");
// Load User model
const User = require("../../models/User");
const Stats = require("../../models/Stats");
const axios = require('axios');
const nodemailer = require('nodemailer');


const senderMail = 'ayushparikh.jackpot@gmail.com';

const emailTransporter = nodemailer.createTransport({
            host: 'smtp.mail.gmail.com',
            port: 465,
            service:'gmail',
            secure: false,
            auth: {
               user: senderMail,
               pass: 'Jackpot123@'
            },
            debug: false,
            logger: false
});

$ADMINID = "5e2777eaa654251431b68e4f";
$ADMINADDRESS = "1JLsZP9SDgv2it27EAFtHDYwT6EW869MFA";

function sendtx(_id, to, amount, original_id){
  User.findUser.findOne({ _id }).then(user => {
    
    if (!user) {
      return { idnotfound: "User not found" };
    }
    var from = user.address;
    var public_key = user.public_key;
    var private_key = user.private_key;
    var cmd = 'curl -d \'{"inputs": [{"addresses": ["'+from+'"]}], "outputs": [{"addresses": ["'+to+'"], "value": '+amount+'}]}\' http://api.blockcypher.com/v1/btc/main/txs/new';

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
          console.log(`error: ${error.message}`);
          return 400;
      }
      if (stderr) {
          //console.log(`stderr: ${stderr}`);
      }
      if (stdout) {
        var send = JSON.parse(stdout);
        for (var i = 0; i < send.tosign.length; i++){
          exec('./signer.exe ' + send.tosign[i] + ' ' + private_key, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return 400;
            }
            if (stderr) {
                //console.log(`stderr: ${stderr}`);
                return 400;
            }
            if (stdout) {
              if (!send.signatures){
                send.signatures = [stdout.replace(/^\s+|\s+$/g, '')];
                send.pubkeys = [public_key];
              } else {
                send.signatures.push(stdout.replace(/^\s+|\s+$/g, ''));
                send.pubkeys.push(public_key);
              }
            }
            if (i == send.tosign.length){
              var subbed = false;
              exec("curl -d '"+JSON.stringify(send)+"' http://api.blockcypher.com/v1/btc/main/txs/send", (error, stdout, stderr) => {
                if ("errors" in send){
                  console.log('errors: ' + JSON.stringify(send.errors));
                  console.log("Something went wrong sending bitcoin: ", original_id, amount);
                  return 400;
                } else {
                  //console.log(send);
                  if (original_id == true){
                    console.log("Successfully deposited bitcoin to admin: ", original_id, amount);
                  } else {
                    console.log("Successfully withdrew bitcoin: ", original_id, amount);
                    if (subbed == false){
                      console.log("Subtracting amount.");
                      subBal(original_id, amount+50000);
                      subbed = true;
                    }
                        
                  }
                  return 200;
                }
              });
            }
          });
        }
      }
    });
  });
}

router.post("/withdraw", (req, res) => {
  var _id = req.body._id;
  var to = req.body.address;
  var amount = parseFloat(req.body.amount);
  var password = req.body.password;

  console.log("Withdrawing: " , _id,to,amount,password);

  //check if they have enough balance
  User.findOne({ _id }).then(user => {
    // Check if user exists
    if (!user) {
      return res.status(404).json({ idnotfound: "Id not found" });
    }

    if (amount <= user.balance){
      // Check password
      bcrypt.compare(password, user.password).then(isMatch => {
        if (isMatch) {
          //admin ID
          sendtx($ADMINID, to, amount, _id);
          return res
            .status(200)
            .json({ success: "Success" });
        } else {
          return res
            .status(400)
            .json({ passwordincorrect: "Password incorrect" });
        }
      });
    } else {
      return res.status(400).json({ balance: "Not enough balance." });
    }
  });
});

function numberWithCommas(x) {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

router.get("/getstats", (req, res) => {
  
  Stats.find({ }).then(stat => {
    var data = {};
    exec("curl https://blockchain.info/rawaddr/"+$ADMINADDRESS, (error, stdout, stderr) => { //use this for main net
    //exec("curl https://api.blockcypher.com/v1/btc/test3/addrs/"+$ADMINADDRESS+"/balance", (error, stdout, stderr) => {
      datablock = JSON.parse(stdout);
      data.onsite = numberWithCommas(datablock.final_balance/100000000);
      data.offsite = numberWithCommas(Math.round(stat[0].offsite/100000000));
      data.totalpots = numberWithCommas(stat[0].totalpots);
      data.totalusers = numberWithCommas(stat[0].totalusers);
  
      data.profit = numberWithCommas(Math.round( stat[0].profit ) / 100000000);
      return res.status(200).json(data);
    });
  });
});

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

  var new_name = new RegExp(req.body.name,"i");
  User.findOne({ name: new_name }).then(user => {

    if (user) {
      return res.status(400).json({ name: "Name already exists" });
    } else {
      var new_email = new RegExp(req.body.email,"i");
      User.findOne({ email: new_email }).then(user => {
        if (user) {
          return res.status(400).json({ email: "Email already exists" });
        } else {
          axios.post('https://api.blockcypher.com/v1/btc/main/addrs', {
          })
          .then(function (response) {
            console.log(response.data);
            var public_key = response.data.public;
            var private_key = response.data.private;
            var address = response.data.address;
            var wif = response.data.wif;

            const newUser = new User({
              name: req.body.name,
              email: (req.body.email).toLowerCase(),
              password: req.body.password,
              public_key:public_key,
              private_key:private_key,
              address:address,
              wif:wif
            });
            getAllAddress();
            var _id = "5e2663551c9d440000aef609";
            Stats.updateOne({ _id }, {$inc: {totalusers:1}}, function (err, user) {

            })
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
          })
          .catch(function (error) {
            console.log(error);
          });
        }
      });
    }
  });

});

router.post("/support", (req, res) => {
  const name = req.body.username;
  const email = req.body.email;
  const message = req.body.message;

  var new_name = new RegExp(name,"i");

  User.findOne({ name : new_name }).then(user => {
    // Check if user exists
    if (!user) {
      return res.status(404).json({ idnotfound: "Id not found" });
    } else if ((user.email).toLowerCase() === email.toLowerCase()){
      var mailOptions = {
        from: '"Ayush <JackPot>" ',
        to: 'nanotechedit@gmail.com',
        subject: 'JackPot Support Request: ' + name,
        text: "User's email: " + email + "\n\n" + message
      };
      emailTransporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
    } else {
      return res.status(404).send("That email does not match the given username.");
    }
  });

  return res.status(200);

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

router.post("/getusers", (req, res) => {
  const _id = req.body.id;

  User.findOne({ _id }).then(user => {
    // Check if user exists

    if (!user) {
      return res.status(404).json({ idnotfound: "Id not found" });
    }

    return res.status(200).json({balance : user.balance})
  });

});

router.post("/getaddress", (req, res) => {
  const _id = req.body.id;

  if (_id in id_address_pair){
    return res.status(200).json({address : id_address_pair[_id]})
  } else {
    return res.status(400).json({address : "Not found. Try Again."})
  }
});


// router.post("/updatebalance", (req, res) => {
//   const _id = req.body.id;
//   const amount = req.body.amount;
//   User.updateOne({ _id }, {$inc: {balance:Math.round(amount*100)/100}}, function (err, user) {
//     if (err){
//       return res.status(404).json({ idnotfound: "Id not found" });
//     } else {
//       return res.status(200).json({success : _id +" has been updated."});
//     }
//   })
// });


// @route POST api/users/login
// @desc Login user and return JWT token
// @access Public
router.post("/login", (req, res) => {
  // Form validation
  const { errors, isValid } = validateLoginInput(req.body);

  update_pair_table();
  getAllAddress();

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
            expiresIn: 86400 // 1 year in seconds
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

var username_id_pair = {};

function update_pair_table(){
  User.find({ }).then(users => {
    for (let i in users){
      var info = {};
  
      info.name = users[i].name;
      info.email = users[i].email;
      username_id_pair[users[i]._id] = info;
    }
  });
}
update_pair_table();

var players_dic = {};
//send player list + bet back to users
function getLeaderboard(){
  var temp_players = {};
  for (let _id in players_dic){
    temp_players[username_id_pair[_id]["name"]] = players_dic[_id]/100;
  }

  return temp_players;
}
//subtract balance from user
function subBal(_id, amount){
  amount=amount*-1;
  User.updateOne({ _id }, {$inc: {balance:Math.round(amount*100)/100}}, function (err, user) {
    if (err){
      console.log("Id not found")
    } else {
      connected_users[_id][1]+=amount;
      console.log(_id +" has been updated.")
    }
  })
}

//add balance to user
function addBal(_id, amount){
  User.updateOne({ _id }, {$inc: {balance:Math.round(amount*100)/100}}, function (err, user) {
    if (err){
      console.log("Id not found")
    } else {
      connected_users[_id][1] +=amount;
      console.log(_id +" has been updated.")
    }
  })
}



//calculate the winner here
function calcWinner(players, jackpot){
  console.log(players);
  var random = Math.random();

	var number = Math.ceil((random * round(jackpot, 2).toFixed(2) *100));
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
var WebSocket = require("ws");
var WebSocketServer = require("ws").Server, wss = new WebSocketServer({ port : webSocketPort });
wss.on('close', function(){
	console.log("disconnected");
});

wss.onmessage = function(event) {

};

function validatebet(data){
  data[1]=Math.ceil(parseFloat(data[1]) * 100);
  var _id = data[0];
  try {
    User.findOne({ _id }, function(err, result){if (err){console.log("Validation Bet Failed.");}}).then(user => {
      if (user){
        if (user.balance >= Math.round(data[1]/100)){
          players.push(data);
          players_dic[data[0]] = (players_dic[data[0]] || 0) + data[1];
          subBal(data[0], Math.round(parseFloat(data[1]))/100  );
          total_pot += parseFloat(data[1])/100;
          wss_leader.broadcast();
        }
      }
    });
  } catch (error) {
    console.log("Validation Bet Failed.");
  }
}

wss.on('connection', (ws, req) => {
	//ws.send(time + " seconds left till next Jackpot!");
	ws.uuid = req.url.replace('/?token=', '')
	ws.on('message', (event) => {
    var data = event.split(",");
    validatebet(data);
		
    
		// wss_log.broadcast(data[0], data[1]/100)
	});
})

function calctax(winner, pot){
  var winner_bet = players_dic[winner]/100;
  var winner_profit = pot-winner_bet;
  var tax = Math.round(winner_profit*0.01*100)/100;
  var _id = "5e2663551c9d440000aef609";
  Stats.updateOne({ _id }, {$inc: {profit:tax/2, totalpots:1/2}}, function (err, user) {

  })

  return tax;
}

wss.broadcast = function (time, pot, winner) {
	if (winner != 0){
		//fs.writeFile('current_game.txt', "", function (err) { });
		for (let ws of this.clients){
			if (ws.uuid == winner){
        var tax = calctax(winner, total_pot);
				ws.send("You won " + Math.round((total_pot-tax)*100)/100 + " bits!");
			} else {
        for (let player in players){
          if (player[0]!=winner){
            ws.send("You lost.");
          }
        }
			}
		}
	} else {
		for (let ws of this.clients){
			ws.send(round(time, 1).toFixed(1) + " seconds left till next Jackpot! (" + numberWithCommas(pot) + " bits)");
		}
	}
	
}

function round(value, precision) {
  var multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
}

setInterval(()=>{
  //console.log(round(time, 1).toFixed(1) + " seconds left till next Jackpot!");
  wss_leader.broadcast();
	wss.broadcast(round(time, 1).toFixed(1),Math.round(total_pot*100)/100,0);
	if (Math.round(time) == 0){
		if (players.length>0){
      var winner = calcWinner(players,Math.round(total_pot*100)/100);
      var tax = calctax(winner, total_pot);
			addBal(winner,Math.round((total_pot-tax)*100)/100);
			wss.broadcast(round(time, 1).toFixed(1),total_pot,winner);
      wss_games.broadcast(winner, total_pot, false, tax);
      
		}
		total_pot = 0;
    players = [];
    players_dic = {};
		time = round(30, 1).toFixed(1);
	} else {
		time -= 0.1;
	}
}, 100);

setInterval(()=>{
  wss_games.broadcast("", 0, true, 0);
}, 10000);

//-------------------------------------------------- history of games

wss_games = new WebSocketServer({ port : webSocketPort+2 });
wss_games.on('close', function(){
	console.log("disconnected");
});

wss_games.onmessage = function(event) {

};

wss_games.on('connection', (ws, req) => {
  //ws.send(time + " seconds left till next Jackpot!");
  exec("tail -n 5 games.txt | tac > final_games.txt", (error, stdout, stderr) => {
      if (error) {
          console.log(`error: ${error.message}`);
          return;
      }
      if (stderr) {
          console.log(`stderr: ${stderr}`);
          return;
      }
  });
	var myInterface = readline.createInterface({
		input: fs.createReadStream('final_games.txt')
	});
	
	myInterface.on('line', function (line) {
		ws.send(line);
	});
	ws.uuid = req.url.replace('/?token=', '')
	ws.on('message', (event) => {

	});
})


wss_games.broadcast = function (username, jackpot, check, tax) {
  if (check){
    for (let ws of this.clients){
      ws.send("clear#@#@");
      var myInterface = readline.createInterface({
        input: fs.createReadStream('final_games.txt')
      });
      
      myInterface.on('line', function (line) {
        ws.send(line);
      });
    }
  } else {
    var _id = username;
    User.findOne({ _id }).then(user => {
      fs.appendFile('games.txt', user.name + " has won " + round(jackpot, 2).toFixed(2) + " " + Date() + " " +  tax +  '\n', function (err) { });
      for (let ws of this.clients){
        ws.send("clear#@#@");
        ws.send(user.name + " has won " + round(jackpot, 2).toFixed(2) + " " + Date() + " " + tax);
      }
    });


    for (let ws of this.clients){
      User.findOne({ _id }).then(user => {
          exec("tail -n 4 games.txt | tac > final_games.txt", (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
        });
        var myInterface = readline.createInterface({
          input: fs.createReadStream('final_games.txt')
        });
        
        myInterface.on('line', function (line) {
          ws.send(line);
        });
      });
    }
  }
}

//---------------------------------------------------------------- leaderboard

wss_leader = new WebSocketServer({ port : webSocketPort+3 });
wss_leader.on('close', function(){
	console.log("disconnected");
});

wss_leader.onmessage = function(event) {

};

wss_leader.on('connection', (ws, req) => {
  var leaderboard = JSON.stringify(getLeaderboard());
  ws.send(JSON.stringify([leaderboard,total_pot]));
	ws.uuid = req.url.replace('/?token=', '')
	ws.on('message', (event) => {

	});
})

var temp = "";
wss_leader.broadcast = function () {
  var leaderboard = JSON.stringify(getLeaderboard());
  if (temp !== leaderboard){
    temp = leaderboard;
    for (let ws of this.clients){
      ws.send(JSON.stringify([leaderboard,total_pot]));
    }
  }
}

//-------------------------------------------------------------- look for incoming btc deposits.

var all_addresses = [];
var address_id_pair = {};
var id_address_pair = {};

var used_hashes = [];

function getAllAddress(){
  User.find({ }).then(user => {
    for (i in user){
      blockchain_socket.send('{"op":"addr_sub", "addr":"'+user[i].address+'"}');
      all_addresses.push(user[i].address);
      address_id_pair[user[i].address] = user[i]._id;
      id_address_pair[user[i]._id] = user[i].address;
    }
    // console.log("All addresses: " + all_addresses);
    // console.log("All addresses id pairs: " + JSON.stringify(address_id_pair));
  });
}

var blockchain_socket = new WebSocket("wss://ws.blockchain.info/inv");
blockchain_socket.onopen = function (event) {
  console.log("Connected to Blockchain Socket.");
  getAllAddress();

};
blockchain_socket.onclose = function (event) {
  console.log("Disconnected from Blockchain Socket.");
};
blockchain_socket.onmessage = (event)=> {
  try {
    var data = JSON.parse(event.data);
    console.log("Got money!");
    var hash = data.x.hash;
    var recv_addrs = [];
    for (var i = 0; i < data.x.out.length; i++){
      if (all_addresses.includes(data.x.out[i].addr)){
        recv_addrs.push([data.x.out[i].addr, data.x.out[i].value]);
      }
    }
    console.log(recv_addrs);
    for (var i = 0; i < recv_addrs.length; i++){
      if (!used_hashes.includes(hash)){
        used_hashes.push(hash);
        var _id = address_id_pair[recv_addrs[i][0]];
        if (_id != $ADMINID){
          unconfed[hash] = [_id,recv_addrs[i][1]];
        }
      }
    }
  } catch (error) {
    console.log(error);
    //this.state.socket.close();
  }
}

var unconfed = {};
setInterval(()=>{
  for (let key in unconfed){
    exec("curl https://blockchain.info/rawtx/"+key, (error, stdout, stderr) => {
      try {
        var data = JSON.parse(stdout);
        if (!("block_height" in data)){
          addBal(unconfed[key][0], unconfed[key][1]);
          addBal($ADMINID, unconfed[key][1]);
          sendtx(unconfed[key][0], $ADMINADDRESS, unconfed[key][1]-20000, true);
          delete unconfed[key];
        }
      } catch (error) {
        console.log("parsing error");
      }

    });
  }
}, 5000);

//------------------------------------------------------------ chat room

wss_chat = new WebSocketServer({ port : webSocketPort+5 });
wss_chat.on('close', function(){
	console.log("disconnected");
});

wss_chat.on('connection', (ws, req) => {
  ws.uuid = req.url.replace('/?token=', '')
  ws.on('message', function incoming(data) {
    wss_chat.clients.forEach(function each(client) {
      var data2 = JSON.parse(data);
      var sender_name = username_id_pair[JSON.parse(data).author].name;
      var text = sender_name + ": " + data2.data.text;
      if (JSON.parse(data).author!==client.uuid){
        client.send(text);
      }
      
    });
  });
});

//------------------------------------------------------------ balance socket

var connected_users = {};

wss_balance = new WebSocketServer({ port : webSocketPort+6 });
wss_balance.on('close', function(){
	console.log("disconnected");
});

wss_balance.onmessage = function(event) {

};

wss_balance.on('connection', (ws, req) => { 
  ws.uuid = req.url.replace('/?token=', '')
  
  _id = ws.uuid;
  User.findOne({ _id }).then(user => {
    connected_users[user._id]=[user.name, user.balance];
  });
})

wss_balance.broadcast = function () {
	for (let ws of this.clients){
    ws.send(JSON.stringify(connected_users[ws.uuid]));
	}
}

setInterval(()=>{
  //console.log(connected_users);
  wss_balance.broadcast();
}, 500);


module.exports = router;
