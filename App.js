import React, { Component } from 'react';
import {
  AppRegistry,
  StatusBar,
} from 'react-native';

// import Orientation from 'react-native-orientation';
import KeepScreenOn from 'react-native-keep-screen-on';
import SplashScreen from "rn-splash-screen";

import MOTION from './components/motion';

export default class SOL extends Component {  

  constructor(props) {
    super(props);
    this.state = {};
  }
  componentWillMount() {  
    StatusBar.setHidden(true);
    // Orientation.lockToPortrait();
    KeepScreenOn.setKeepScreenOn(true);
  }

  render() {
    return (
      <MOTION 
        onWebviewLoad={() => SplashScreen.hide()}
      />
    )
  }
}

AppRegistry.registerComponent('SOL', () => SOL);

