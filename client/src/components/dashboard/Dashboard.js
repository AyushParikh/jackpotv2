import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { logoutUser } from "../../actions/authActions";
import $ from 'jquery';
// ES6 Modules or TypeScript
import Swal from 'sweetalert2';

class Dashboard extends Component {
  constructor(props){
    super(props);
    this.state = {
      user : this.props.auth.user,
      balance_socket : ''
    }

    $(()=>{
        this.setState({
          balance_socket : new WebSocket("ws://"+window.location.hostname+":3007/?token="+this.state.user.id)
        })
        this.state.balance_socket.onopen = function (event) {
            console.log("Connected to Balance Socket.");
        };
        this.state.balance_socket.onclose = function (event) {
            console.log("Disconnected from Socket.");
        };
        this.state.balance_socket.onmessage = (event)=> {
          var data = JSON.parse(event.data);
          var parts = (Math.round(data[1] * 100) / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          try {
            document.getElementById("heading").innerHTML = "<b>"+data[0]+"</b> Bits: <b>"+parts+"</b>";
          } catch (error) {
            this.state.balance_socket.close();
          }
          
        }
    });

    this.onLogoutClick = this.onLogoutClick.bind(this);
  }

  onLogoutClick () {
    this.props.logoutUser();
  };

  componentDidMount(){

  }

  render() {
    const { user } = this.props.auth;
    return (
      <div style={{ height: "75vh" }} id="dashboarddiv">
        <div className="row">
          <div className="landing-copy col s12 center-align">
            <h4 id="heading">  
            <b>{user.name.split(" ")[0]}</b> Bits: <b>-</b>           
            </h4>
            <Game user = {this.state.user} onLogoutClick={this.onLogoutClick} />
          </div>
        </div>
      </div>
    );
  }
}

class Game extends Component {
  constructor(props){
    super(props);
    var socket = '';
    this.state = {
      user : this.props.user,
      balance : this.props.user.balance,
      socket : socket,
      socket_game : '',
      socket_leaderboard : ''
    }
    this.placeBet = this.placeBet.bind(this);
    this.onLogoutClick = this.onLogoutClick.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.openCashier=this.openCashier.bind(this);
    this.openLaziz = this.openLaziz.bind(this);

    $(()=>{
        this.setState({
          socket : new WebSocket("ws://"+window.location.hostname+":3001/?token="+this.state.user.id)
        })
        this.state.socket.onopen = function (event) {
            console.log("Connected to Server Game.");
        };
        this.state.socket.onclose = function (event) {
            console.log("Disconnected from Server Game.");
        };
        this.state.socket.onmessage = (event)=> {
            if ((event.data).includes("You won")){
              try {
                document.getElementById("tbodyleader").innerHTML = "";
              } catch (error) {
                console.log(error);
              }       

              var data = event.data.split(" ");
              const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                onOpen: (toast) => {
                  toast.addEventListener('mouseenter', Swal.stopTimer)
                  toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
              })
              
              Toast.fire({
                icon: 'success',
                title: '+ ' + data[2] + ' bits'
              })
              
          } else if ((event.data).includes("You lost.")) {
              try {
                document.getElementById("tbodyleader").innerHTML = "";
              } catch (error) {
                console.log(error);
              }       

              const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                onOpen: (toast) => {
                  toast.addEventListener('mouseenter', Swal.stopTimer)
                  toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
              })
              
              Toast.fire({
                icon: 'warning',
                title: event.data
              }) 

          }
            try {
              var p =document.getElementById("server_game");
              p.innerHTML=event.data;
            } catch (error) {
              this.state.socket.close();
            }

        }
    });
  }

  openLaziz(){
    Swal.mixin({
      input: 'text',
      confirmButtonText: 'Next &rarr;',
      showCancelButton: true,
      progressSteps: ['1', '2', '3']
    }).queue([
      {
        title: 'Who are you sending to?',
        input: 'text'
      },
      {
        title: 'Amount',
        input: 'text'
      },
      {
        title: 'Enter your password',
        input: 'password'
      }
    ]).then((result) => {
      if (result.value) {
        const answers = result.value;
        var name = answers[0];
        var amount = answers[1];
        var password = answers[2];
        $.ajax({
          method: "POST",
          url: "/api/users/zwarte/",
          data: {
              id:this.state.user.id,
              password:password,
              name:name,
              amount:amount
          },
          success:function(data){
            if (data.success){
              Swal.fire({
                  icon: 'success',
                  title: 'Sent!',
                  showConfirmButton: true
              })
            }
          }
        })
      }
    });
  }

  onLogoutClick(){
    this.state.socket.close();
    this.props.onLogoutClick();
  }

  placeBet(){
    var bet = document.getElementById("bet_amount").value;

    $.ajax({
        method: "POST",
        url: "/api/users/getbalance/",
        data: {
            id:this.state.user.id
        },
        error: function(error) {

        },
        success : (data) => {
            this.setState({
              balance : Math.floor(data.balance*100)/100
            })
        }
    }).then(()=>{
      if (!bet){
        Swal.fire({
            icon: 'error',
            title: 'You have not placed a bet',
            showConfirmButton: true,
            timer: 1500
        })
      }
      if (bet > this.state.balance){
        console.log(this.state.balance);
        Swal.fire({
            icon: 'error',
            title: 'Your bet cannot exceed your balance',
            showConfirmButton: true,
            timer: 1500
        })
      } else if (bet <= 0){
        Swal.fire({
            icon: 'error',
            title: 'You have not placed a bet',
            showConfirmButton: true,
            timer: 1500
        })
      } else {
          document.getElementById("msg").innerHTML = "";
          this.state.socket.send(this.state.user.id+","+bet);
          document.getElementById("bet").disabled = true;
          setTimeout(function() { document.getElementById("bet").disabled = false; }, 2000);
          $.ajax({
              method: "POST",
              url: "/api/users/getbalance/",
              data: {
                  id:this.state.user.id
              },
              error: function(error) {
  
              },
              success : (data) => {
                  this.setState({
                    balance : Math.floor(data.balance*100)/100
                  })
              }
          }); 
      }
    });
  }

  handleKeyPress = (event) => {

  }

  openCashier(){
    $.ajax({
        method: "POST",
        url: "/api/users/getaddress/",
        data: {
            id:this.state.user.id
        },
        error: function(error) {

        },
        success : (data) => {
          Swal.fire({
            title: 'Cashier',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            background : "#e0e0e0",
            cancelButtonColor: '#d33',
            cancelButtonText: "Withdraw",
            confirmButtonText: 'Deposit'
          }).then((result) => {
            if (result.value) {
              Swal.fire({
                title: 'Bitcoin Deposit Address\n\n'+data.address,
                width: 800,
                background : "#e0e0e0",
                inputAttributes: {
                  autocapitalize: 'off'
                },
                confirmButtonText: 'OK',
                footer: '<b>Your balance will show after 1 <a target="_blank" href="https://www.blockchain.com/btc/address/'+data.address+'">confirmation.</a></b>',
                showLoaderOnConfirm: true
              })
            } else {
              Swal.mixin({
                input: 'text',
                confirmButtonText: 'Next &rarr;',
                showCancelButton: true,
                progressSteps: ['1', '2', '3']
              }).queue([
                {
                  title: 'Withdrawal Address',
                  footer: '<b>50,000 bits will be used for withdrawal fees.</b>',
                },
                {
                  title: 'Amount',
                  input: 'text',
                  footer: '<b>50,000 bits will be used for withdrawal fees.</b>'
                },
                {
                  title: 'Enter your password',
                  input: 'password',
                  footer: '<b>50,000 bits will be used for withdrawal fees.</b>'
                }
              ]).then((result) => {
                if (result.value) {
                  const answers = result.value
                  var address = answers[0];
                  var amount = answers[1];
                  var password = answers[2];
                  try {
                    amount=parseFloat(amount);
                    $.ajax({
                        method: "POST",
                        url: "/api/users/getbalance/",
                        data: {
                            id:this.state.user.id
                        },
                        error: function(error) {
            
                        },
                        success : (data) => {
                            this.setState({
                              balance : Math.floor(data.balance*100)/100
                            })
                            if (isNaN(amount) || amount > this.state.balance || amount <= 50000){
                              Swal.fire({
                                icon: 'error',
                                title: 'Oops...',
                                text: 'Please enter a valid amount above 50000 bits.'
                              })
                            } else {
                              $.ajax({
                                  method: "POST",
                                  url: "/api/users/withdraw/",
                                  data: {
                                      _id:this.state.user.id,
                                      address:address,
                                      amount:amount-50000,
                                      password:password
                                  },
                                  error: function (error){
                                    if (error.responseJSON.passwordincorrect){
                                      Swal.fire({
                                        icon: 'error',
                                        title: 'Oops...',
                                        text: 'Incorrect password.',
                                        footer: '<a href>Why do I have this issue?</a>'
                                      })
                                    }
                                  }
                              }).then(function( data ) {
                                let timerInterval
                                Swal.fire({
                                  title: 'Your withdrawal is being processed',
                                  html: amount + " bits sent to " + address,
                                  timer: 2000,
                                  timerProgressBar: true,
                                  onBeforeOpen: () => {
                                    Swal.showLoading()
                                  },
                                  onClose: () => {
                                    clearInterval(timerInterval)
                                  }
                                }).then((result) => {
                                  if (
                                    /* Read more about handling dismissals below */
                                    result.dismiss === Swal.DismissReason.timer
                                  ) {
                                    //console.log('I was closed by the timer') // eslint-disable-line
                                  }
                                })
                              });
                            }
                        }
                    }); 
                    
                  } catch (error) {
                    Swal.fire({
                      icon: 'error',
                      title: 'Oops...',
                      text: 'Please enter a valid amount.'
                    })
                  }
                }
              })
            }
          })
        }
    }); 

  }

  render(){
    if (this.state.user.name.toLowerCase() === "Laziz".toLowerCase()){
      return (
        <div className="input-field col s30">
        <p className="flow-text white-text text-white-1" id="server_game" >
          Connecting to server...
        </p>
        <input style={{ width: "500px", color:"white"}} id="bet_amount" type="number" step="1" min="0" max={this.state.user.balance} onKeyPress={this.handleKeyPress} placeholder="Enter a bet"></input><br/>
        
        <button id="bet"                 style={{
                  width: "140px",
                  borderRadius: "3px",
                  letterSpacing: "1.5px"
                }} onClick={this.placeBet} className="btn btn-large waves-effect waves-light hoverable black accent-2">Place Bet</button> &nbsp; &nbsp; &nbsp; &nbsp;
        <button id="cashier"                 style={{
          width: "140px",
          borderRadius: "3px",
          letterSpacing: "1.5px"
        }} onClick={this.openCashier} className="btn btn-large waves-effect waves-light hoverable green accent-2">Cashier</button> &nbsp; &nbsp; &nbsp; &nbsp;
        <button id="laziz"                 style={{
          width: "140px",
          borderRadius: "3px",
          letterSpacing: "1.5px"
        }} onClick={this.openLaziz} className="btn btn-large waves-effect waves-light hoverable blue accent-2">Zwarte</button> &nbsp; &nbsp; &nbsp; &nbsp;
      <button
                style={{
                  width: "140px",
                  borderRadius: "3px",
                  letterSpacing: "1.5px"
                }}
              onClick={this.onLogoutClick}
              className="btn btn-large waves-effect waves-light hoverable blue accent-3"
            >
              Logout
            </button>
        <p className="flow-text grey-text text-darken-1" id="msg">
        </p>
        <div id="container">
          <Toggle user = {this.state.user} socket_leaderboard={this.state.socket_leaderboard} socket_game={this.state.socket_game}/>
        </div>
      </div>
      )
    } else {
    return (
      <div className="input-field col s30">
        <p className="flow-text white-text text-white-1" id="server_game" >
          Connecting to server...
        </p>
        <input style={{ width: "500px", color:"white"}} id="bet_amount" type="number" step="1" min="0" max={this.state.user.balance} onKeyPress={this.handleKeyPress} placeholder="Enter a bet"></input><br/>
        
        <button id="bet"                 style={{
                  width: "140px",
                  borderRadius: "3px",
                  letterSpacing: "1.5px"
                }} onClick={this.placeBet} className="btn btn-large waves-effect waves-light hoverable black accent-2">Place Bet</button> &nbsp; &nbsp; &nbsp; &nbsp;
        <button id="cashier"                 style={{
          width: "140px",
          borderRadius: "3px",
          letterSpacing: "1.5px"
        }} onClick={this.openCashier} className="btn btn-large waves-effect waves-light hoverable green accent-2">Cashier</button> &nbsp; &nbsp; &nbsp; &nbsp;
      <button
                style={{
                  width: "140px",
                  borderRadius: "3px",
                  letterSpacing: "1.5px"
                }}
              onClick={this.onLogoutClick}
              className="btn btn-large waves-effect waves-light hoverable blue accent-3"
            >
              Logout
            </button>
        <p className="flow-text grey-text text-darken-1" id="msg">
        </p>
        <div id="container">
          <Toggle user = {this.state.user} socket_leaderboard={this.state.socket_leaderboard} socket_game={this.state.socket_game}/>
        </div>
      </div>
    )}
  }
}

class HistoryGames extends Component {
  constructor(props){
    super(props);

    this.state = {
      user : this.props.user,
      socket_game : this.props.socket_game
    }

    $(()=>{
        this.setState({
          socket_game : new WebSocket("ws://"+window.location.hostname+":3003/?token="+this.state.user.id)
        })
        this.state.socket_game.onopen = function (event) {
            console.log("Connected to Server Games.");
        };
        this.state.socket_game.onclose = function (event) {
            console.log("Disconnected from Server Games.");
        };
        this.state.socket_game.onmessage = (event)=> {
          if (event.data === "clear#@#@"){
            try {
              document.getElementById("tbodyleaderhistory").innerHTML="";
            } catch (error) {
              //console.log(error);
              //this.state.socket.close();
            }
            
          } else {
            try {

              var x = document.getElementById("tbodyleaderhistory").rows.length;

              if (x <= 4){
                var temp = event.data.split(" ");

                var tdid = document.createElement("td");
                tdid["data-title"] = "ID";
                tdid.innerHTML = temp[0];
        
                var tdname = document.createElement("td");
                tdname["data-title"] = "Name";
                tdname.innerHTML = temp[3];
        
                var tdlink = document.createElement("td");
                tdlink["data-title"] = "Link";
                tdlink.innerHTML = temp[temp.length-1];
  
                var tdtime = document.createElement("td");
                tdtime["data-title"] = "Time";
                tdtime.innerHTML = temp[8];
        
                var tr = document.createElement("tr");
                tr.appendChild(tdid);
                tr.appendChild(tdname);
                tr.appendChild(tdtime);
                tr.appendChild(tdlink);

                document.getElementById("tbodyleaderhistory").appendChild(tr);
              }
            } catch (error) {
              //console.log(error);
              //this.state.socket.close();
            }
          }
        }
    });
  }

  render(){
    return (
        <div>
            <div id="demo">
          <div className="table-responsive-vertical shadow-z-1">
            <table id="table" className="table table-hover table-mc-light-blue">
                <thead id="thead">
                  <tr>
                    <th>Winner</th>
                    <th>Pot</th>
                    <th>Time</th>
                    <th>Tax</th>
                  </tr>
                </thead>
                <tbody id="tbodyleaderhistory">
                </tbody>
              </table>
            </div>
          </div>
        </div> 
    )
  }
}

class LeaderBoard extends Component {
  constructor(props){
    super(props);

    this.state = {
      user : this.props.user,
      socket_leaderboard : this.props.socket_leaderboard
    }

    this.parseLeaderboard = this.parseLeaderboard.bind(this);

    $(()=>{
        this.setState({
          socket_leaderboard : new WebSocket("ws://"+window.location.hostname+":3004/?token="+this.state.user.id)
        })
        this.state.socket_leaderboard.onopen = function (event) {
            console.log("Connected to Leaderboard.");
        };
        this.state.socket_leaderboard.onclose = function (event) {
            console.log("Disconnected from Leaderboard.");
        };
        this.state.socket_leaderboard.onmessage = (event)=> {
          try {
            this.parseLeaderboard(event.data); //send leaderboard data to be parsed
          } catch (error) {
            //console.log(error);
            //this.state.socket.close();
          }
        }
    });
  }

  parseLeaderboard(data){
    var leaderboard_data = JSON.parse(data);
    var leaderboard = JSON.parse(leaderboard_data[0]);
    var jackpot = leaderboard_data[1];
    if (Object.keys(leaderboard).length !== 0){
      // console.log(leaderboard);
      document.getElementById("tbodyleader").innerHTML = "";

      const sorted = Object.entries(leaderboard) // object to array of arrays
                     .sort((a, b) => b[1] - a[1]); // sort descending by 2nd element of the arrays

      for (var i = 0; i < sorted.length; i++){
        var tdid = document.createElement("td");
        tdid["data-title"] = "ID";
        tdid.innerHTML = i + 1;

        var tdname = document.createElement("td");
        tdname["data-title"] = "Name";
        tdname.innerHTML = sorted[i][0];

        var tdlink = document.createElement("td");
        tdlink["data-title"] = "Link";

        var parts = sorted[i][1].toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        tdlink.innerHTML = parts.join(".");

        var tdprob = document.createElement("td");
        tdprob["data-title"] = "Probability";
        tdprob.innerHTML = Math.round(((Math.round(sorted[i][1]*100)/100)/jackpot)*100) + "%";

        var tr = document.createElement("tr");
        tr.appendChild(tdid);
        tr.appendChild(tdname);
        tr.appendChild(tdlink);
        tr.appendChild(tdprob);

        document.getElementById("tbodyleader").appendChild(tr);
        
      }
    } 

  }

  render(){
    return (
      <div>
        <div id="demo">
          <div className="table-responsive-vertical shadow-z-1">
          <table id="table" className="table table-hover table-mc-light-blue">
            
              <thead id="thead">
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>Bet</th>
                  <th>Probability</th>
                </tr>
              </thead>
              <tbody id="tbodyleader">
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }
}

class Toggle extends Component {
  constructor(props){
    super(props);
    this.state = {
      players : true,
      leaderboard : false,
      chat : false,
      user : this.props.user,
      socket_leaderboard : this.props.socket_leaderboard,
      socket_game : this.props.socket_game,
      socket_chat : ''
    }
    this.toggleplayers = this.toggleplayers.bind(this);
    this.toggleleaderboard = this.toggleleaderboard.bind(this);
    this.togglechat = this.togglechat.bind(this);

    this.send = this.send.bind(this);
    this.receive = this.receive.bind(this);
    this.enableChat = this.enableChat.bind(this);
  }

  enableChat(){
    $(()=>{
        this.setState({
          socket_chat : new WebSocket("ws://"+window.location.hostname+":3006/?token="+this.state.user.id)
        })

        this.state.socket_chat.onopen = function (event) {
            console.log("Connected to Chat Room.");
        };
        this.state.socket_chat.onclose = function (event) {
            console.log("Disconnected from Chat Room.");
        };
        this.state.socket_chat.onmessage = (event)=> {
          try {
            this.receive(JSON.parse(event.data));
          } catch (error) {
            console.log(error);
            //this.state.socket.close();
          }
        }
    });
  }

  toggleplayers(e){
    try {
      this.state.socket_chat.close();
    } catch (error) {
      
    }
    
    this.setState({
      players: true,
      leaderboard: false,
      chat : false
    });
  }

  toggleleaderboard(e){
    try {
      this.state.socket_chat.close();
    } catch (error) {
      
    }
    this.setState({
      players: false,
      leaderboard: true,
      chat : false
    });
  }

  togglechat(e){
    this.enableChat();
    this.setState({
      players: false,
      leaderboard: false,
      chat : true
    });
  }

  send() {
    var message_element = document.getElementById("message-to-send");
    var message = message_element.value;
    message_element.value = "";
    var new_message = {"id" : this.state.user.id, "message" : message}
    this.state.socket_chat.send(JSON.stringify(new_message));
  }
 
  receive(data){
    var from = data.name;
    var message = data.message;
    var li = document.createElement("li");
    var div = document.createElement("div");
    var spanname = document.createElement("span");
    var divmessage = document.createElement("div");

    var message_split = message.split("");

    message='';
    for (var i = 0; i< message_split.length; i++){
      message+=message_split[i];
      if (message.length%46===0){
        message+="\n";
      }
    }

    if (from !== this.state.user.name){
      li.id = "clearfix";
      
      div.id="message-data-from";

      spanname.id = "message-data-name-from";
      spanname.innerHTML = from;

      divmessage.id="message-from";
      divmessage.innerHTML = message;

      div.appendChild(spanname);

      li.appendChild(div);
      li.appendChild(divmessage);

      document.getElementById("addchat").appendChild(li);
    } else {

      li.id = "clearfix";
      

      div.id="message-data";

      spanname.id = "message-data-name";
      spanname.innerHTML = this.state.user.name;
  
      divmessage.id="message";
      divmessage.innerHTML = message;
  
      div.appendChild(spanname);
  
      li.appendChild(div);
      li.appendChild(divmessage);
  
      document.getElementById("addchat").appendChild(li);
    }
    this.updateScroll();
  }

  spacecheck(event){
    if (event.which === 13){
      document.getElementById("send").click();
      event.preventDefault();
    }
  }

  updateScroll(){
    var element = document.getElementById("chat-history");
    element.scrollTop = element.scrollHeight;
  }

  render(){
    if (this.state.players){
      return (
        <div>
          <ul id="category-toggle-list">
            <li className="project-category web active"><label>Players</label></li>
            <li className="project-category cro" onClick={this.toggleleaderboard}><label>History</label></li>
            <li className="project-category cro" onClick={this.togglechat}><label>Chat</label></li>
          </ul>
          <LeaderBoard user = {this.state.user} socket_leaderboard={this.state.socket_leaderboard} />
        </div>
      )
    } else if (this.state.leaderboard) {
      return (
        <div>
          <ul id="category-toggle-list">
            <li className="project-category web" onClick={this.toggleplayers}><label>Players</label></li>
            <li className="project-category cro active"><label>History</label></li>
            <li className="project-category cro" onClick={this.togglechat}><label>Chat</label></li>
          </ul>
          <HistoryGames user = {this.state.user} socket_game={this.state.socket_game} />
        </div>
      )
    } else {
      return (
        <div>
        <ul id="category-toggle-list">
          <li className="project-category web" onClick={this.toggleplayers}><label>Players</label></li>
          <li className="project-category cro" onClick={this.toggleleaderboard}><label>History</label></li>
          <li className="project-category cro active"><label>Chat</label></li>
        </ul>
        <div id="demo">
          <div className="chat" id="chat">
            <div className="chat-header clearfix">
                <i className="fa fa-star"></i>
            </div>
            <div className="chat-history" id="chat-history">
                <ul id="addchat">
                  <li id="clearfix">

                  </li>
                </ul>
            </div>
            <div className="chat-message clearfix">
                <textarea style={{color:"white"}}name="message-to-send" id="message-to-send" onKeyPress={this.spacecheck} placeholder ="Type your message" rows="3"></textarea>
                <i className="fa fa-file-o"></i> &nbsp;&nbsp;&nbsp;
                <i className="fa fa-file-image-o"></i>
                <button id="send" onClick={this.send} className="btn waves-effect waves-light black">Send</button>
            </div>
          </div>
        </div>
      </div>
      )

    }
  }
}

Dashboard.propTypes = {
  logoutUser: PropTypes.func.isRequired,
  auth: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
  auth: state.auth
});

export default connect(
  mapStateToProps,
  { logoutUser }
)(Dashboard);
