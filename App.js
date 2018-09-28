import React, { Component } from 'react';
import {
  AppRegistry,
  StatusBar,
} from 'react-native';

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
    KeepScreenOn.setKeepScreenOn(true);
    // this.watchID = navigator.geolocation.watchPosition(
    //    (position) => {
    //       console.log(position);
    //       navigator.geolocation.clearWatch(this.watchID);
    //       alert(''+position.coords.latitude+' - '+position.coords.longitude);
    //   },
    //   (error) => {
    //     alert(JSON.stringify(error))
    //   },{
    //     enableHighAccuracy:true,
    //     timeout:500, 
    //     maximumAge:1000, 
    //     distanceFilter:1
    //   }
    // );
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

