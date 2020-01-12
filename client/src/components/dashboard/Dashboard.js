import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { logoutUser } from "../../actions/authActions";
import $ from 'jquery'; 

class Dashboard extends Component {
  constructor(props){
    super(props);
    this.state = {
      user : this.props.auth.user
    }
    this.updateBalance = this.updateBalance.bind(this);
    this.onLogoutClick = this.onLogoutClick.bind(this);

  }
  onLogoutClick () {
    this.props.logoutUser();
  };

  updateBalance(){
    this.state.user.balance = 100;
  }

  render() {
    const { user } = this.props.auth;
    return (
      <div style={{ height: "75vh" }} className="container valign-wrapper">
        <div className="row">
          <div className="landing-copy col s12 center-align">
            <h4>
            <b>{user.name.split(" ")[0]}</b> Tokens: <b>${this.state.user.balance}</b>           
            </h4>
            <Game user = {this.state.user} updateBalance= {this.updateBalance} onLogoutClick={this.onLogoutClick} />
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
      socket : socket
    }
    this.placeBet = this.placeBet.bind(this);
    this.onLogoutClick = this.onLogoutClick.bind(this);
    $(()=>{
        this.state.socket = new WebSocket("ws://localhost:3001/?token="+this.state.user.name);
        this.state.socket.onopen = function (event) {
            console.log("Connected to Server Game.");
        };
        this.state.socket.onclose = function (event) {
            console.log("Disconnected from Server Game.");
        };
        this.state.socket.onmessage = (event)=> {
            console.log(event.data);
            var p =document.getElementById("server_game");
            p.innerHTML=event.data;
            this.props.updateBalance();
        }
    });
  }

  onLogoutClick(){
    this.state.socket.close();
    this.props.onLogoutClick();
  }

  placeBet(){
    var bet = document.getElementById("bet_amount").value;

    if (bet > this.props.balance){
        document.getElementById("msg").innerHTML("Your bet cannot exceed your balance.");
    } else if (bet <= 0){
        document.getElementById("msg").innerHTML("You must place a bet greater than 0");
    } else {
        this.state.socket.send(this.state.user.id+","+bet);
    }
  }

  render(){
    return (
      <div>
        <p className="flow-text grey-text text-darken-1" id="server_game">
          Connecting to server...
        </p>
        <input id="bet_amount" type="number" step="1" min="0" max={this.state.user.balance} placeholder="Enter a bet"></input>
        <button id="bet" onClick={this.placeBet} className="btn btn-large waves-effect waves-light hoverable black accent-2">Place Bet</button>
        <p className="flow-text grey-text text-darken-1" id="msg">
        </p>
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
