import React, { Component } from "react";
import { Link } from "react-router-dom";
import Swal from 'sweetalert2';
import $ from 'jquery';

class Navbar extends Component {
  constructor(props){
    super(props);
    this.showStats = this.showStats.bind(this);
    this.support = this.support.bind(this);
  }


  support(){
    Swal.mixin({
      title: '<b>Support</b>',
      html: "We're here to help.\nSubmit a message through this form and we will email you back.",
      confirmButtonText: 'Next &rarr;',
      showCancelButton: true,
      progressSteps: ['1', '2', '3', '4']
    }).queue([
      {
      },
      {
        title: 'What is your username?',
        input: "text",
        html: ''
      },{
        title: 'What is your associated email?',
        input: "email",
        html: ''
      }, {
        title: 'Enter your message',
        input: "text",
        html: ''
      }
    ]).then((result) => {
      if (result.value) {
        const answers = result.value;
        var username = answers[1];
        var email = answers[2];
        var message = answers[3];
        $.ajax({
          method: "POST",
          url: "/api/users/support/",
          data: {
              username:username,
              email:email,
              message
          },
          error: function(error) {
            
          },
        })
        Swal.fire(
          'Success!',
          'Your message has been sent.\nWe will try to get back to you as soon as possible.',
          'success'
        )
      }
    })
  }

  showStats(){
    
  }
  render() {
    return (
      <div className="navbar-fixed">
        <nav className="z-depth-0">
          <div className="nav-wrapper black">
            <div className="link-effect-13" id="link-effect-13">
            <a style={{cursor: "pointer", fontFamily: "monospace"}} className="col left" onClick={this.showStats}>Statistics</a>
            </div>
            <Link
              to="/"
              style={{
                fontFamily: "monospace",
              }}
              className="col s5 brand-logo center white-text"
            >
              JackPot
            </Link>
            <div className="link-effect-13" id="link-effect-13">
              <a style={{cursor: "pointer", fontFamily: "monospace"}} className="col right" onClick={this.support}>Support</a>
            </div>    
          </div>
        </nav>
      </div>
    );
  }
}

export default Navbar;
