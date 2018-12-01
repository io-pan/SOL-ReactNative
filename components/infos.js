import React, { Component } from 'react';
import {
	AppRegistry,
	StyleSheet,
	Text,
	Alert,
	View,
  Image,
  TouchableHighlight,
  Linking,
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
          algo:'Sun position algorithm:',
          source:'Open source application',
          react1:'Developed with React-Native',
          react2:'(for once Facebook is doing something useful ;)',
        },
        'fr':{
          credits:'Crédits:',
          algo:'Algorithme de la position du soleil:',
          source:'Application open source:',
          react1:'Développé avec',
          react2:'pour une fois que Facebook fait quelque chose d\'utile ;)',
        },
      });



export default class Infos extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible:false,
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
          <Image
            resizeMode='contain'
            style={styles.icon}
            source={require('./img/launch_screen.png')}
          />
        
          <Text style={styles.title}>
            {/*{strings.credits}*/}
          </Text>

          <Text style={styles.strong}>
            {strings.algo}
          </Text>
          <Text style={styles.normal}
            onPress={() => Linking.openURL('http://www.psa.es/sdg/archive/SunPos.cpp')}>
            http://www.psa.es/sdg/archive/SunPos.cpp
          </Text>

          <Text style={styles.normal} />

          <Text style={styles.strong}>
            {strings.source}
          </Text>

          <Text style={styles.normal}
            onPress={() => Linking.openURL('https://github.com/io-pan/SOL-ReactNative')}>
            https://github.com/io-pan/SOL-ReactNative
          </Text>

        </View>
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
    // justifyContent:'center',
  },

  scrollView:{
    flex:1,
    alignSelf: 'stretch',
    alignItems:'center', 
    // justifyContent:'center',
  },

  title:{
    color:'#000000', 
    fontSize:22,
    alignSelf: 'stretch',
    textAlign: 'center',
    paddingBottom:50,
  },
  strong:{
    textAlign:'center',
    color:'#000000', 
    fontSize:16,
    fontWeight:'bold',
  },
  normal:{
    textAlign:'center',
    color:'#3333aa', 
    fontSize:16,
    paddingBottom:10,
  },
  icon:{
    maxHeight:250,
    width:250,
    minHeight:250,
    },
});