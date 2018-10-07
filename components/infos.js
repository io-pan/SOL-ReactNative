import React, { Component } from 'react';
import {
	AppRegistry,
	StyleSheet,
	Text,
	Alert,
	View,
  ScrollView,
  TouchableHighlight,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LocalizedStrings from 'react-native-localization';
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

const strings = new LocalizedStrings({
        'en':{
          credits:'Crédits:',
          algo:'Sun position algorithm found at',
          source:'This is an open source application',
          react1:'Developed with React-Native',
          react2:'(for once Facebook is doing something useful ;)',
        },
        'fr':{
          credits:'Crédits:',
          algo:'Algorithme de la position du soleil trouvé sur',
          source:'Cette application est un projet open source',
          react1:'Développé avec',
          react2:'pour une fois que Facebook fait quelque chose d\'utile ;)',
        },
      });



export default class Infos extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible:false,//visible={this.state.targetOn && this.state.view!='orbit'}
    }
  }

  setVisible (visible) {
    if (typeof visible == 'undefined') {
      visible = !this.state.visible;
    }
    this.setState({'visible':visible});
  }
  
  render() {
    if (!this.state.visible) return null;
    
    return (
      <TouchableHighlight  
        style={styles.infosContainer}
        onPress={() => { this.setVisible(false) }}
        >
        <View style={styles.scrollView} >

          <Text style={styles.title}>{strings.credits}</Text>
{/*
            <MaterialCommunityIcons 
              name="compass-outline"
              size={16}
              borderRadius={0}
              color={'#222222'}
            />
*/}
          <Text style={styles.strong}>
            {strings.algo}
          </Text>
          <Text style={styles.normal}>
            http://www.psa.es/sdg/archive/SunPos.cpp
          </Text>

          <Text style={styles.normal} />

          <Text style={styles.strong}>
            {strings.source}
          </Text>

          <Text style={styles.normal}>
            https://github.com/io-pan/SOL-ReactNative
          </Text>

          <Text style={styles.title}/>



        </View>
        {/*
        <View style = {styles.exitBar} >
          <Icon.Button 
            name="times" 
            size={25}
            color="rgba(50,50,55,0.8)"
            backgroundColor = {'transparent'}
            underlayColor = "rgba(255,255,255,0.5)"
            onPress={() => { this.setVisible(false) }}
          >
            <Text style={styles.exitText}>Fermer</Text>
          </Icon.Button>
        </View>
        */}
      </TouchableHighlight>
    );
  }
}

const styles = StyleSheet.create({ 
  infosContainer:{
    position: 'absolute',
    top:0,
    bottom:0,
    left:0,
    right:0,
    backgroundColor:'rgba(250,250,255,1)',
    padding:10,
    alignItems:'center', 
    justifyContent:'center',
  },

  scrollView:{
    flex:1,
    alignSelf: 'stretch',
    alignItems:'center', 
    justifyContent:'center',
  },

  title:{
    color:'#000000', 
    fontSize:22,
    alignSelf: 'stretch',
    textAlign: 'center',
    paddingBottom:20,
  },
  strong:{
    textAlign:'center',
    color:'#000000', 
    fontSize:16,
    fontWeight:'bold',
  },
  normal:{
    textAlign:'center',
    color:'#444444', 
    fontSize:16,
    paddingBottom:10,
  },
/*
  exitBar:{
    position:'absolute', 
    top:0,
    left:0,
    right:0,
    margin:0, 
    flexDirection:'row', 
    justifyContent: 'flex-end',
  },
  exitText:{
    fontWeight:'bold', 
    fontSize:15,
  },*/
});