import React from 'react';
import {
  Alert,
  Image,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  AsyncStorage,
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
  

  // takePicture = async function() {
  //   if (this.camera) {
  //     const options = { quality: 0.5, base64: true };
  //     const data = await this.camera.takePictureAsync(options)
  //     console.log(data.uri);
  //   }
  // };

  takePicture = (folder, orientation) => {
    if (this.camera) {
      this.camera.capture({jpegQuality:70})
      .then((srcPath) => {

        const dirs = RNFetchBlob.fs.dirs;
        srcPath = srcPath.path.split('/');
        srcPath = srcPath[srcPath.length-1];
        srcPath = dirs.CacheDir +'/'+ srcPath,
        destName = orientation.lat +'_'+ orientation.lon +'_'+ orientation.roll + '.jpg',
        destPath = dirs.DocumentDir +'/'+ folder +'/'+ destName;

        // Move picture to location folder.
        RNFetchBlob.fs.mv(
          srcPath,
          destPath
        ).then(() => {
          this.props.getNewPhoto(destName)
        }).catch((error) => {
          // console.log(error);
        }); 
      })
      .catch(err => console.error(err));
    }
  }

  componentDidMount() {
    this.getFOV();
  }

  getFOV() {
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

  render() {
    return (
      <View style={styles.container}>
        <StatusBar
          animated
          hidden
        />
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

       
        {/*
        <Camera
          ref={(cam) => {
            this.camera = cam;
          }}
          style={styles.preview}
          aspect={this.state.camera.aspect}
          captureTarget={this.state.camera.captureTarget}
          type={this.state.camera.type}
          flashMode={this.state.camera.flashMode}
          mirrorImage={false}
          playSoundOnCapture={false}
          captureQuality={this.state.camera.captureQuality}
          orientation={this.state.camera.orientation}
        />
        */ }
      </View>
    );
  }

}




  //   <View style={styles.container}>
  //       <RNCamera
  //           ref={ref => {
  //             this.camera = ref;
  //           }}
  //           style = {styles.preview}
  //           type={RNCamera.Constants.Type.back}
  //           flashMode={RNCamera.Constants.FlashMode.off}
  //           permissionDialogTitle={'Permission to use camera'}
  //           permissionDialogMessage={'We need your permission to use your camera phone'}
    
  //       />
  //       <View style={{flex: 0, flexDirection: 'row', justifyContent: 'center',}}>
  //       <TouchableOpacity
  //           onPress={this.takePicture.bind(this)}
  //           style = {styles.capture}
  //       >
  //           <Text style={{fontSize: 14}}> SNAP </Text>
  //       </TouchableOpacity>
  //       </View>
  //     </View>
  //   );
  // }

 

  // takePicture = async function() {
  //   if (this.camera) {
  //     const data = await this.camera.getSupportedRatiosAsync()
  //     console.log(data);
  //   }
  // };


