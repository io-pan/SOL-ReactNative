import React, { Component } from 'react';
import {
  AppRegistry,
  StatusBar,
  BackHandler,

  TouchableOpacity, View, Text, StyleSheet,
} from 'react-native';

import Orientation from 'react-native-orientation';
import KeepScreenOn from 'react-native-keep-screen-on';
import SplashScreen from "rn-splash-screen";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFetchBlob from 'rn-fetch-blob'
import { RNCamera } from 'react-native-camera';
import LocalizedStrings from 'react-native-localization';
import RNExitApp from 'react-native-exit-app';

const strings = new LocalizedStrings({
  'en':{
    lang:'EN',
  },
  'fr':{
    lang:'FR',
  },
});

// import MapView from 'react-native-maps';

// import MOTION from './components/motion';

export default class SOL extends Component {  
  constructor(props) {
    super(props);
    this.state = {};
  }

  backButton = () => {
    RNExitApp.exitApp();
  }

  componentWillMount() {  
    BackHandler.addEventListener('hardwareBackPress', this.backButton);

    StatusBar.setHidden(true);
    Orientation.lockToPortrait();
    KeepScreenOn.setKeepScreenOn(true);
    this.hideSplash();

    strings.setLanguage('en');
  }

  hideSplash(){
    SplashScreen.hide();
  }


  render() {
    const { region } = this.props;
    console.log('region');
    console.log(region);

    return (
      <View style ={styles.container}>
        <RNCamera
            ref={ref => {
              this.camera = ref;
            }}
            style = {styles.preview}
            type={RNCamera.Constants.Type.back}
            flashMode={RNCamera.Constants.FlashMode.off}
            permissionDialogTitle={'Permission to use camera'}
            permissionDialogMessage={'We need your permission to use your camera phone'}
        />

        <Text>
            <MaterialCommunityIcons 
                name="arrow-expand-up"
                size={16}
                borderRadius={0}
                color={'#aa0000'}
              />
              ********** { strings.lang } **********
        </Text>


        <View style={{flex: 0, flexDirection: 'row', justifyContent: 'center',}}>
        <TouchableOpacity
            onPress={this.takePicture.bind(this)}
            style = {styles.capture}
        >
            <Text style={{fontSize: 14}}> SNAP </Text>
        </TouchableOpacity>
        </View>
      </View>

    );
  }

  takePicture = async function() {
    if (this.camera) {
      const options = { quality: 0.5, base64: true };
      var data = await this.camera.takePictureAsync(options)
      console.log('Camera');
      console.log(data);
      data = await this.camera.getSupportedRatiosAsync()
      console.log(data);

      RNFetchBlob.fs.ls(RNFetchBlob.fs.dirs.CacheDir+'/'+'Camera').then((files) => {
        console.log('RNFetchBlob');
        console.log(RNFetchBlob.fs.dirs.DocumentDir);
        console.log(files);
      });
    }
  };

} //  class SOL

AppRegistry.registerComponent('SOL', () => SOL);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black'
  },
  preview: {
    position: 'absolute',
    left:0,top:0,right:0,bottom:0,

    // flex: 1,
    // justifyContent: 'flex-end',
    // alignItems: 'center'
  },
  capture: {
    flex: 0,
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: 'center',
    margin: 20
  }
});


