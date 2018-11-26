import React, { Component } from 'react';
import { 
  View, 
  Text,
  Button,
  Image,
  TouchableHighlight,
  ScrollView,
  StyleSheet,
  Animated,
  Slider,
  Dimensions,
  Alert,
  NetInfo,
  AsyncStorage,
} from 'react-native';

import DatePicker from 'react-native-datepicker';
import Icon from 'react-native-vector-icons/FontAwesome';             // http://fontawesome.io/icons/          
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';  // https://material.io/icons/
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LocalizedStrings from 'react-native-localization';

const strings = new LocalizedStrings({
  'en':{
    month0:'Jan.',
    month1:'Feb.',
    month2:'Mar.',
    month3:'Apr.',
    month4:'May',
    month5:'June',
    month6:'July.',
    month7:'Aug.',
    month8:'Sept.',
    month9:'Oct.',
    month10:'Nov.',
    month11:'Dec.',

    elevation:'Elev.',
    azimuth:'Azi.',
    day:'Day',
    year:'Year',
    hours:'Hours',
    months:'Months',
    solstices:'Solstices',
    ground:'Ground',
    compass:'Compass',
    pictures:'Pictures',
  },
  'fr':{
    month0:'jan.',
    month1:'fév.',
    month2:'mars',
    month3:'avr.',
    month4:'mai',
    month5:'juin',
    month6:'juil.',
    month7:'aôut',
    month8:'sept.',
    month9:'oct.',
    month10:'nov.',
    month11:'dec.',

    elevation:'Élév.',
    azimuth:'Azi.',
    day:'Jour',
    year:'Année',
    hours:'Heures',
    months:'Mois',
    solstices:'Solstices',
    ground:'Sol',
    compass:'Boussole',
    pictures:'Photos',
  },
});

const colorLight = 'rgba(250,250,255,0.8)',
      backgroundDark = 'rgba(0,0,0,0.3)',
      colorDark = 'rgba(30,30,30,0.8)',
      backgroundLight = 'rgba(255,255,255,0.4)',

      // Date format helpers
      pad = function(num, size) {
        var s = "000000000" + num;
        return s.substr(s.length-size);
      },

      date2formatTimePicker = function(datetime){
        if (typeof datetime == 'undefined') {
          datetime = new Date();
        }

        return '' +
          pad(datetime.getDate(),2) +  '/' + 
          pad((datetime.getMonth()+1),2)+' ' + 
          pad(datetime.getHours(),2) + ':' + 
          pad(datetime.getMinutes(),2)
        ;
      },

      date2formatText = function(datetime) {
        // strings.setLanguage('en');
        return '' +
          pad(datetime.getUTCDate(),2) + ' ' + 
          strings['month'+datetime.getUTCMonth()] + ' ' + 
          pad(datetime.getUTCHours(),2) + ':' + 
          pad(datetime.getUTCMinutes(),2)
        ;
      };

      Date.prototype.isLeapYear = function() {
          var year = this.getFullYear();
          if((year & 3) != 0) return false;
          return ((year % 100) != 0 || (year % 400) == 0);
      };
      Date.prototype.getDOY = function() { //  Day Of Year
          var dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
          var mn = this.getMonth();
          var dn = this.getDate();
          var dayOfYear = dayCount[mn] + dn;
          if(mn > 1 && this.isLeapYear()) dayOfYear++;
          return dayOfYear;
      };

//---------------------------------------------------------------------
// Sub components
//---------------------------------------------------------------------

//---------------------------------------------------------------------
class ToolBar extends Component {
  constructor(props) {
    super(props);
    this.state={
      locationId:false,
      gpsOpacity:new Animated.Value(1),
      azimuthResetRotation:new Animated.Value(1),
      collapsedPanel:false,
      view:'gyroscope',
      target:false,
      visible_azimuthCorrection: false,
      visible_sceneLayout: false,
    }
    this.gpsSearching = false;
    this.toValue = 1;
  }

  componentDidMount() {
    NetInfo.addEventListener(
      'connectionChange',
      this._handleConnectivityChange
    );

    NetInfo.isConnected.fetch().done(
        (isConnected) => { this.setState({'connected':isConnected}); }
    );
  }
  componentWillUnmount() {
    NetInfo.removeEventListener(
      'connectionChange',
      this._handleConnectivityChange
    );
  }

  _handleConnectivityChange = (isConnected) => {
    this.setState({'connected':isConnected});
  }

  gpsAnimation() {
    if (!this.gpsSearching && this.toValue==1){
      return;
    }
    this.toValue = (this.toValue==0) ?1:0;
    Animated.timing(
      this.state.gpsOpacity,
      {
        toValue: this.toValue,
        useNativeDriver: true,
      }
    ).start(() => this.gpsAnimation())  
  }

  setLocationId(id) {
    this.setState({locationId:id});
  }

  azimuthResetAnimation() {
    this.state.azimuthResetRotation.setValue(0);
    Animated.timing(this.state.azimuthResetRotation, {
      toValue: 360,
      duration: 1000,
    }).start();
  }

  setLocationId(id) {
    this.setState({locationId:id});
  }

  onToggleButton(key, value){
    if (typeof value == 'undefined') {
      if (key=='view') {
        if (this.state.view == 'orbit') {
          value = 'gyroscope';
        }
        else if (this.state.view == 'gyroscope') {
          value = 'panorama';
        }
        else if (this.state.view == 'panorama') {
          value = 'orbit';
        }
      }
      else {
        value = !this.state[key];
      }
    }

    // Hide inappropriate items on orbital view.
    if (key=='view' && value=='orbit') {
      this.onToggleButton('target', false);
      this.onToggleButton('azimuthCorrection', false);
    }

    else if (key=='geoloc') {
      this.gpsSearching = true;
      this.gpsAnimation();
    }

    else if (key=='azimuthReset') {
      this.azimuthResetAnimation();
    }

    this.setState({[key]:value});
    this.props.buttonToggled(key, value);
  }

  _renderCameraButton() {
    if (this.state.locationId == -1 || this.state.view != 'gyroscope') {
      return(
        <MaterialCommunityIcons.Button   
          name='cancel' 
          size={24}
          height={40}
          width={40}
          style={styles.iconButton}
          borderRadius={0}
          padding={0}
          paddingLeft={0}
          margin={0}
          marginLeft={2}
          color='#777777'
          backgroundColor={backgroundDark}
        ></MaterialCommunityIcons.Button>
      );
    }
    else {
      return(
        <MaterialCommunityIcons.Button   
          name='camera'
          underlayColor={colorLight}
          size={24}
          height={40}
          width={40}
          style={styles.iconButton}
          borderRadius={0}
          padding={0}
          paddingLeft={0}
          margin={0}
          marginLeft={2}
          color={colorLight}
          backgroundColor ={backgroundDark}
          onPress={ () => this.onToggleButton('takePicture')}
        />  
      );
    }
  }

  _renderAzimuthCorrectionButton(){
    if (this.state.view != 'gyroscope'){
      return(
        <MaterialCommunityIcons.Button   
          name='cancel' 
          size={24}
          height={40}
          width={40}
          style={styles.iconButton}
          borderRadius={0}
          padding={0}
          paddingLeft={0}
          margin={0}
          marginLeft={2}
          color='#777777'
          backgroundColor={backgroundDark}
        ></MaterialCommunityIcons.Button>
      );
    }
    else {
      return(
        <View style={{backgroundColor:this.state.visible_azimuthCorrection ? backgroundLight : backgroundDark }}>
        <Animated.View 
          style={{transform: [
                {rotate: this.state.azimuthResetRotation.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg']
                })},
              ]}}
          >
          <MaterialCommunityIcons.Button   
            name='compass-outline' 
            size={24}
            height={40}
            width={40}
            style={styles.iconButton}
            borderRadius={0}
            padding={0}
            paddingLeft={0}
            margin={0}
            marginLeft={2}

            color={ this.state.visible_azimuthCorrection ? colorDark : colorLight }
            backgroundColor='transparent'
            onPress={ () => this.onToggleButton('azimuthReset') }
            onLongPress={ () => this.onToggleButton('visible_azimuthCorrection') }
          />
        </Animated.View>
        </View>
      );
    }
  }

  _renderTargetButton(){
    if (this.state.view == 'orbit'){
      return(
        <MaterialCommunityIcons.Button   
          name='cancel' 
          size={24}
          height={40}
          width={40}
          style={styles.iconButton}
          borderRadius={0}
          padding={0}
          paddingLeft={0}
          margin={0}
          marginLeft={2}
          color='#777777'
          backgroundColor={backgroundDark}
        />
      );
    }
    else {
      return(
        <MaterialCommunityIcons.Button   
          name='plus-box-outline' 
          size={24}
          height={40}
          width={40}
          style={styles.iconButton}
          borderRadius={0}
          padding={0}
          paddingLeft={0}
          margin={0}
          marginLeft={2}

          color= { this.state.target ? colorLight : colorLight }
          backgroundColor={ this.state.target ? backgroundLight : backgroundDark }
          onPress={ () => this.onToggleButton('target') }
        />
      );
    }
  }

  _renderSearchButton() {
    if (!this.state.connected || this.state.connected.type == 'none' ) return null;

    return (
      <MaterialCommunityIcons.Button
        name="magnify" 
        size={22}
        height={40}
        width={40}
        style={styles.iconButton}
        borderRadius={0}
        padding={0}
        paddingLeft={0}
        margin={0}
        marginLeft={2}

        color= { colorLight }
        backgroundColor={ backgroundDark }
        onPress ={ () => this.props.onSearchLocation() }
      />
    );  
  }

  render() {
    // console.log(this.state);
    return (
      <View style={styles.panelTopBar}>
        <ScrollView horizontal={true} style={styles.panelTopBarScroll}>
        
          <View style={{ paddingLeft:10, backgroundColor:backgroundDark, transform:[{ rotate: '180deg'}] }} >
            <Icon.Button   
              name="sign-out"
              size={24}
              height={40}
              width={40}
              style={styles.iconButton}
              borderRadius={0}
              padding={0}
              paddingLeft={0}
              margin={0}
              marginLeft={2}

              color={colorLight}
              backgroundColor = 'transparent'
              onPress={() => this.props.onBackButton()}
            />
          </View>

          <View style={{backgroundColor:backgroundDark}}>
            <Animated.View style={[{position:'absolute'}, { opacity: this.state.gpsOpacity }]}>
              <MaterialCommunityIcons.Button
                name="crosshairs-gps" 
                size={22}
                height={40}
                width={40}
                style={styles.iconButton}
                borderRadius={0}
                padding={0}
                paddingLeft={0}
                margin={0}
                marginLeft={2}
                color= { colorLight }
                backgroundColor = 'transparent'
              />
            </Animated.View>
            <MaterialCommunityIcons.Button
              name="crosshairs"
              size={22}
              height={40}
              width={40}
              style={styles.iconButton}
              borderRadius={0}
              padding={0}
              paddingLeft={0}
              margin={0}
              marginLeft={2}
              color={colorLight}
              backgroundColor = 'transparent'
              onPress ={ () => this.onToggleButton('geoloc') }
            />
          </View>

          {this._renderSearchButton()}

          <MaterialCommunityIcons.Button
            name="map-marker-multiple"
            size={22}
            height={40}
            width={40}
            style={styles.iconButton}
            borderRadius={0}
            padding={0}
            paddingLeft={0}
            margin={0}
            marginLeft={2}

            color= { colorLight }
            backgroundColor={ backgroundDark }
            onPress ={ () => this.props.onToggleLocationList() }
          />

          <MaterialCommunityIcons.Button   
            name='cube-outline' 
            size={24}
            height={40}
            width={40}
            style={styles.iconButton}
            borderRadius={0}
            padding={0}
            paddingLeft={0}
            margin={0}
            marginLeft={2}

            color= { this.state.visible_sceneLayout ? colorDark : colorLight }
            backgroundColor={ this.state.visible_sceneLayout ? backgroundLight : backgroundDark }
            onPress={ () => this.onToggleButton('visible_sceneLayout') }
          />

          <View style={{position:'relative', margin:0,padding:0, height:40,width:40,backgroundColor:backgroundDark}} >
            <View style={{position:'absolute',left:0, top:5}} >
              <Icon.Button
                name ='eye'
                size={22}
                height={25}
                width={35}
                style={styles.iconButton}
                borderRadius={0}
                padding={0}
                paddingLeft={1}
                paddinTop={1}
                margin={0}
                marginLeft={0}

                color={colorLight}
                backgroundColor = 'transparent'
              />
            </View>
            <View style={{position:'absolute', paddingLeft:5, paddingTop:8}} >
              <MaterialCommunityIcons.Button
                name ={ 
                  (this.state.view=='orbit') ? "orbit" : 
                  (this.state.view=='panorama' ) ? "image" : "compass-outline" 
                }
                size={14}
                height={40}
                width={40}
                style={styles.iconButton}
                borderRadius={0}
                padding={0}
                margin={0}
                color={colorLight}
                backgroundColor = 'transparent'
                onPress={() => this.onToggleButton('view')}
                underlayColor = 'transparent'
              />
            </View>
          </View>

          { this._renderTargetButton() }
          { this._renderCameraButton() }
          { this._renderAzimuthCorrectionButton() }

          <Icon.Button   
            name='info-circle' 
            size={24}
            height={40}
            width={40}
            style={styles.iconButton}
            borderRadius={0}
            padding={0}
            paddingLeft={0}
            margin={0}
            marginLeft={2}

            color={colorLight}
            backgroundColor={ backgroundDark}
            onPress={() => this.onToggleButton('showInfos')}
          />
          
        </ScrollView>


        <MaterialCommunityIcons.Button   
          name={ this.state.collapsedPanel ? 'chevron-up' : 'chevron-down'}
          ref="collapseButton"
          size={24}
          height={40}
          width={40}
          style={styles.iconButton}
          borderRadius={0}
          padding={0}
          paddingLeft={0}
          margin={0}
          marginLeft={2}
          color={colorDark}
          backgroundColor={backgroundLight}

          onPress={ () => this.onToggleButton('collapsedPanel') }
        />
      </View>
    );
  }
}

//---------------------------------------------------------------------
/*export*/ class AzimuthCorrection extends Component {
  constructor(props) {
    super(props);
    this.state={
      bounceValue: new Animated.Value(0),
      correction:0,
    }
    this.panelHeight = 80;
    this.visible = false;
  }

  setVisible(visible){
    if (typeof visible == 'undefined') {
      this.visible = !this.visible;
    }
    else {
      this.visible = visible;
    }
    Animated.spring(
      this.state.bounceValue,
      {
        toValue: (this.visible) ? this.panelHeight : 0,
        velocity: 20,
        // useNativeDriver: true,
      }
    ).start();
  }

  reset() {
    this.setState({correction:0, lat:0});
    this.refs['alphaOffsetAngle'].setNativeProps({ value: 0});
    this.refs['latOffsetAngle'].setNativeProps({ value: 0});
  }

  onAzimuthOffset(angle) {
    this.props.onAzimuthOffset(angle);
    this.setState({
      correction: angle,
    });
  }
  onLatOffset(angle) {
    this.props.onLatOffset(angle);
    this.setState({
      lat: angle,
    });
  }

  render() {
    return (
      <Animated.View 
        style={[styles.collapsiblePanelWrapper, {height: this.state.bounceValue}]}
        // onLayout={this.getPanelHeight} 
        > 
        <View style={styles.collapsiblePanelContainer}>
          <View style={styles.collapsiblePanelLine_column}>
            {/* <Text style={styles.AzimuthCorrectionText}>{this.state.correction}</Text> */}

            <View style={styles.flex1Row}>
            <Slider  
              ref="latOffsetAngle"
              style={styles.AzimuthCorrectionSlider} 
              thumbTintColor = '#ffffff' 
              minimumTrackTintColor='#dddddd' 
              maximumTrackTintColor='#888888' 
              minimumValue={-90}
              maximumValue={90}
              step={1}
              onValueChange={
                (value) => this.onLatOffset(value)
              } 
            />
            <MaterialCommunityIcons 
              name="arrow-expand-up"
              color="#ffffff"
              style={{paddingRight:2}}
            />
            </View>

            <View style={styles.flex1Row}>
            <Slider  
              ref="alphaOffsetAngle"
              style={styles.AzimuthCorrectionSlider} 
              thumbTintColor = '#ffffff' 
              minimumTrackTintColor='#dddddd' 
              maximumTrackTintColor='#888888' 
              minimumValue={-180}
              maximumValue={180}
              step={1}
              onValueChange={
                (value) => this.onAzimuthOffset(value)
              } 
            />
           <MaterialCommunityIcons 
              name="compass-outline"
              color="#ffffff"
              style={{paddingRight:2}}
            />
            </View>
          </View>
        </View>
      </Animated.View>
    );
  }
}


//---------------------------------------------------------------------
class ColorPicker extends Component {
  constructor(props) {
    super(props);
    this.state={
      color:'rgb(0,0,0)',
      bounceValue: new Animated.Value(0),
    }
    this.panelHeight = 50;
    this.item = false; // item is dayPath, Hours, solstices...

    this.width = Dimensions.get('window').width - 30; // 30 = slider default left+right margins
    let Arr = [];
    for(i=0; i <= this.width; i++){
      Arr.push('hsl('+ 360*i/this.width +', 100%, 50%)');
    }
    this.gradiant = Arr.map((rgb, i) => {
      return (
        <View 
          key={i} 
          style={{ height:this.panelHeight, width:1, backgroundColor: rgb}}>
        </View>                            
      );
    });
  }

  editColor (item, color) {
    // init slider value.
    if (item && color) {
      this.setState({color:color});

      var hexToHsl = function hexToHsl(hex) {
        var min, max, i, l, s, maxcolor, h,
        rgb = [ hex.substr(1,2), hex.substr(3,2), hex.substr(5,2)];

        rgb[0] = parseInt(rgb[0],16) / 255;
        rgb[1] = parseInt(rgb[1],16) / 255;
        rgb[2] = parseInt(rgb[2],16) / 255;
        min = rgb[0];
        max = rgb[0];
        maxcolor = 0;
        for (i = 0; i < rgb.length - 1; i++) {
          if (rgb[i + 1] <= min) {min = rgb[i + 1];}
          if (rgb[i + 1] >= max) {max = rgb[i + 1];maxcolor = i + 1;}
        }
        if (maxcolor == 0) {
          h = (rgb[1] - rgb[2]) / (max - min);
        }
        if (maxcolor == 1) {
          h = 2 + (rgb[2] - rgb[0]) / (max - min);
        }
        if (maxcolor == 2) {
          h = 4 + (rgb[0] - rgb[1]) / (max - min);
        }
        if (isNaN(h)) {h = 0;}
        h = h * 60;
        if (h < 0) {h = h + 360; }
        l = (min + max) / 2;
        if (min == max) {
          s = 0;
        } else {
          if (l < 0.5) {
            s = (max - min) / (max + min);
          } else {
            s = (max - min) / (2 - max - min);
          }
        }
        s = s;
        return {h : h, s : s, l : l};
      }

      this.refs['hueSlider'].setNativeProps({ 
        value: hexToHsl(color).h/360 * this.width 
      });
    }

    // Toggle panel.
    var toValue = this.panelHeight;
    if (!item || item==this.item){
      toValue = 0;
      item = false;
    }

    Animated.spring(
      this.state.bounceValue,
      {
        toValue:toValue,
        velocity: 20,
        // useNativeDriver: true,
      }
    ).start();

    this.item = item;
  }

  changeColor(hue) {
    // Hexadecimal color is recommended on three.js
    var hslToHex =  function hslToHex(h, s, l){
      var r, g, b, 
          toHex = function toHex (n) {
            var hex = n.toString(16);
            while (hex.length < 2) {hex = "0" + hex; }
            return hex;
          }

      if (s == 0) {
          r = g = b = l; // achromatic
      }
      else {
          var hue2rgb = function hue2rgb(p, q, t){
              if(t < 0) t += 1;
              if(t > 1) t -= 1;
              if(t < 1/6) return p + (q - p) * 6 * t;
              if(t < 1/2) return q;
              if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
              return p;
          }

          var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          var p = 2 * l - q;
          r = hue2rgb(p, q, h + 1/3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1/3);
      }
      return '#' + toHex(Math.round(r*255)) + toHex(Math.round(g*255)) + toHex(Math.round(b*255));
    }

    this.setState(
      {color:hslToHex(hue,1,0.5)}, 
      function(){
        this.props.colorChanged(this.item, this.state.color);
      }
    );
  }

  render() {
    // if (!this.state.visible) return null;
    return(
      <Animated.View style={{overflow:'hidden', backgroundColor:this.state.color, height: this.state.bounceValue}}>
        <View style={{flexDirection:'row', flex:1, paddingLeft:15, paddingRight:15}}>
          { this.gradiant }
        </View>
        <View style={{position:'absolute', top:0, bottom:0, left:0, right:0}}>
          <Slider 
            ref="hueSlider"
            style={styles.AzimuthCorrectionSlider} 
            thumbTintColor = '#ffffff' 
            minimumTrackTintColor='rgba(255,255,255,0.5)' 
            maximumTrackTintColor='rgba(255,255,255,1)'
            minimumValue={0}
            maximumValue={this.width}
            step={1}
            onValueChange={(value) => this.changeColor(value/this.width)}
          />
        </View>
      </Animated.View>
    );
  }
}

//---------------------------------------------------------------------
class SceneLayout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      bounceValue: new Animated.Value(0),
      sceneLayout:{
        day:true,
        year:true,
        hours:true,
        months:true,
        solstices:true,
        compass:true,
        ground:true,
        photos:true,
      },
    };

    this.sceneColors = {
      day:'#fffb72',
      year:'#fffb72',
      hours:'#fffb72',
      months:'#fffb72',
      solstices:'#fffb72',
    };
    this.visible = false;
    this.panelHeight = 102;
  }
  
  componentDidMount(){
    // Get stored layout & colors.
    AsyncStorage.getItem('sceneLayout', (err, sceneLayout) => {
      if (sceneLayout !== null) {
        this.setState({ sceneLayout:JSON.parse(sceneLayout)});
        this.props.onSceneLayout('sceneLayout', JSON.parse(sceneLayout));
      }
    });
    AsyncStorage.getItem('sceneColors', (err, sceneColors) => {
      if (sceneColors !== null) {
        this.sceneColors = JSON.parse(sceneColors);
        this.props.onSceneLayout('sceneColors', this.sceneColors);
      }
    });
  }

  setVisible(visible) {
   if (typeof visible == 'undefined') {
      this.visible = !this.visible;
    }
    else {
      this.visible = visible;
    }
    Animated.spring(
      this.state.bounceValue,
      {
        toValue: (this.visible) ? this.panelHeight : 0,
        velocity: 20,
        // useNativeDriver: true,
      }
    ).start();

    if (!this.visible) {
      this.refs.colorPicker.editColor(false,'');
    }
  }

  onToggleSceneLayout(sceneLayout) {
    var val = this.state.sceneLayout;

    // Always show path when showing text.
    if (sceneLayout=='months' && !val.months) {
      val.year = true;
    }
    if (sceneLayout=='hours' && !val.hours) {
      val.day = true;
    }
    val[sceneLayout] = !val[sceneLayout];

    // Hide text when hidding path.
    if (!val.day) {
      val.hours = false;
    }
    if (!val.year) {
      val.months = false;
    }

    this.setState({sceneLayout:val});
    this.props.onSceneLayout('sceneLayout',val);

    AsyncStorage.setItem('sceneLayout', JSON.stringify(val));
  }

  editColor(item) {
    var toValue = this.panelHeight + this.refs.colorPicker.panelHeight;
    if (this.refs.colorPicker.item == item){
      toValue = this.panelHeight;
    }

    Animated.spring(
      this.state.bounceValue,
      {
        toValue: toValue,
        velocity: 20,
        // useNativeDriver: true,
      }
    ).start();     

    this.refs.colorPicker.editColor(item, this.sceneColors[item]);
  }

  colorChanged(item, color) {
    this.sceneColors[item] = color;
    this.props.onSceneLayout('sceneColors',this.sceneColors);
    AsyncStorage.setItem('sceneColors', JSON.stringify(this.sceneColors));
  }

  render() {
    return (
      <Animated.View 
        style={[styles.collapsiblePanelWrapper,{height: this.state.bounceValue}]}
        // onLayout={this.getPanelHeight} 
        > 

        <View style={styles.collapsiblePanelContainer}>

          <ColorPicker
            style={[styles.collapsiblePanelLine, {height:10}]}
            ref="colorPicker"
            colorChanged={(item, color) => this.colorChanged(item, color)}
          />

          <View style={styles.collapsiblePanelLine}>
            <TouchableHighlight 
              style={styles.sceneLayoutButton}
              onPress={()=> this.onToggleSceneLayout('day')}
              onLongPress={()=> this.editColor('day')}
              >
              <Text 
                style={ (this.state.sceneLayout.day) ? styles.sceneLayoutTextOn : styles.sceneLayoutTextOff }
                >{strings.day}</Text>
            </TouchableHighlight>

            <TouchableHighlight 
              style={styles.sceneLayoutButton}
              onPress={()=> this.onToggleSceneLayout('hours')}
              onLongPress={()=> this.editColor('hours')}
              >
              <Text 
                style={ (this.state.sceneLayout.hours) ? styles.sceneLayoutTextOn : styles.sceneLayoutTextOff }
                >{strings.hours}</Text>
            </TouchableHighlight>

            <TouchableHighlight 
              style={styles.sceneLayoutButton}
              onPress={()=> this.onToggleSceneLayout('year') }
              onLongPress ={()=> this.editColor('year')}
              >
              <Text 
                style={ (this.state.sceneLayout.year) ? styles.sceneLayoutTextOn : styles.sceneLayoutTextOff }
                >{strings.year}</Text>
            </TouchableHighlight>

            <TouchableHighlight 
              style={styles.sceneLayoutButton}
              onPress={()=> this.onToggleSceneLayout('months')}
              onLongPress ={()=> this.editColor('months')}
              >
              <Text 
                style={ (this.state.sceneLayout.months) ? styles.sceneLayoutTextOn : styles.sceneLayoutTextOff }
                >{strings.months}</Text>
            </TouchableHighlight>

            <TouchableHighlight style={styles.sceneLayoutButton}
              onPress={()=> this.onToggleSceneLayout('solstices') }
              onLongPress ={()=> this.editColor('solstices')}
              >
              <Text 
                style={ (this.state.sceneLayout.solstices) ? styles.sceneLayoutTextOn : styles.sceneLayoutTextOff }
                >{strings.solstices}</Text>
            </TouchableHighlight>
          </View>

          <View style={styles.collapsiblePanelLine}>
            <TouchableHighlight 
              style={styles.sceneLayoutButton}
              onPress={ () => this.onToggleSceneLayout('compass') }
              >
              <Text 
                style={ (this.state.sceneLayout.compass) ? styles.sceneLayoutTextOn : styles.sceneLayoutTextOff }
                >{strings.compass}</Text>
            </TouchableHighlight>

            <TouchableHighlight 
              style={styles.sceneLayoutButton}
              onPress={ () => this.onToggleSceneLayout('ground') }
              >
              <Text 
                style={ (this.state.sceneLayout.ground) ? styles.sceneLayoutTextOn : styles.sceneLayoutTextOff }
                >{strings.ground}</Text>
            </TouchableHighlight>

            <TouchableHighlight 
              style={styles.sceneLayoutButton}
              onPress={ () => this.onToggleSceneLayout('photos') }
              >
              <Text 
                style={ (this.state.sceneLayout.photos) ? styles.sceneLayoutTextOn : styles.sceneLayoutTextOff }
                >{strings.pictures}</Text>
            </TouchableHighlight>

          </View>
        </View>
      </Animated.View>
    );
  }
}

//---------------------------------------------------------------------
class LocationPicker extends Component {
  constructor(props) {
    super(props);
    this.state={
      loc:{},
    }
  }

  setLocation(location) {
    this.setState({
      loc:location, 
    });
  }

  renderLocationIcon() {
    if (this.state.loc.id == -1){
      return(
        <View style={styles.locationAdd}>
        <Icon
          name='plus-circle' 
          size={30}
          color= {'#ffffff'}
          position='absolute'
          top={30}
          
          backgroundColor={'transparent'}
        /></View>
      );
    }
    else {
      return (
        <Image
          resizeMode='contain'
          style={styles.locationIcon}
          source={require('./img/location_icon.png')}
        />
      );
    }
  }

  render() {
    return (
      <TouchableHighlight style={styles.spiltH_left}
        onPress={ () => {
          if (this.state.loc.id == -1) {
            this.props.onAddLocation()
          }
          else {
            this.props.onEditLocation(this.state.loc.id)
          }
        }}
        underlayColor="rgba(255,255,255,0.5)"
      >
        <View style={styles.spiltH_leftInner}>
          {this.renderLocationIcon()}

          <Text style={styles.locationName}>
            {this.state.loc.name}
          </Text>
        </View>
      </TouchableHighlight>
    );
  }
}


//---------------------------------------------------------------------
class SunPositionTextView extends Component {
  constructor(props) {
    super(props);
    this.state={
      position:false,
    }
  }

  setPosition(position) {
    this.setState({
      position:position, 
    });
  }

  render() {
    return (
      <View style={{alignItems:'center', justifyContent:'center', flexDirection:'row', backgroundColor:'rgba(0,0,0,0.3)', paddingBottom:5}}>

        <MaterialCommunityIcons 
          name="arrow-expand-up"
          size={14}
          borderRadius={0}
          color={'#aaaaaa'}
        />
        <Text style={styles.sunpos}>
          &#160;&#160;{ (this.state.position && this.state.position.alt) ? this.state.position.alt : '...' }° &#160;&#160;
        </Text>

        <MaterialCommunityIcons 
          name="compass-outline"
          size={14}
          borderRadius={0}
          color={'#aaaaaa'}
        />
        <Text style={styles.sunpos}>
          &#160;&#160;{ (this.state.position && this.state.position.azi) ? this.state.position.azi : '...' }°
        </Text>

      </View>
    );
  }
}

//---------------------------------------------------------------------
class DateTimePicker extends Component {
  constructor(props) {
    var d = new Date(),
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()));
 
    super(props);
    this.state={
      datetime:d,
    }
  }

  setDateTime(datetime) {
    d = new Date(datetime);
    this.setState({
      datetime:d, 
    });
  }

  datePickerChanged(formated){
    var d0 = new Date(this.state.datetime.getTime());
    formated = formated.split(" ");
    var d = formated[0].split("/");
    var t = formated[1].split(":");
    d0.setUTCDate( d[0] );
    d0.setUTCMonth( d[1]-1 );
    d0.setUTCHours( t[0] );
    d0.setUTCMinutes( t[1] );
    this.setState({datetime: d0 });

    this.props.onDateTime(d0); 
  }


  render() {
    // console.log(this.state.datetime);
    return (
      <TouchableHighlight style={styles.spiltH_left}
        onPress={ () => this.refs['DatePicker'].onPressDate()}
        underlayColor = "rgba(255,255,255,0.5)"
      >
          <View style={styles.spiltH_leftInner}>
          <Text style={styles.dateText}>
            { date2formatText(this.state.datetime) }
          </Text>
          <DatePicker
              style={styles.dateIcon}
              ref="DatePicker"
              date= { date2formatTimePicker() }
              mode="datetime"
              format="DD/MM HH:mm"
              hideText={true}
              showIcon={true}
              onDateChange={(datetime) => { this.datePickerChanged(datetime) }}
            />
          </View>
      </TouchableHighlight>
    );
  }
}

//---------------------------------------------------------------------
class DateTimeSliders extends Component {
  constructor(props) {
    // var d = new Date(),
    // UTC ? d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()));
    // d = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());

    super(props);
    this.state={
      // datetime:d,
    }
  }

  sliderDateTime = new Date();

  componentDidMount() {
    this.refs['sliderHours'].setNativeProps({ value: this.sliderDateTime.getHours()*60  + this.sliderDateTime.getMinutes() });
    this.refs['sliderDays'].setNativeProps({ value: this.sliderDateTime.getDOY() });
  }

  setDateTime(date){
    this.sliderDateTime = date;
    this.refs['sliderHours'].setNativeProps({ value: this.sliderDateTime.getUTCHours()*60  + this.sliderDateTime.getUTCMinutes() });
    this.refs['sliderDays'].setNativeProps({ value: this.sliderDateTime.getDOY() });
  }

  onTimeSlider(dayhour, value) {
    var d0 = this.sliderDateTime;
    if (dayhour=='hours'){
      d0.setUTCHours(0);
      d0.setUTCMinutes(0);
      d0.setUTCMinutes(value);
    }
    else {
      d0.setUTCDate(1);
      d0.setUTCMonth(0);
      d0.setUTCDate(value);
    }
    this.sliderDateTime = d0;
    this.props.onDateTime(d0); 
  }

  render() {
    return (
      <View>
        <View style={styles.flex1Row}>
          <Slider
            ref="sliderDays"
            style={styles.AzimuthCorrectionSlider} 
            thumbTintColor= {colorLight} 
            minimumTrackTintColor={'grey'} maximumTrackTintColor={'grey'}
            minimumValue={1}
            maximumValue={ this.sliderDateTime.isLeapYear() ? 366:365 }
            step={1}
            onValueChange={
              (value) => this.onTimeSlider('days', value)
            } 
          />
          <MaterialCommunityIcons 
            name="calendar-range"
            color="#ffffff"
            style={{paddingRight:2}}
          />
        </View>

        <View style={styles.flex1Row}>
          <Slider  
            ref="sliderHours"
            style={styles.AzimuthCorrectionSlider}
            thumbTintColor={colorLight} minimumTrackTintColor={'grey'} maximumTrackTintColor={'grey'}
            maximumValue={24*60-1}
            step={1}
            onValueChange={
              (value) => this.onTimeSlider('hours',value)
            } 
          />
          <MaterialCommunityIcons 
            name="clock"
            color="#ffffff"
            style={{paddingRight:2}}
          />
        </View>
      </View>
    );
  }
}

          
//----------------------------------------------------------------------
// Main component
//----------------------------------------------------------------------
export default class CONTROLS extends Component {

  constructor(props) {
    super (props);
    this.state={
      bounceValue: new Animated.Value(0),
    };

    this.lastSliderTime = false;
    this.collapsedPanel = false;
    this.panelHeight = false;
  }

  // Expand / collapse panel
  getPanelHeight = event => {
    if (this.panelHeight) return;
    let {width, height} = event.nativeEvent.layout;
    this.panelHeight = height;
  }

  _togglePanel() {
    this.collapsedPanel = !this.collapsedPanel;
    Animated.spring(
      this.state.bounceValue,
      {
        toValue: this.collapsedPanel ? this.panelHeight-40 : 0,
        velocity: 20,
        // useNativeDriver: true,
      }
    ).start();
  }

  buttonToggled(key, value) {
    if (key.indexOf('visible_') == 0) {
      this.refs[key.substr(8)].setVisible(value);
    }
    else if (key=='collapsedPanel') {
      this._togglePanel();
    }
    else if (key=='takePicture') {
      this.props.controlUpdated(key, this.refs.LocationPicker.state.loc.date);
    }
    else {
      this.props.controlUpdated(key, value);
    }

    if (key=='azimuthReset') {
      this.refs['azimuthCorrection'].reset();
    }

  }

  timeSlider(value) {
    // Ensure 3D scene is done before sending another request
    if (!this.lastSliderTime) {
      this.buttonToggled('sliderTime', value);
    }
    else {
      // We will send request when 3D scene will be done.
      this.lastSliderTime = value;
    }
    this.refs.DATETIMEPICKER.setDateTime(value);
  }

  timePicker(value) {
    this.refs.DATETIMESLIDERS.setDateTime(value);
    this.buttonToggled('sliderTime', value);
  }

  gotNewLoc = (place) => {
    this.refs['LocationPicker'].setLocation(place);
  }


  render() {
    return (
      <Animated.View 
        style={[
          styles.panelContainer,
          {transform: [{translateY: this.state.bounceValue}]}
        ]}
        onLayout={this.getPanelHeight}   
      >
        <ToolBar
          ref="toolBar"
          buttonToggled={(key, value) => this.buttonToggled(key, value)}
          onToggleLocationList={() => this.props.onToggleLocationList(true)}
          onSearchLocation={() => this.props.onSearchLocation()}
          onAzimuthReset={() => this.buttonToggled('azimuthReset', 0)}
          onBackButton={() => this.props.onBackButton()}
        />

        <AzimuthCorrection 
          ref="azimuthCorrection"
          onAzimuthOffset={(angle) => this.buttonToggled('azimuthOffset', angle)  }
          onLatOffset={(angle) => this.buttonToggled('latOffset', angle)  }
        />

        <SceneLayout 
          ref="sceneLayout" 
          onSceneLayout ={(layoutORcolor, layout) => this.buttonToggled(layoutORcolor, layout)}
         />

        <View style={styles.spiltH}>

          <LocationPicker
            ref="LocationPicker"
            onEditLocation={(id) => this.props.onEditLocation(id)}
            onAddLocation={() => this.props.controlUpdated('addLocation')}
          />

          <DateTimePicker
            ref="DATETIMEPICKER" 
            onDateTime={(dateTime) => this.timePicker(dateTime)}
          />
        </View>

        <SunPositionTextView ref="SunPosition" />

        <DateTimeSliders
          ref="DATETIMESLIDERS"
          onDateTime={(dateTime) => this.timeSlider(dateTime)}
        />

      </Animated.View>
    )
  }
}

const styles = StyleSheet.create({
 panelContainer: {
    position: 'absolute',
    bottom:0,    
    left: 0,
    right:0,
  },
  panelTopBar:{
    flex:1,
    flexDirection:'row',
    justifyContent: 'flex-end',
    marginBottom:1,
  },
  panelTopBarScroll:{
    flex:1,
    marginRight:2,
  },
  iconButton:{
    backgroundColor:'transparent',
    justifyContent: 'flex-end',
  },

  collapsiblePanelWrapper: {
    flex:1,
  },

  collapsiblePanelContainer:{
    overflow: 'hidden',
    position:'absolute',
    left:0,
    right:0,
    top:0,
    bottom:0,
  },

  collapsiblePanelLine:{
    flexDirection:'row',
    justifyContent: 'center',
    alignItems : 'center',
 
    marginBottom:1,
    backgroundColor:'rgba(0,0,0,0.3)',
    flex:1,
  },
  collapsiblePanelLine_column:{
    marginBottom:1,
    backgroundColor:'rgba(0,0,0,0.3)',
    flex:1,
  },

  AzimuthCorrectionSlider: {
    height: 40,
    margin: 0,
    flex: 1,
  },
  AzimuthCorrectionText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    margin: 0,
    padding: 1,
    width: 38,
  },

  sceneLayoutButton:{
    flex:0.2,
    margin: 0,
    padding:0,
    height:50,
    justifyContent: 'center',
    alignItems : 'center',
  },
  sceneLayoutTextOff:{
    textAlign: 'center',
    color:'#777777',
  },
  sceneLayoutTextOn:{
    textAlign: 'center',
    color:'white',
  },

  sunposContainer:{
    
  },
  sunpos:{
    textAlign: 'center',
    color:'white',
  },

  spiltH:{
    height:40,
    flex:1,
    flexDirection:'row',
    backgroundColor:'rgba(0,0,0,0.3)',
  },

    spiltH_left:{
      position:'relative',
      flex:0.5,
      alignItems: 'center',
      justifyContent: 'center',
    },

     spiltH_leftInner:{  
      height:50,
      flexDirection:'row',
      alignSelf:'stretch',
      alignItems: 'center',
      justifyContent: 'center',
      },

      locationIcon:{
        position:'absolute',
        top:10,left:0,right:0,bottom:0,
        maxHeight:30,
        width:40,
        minHeight:30,
      },
      locationAdd:{
        position:'absolute',
        top:10,left:10, 
      },
      locationName:{
        paddingLeft:40,
        textAlign:'center',
        color:'white',
      },

    dateText:{
      textAlign:'center',
      marginLeft:10,
      flex:0.8,
      color:'white',
    },
    dateIcon:{
      marginRight:5,
      flex:0.2,
    },

    flex1Row:{
      alignItems: 'center',
      flex:1,
      flexDirection:'row',
      height:40,
    },
    flex05:{
      flex:0.5,
      height:40,
    },
});