import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  Alert,
  View,
  ScrollView,
  Dimensions,
  WebView,
  TouchableHighlight,
  BackHandler,
  Modal,
  DeviceEventEmitter,
  PixelRatio,
  PermissionsAndroid,
  // Image,
  // AsyncStorage,
} from 'react-native';

import { RNCamera } from 'react-native-camera';
import RNExitApp from 'react-native-exit-app';
import LocalizedStrings from 'react-native-localization';
import RNFetchBlob from 'rn-fetch-blob';
import { SensorManager } from 'NativeModules';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import CONTROLS from './controls';
import LOCATIONS from './location';
// import CAM from './cam';
import INFOS from './infos';

import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';
let source;
const _source = resolveAssetSource(require('./canvas.html'));
if (__DEV__) {
  source = { uri: `${_source.uri}` };   // uri: `file://${_source.uri}?id=${article.id}` 
}
else {
  const sourceAndroid = { uri: 'file:///android_asset/canvas.html'};//const sourceAndroid = { uri: `file:///android_asset/helloworld.html?id=${article.id}` };
  const sourceIOS = { uri: 'file://${_source.uri}' };
  source = Platform.OS === 'ios' ? sourceIOS : sourceAndroid;
}

const deviceWidth  = Dimensions.get('window').width,
      deviceHeight = Dimensions.get('window').height,
      strings = new LocalizedStrings({
        'en':{
          close:'CLOSE',
          gps_error_title:'ERROR.',
          gps_error:'Please check your device parameters. Location service must be enabled.',
          exitApp:'Exit app ?',
          yes:'YES',
          no:'NO',
          elevation:'Elev.',
          azimuth:'Azi.',
        },
        'fr':{
          close:'FERMER',
          gps_error_title:'Géolocalisation impossible.',
          gps_error:'Vérifier que le service est disponible sur votre appareil et qu\'il est bien activé.',
          exitApp:'Quitter l\'application ?',
          yes:'OUI',
          no:'NON',
          elevation:'Élév.',
          azimuth:'Azi.',
        },
      });

//-------------------------------------------------
//  Outputs device orientation (target)
//-------------------------------------------------
class DeviceOrientationTextView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible:false,//visible={this.state.targetOn && this.state.view!='orbit'}
      orientation:{
        lat:0,
        lon:0,
        roll:0
      },
    }
  }

  setVisible(visible){
    this.setState({
      visible:visible, 
    });
  }

  setOrientation(orientation) {
    this.setState(
      { orientation:orientation }
    );
  }

  getRoll(){
    if (typeof this.state.orientation.roll !== "undefined") {
      return this.state.orientation.roll;
    }
    return 0;
  }
  
  render() {
    if (!this.state.visible) {
      return null;
    }
    return (

      <View 
        pointerEvents = 'none'
        style={[
          styles.targetContainer,
          { transform: [{ rotate: this.getRoll()+'deg'}] }
        ]} 
      >
        <View style={styles.target_h}  ></View>
        <View style={styles.target_v}  ></View>

        <View >
          <Text style={[styles.target_text, styles.target_text_elevation]}>
            <MaterialCommunityIcons 
              name="arrow-expand-up"
              size={16}
              borderRadius={0}
              color={'#aa0000'}
            />&#160;
            { this.state.orientation ? this.state.orientation.lat : '' }°
          </Text>

          <Text style={[styles.target_text, styles.target_text_azimuth]}>
            &#160;&#160;
            <MaterialCommunityIcons 
              name="compass-outline"
              size={16}
              borderRadius={0}
              color={'#aa0000'}
            />&#160;
            { this.state.orientation ? this.state.orientation.lon : '' }°
            {/* roll:  { this.state.orientation ? this.state.orientation.roll : '' }*/}
          </Text>
        </View>

      </View>
    );
  }
}

//-------------------------------------------------
//  Exit app confirmation modal
//-------------------------------------------------
class ExitModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open:false,
    }
  }

  show(){
    this.setState({open: true});
  }

  _confirm() {
    RNExitApp.exitApp();
  }
  _cancel() {
    this.setState({open: false});
  }

  render() {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={this.state.open}
        onRequestClose={() => { this.setState({open: false}); }}
        >
        <View style = { styles.exitModal}>
          <Text style={styles.exitModalTitle}>
            {strings.exitApp}
          </Text>

          <View style={styles.exitModalButtonContainer}>
            <TouchableHighlight 
              onPress={() => { this._confirm() }}
              style = {styles.exitModalButton}
            >
              <Text style={styles.exitModalButtonText}>{strings.yes}</Text>
            </TouchableHighlight>

            <TouchableHighlight
              onPress={() => { this._cancel() }}
              style = {styles.exitModalButton}
            >
              <Text style={styles.exitModalButtonText}>{strings.no}</Text>
            </TouchableHighlight>
          </View>

        </View>
      </Modal>
    );
  }
}

//-------------------------------------------------
// Warn geolocation failed.
//-------------------------------------------------
class GeolocErrorModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open:false,
    }
  }

  show(){
    this.setState({open: true});
  }

  hide() {
    this.setState({open: false});
  }

  render() {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={this.state.open}
        onRequestClose={() => { this.setState({open: false}); }}
        >
        <View style = { styles.exitModal}>
        
            <Text style={styles.exitModalTitle}>
              {strings.gps_error_title}
            </Text>
            <Text style={styles.exitModalText}>
              {strings.gps_error}
            </Text>
        
            <TouchableHighlight
              onPress={() => { this.hide() }}
              style = {styles.exitModalButton}
              >
              <Text style={styles.exitModalTitle}>{strings.close}</Text>
            </TouchableHighlight>
         
          </View>
      </Modal>
    );
  }
}
//-----------------------------------------------------
//
//-----------------------------------------------------

export default class MotionManager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ratio: undefined,
      remountCamera: false,
      widthOffset: false,
    }

    this.webViewBridgeReady = false;
    this.curLoc = {};
    this.initialAzimuth = false;
    this.toBeSent = {};
    this.waitOrientation = false;
  }

  backButton = () => {
    if (this.refs.LOCATIONS && this.refs.LOCATIONS.state && this.refs.LOCATIONS.state.visible) {
      this.refs.LOCATIONS.setVisible(false);
      return true;
    }
    else if (this.refs.INFOS && this.refs.INFOS.state && this.refs.INFOS.state.visible){
      this.refs.INFOS.setVisible(false);
      return true;
    }
    else {
      this.refs.EXITMODAL.show();
      return true;
    }
  }

  componentDidUpdate() {
    if (this.state.remountCamera) {
      // setTimeout(() => {
          this.setState({ remountCamera: false })
      // }, 1);
    }
  }

  // Webwiew sometimes does not provide true heading so catch it from native component.
  resetAzimuth() {
    this.refs.scene.postMessage(JSON.stringify({'azimuthReset':this.initialAzimuth}));
    /*
    this.initialAzimuth = false;
    var scope = this;
  
    SensorManager.startOrientation(100);
    DeviceEventEmitter.addListener('Orientation', (data)=> {
      
      if (this.initialAzimuth === false) {
        this.initialAzimuth = 'first';
        // Getting only the very first returned data gives an inaccurate value so get it for a while sec.
        setTimeout(function() {
          SensorManager.stopOrientation();
          DeviceEventEmitter.removeListener('Orientation');
          scope.initialAzimuth = Math.round(data.azimuth, 10);
          scope.refs.scene.postMessage(JSON.stringify({'azimuthReset':scope.initialAzimuth}));  
        }, 1000); 
      }
    });
    */
  }

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.backButton);

    SensorManager.startOrientation(100);
    DeviceEventEmitter.addListener('Orientation', (data)=> {
      if (!this.waitOrientation) {
        this.waitOrientation = true;
        this.initialAzimuth = Math.round(data.azimuth, 10);
      }
    });

    var scope= this;
    this._interval = setInterval(function(){
      scope.waitOrientation = false;
    }, 100);
  }

  componentWillUnmount() {
    clearInterval(this._interval);
    SensorManager.stopOrientation();
    DeviceEventEmitter.removeListener('Orientation');
  }

  // Controls actions
  controlUpdated = (key, value) => {
    // console.log(key+' '+value);
    if(typeof key == "undefined" || key==''){
      return;
    }

    if(key=='target'){
      this.refs.deviceOrientation.setVisible(value);
    }
    else if(key=='takePicture'){
      // console.log(this.refs.deviceOrientation.state.orientation);
      this.takePicture( value, this.refs.deviceOrientation.state.orientation);
    }
    else if(key=='addLocation'){
      this.refs.LOCATIONS._onAddLoc();
    }
    else if(key=='geoloc'){
      this.refs.LOCATIONS.getLoc();
    }
    else if(key=='azimuthReset'){
      this.resetAzimuth();
    }
    else if(key=='showInfos'){
      this.refs.INFOS.setVisible();
    }

    else {
      
      if(key=='view' && value=='gyroscope'){
        this.refs.scene.postMessage( JSON.stringify({ 
          [key]:value ,
          'azimuthReset':this.initialAzimuth
        }));
      }
      else {
        this.refs.scene.postMessage( JSON.stringify({ [key]:value }));
      }
    }

  }

  onToggleLocationList = (visible) => {
    this.refs.LOCATIONS.setVisible(visible);
  }
  onEditLocation = (id) => {
    this.refs.LOCATIONS._onEditItem(id);
  }
  onSearchLocation = () => {
    this.refs.LOCATIONS.onSearchPress();
  }

  gotNewLoc = (place) => {
    this.refs.CONTROLS.refs.toolBar.gpsSearching = false;
    this.refs.CONTROLS.refs.toolBar.setLocationId(place.id);

    if (place){
      this.curLoc = place;
      this.refs['CONTROLS'].gotNewLoc(place);

      if (this.webViewBridgeReady) {
        this.refs.scene.postMessage( JSON.stringify({ loc:place }));
        if (place.id != -1) {
          this.sendPhotosToBridge();
        }
      }
      else {
        this.toBeSent.loc = place;
        this.toBeSent.photos = true;
      }

    }
    else {
      this.refs.GEOLOCERRORMODAL.show();
    }
  }

  getFOVCallback = (angle) => {
    var d = new Date(),
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()));

    this.fov = angle;
    if (this.webViewBridgeReady) {
      this.refs.scene.postMessage( JSON.stringify({ 
        FOV:angle, // horizontal fov
        sliderTime:d,
      }));
    }
    else {
      this.toBeSent.FOV = angle;
      this.toBeSent.sliderTime = d; 
    }
  }

  sendPhotosToBridge(){
    // console.log('sendPhotosToBridge');
    var photos = [];
    const currentFolder = RNFetchBlob.fs.dirs.DocumentDir + '/' + this.curLoc.date;
    RNFetchBlob.fs.ls(currentFolder).then((files) => {
      var promises = [];
      for(var i=0; i<files.length; i++) {

        console.log(files[i]);
        const metaData = files[i].slice(0,-4).split('_');
        // console.log(currentFolder+'/'+files[i]);
        promises[i] = RNFetchBlob.fs.readFile(currentFolder+'/'+files[i], 'base64')
          .then((data) => {
            this.refs.scene.postMessage( JSON.stringify({
              photo:{
                src:'data:image/jpeg;base64,' + data,
                lat:metaData[0],
                lon:metaData[1],
                roll:metaData[2],
                width:metaData[3],
                height:metaData[4],
                fov:metaData[5],
              }
            }));
          })
      }
    });
  }

  onWebviewLoad() {
    // Send initial data to 3D scene.
    this.resetAzimuth();

    if (this.toBeSent.photos) {
      this.sendPhotosToBridge();
    }
    delete this.toBeSent.photos;

    this.toBeSent.lang = strings.getLanguage();
    this.refs.scene.postMessage(JSON.stringify(this.toBeSent));
  }

  onMessage(webViewData) {
    webViewData = JSON.parse(webViewData);
    for (var propertyName in webViewData) {
      if (propertyName=='debug'){
        console.log(webViewData.debug);
        continue;
      } 

      else if (propertyName == 'WebViewReady') {
        if (!this.webViewBridgeReady){
          this.webViewBridgeReady = true;
          this.onWebviewLoad();
          this.props.onWebviewLoad();
        }
      }

      else if (propertyName == 'drawCompleted') {
        if (this.refs.CONTROLS.lastSliderTime) {
          this.refs.scene.postMessage( JSON.stringify( {'sliderTime':this.refs.CONTROLS.lastSliderTime} ));
          this.refs.CONTROLS.lastSliderTime = false;
        }
      }

      else if (propertyName == 'deviceOri') {
        this.refs['deviceOrientation'].setOrientation( webViewData.deviceOri );
      }

      else if (propertyName == 'sunpos') {
        this.refs['CONTROLS'].refs['SunPosition'].setPosition(  webViewData.sunpos );
      }

      else {
        this.setState({[propertyName]:webViewData[propertyName]});
      }
    }
  }

  onCameraReady = async () => {
    // this.camera.getAvailablePictureSizes().then((sizes) => {
    //   console.log('getAvailablePictureSizes', sizes);
    // });

    if (!this.state.ratio && this.camera) {

      this.camera.getSupportedRatiosAsync().then((ratios) => {
        // console.log('getSupportedRatiosAsync', ratios);

        // Choose a ratio close to screen ratio.
        const device_ratio = this.device_height / this.device_width;
        var delta = 999,
            ratio = '1:1';
        for (var i in ratios) {
          const curRatio = ratios[i].split(':')[0] / ratios[i].split(':')[1]
          if (Math.abs(curRatio - device_ratio) < delta) {
            delta = Math.abs(curRatio - device_ratio);
            ratio = ratios[i];
          }
        }
        // Compute negative margins.
        const newWidth = this.device_height * (parseInt(ratio.split(':')[1], 10) / parseInt(ratio.split(':')[0], 10));
        this.setState({...this.state, 
          ratio:ratio, 
          widthOffset:-((newWidth - this.device_width) /2),
          remountCamera: true,
        }, function () {
          // console.log(this.state);
        });
      });
    
      this.camera.getFOV().then((data) => {
        // console.log('gotFOV');
        // console.log(data);
        this.getFOVCallback( data[0] );
      }).catch(err =>  {
        // Cam not yet initialised, try again.
        // console.log('getFOV', err);
      });
    }
  };

  takePicture = async (folder, orientation) => {
    folder = RNFetchBlob.fs.dirs.DocumentDir +'/'+ folder +'/';
    // console.log(folder);
    // console.log('orientation', orientation);

    if (this.camera) {

      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE]);
          // console.log(granted);

        if (granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
        &&  granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED){
     
          try {
            var picture = await this.camera.takePictureAsync({ 
              quality: 0.7, 
              base64: false, 

              width: this.device_width + this.state.widthOffset*(-2) * PixelRatio.get(),
              fixOrientation: true,
            });
            // console.log('Picture taken:');
            // console.log(picture);
              // height: 3024
              // uri: "file:///data/user/0/com.sol/cache/Camera/2582d5c5-a8a0-4658-91b0-9ff14f501634.jpg"
              // width: 4032

            // Move picture to location folder.
            folder +=
              orientation.lat +'_'+ 
              orientation.lon +'_'+ 
              orientation.roll +'_'+ 
              picture.width +'_'+ 
              picture.height +'_'+ 
              this.fov + '.jpg';
            RNFetchBlob.fs.mv(
              picture.uri.replace('file://',''),
              folder,
            ).then(() => {

              // Send photo to webview.
              RNFetchBlob.fs.readFile(folder, 'base64').then((base64) => {
                this.refs.scene.postMessage( JSON.stringify({
                  photo:{
                    src:'data:image/jpeg;base64,' + base64,
                    lat:orientation.lat,
                    lon:orientation.lon,
                    roll:orientation.roll,
                    width:picture.width,
                    height:picture.height,
                    fov:this.fov,
                  }
                }));
              })

            }).catch((error) => {
              alert('Move file ERROR');
              // console.log('Move file ',error);
            }); 

          } 
          catch (err) {
            // console.log('takePictureAsync ERROR: ', err);
          }
        } else {
         // console.log('REFUSED');
        }
      } catch (err) {
        // console.warn(err)
      }
    }
  };

  getWindowDimensions(event) {
    this.device_width = event.nativeEvent.layout.width;
    this.device_height = event.nativeEvent.layout.height;

    if (this.state.ratio && this.state.widthOffset===false) {
      const newWidth = this.device_height * (parseInt(this.state.ratio.split(':')[1], 10) / parseInt(this.state.ratio.split(':')[0], 10));
      this.setState({ widthOffset:-((newWidth - this.device_width) /2) });
    }
  }

  renderCamera() {
    return(
      !this.state.remountCamera && (
        <RNCamera
          ref={cam => (this.camera = cam)}
          style = {[styles.cam, {left: this.state.widthOffset||0 , right:this.state.widthOffset||0}]}
          type={RNCamera.Constants.Type.back}
          flashMode={RNCamera.Constants.FlashMode.off}
          permissionDialogTitle={'Permission to use camera'}
          permissionDialogMessage={'We need your permission to use your camera phone'}
          autoFocus ={RNCamera.Constants.AutoFocus.off}
          focusDepth = {1}

          onCameraReady = {this.onCameraReady} 
          ratio = {this.state.ratio}
          >
          <WebView   
            ref = "scene"
            mixedContentMode = 'always'
            style = { styles.w_webView }
            source = {source}
            onMessage={(event)=> this.onMessage(event.nativeEvent.data)}
          />
        </RNCamera>
      )
    );
  }

  render() {
    return (
      <View 
        style={styles.container}
        onLayout={(event) => this.getWindowDimensions(event)}
        >

        {this.renderCamera()}

        <CONTROLS
          ref="CONTROLS"
          controlUpdated={this.controlUpdated}
          onToggleLocationList = { this.onToggleLocationList }
          onEditLocation = { this.onEditLocation }
          onSearchLocation = { this.onSearchLocation }
          onBackButton = { this.backButton }
        />

        <DeviceOrientationTextView ref="deviceOrientation"/>

        <LOCATIONS
          ref = "LOCATIONS"
          curLoc = {false}
          visible = {false}
          gotNewLoc = { this.gotNewLoc }
        />
        
        <INFOS ref="INFOS"/>
        <ExitModal ref="EXITMODAL"/>
        <GeolocErrorModal ref="GEOLOCERRORMODAL"/>

      </View>
    )
  }
}

const styles = StyleSheet.create({ 
  container:{
    alignSelf: 'stretch',
    flex: 1,
    backgroundColor:'rgba(52,52,255,0)',
  },
  cam: {
    position:'absolute',
    left:0,
    right:0,
    top:0,
    bottom:0,
    flex: 1,
    backgroundColor:'black',
  },
  w_webView:{
    alignSelf: 'stretch',
    flex: 1,
    backgroundColor:'rgba(0,0,0,0)',
  },

  targetContainer:{
    position: 'absolute',
    top: (deviceHeight>deviceWidth) ? deviceHeight/2 - deviceWidth/2 : 0,
    bottom: (deviceHeight>deviceWidth) ? deviceHeight/2 - deviceWidth/2 : 0,
    left: (deviceHeight>deviceWidth) ? 0 :  deviceWidth/2 - deviceHeight/2,
    right: (deviceHeight>deviceWidth) ? 0 : deviceWidth/2 - deviceHeight/2,
    flex:1,
    paddingLeft:(deviceHeight<deviceWidth) ? deviceHeight/2 + 5 : deviceWidth/2 + 5,
    paddingTop:(deviceHeight<deviceWidth) ? deviceHeight/2 - 65 : deviceWidth/2 - 65,
  },

  target_h:{
    position: 'absolute',
    top: (deviceHeight<deviceWidth) ? deviceHeight/2 : deviceWidth/2,
    left: 0,
    right:0,
    height:1,
    backgroundColor:'red',
  },

  target_v:{
    position: 'absolute',
    top: 0,
    left: (deviceHeight<deviceWidth) ? deviceHeight/2 : deviceWidth/2,
    bottom:0,
    width:1,
    backgroundColor:'red',
  },

  target_text:{
    color: 'red',
    fontSize: 24,
  },


  exitModal:{
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding:40,
  },
    exitModalTitle:{
      fontWeight:'bold',
      textAlign:'center',
      fontSize:20,
      marginBottom:10,
      color:'white',
    },
    exitModalText:{
      fontWeight:'normal',
      textAlign:'center',
      fontSize:20,
      marginBottom:10,
      color:'white',
    },
    exitModalButtonContainer:{
      flexDirection:'row',
       alignSelf: 'stretch',
    },
      exitModalButton:{
        flex:0.5,
        height:50,
        margin:5,
        padding:10,
        backgroundColor: 'rgba(0,0,0,0.7)',
      },
      exitModalButtonText:{
        fontWeight:'bold',
        textAlign:'center',
        fontSize:20,
        color:'white',
      },
});
