import React from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  AsyncStorage,
  PixelRatio,
} from 'react-native';

import { RNCamera } from 'react-native-camera';
import RNFetchBlob from 'rn-fetch-blob';

const styles = StyleSheet.create({
  container: {
    position:'absolute',
    left:0,
    right:0,
    top:0,
    bottom:0,
    flex: 1,
    backgroundColor:'black',
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});


export default class Cam extends React.Component {
  constructor(props) {
    super(props);

    this.camera = null;
    this.state = {
      // camera: {
      //   aspect: Camera.constants.Aspect.cover,
      //   captureTarget: Camera.constants.CaptureTarget.temp,
      //     // temp:        file:///data/user/0/com.sol/cache
      //     // disk:        file:///storage/emulated/0/Pictures
      //     // cameraRoll : file:///storage/emulated/0/DCIM/
      //   captureQuality: Camera.constants.CaptureQuality.preview,
      //   type: Camera.constants.Type.back,
      //   orientation: Camera.constants.Orientation.portrait,
      //   flashMode: Camera.constants.FlashMode.off,
      // },
      FOV: this.props.FOV,
    };
  }

/*
    // 2 ways of getting promise

    _loadInitialInfo = () => {
      this.camera.hasFlash()
      .then(res => {
        console.log('hasFlash ' + res);
        console.log( res);
      });
    }

    __loadInitialInfo = async () => {
      var value = await this.camera.hasFlash();
      console.log('hasFlash ' + value);
      console.log( value);
    };
*/
  
  takePicture = async (folder, orientation) => {
    folder = RNFetchBlob.fs.dirs.DocumentDir +'/'+ folder;
    console.log(folder);
    console.log(orientation);

    if (this.camera) {

        this.camera.getSupportedRatiosAsync().then((data) => {
          console.log('getSupportedRatiosAsync');
          console.log(data);

          console.log (this.device_height);
          console.log (this.device_width);
          
// scr cap 2220*1080  18.5:9
// app res 740*360

// "1:1", "3:2", "4:3", "11:9", "16:9"      ...18.5:9
// 1        1.5  1.333   1222   1.777        2.055555

// // photo
// h 1440*w1080 4:3
          var ratio = 0;
      });

      try {
        var data = await this.camera.takePictureAsync({ 
          quality: 0.7, 
          base64: true, 
          width: Dimensions.get('window').width * PixelRatio.get(),
          fixOrientation: true,
          ratio:'18.5:9',
        });
        console.log('Picture taken:');
        console.log(data);
          // height: 3024
          // uri: "file:///data/user/0/com.sol/cache/Camera/2582d5c5-a8a0-4658-91b0-9ff14f501634.jpg"
          // width: 4032
            // RNFetchBlob.fs.ls(RNFetchBlob.fs.dirs.CacheDir+'/'+'Camera').then((files) => {
            //  console.log('RNFetchBlob');
            //  console.log(RNFetchBlob.fs.dirs.CacheDir+'/'+'Camera');
            //  console.log(files);
            //  });
    
            // RNFetchBlob.fs.exists(data.uri.replace('file://',''))
            //    .then((exist) => {
            //        console.log(`file ${exist ? '' : 'not'} exists`)
            //    }).catch((error) => {
            //     console.log(error);
            //  }); 

        // Move picture to location folder.
        const destPath = folder +'/'+ orientation.lat +'_'+ orientation.lon +'_'+ orientation.roll + '.jpg';        
        RNFetchBlob.fs.mv(
          data.uri.replace('file://',''),
          destPath
        ).then(() => {
          console.log('moved ' + destPath);
          // RNFetchBlob.fs.ls(folder).then((files) => {
          //   console.log('dossier' + folder);
          //   console.log(files);
          // });
          // Send photo to webview.
          this.props.getNewPhoto(data.base64);
        }).catch((error) => {
           console.log(error);
        }); 
      } 
      catch (err) {
        // console.log('err: ', err);
      }
    }
  };

  componentDidMount() {
    this.getFOV();
  }

  getFOV() {
    // console.log('this.camera');console.log(this.camera);
    //  console.log('RNCamera');console.log(RNCamera);
    this.props.getFOVCallback('68');
    // this.camera.getFOV()
    // .then(res => {
    //   // console.log('getFOV');
    //   this.props.getFOVCallback( res[Camera.constants.Type.back] );
    // })
    // .catch(err =>  {
    //   // Cam not yet initialised, try again.
    //   this.getFOV();
    // });
  };


  getWindowDimensions(event) {
    this.device_width = event.nativeEvent.layout.width,
    this.device_height = event.nativeEvent.layout.height
  }

  render() {
    return (
      <View 
        style={styles.container}
        onLayout={(event) => this.getWindowDimensions(event)} 
        >
        
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
      </View>
    );
  }
}
