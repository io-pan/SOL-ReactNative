import React from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  AsyncStorage,
  PixelRatio,
  PermissionsAndroid,
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
    // console.log(folder);
    // console.log(orientation);

    if (this.camera) {

      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE]);
          console.log(granted);

        if (granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
        &&  granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED){
     
          try {
            var data = await this.camera.takePictureAsync({ 
              quality: 0.7, 
              base64: true, 
              width: this.device_width * PixelRatio.get(),
              fixOrientation: true,
            });
            console.log('Picture taken:');
            console.log(data);
              // height: 3024
              // uri: "file:///data/user/0/com.sol/cache/Camera/2582d5c5-a8a0-4658-91b0-9ff14f501634.jpg"
              // width: 4032

            const photoURI = data.uri.replace('file://','');
            // RNFetchBlob.fs.exists(photoURI)
            //    .then((exist) => {
            //       console.log(`file ${exist ? '' : 'not'} exists`);
            //       if(exist) {
                    // Move picture to location folder.
                    const destPath = folder +'/'+ orientation.lat +'_'+ orientation.lon +'_'+ orientation.roll + '.jpg';        
                    console.log(photoURI);
                    console.log(destPath);
                    RNFetchBlob.fs.mv(
                      photoURI,
                      destPath
                    ).then(() => {
                      console.log('moved ' + destPath);
                      // RNFetchBlob.fs.ls(folder).then((files) => {
                      //   console.log('dossier' + folder);
                      //   console.log(files);
                      // });
            
                      // Send photo to webview.
                      this.props.getNewPhoto(
                        orientation.lat +'_'+ orientation.lon +'_'+ orientation.roll + '.jpg', 
                        data.base64
                      );
                    }).catch((error) => {
                      alert('Move file ERROR');
                      console.log('Move file ',error);
                    }); 
                              
             //      } // file exists.
             //   }).catch((error) => {
             //    console.log(error);
             // }); 

          } 
          catch (err) {
            // console.log('takePictureAsync ERROR: ', err);
          }
        } else {
         console.log('REFUSED');
        }
      } catch (err) {
        console.warn(err)
      }


// // scr cap 2220*1080  18.5:9
// // app res 740*360

// // "1:1", "3:2", "4:3", "11:9", "16:9"      ...18.5:9
// // 1        1.5  1.333   1.222   1.777        2.055555


// // 16
// // 9

// // // photo
// // h 1440*w1080 4:3

//       });

    }
  };

  componentDidMount() {
  }

  onCameraReady(){
    console.log('onCameraReady');
    console.log(this.camera);

     this.camera.getAvailablePictureSizes().then((data) => {
          console.log('getAvailablePictureSizes');
          console.log(data);
     });
     this.camera.getSupportedRatiosAsync().then((data) => {
          console.log('getSupportedRatiosAsync');
          console.log(data);
     });

//
// Dimensions.get('window').width * PixelRatio.get(),

    this._getFOV();
};
 
  _getFOV() {
    console.log('getFOV');
    this.camera.getFOV().then((data) => {
     console.log('gotFOV');
      console.log(data);
      this.props.getFOVCallback( data[0] );
    }).catch(err =>  {
      // Cam not yet initialised, try again.
      console.log(err);
    });
  };


  getWindowDimensions(event) {
    this.device_width = event.nativeEvent.layout.width;
    this.device_height = event.nativeEvent.layout.height;
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

          autoFocus ={RNCamera.Constants.AutoFocus.off}
          focusDepth = {1}
          onCameraReady =  { () => this.onCameraReady() } 

        />
      </View>
    );
  }
}
