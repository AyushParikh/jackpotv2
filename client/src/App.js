import React, { Component } from "react";
import { BrowserRouter as Router, Route, Switch, HashRouter } from "react-router-dom";
import jwt_decode from "jwt-decode";
import setAuthToken from "./utils/setAuthToken";

import { setCurrentUser, logoutUser } from "./actions/authActions";
import { Provider } from "react-redux";
import store from "./store";

import Navbar from "./components/layout/Navbar";
import Landing from "./components/layout/Landing";
import Register from "./components/auth/Register";
import Login from "./components/auth/Login";
import PrivateRoute from "./components/private-route/PrivateRoute";
import Dashboard from "./components/dashboard/Dashboard";

import "./App.css";

// Check for token to keep user logged in
if (localStorage.jwtToken) {
  // Set auth token header auth
  const token = localStorage.jwtToken;
  setAuthToken(token);
  // Decode token and get user info and exp
  const decoded = jwt_decode(token);
  // Set user and isAuthenticated
  store.dispatch(setCurrentUser(decoded));
  // Check for expired token
  const currentTime = Date.now() / 1000; // to get in milliseconds
  if (decoded.exp < currentTime) {
    // Logout user
    store.dispatch(logoutUser());

    // Redirect to login
    window.location.href = "./login";
  }
}

class App extends Component {
  constructor(props){
    super(props);
    console.log("%cCareful. This is a browser feature intended for developers. If someone told you to copy and paste something here to enable a jackpot feature or do a \"hack\", it is a scam and will give them access to your account!", "background-color: red; color: yellow; font-size:30px;");
  }
  render() {
    return (
      <Provider store={store}>
        
        <HashRouter >
          <div className="App">
            <Navbar />
            <Route exact path="/" component={Landing} />
            <Route exact path="/register" component={Register} />
            <Route exact path="/login" component={Login} />
            <Switch>
            
            <PrivateRoute exact path="/dashboard" component={Dashboard} />
            </Switch>
          </div>
        </HashRouter >
      </Provider>
    );
  }
}
export default App;
