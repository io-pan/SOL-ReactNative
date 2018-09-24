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
} from 'react-native';

import RNExitApp from 'react-native-exit-app';
import LocalizedStrings from 'react-native-localization';
import RNFetchBlob from 'react-native-fetch-blob';
import { SensorManager } from 'NativeModules';
// import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// import CONTROLS from './controls';
// import LOCATIONS from './location';
import CAM from './cam';
// import INFOS from './infos';

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
          exitApp:'Do you want to quit this marvelous application ?',
          yes:'YES',
          no:'NO',
          elevation:'Elev.',
          azimuth:'Azi.',
        },
        'fr':{
          close:'FERMER',
          gps_error_title:'Géolocalisation impossible.',
          gps_error:'Vérifier que le service est disponible sur votre appareil et qu\'il est bien activé.',
          exitApp:'Voulez-vous quitter cette merveilleuse application ?',
          yes:'OUI',
          no:'NON',
          elevation:'Élév.',
          azimuth:'Azi.',
        },
      });


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



  getFOVCallback = (angle) => {
    var d = new Date(),
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()));

    if (this.webViewBridgeReady) {
      this.refs.scene.postMessage( JSON.stringify({ 
        FOV:angle,
        sliderTime:d,
      }));
    }
    else {
      this.toBeSent.FOV = angle;
      this.toBeSent.sliderTime = d; 
    }
  }

  getNewPhoto = (photoPath) => {
    const metaData = photoPath.slice(0,-4).split('_'), // -4 <=> .jpg length
          currentFolder = RNFetchBlob.fs.dirs.DocumentDir + '/' + this.curLoc.date;

    var promises = RNFetchBlob.fs.readFile(currentFolder+'/'+photoPath, 'base64')
        .then((data) => {
          this.refs.scene.postMessage( JSON.stringify({
            photo:{
              src:'data:image/jpeg;base64,' + data,
              lat:metaData[0],
              lon:metaData[1],
              roll:metaData[2],
            }
          }));
        })
  }

  sendPhotosToBridge(){
    // console.log('sendPhotosToBridge');
    var photos = [];
    const currentFolder = RNFetchBlob.fs.dirs.DocumentDir + '/' + this.curLoc.date;
    RNFetchBlob.fs.ls(currentFolder).then((files) => {
      var promises = [];
      for(var i=0; i<files.length; i++) {
        const metaData = files[i].slice(0,-4).split('_');

        promises[i] = RNFetchBlob.fs.readFile(currentFolder+'/'+files[i], 'base64')
          .then((data) => {
            this.refs.scene.postMessage( JSON.stringify({
              photo:{
                src:'data:image/jpeg;base64,' + data,
                lat:metaData[0],
                lon:metaData[1],
                roll:metaData[2],
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
        this.webViewBridgeReady = true;
        this.onWebviewLoad();
        this.props.onWebviewLoad();
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

	render () {
		return (
			<View style={styles.container}>
        <CAM ref='cam'
          FOV = {false}
          getFOVCallback = { this.getFOVCallback }
          getNewPhoto = { this.getNewPhoto }
        />
    

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

  w_webView:{
    // alignSelf: 'stretch',
    // flex: 1,
    backgroundColor:'rgba(0,0,0,0)',
    position: 'absolute',
    top:0,
    left:0,
    bottom:0,
    right:0,
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
