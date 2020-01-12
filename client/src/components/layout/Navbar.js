import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Widget, addResponseMessage  } from 'react-chat-widget';

import 'react-chat-widget/lib/styles.css';

class Navbar extends Component {
  //live chat --------------------------
  // handleNewUserMessage = (newMessage) => {
  //   console.log(`New message incoming! ${newMessage}`);
  //   // Now send the message throught the backend API
  // }

  // componentDidMount() {
  //   addResponseMessage("Please send a message to start this chat.");
  // }

  render() {
    return (
      <div className="navbar-fixed">
        <nav className="z-depth-0">
          <div className="nav-wrapper black">
            <Link
              to="/"
              style={{
                fontFamily: "monospace",
              }}
              className="col s5 brand-logo center white-text"
            >
              <i className="material-icons">code</i>
              JackPot
            </Link>
            {/* <div className="App">
              <Widget 
                handleNewUserMessage={this.handleNewUserMessage}
                title="Live Chat Support"
                subtitle=""
              />
            </div> */}
          </div>
        </nav>
      </div>
    );
  }
}

export default Navbar;
