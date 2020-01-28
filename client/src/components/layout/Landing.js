import React, { Component } from "react";
import { Link } from "react-router-dom";

class Landing extends Component {
  render() {
    return (
      <div>
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
      </div>
        <div id="belowcontent" className="row">
          <div className="section-light row">
            <h4>
              <b>What's JackPot?</b>
            </h4>
            <div >
              <p style={{fontSize : "x-large", display:"inline"}}>Jackpot is an online multiplayer bitcoin gambling game where the total pot is based on the bets other player's place.<br/> The probability of winning the JackPot increases as you own a greater share of the pot.<br/><br/><b>Probability of winning</b><br/> If you place a bet of 100,000, and the pot is 200,000, your chance of winning is 100,000/200,000 = 50%. <br/><br/> <b>House Edge</b><br/>The house takes a <b>1%</b> tax from the profits of the pot. This is allows users to place big bets without paying tax on their principal bet.<br/>For example: If you place a bet of 100,000 and the total pot is 150,000. If you win your profit is only 50,000. The house would take 500 (1% of 50,000).
              <br/><br/><b>Winner Selection</b><br/>The winning selection works on a simple algorithm. Each bet generates a range of numbers for that player's bet. A random number is selected from 0 to the total jackpot. Whoever owns the range where that number lies, is declared the winner.<br/></p><p className="underline" >Example:</p><p style={{fontSize : "x-large", display:"inline"}}>Player 1: Bets 100<br/>Player 2: Bets 200<br/>Player 3: Bets 300<br/><b>Total Pot: 600</b><br/>Player 1 - [0,99]<br/>Player 2 - [100,299]<br/>Player 3 - [300,599]<br/><br/>A <b>random</b> number is generated from 0 to 599. Whoever owns the range where that number lies is the winner. The higher the bet, the higher the range you own of the total pot.</p><br/>
            </div>
            </div>
        </div>
      </div>
    );
  }
}

export default Landing;
