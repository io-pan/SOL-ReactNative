import React, { Component } from 'react';
import {
  AppRegistry,
  StatusBar,

  TouchableOpacity, View, Text, StyleSheet,
} from 'react-native';

import Orientation from 'react-native-orientation';
import KeepScreenOn from 'react-native-keep-screen-on';
import SplashScreen from "rn-splash-screen";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';


import RNFetchBlob from 'rn-fetch-blob'
import { RNCamera } from 'react-native-camera';


// import MapView from 'react-native-maps';

// import MOTION from './components/motion';

export default class SOL extends Component {  
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentWillMount() {  
    StatusBar.setHidden(true);
    Orientation.lockToPortrait();
    KeepScreenOn.setKeepScreenOn(true);
    this.hideSplash();
  }

  hideSplash(){
    SplashScreen.hide();
  }


 render() {
   const { region } = this.props;
   console.log(region);

   return (
     <View style ={styles.container}>
<Text>
          <MaterialCommunityIcons 
              name="arrow-expand-up"
              size={16}
              borderRadius={0}
              color={'#aa0000'}
            /> B
            </Text>
     </View>
     
      // <MOTION 
      //   onWebviewLoad={() => this.hideSplash()}
      // />

      // <View style={styles.container}>
        // <RNCamera
        //     ref={ref => {
        //       this.camera = ref;
        //     }}
        //     style = {styles.preview}
        //     type={RNCamera.Constants.Type.back}
        //     flashMode={RNCamera.Constants.FlashMode.off}
        //     permissionDialogTitle={'Permission to use camera'}
        //     permissionDialogMessage={'We need your permission to use your camera phone'}
    
        // />
        // <View style={{flex: 0, flexDirection: 'row', justifyContent: 'center',}}>
        // <TouchableOpacity
        //     onPress={this.takePicture.bind(this)}
        //     style = {styles.capture}
        // >
        //     <Text style={{fontSize: 14}}> SNAP </Text>
        // </TouchableOpacity>
        // </View>
      // </View>

    );
  }

 

  // takePicture = async function() {
  //   if (this.camera) {
  //     const data = await this.camera.getSupportedRatiosAsync()
  //     console.log(data);
  //   }
  // };

  // takePicture = async function() {
  //   if (this.camera) {
  //     const options = { quality: 0.5, base64: true };
  //     const data = await this.camera.takePictureAsync(options)
  //     console.log('Camera');
  //     console.log(data);

  //     RNFetchBlob.fs.ls(RNFetchBlob.fs.dirs.CacheDir+'/'+'Camera').then((files) => {
  //       console.log('RNFetchBlob');
  //       console.log(RNFetchBlob.fs.dirs.DocumentDir);
  //       console.log(files);
  //     });
  //   }
  // };

}

AppRegistry.registerComponent('SOL', () => SOL);

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     flexDirection: 'column',
//     backgroundColor: 'black'
//   },
//   preview: {
//     flex: 1,
//     justifyContent: 'flex-end',
//     alignItems: 'center'
//   },
//   capture: {
//     flex: 0,
//     backgroundColor: '#fff',
//     borderRadius: 5,
//     padding: 15,
//     paddingHorizontal: 20,
//     alignSelf: 'center',
//     margin: 20
//   }
// });


const styles = StyleSheet.create({
 container: {
   ...StyleSheet.absoluteFillObject,
   height: 400,
   width: 400,
   justifyContent: 'flex-end',
   alignItems: 'center',
 },
 map: {
   ...StyleSheet.absoluteFillObject,
 },
});