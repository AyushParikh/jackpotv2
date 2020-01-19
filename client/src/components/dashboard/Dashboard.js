import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { logoutUser } from "../../actions/authActions";
import $ from 'jquery';
// ES6 Modules or TypeScript
import Swal from 'sweetalert2';
import {Launcher} from 'react-chat-window'

class Dashboard extends Component {
  constructor(props){
    super(props);
    this.state = {
      user : this.props.auth.user
    }

    this.onLogoutClick = this.onLogoutClick.bind(this);
  }
  onLogoutClick () {
    this.props.logoutUser();
  };

  componentDidMount(){
    $.ajax({
        method: "POST",
        url: "/api/users/getbalance/",
        data: {
            id:this.state.user.id
        },
        error: function(error) {
          $.ajax({
              method: "POST",
              url: "/api/users/getbalance/",
              data: {
                  id:this.state.user.id
              },
              error: function(error) {
                $.ajax({
                    method: "POST",
                    url: "/api/users/getbalance/",
                    data: {
                        id:this.state.user.id
                    },
                    error: function(error) {
                      
                    },
                    success : (data) => {
                      try {
                        document.getElementById("heading").innerHTML = "<b>"+this.state.user.name+"</b> Bits: <b>"+Math.floor(data.balance*100)/100+"</b>"
                      } catch (error) {
                        
                      }       
                    }
                });
              },
              success : (data) => {
                try {
                  document.getElementById("heading").innerHTML = "<b>"+this.state.user.name+"</b> Bits: <b>"+Math.floor(data.balance*100)/100+"</b>"
                } catch (error) {
                  
                }   
              }
          });
        },
        success : (data) => {
          try {
            document.getElementById("heading").innerHTML = "<b>"+this.state.user.name+"</b> Bits: <b>"+Math.floor(data.balance*100)/100+"</b>"
          } catch (error) {
            
          }   
        }
    }); 
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
    $(()=>{
        this.state.socket = new WebSocket("ws://"+window.location.hostname+":3001/?token="+this.state.user.id);
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
              Swal.fire({
              title: event.data,
              width: 600,
              padding: '3em',
              timer: 1500
              })

              $.ajax({
                  method: "POST",
                  url: "/api/users/getbalance/",
                  data: {
                      id:this.state.user.id
                  },
                  error: function(error) {

                  },
                  success : (data) => {
                    try {
                      document.getElementById("heading").innerHTML = "<b>"+this.state.user.name+"</b> Bits: <b>"+Math.floor(data.balance*100)/100+"</b>"  
                    } catch (error) {
                      console.log(error);
                      //this.state.socket.close();
                    }
                  }
              }); 
              
          } else if ((event.data).includes("You lost.")) {
              try {
                document.getElementById("tbodyleader").innerHTML = "";
              } catch (error) {
                console.log(error);
              }       
              Swal.fire({
                title: event.data,
                width: 600,
                padding: '3em',
                timer: 1500
                })

                $.ajax({
                    method: "POST",
                    url: "/api/users/getbalance/",
                    data: {
                        id:this.state.user.id
                    },
                    error: function(error) {

                    },
                    success : (data) => {
                      try {
                        document.getElementById("heading").innerHTML = "<b>"+this.state.user.name+"</b> Bits: <b>"+Math.floor(data.balance*100)/100+"</b>"  
                      } catch (error) {
                        console.log(error);
                        //this.state.socket.close();
                      }
                    }
                }); 

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

  onLogoutClick(){
    this.state.socket.close();
    this.props.onLogoutClick();
  }

  placeBet(){
    var bet = document.getElementById("bet_amount").value;

    if (!bet){
      Swal.fire({
          icon: 'error',
          title: 'You have not placed a bet',
          showConfirmButton: true,
          timer: 1500
      })
    }
    if (bet > this.state.balance){
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
        document.getElementById("heading").innerHTML = "<b>"+this.state.user.name+"</b> Bits: <b>"+this.state.balance-bet+"</b>"
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
                document.getElementById("heading").innerHTML = "<b>"+this.state.user.name+"</b> Bits: <b>"+Math.floor(data.balance*100)/100+"</b>"
                this.setState({
                  balance : Math.floor(data.balance*100)/100
                })
            }
        }); 
    }
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
                                  },
                                  success: ()=>{
                                    console.log("successssss");
                                    $.ajax({
                                      method: "POST",
                                      url: "/api/users/getbalance/",
                                      data: {
                                          id:this.state.user.id
                                      },
                                      error: function(error) {
                                        
                                      },
                                      success : (data) => {
                                        try {
                                          document.getElementById("heading").innerHTML = "<b>"+this.state.user.name+"</b> Bits: <b>"+Math.floor(data.balance*100)/100+"</b>"  
                                        } catch (error) {
                                          console.log(error);
                                        }
                                      }
                                    }); 
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
    return (
      <div className="input-field col s30">
        <p className="flow-text grey-text text-darken-1" id="server_game">
          Connecting to server...
        </p>
        <input style={{ width: "500px" }} id="bet_amount" type="number" step="1" min="0" max={this.state.user.balance} onKeyPress={this.handleKeyPress} placeholder="Enter a bet"></input><br/>
        
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
          <div id="history">
          <LeaderBoard user = {this.state.user} socket_leaderboard={this.state.socket_leaderboard}/>
          <HistoryGames user = {this.state.user} socket_game={this.state.socket_game} />
          
          </div>
          <div id="leaderboard">
          
          </div>     
        </div>

        <ChatRoom user = {this.state.user} />
      </div>
    )
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
        this.state.socket_game = new WebSocket("ws://"+window.location.hostname+":3003/?token="+this.state.user.id);
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

              var temp = event.data.split(" ");

              var tdid = document.createElement("td");
              tdid["data-title"] = "ID";
              tdid.innerHTML = temp[0];
      
              var tdname = document.createElement("td");
              tdname["data-title"] = "Name";
              tdname.innerHTML = temp[3];
      
              var tdlink = document.createElement("td");
              tdlink["data-title"] = "Link";
              tdlink.innerHTML = "##########";

              var tdtime = document.createElement("td");
              tdtime["data-title"] = "Time";
              tdtime.innerHTML = temp[8];
      
              var tr = document.createElement("tr");
              tr.appendChild(tdid);
              tr.appendChild(tdname);
              tr.appendChild(tdtime);
              tr.appendChild(tdlink);
      
              document.getElementById("tbodyleaderhistory").appendChild(tr);


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
                    <th>Hash</th>
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
        this.state.socket_leaderboard = new WebSocket("ws://"+window.location.hostname+":3004/?token="+this.state.user.id);
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
            console.log(error);
            //this.state.socket.close();
          }
        }
    });
  }

  parseLeaderboard(data){
    var leaderboard = JSON.parse(data);
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
        tdlink.innerHTML = sorted[i][1];

        var tr = document.createElement("tr");
        tr.appendChild(tdid);
        tr.appendChild(tdname);
        tr.appendChild(tdlink);

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

class ChatRoom extends Component {
  constructor(props){
    super(props);
    this.state = {
      messageList: [],
      socket : '',
      user : this.props.user,
      mobile : false
    };

    this._onMessageWasSent = this._onMessageWasSent.bind(this);

    $(()=>{
      this.state.socket = new WebSocket("ws://"+window.location.hostname+":3005/?token="+this.state.user.id);
      this.state.socket.onopen = function (event) {
          console.log("Connected to Chat Room.");
      };
      this.state.socket.onclose = function (event) {
          console.log("Disconnected from Chat Room.");
      };
      this.state.socket.onmessage = (event)=> {
        try {
          this._sendMessage(event.data);
        } catch (error) {
          console.log(error);
          //this.state.socket.close();
        }
      }
  });
  }

  componentDidMount(){
    var isMobile = {
      Android: function() {
          return navigator.userAgent.match(/Android/i);
      },
      BlackBerry: function() {
          return navigator.userAgent.match(/BlackBerry/i);
      },
      iOS: function() {
          return navigator.userAgent.match(/iPhone|iPad|iPod/i);
      },
      Opera: function() {
          return navigator.userAgent.match(/Opera Mini/i);
      },
      Windows: function() {
          return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
      },
      any: function() {
          return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
      }
    };
    if( isMobile.any() ){ 
      this.setState({
        mobile:true
      })
    };
  }

  _onMessageWasSent(message) {
    var new_message = JSON.parse(JSON.stringify(message));
    new_message.author = this.state.user.id;
    this.state.socket.send(JSON.stringify(new_message));
    this.setState({
      messageList: [...this.state.messageList, message]
    })
  }
 
  _sendMessage(text) {
    if (text.length > 0) {
      this.setState({
        messageList: [...this.state.messageList, {
          author: 'them',
          type: 'text',
          data: { text }
        }]
      })
    }
  }

  render(){
    if (this.state.mobile == true){
      return (
        <div>

        </div>
      )
    } else {
      return (
        <div>
          <Launcher
            agentProfile={{
              teamName: 'English Chat'
            }}
            onMessageWasSent={this._onMessageWasSent.bind(this)}
            messageList={this.state.messageList}
            showEmoji={false}
            mute={true}
          />
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
