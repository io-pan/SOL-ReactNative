import React, { Component } from 'react';
import {
  AppRegistry,
  StatusBar,
  BackHandler,
  DeviceEventEmitter,
  Platform,
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
import DeviceInfo from 'react-native-device-info';
import DatePicker from 'react-native-datepicker';
import { SensorManager } from 'NativeModules';
import LocationServicesDialogBox from "react-native-android-location-services-dialog-box";
import { GOOGLE_APIKEY } from './components/googleAPIKEY.js';

const strings = new LocalizedStrings({
  'en':{
    languag:'EN',
  },
  'fr':{
    languag:'FR',
  },
});

// import MapView from 'react-native-maps';

// import MOTION from './components/motion';
//http://maps.googleapis.com/maps/api/geocode

export default class SOL extends Component {  
  constructor(props) {
    super(props);
    this.state = {};
  }

  backButton = () => {
    RNExitApp.exitApp();
  }

  componentWillMount() {
    console.log('GOOGLE_APIKEY'+GOOGLE_APIKEY);
    BackHandler.addEventListener('hardwareBackPress', this.backButton);

    StatusBar.setHidden(true);
    Orientation.lockToPortrait();
    KeepScreenOn.setKeepScreenOn(true);
    this.hideSplash();

    strings.setLanguage('en');
    strings.setLanguage(strings.getInterfaceLanguage());

    SensorManager.startOrientation(100);
    DeviceEventEmitter.addListener('Orientation', (data)=> {
      if (!this.waitOrientation) {
        this.waitOrientation = true;
        // console.log('azi' + Math.round(data.azimuth, 10));
      }
    });

    var scope= this;
    this._interval = setInterval(function(){
      scope.waitOrientation = false;
    }, 100);

            var summerDate = new Date();
            summerDate.setFullYear(summerDate.getFullYear()-1);
            summerDate.setMonth(6);
            summerDate = summerDate.getTime()/1000;

            fetch('https://maps.googleapis.com/maps/api/timezone/json?location=48.8589506,2.2768486&timestamp='+summerDate+'&key='+GOOGLE_APIKEY)
            .then((response) => response.json())
            .then((responseJson) => {
              if(responseJson.status=="OK") {
                console.log('api timezone:');
                console.log(responseJson); //dstOffset // rawOffset
              }
              else {
                console.log('api timezone ERROR:');
                console.log(responseJs);
              }
            })
            .catch((error) => { }); 

            fetch('https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key='+GOOGLE_APIKEY)
            .then((response) => response.json())
            .then((responseJson) => {
              if(responseJson.status=="OK") {
                console.log('api geocode:');
                console.log(responseJson.results[0].geometry.location);
              }
              else {
                console.log('api geocode ERROR:');
                console.log(responseJson);
              }
            })
            .catch((error) => { console.log(error);  }); 
            

  }


componentDidMount () {
  
   console.log(' componentDidmount ********************');
    if(Platform.OS === 'android'){
      LocationServicesDialogBox.checkLocationServicesIsEnabled({
        enableHighAccuracy: false,
        showDialog: false, 
        openLocationServices: true, 
        preventOutSideTouch: false,
        preventBackClick: false
      }).then(function(success) {
             console.log('LocationServicesDialogBox SUCCESS');
          }.bind(this)
      ).catch((error) => {
            console.log('LocationServicesDialogBox ERROR');
      });
    }
}

  componentWillUnmount() {
    clearInterval(this._interval);
    SensorManager.stopOrientation();
    DeviceEventEmitter.removeListener('Orientation');
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
          permissionDialogTitle={'Title Permission to use camera'}
          permissionDialogMessage={'MSG We need your permission to use your camera phone'}
          > 
            {({ camera, status }) => {  // 'READY' | 'PENDING_AUTHORIZATION' | 'NOT_AUTHORIZED'
              if (status == 'NOT_AUTHORIZED') return  <Text> NOT_AUTHORIZED </Text>;
              if (status == 'PENDING_AUTHORIZATION') return  <Text> Wait cam </Text>;
              return (
                <View style={{ flex: 0, flexDirection: 'row', justifyContent: 'center' }}>
                  <TouchableOpacity onPress={() => this.takePicture(camera)} style={styles.capture}>
                    <Text style={{ fontSize: 14 }}> SNAP </Text>
                  </TouchableOpacity>
                </View>
              );
            }}     
          </RNCamera>

          <DatePicker
              mode="datetime"
              format="DD/MM HH:mm"
            />

        <Text>
            <MaterialCommunityIcons 
                name="arrow-expand-up"
                size={16}
                borderRadius={0}
                color={'#aa0000'}
              />
              ********** { strings.languag } ** { DeviceInfo.getApplicationName() } ********
        </Text>

        {/*
        <View style={{flex: 0, flexDirection: 'row', justifyContent: 'center',}}>
        <TouchableOpacity
            onPress={this.takePicture.bind(this)}
            style = {styles.capture}
        >
            <Text style={{fontSize: 14}}> SNAP2 </Text>
        </TouchableOpacity>
        </View>
        */}
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
    justifyContent: 'flex-end',
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


