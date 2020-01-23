import React, { Component } from "react";
import { Link } from "react-router-dom";

class Landing extends Component {
  render() {
    return (
      <div style={{ height: "75vh" }} className="container valign-wrapper">
        <div className="row">
          <div className="col s12 center-align">
            <h3>
              <b>THE ORIGINAL JACKPOT</b>
            </h3>
            <p className="flow-text white-text text-darken-1">
              Bitcoin Gambling &nbsp;	&nbsp;	
              Social & Real Time
              
            </p>
            <br />
            <div className="col s6">
              <Link
                to="/register"
                style={{
                  width: "140px",
                  borderRadius: "3px",
                  letterSpacing: "1.5px"
                }}
                className="btn btn-large waves-effect waves-light hoverable blue accent-3"
              >
                Register
              </Link>
            </div>
            <div className="col s6">
              <Link
                to="/login"
                style={{
                  width: "140px",
                  borderRadius: "3px",
                  letterSpacing: "1.5px"
                }}
                className="btn btn-large waves-effect waves-light hoverable black accent-3"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
        <div id="belowcontent" className="row">
            <h4>
              <b>What's JackPot?</b>
            </h4>
            <div>
              <p style={{fontSize : "x-large"}}>Jackpot is an online multiplayer bitcoin gambling game where the total pot is based on the bets other player's place.<br/><br/>The probability of winning the JackPot increases as you own a greater share of the pot.</p>
            </div>
            
        </div>
      </div>
    );
  }
}

export default Landing;
