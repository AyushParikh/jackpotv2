import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { logoutUser } from "../../actions/authActions";
import $ from 'jquery';
// ES6 Modules or TypeScript
import Swal from 'sweetalert2'


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

        },
        success : (data) => {
            document.getElementById("heading").innerHTML = "<b>"+this.state.user.name+"</b> Tokens: <b>$"+Math.floor(data.balance*100)/100+"</b>"  
        }
    }); 
  }

  render() {
    const { user } = this.props.auth;
    return (
      <div style={{ height: "75vh" }} className="container valign-wrapper">
        <div className="row">
          <div className="landing-copy col s12 center-align">
            <h4 id="heading">  
            <b>{user.name.split(" ")[0]}</b> Tokens: <b>-</b>           
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
      socket : socket
    }
    this.placeBet = this.placeBet.bind(this);
    this.onLogoutClick = this.onLogoutClick.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    $(()=>{
        this.state.socket = new WebSocket("ws://"+window.location.hostname+":3001/?token="+this.state.user.id);
        this.state.socket.onopen = function (event) {
            console.log("Connected to Server Game.");
        };
        this.state.socket.onclose = function (event) {
            console.log("Disconnected from Server Game.");
        };
        this.state.socket.onmessage = (event)=> {
            console.log(event.data);
            if ((event.data).includes("You won")){
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
                      document.getElementById("heading").innerHTML = "<b>"+this.state.user.name+"</b> Tokens: <b>$"+Math.floor(data.balance*100)/100+"</b>"  
                    } catch (error) {
                      console.log(error);
                      this.state.socket.close();
                    }
                  }
              }); 
              
          } else if ((event.data).includes("You lost.")) {
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
                        document.getElementById("heading").innerHTML = "<b>"+this.state.user.name+"</b> Tokens: <b>$"+Math.floor(data.balance*100)/100+"</b>"  
                      } catch (error) {
                        console.log(error);
                        this.state.socket.close();
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
    console.log(this.state.balance);

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
        $.ajax({
            method: "POST",
            url: "/api/users/getbalance/",
            data: {
                id:this.state.user.id
            },
            error: function(error) {

            },
            success : (data) => {
                document.getElementById("heading").innerHTML = "<b>"+this.state.user.name+"</b> Tokens: <b>$"+Math.floor(data.balance*100)/100+"</b>"
                this.setState({
                  balance : Math.floor(data.balance*100)/100
                })
            }
        }); 
    }
  }

  handleKeyPress = (event) => {

  }

  render(){
    return (
      <div className="input-field col s30">
        <p className="flow-text grey-text text-darken-1" id="server_game">
          Connecting to server...
        </p>
        <input id="bet_amount" type="number" step="1" min="0" max={this.state.user.balance} onKeyPress={this.handleKeyPress} placeholder="Enter a bet"></input>
        <button id="bet" onClick={this.placeBet} className="btn btn-large waves-effect waves-light hoverable black accent-2">Place Bet</button>
        <p className="flow-text grey-text text-darken-1" id="msg">
        </p>
        <HistoryGames user = {this.state.user}/>
        <button
              style={{
                width: "150px",
                borderRadius: "3px",
                letterSpacing: "1.5px",
                marginTop: "1rem"
              }}
              onClick={this.onLogoutClick}
              className="btn btn-large waves-effect waves-light hoverable blue accent-3"
            >
              Logout
            </button>
      </div>
    )
  }
}

class HistoryGames extends Component {
  constructor(props){
    super(props);

    this.state = {
      user : this.props.user,
      socket_game : ""
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
          console.log(event.data);
          if (event.data == "clear#@#@"){
            try {
              document.getElementById("gamespre").innerHTML="";
            } catch (error) {
              console.log(error);
              this.state.socket.close();
            }
            
          } else {
            try {
              var span = document.createElement("span");
              span.innerHTML = event.data;
              document.getElementById("gamespre").appendChild(span);
            } catch (error) {
              console.log(error);
              this.state.socket.close();
            }
          }
        }
    });
  }

  render(){
    return (
        <div>
            <div id="parent"><pre id="gamespre"></pre></div>
        </div>
    )
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
