'use strict';
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  Alert,
  Image,
  Dimensions,
  TextInput,
  AsyncStorage,
  FlatList,
  TouchableHighlight,
  ScrollView,
  NetInfo,
  Modal,
  Platform,
} from 'react-native';

// blob:http://localhos…-23578f278121:20082 
// Warning: Failed child context type: Invalid child context `virtualizedCell.cellKey` of type `number` supplied to `CellRenderer`, expected `string`.
//     in CellRenderer (at VirtualizedList.js:687)
//     in RCTView (at View.js:44)
//     in RCTScrollView (at ScrollView.js:977)
//     in ScrollView (at VirtualizedList.js:1062)
//     in VirtualizedList (at FlatList.js:662)
//     in FlatList (at location.js:1171)
//     in RCTView (at View.js:44)
//     in RCTView (at View.js:44)
//     in GeolocationManager (at motion.js:542)
//     in RCTView (at View.js:44)
//     in MotionManager (at App.js:27)
//     in SOL (at renderApplication.js:34)

import Icon from 'react-native-vector-icons/FontAwesome';
import MapView from 'react-native-maps';
// import Geocoder from 'react-native-geocoder';
import DeviceInfo from 'react-native-device-info';
import RNFetchBlob from 'rn-fetch-blob'
import LocationServicesDialogBox from "react-native-android-location-services-dialog-box";
import LocalizedStrings from 'react-native-localization';

import { GOOGLE_APIKEY } from './googleAPIKEY.js';

const deviceWidth = Dimensions.get('window').width,
      deviceHeight = Dimensions.get('window').height,
      appFolder = RNFetchBlob.fs.dirs.DocumentDir,
      formatGMT = function (sec){
        var sign ='';
        if (sec>=0) {
          sign ='+';
        }
        else {
          sign ='-';
          sec *= -1;
        }

        var min = (sec%3600)/60;
        if (min<10) {
          min = '0'+min;
        }
        var hour = parseInt(sec/3600,10);
        if (hour<10) {
          hour = '0'+hour;
        }
        return sign+hour+':'+min;
      },
      strings = new LocalizedStrings({
        'en':{
          yes:'YES',
          no:'NO',
          gps_permission:'Use Location ?',
          name:'Name',
          latitude:'Latitude',
          longitude:'Longitude',
          adddate:'Creation Date',

          northpole:'North Pole',
          arcticcircle:'Arctic Circle',
          cancertropic:'Tropic of Cancer',
          equator:'Equator',
          capricorntropic:'Tropic of Capricorn',

          add:'Add',
          delete:'Delete',
          cancel:'Cancel',
          save:'Save',
          select:'Select',
        },
        'fr':{
          yes:'OUI',
          no:'NON',
          gps_permission:'Activer la géolocation ?',
          name:'Nom',
          latitude:'Latitude',
          longitude:'Longitude',
          adddate:'Date d\'ajout',

          northpole:'Pôle Nord',
          arcticcircle:'Cercle Arctique',
          cancertropic:'Tropique du Cancer',
          equator:'Equateur',
          capricorntropic:'Tropique du Capricorne',

          add:'Ajouter',
          delete:'Supprimer',
          cancel:'Annuler',
          save:'Enregistrer',
          select:'Sélectionner',
        },
      });


//-----------------------------------------------------------------------------------------
class LocationEdit extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: this.props.visible,
      name: this.props.location.name,
      lat: this.props.location.lat,
      lon: this.props.location.lon,
      gmt:this.props.location.gmt,
      dst:this.props.location.dst,
      latitudeDelta: 0.002,
      longitudeDelta: 0.002,
      photoList:false,
    }

    this.makeCancelable = (promise) => {
      let hasCanceled_ = false;
      const wrappedPromise = new Promise((resolve, reject) => {
        promise.then(
          val => hasCanceled_ ? reject({isCanceled: true}) : resolve(val),
          error => hasCanceled_ ? reject({isCanceled: true}) : reject(error)
        );
      });
      return {
        promise: wrappedPromise,
        cancel() {
          hasCanceled_ = true;
        },
      };
    };
    this.geocodeAddressPromise = false;
  }

  onRegionText(text) {
    // if (text) {
    //   this.geocodeAddressPromise = this.makeCancelable(Geocoder.geocodeAddress(text));
    //   this.geocodeAddressPromise
    //     .promise
    //     .then((val) =>  {
    //       if (val.length) {
    //         this.setState({ 
    //           name: val[0].formattedAddress,
    //           lat: val[0].position.lat,
    //           lon: val[0].position.lng,
    //         })

    //         // Get timezone
    //         var summerDate = new Date();
    //         summerDate.setFullYear(summerDate.getFullYear()-1);
    //         summerDate.setMonth(6);
    //         summerDate = summerDate.getTime()/1000;

    //         fetch('https://maps.googleapis.com/maps/api/timezone/json?location='+val[0].position.lat+','+val[0].position.lng+'&timestamp='+summerDate+'&key='+GOOGLE_APIKEY)
    //         .then((response) => response.json())
    //         .then((responseJson) => {
    //           if(responseJson.status=="OK") {
    //             this.setState({ 
    //               gmt: responseJson.rawOffset,
    //               dst: responseJson.dstOffset,
    //             });
    //           }
    //           else {
    //             this.setState({ 
    //               gmt: 0,
    //               dst: 0,
    //             });
    //           }
    //         })
    //         .catch((error) => { }); 
    //       }
    //       else {
    //         this.setState({ 
    //           name: 'lieu inconnu.',
    //           lat: 0,
    //           lon: 0,
    //           gmt: 0,
    //           dst: 0,
    //         })
    //       }
    //     })
    //     /*.catch((reason) => console.log('isCanceled', reason))*/;
    // }
  }

  onRegionChange(region) {
    this.setState({ 
      lat: region.latitude,
      lon: region.longitude,
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    });
  }

  onRegionChangeComplete(region) {
    this.setState({ 
      lat: region.latitude,
      lon: region.longitude,
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    }); 

    if (this.props.location.id < 0) {
      // Get place name
      // Geocoder.geocodePosition({lat: region.latitude, lng: region.longitude})
      // .then(res => {
      //   this.setState({ 
      //     name: res[0].locality,
      //   });
      // })
      // .catch((error) => {  });

      // Get timezone
      var summerDate = new Date();
      summerDate.setFullYear(summerDate.getFullYear()-1);
      summerDate.setMonth(6);
      summerDate = summerDate.getTime()/1000;
      fetch('https://maps.googleapis.com/maps/api/timezone/json?location='+region.latitude+','+region.longitude+'&timestamp='+summerDate+'&key='+GOOGLE_APIKEY)
      .then((response) => response.json())
      .then((responseJson) => {
        if(responseJson.status=="OK") {
          this.setState({ 
            gmt: responseJson.rawOffset,
            dst: responseJson.dstOffset,
          });
        }
      })
      .catch((error) => {}); 
    }
  }

  _renderDeleteButton() {
    if (this.props.location.id < 0){
      return (
        <Icon.Button
          name="plus-circle" 
          size={25}
          style={styles.listItemEditButton} 
          color="rgba(50,50,55,0.8)"
          backgroundColor = {'transparent'}
          underlayColor = "rgba(255,255,255,0.5)"
          onPress = { () => this.props.addMe({
            id: this.props.location.id, 
            name:this.state.name, 
            lat: parseFloat(this.state.lat.toFixed(6)),
            lon: parseFloat(this.state.lon.toFixed(6)),
            gmt: this.state.gmt,
            dst: this.state.dst,
          })}
        ><Text style={{fontWeight:'bold', fontSize:15}}>{strings.add}</Text></Icon.Button>
      );
    }
    else {
      return (
        <Icon.Button
          name="trash-o" 
          size={25}
          style={styles.listItemEditButton} 
          color="rgba(50,50,55,0.8)"
          backgroundColor = {'transparent'}
          underlayColor = "rgba(255,255,255,0.5)"
          onPress = { () => this.props.deleteMe() }
        ><Text style={{fontWeight:'bold', fontSize:15}}>{strings.delete}</Text></Icon.Button>
      );
    }
  }

  _renderSearchButton(){
    if (this.props.location.id>=0) return null;
    return (
      <View style={{margin:10}}>
        <Icon.Button   
          name="search"
          size={30}
        >
          <TextInput
            underlineColorAndroid='transparent'
            ref='searchText'
            style={{ 
              backgroundColor:'white', 
              flex:1,
              margin:0, 
              padding:3,
            }}
            onEndEditing =    {(event) => this.onRegionText( event.nativeEvent.text) } 
            onSubmitEditing = {(event) => this.onRegionText( event.nativeEvent.text) } 
          />
        </Icon.Button>
      </View>
    );
  }

  _renderMap(){
    if (!this.props.connected) return null;
    return(
      <View style={styles.map_container}  >
        <MapView style={styles.map} 
          initialRegion={{
            latitude: this.props.location.lat,
            longitude: this.props.location.lon,
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
          }} 
          region={{
            latitude: this.state.lat,
            longitude: this.state.lon,
            latitudeDelta:  this.state.latitudeDelta,
            longitudeDelta:  this.state.longitudeDelta,
          }}
          mapType = "hybrid"
          onRegionChange = { (region) => this.onRegionChange(region) } 
          onRegionChangeComplete = { (region) => this.onRegionChangeComplete(region) } 
        ></MapView>
        <View style={styles.target_h}  ></View>
        <View style={styles.target_v}  ></View>
      </View>   
    );
  }

  _deleteFile = (fileName) => {
    const currentFolder = appFolder +'/'+ this.props.location.date;
    RNFetchBlob.fs.unlink(currentFolder+'/'+fileName).then(() => {
      RNFetchBlob.fs.ls(currentFolder).then((files) => {
        this.setState({photoList:files});
      });
    });
  }

  _renderphotoList() {
    if (this.props.location.id == -1) return null;
    
    const currentFolder = appFolder +'/'+ this.props.location.date;
    if(!this.state.photoList){
      RNFetchBlob.fs.ls(currentFolder).then((files) => {
        this.setState({photoList:files});
      });
      return null;
    }
    else {
      if (!this.state.photoList.length) {
        return null;
      }
      else {
        return(
          <View style={{marginBottom:40}}>
            <Text 
              style={{
                textAlign:'center',
                fontWeight:'bold', 
                padding:10, 
                marginTop:3,marginBottom:2,
                color:'white',
                backgroundColor:'rgba(10,20,30,0.8)',}}>
              PHOTOS
            </Text>
              
            <View style={{ 
              flexWrap: 'wrap', 
              flexDirection:'row',
              alignItems: 'flex-start', }}
            >
            { this.state.photoList.map((value, index) => {
              return(
                <View key={index} style={{ margin:1, width:deviceWidth/2 - 2,flexDirection:'row',marginBottom:2,
                flexWrap: 'nowrap' }}>

                  <Image 
                    style={{width:deviceWidth/2 - 2, height:(deviceWidth/2 - 2)*16/9}}
                    source={{ uri:'file:///'+currentFolder+'/'+value, scale:1}}
                    resizeMode='contain'
                  />
                  {/*<Text>{value}</Text>*/}

                  <TouchableHighlight 
                    style={styles.deletePhoto}
                    onPress = {() => this._deleteFile(value)}
                    >
                    <Icon name={"trash-o"} style={{paddingRight:1}} size={25} color="#ffffff" />
                  </TouchableHighlight>
                </View>
              );
            })}
            </View>
          </View>
        );
      }
    }
  }

  componentDidMount() {
    if (this.props.location.id < 0 ) {
      this.refs.searchText.focus(); 
    }
  }

  componentWillUnmount() {
    if (this.geocodeAddressPromise){
      this.geocodeAddressPromise.cancel();
    }
  }

  render() {
    return (
      <View style={styles.editLocation} >

        <ScrollView style={{marginTop:50}}>

          {this._renderSearchButton()}

          <TextInput
            underlineColorAndroid='transparent'
            defaultValue = {this.props.location.name}
            value= {this.state.name}
            onChangeText={(text) => this.setState({name:text})}
            multiline = {true}
            numberOfLines = {2}
            style = {{ 
              backgroundColor:'white', 
              fontSize:22,
              margin:10, 
              padding:5,
            }}
          />

          <View style = {styles.editCoords}>
            <View style = {styles.flex05}>
              <Text style = {{color:'white',}}>{strings.latitude}</Text>
              <TextInput
                underlineColorAndroid='transparent'
                // keyboardType = 'numeric'
                defaultValue = {this.state.lat.toFixed(6)}
                style = {{ 
                  backgroundColor:'white', 
                  marginTop:5,
                  marginRight:8,
                  padding:5,
                  fontSize:20,
                }}
                onEndEditing = {(event) => this.setState({
                  lat: parseFloat(event.nativeEvent.text)
                  ? parseFloat( parseFloat(event.nativeEvent.text).toFixed(6)) 
                  : 0
                })}
                onSubmitEditing = {(event) => this.setState({
                  lat: parseFloat(event.nativeEvent.text)
                  ? parseFloat( parseFloat(event.nativeEvent.text).toFixed(6)) 
                  : 0
                })}
              />
            </View>
            <View style = {styles.flex05}>
              <Text style={{color:'white',marginLeft:8}}>{strings.longitude}</Text>
              <TextInput
                underlineColorAndroid='transparent'
                // keyboardType = 'numeric'
                defaultValue = {this.state.lon.toFixed(6)}
                style = {{ 
                  backgroundColor:'white', 
                  marginTop:5,
                  marginLeft:8,
                  padding:5,
                  fontSize:20,
                }}
                onEndEditing = {(event) => this.setState({
                  lon: parseFloat(event.nativeEvent.text)
                  ? parseFloat( parseFloat(event.nativeEvent.text).toFixed(6)) 
                  : 0
                })}
                onSubmitEditing = {(event) => this.setState({
                  lon: parseFloat(event.nativeEvent.text)
                  ? parseFloat( parseFloat(event.nativeEvent.text).toFixed(6)) 
                  : 0
                })}
              />
            </View>
          </View>

          {this._renderMap()}
          {this._renderphotoList()}

        </ScrollView>

        <View style = {{position:'absolute', top:0, left:0, right:0, margin:0, flexDirection:'row', flex:1,}} >
          <View>
            {this._renderDeleteButton()}
          </View>

            <View style={{flexDirection:'row', flex:1, justifyContent: 'flex-end'}} >
              <View  >
                <Icon.Button 
                  name="times" 
                  size={25}
                  style={styles.listItemEditButton} 
                  color="rgba(50,50,55,0.8)"
                  backgroundColor = {'transparent'}
                  underlayColor = "rgba(255,255,255,0.5)"
                  onPress = { this.props.closeMe }
                ><Text style={{fontWeight:'bold', fontSize:15}}>{strings.cancel}</Text></Icon.Button>

              </View>
              <View >
                <Icon.Button 
                  name="check" 
                  size={25}
                  style={styles.listItemEditButton} 
                  color="rgba(50,50,55,0.8)"
                  backgroundColor = {'transparent'}
                  underlayColor = "rgba(255,255,255,0.5)"
                  onPress = { () => this.props.locationChanged({
                    id: this.props.location.id, 
                    name:this.state.name, 
                    lat: parseFloat(this.state.lat.toFixed(6)),
                    lon: parseFloat(this.state.lon.toFixed(6)),
                    gmt: this.state.gmt,
                    dst: this.state.dst,
                    date: this.props.location.date,
                  })}
                ><Text style={{fontWeight:'bold', fontSize:15}}>{this.props.location.id>=0 ? strings.save: strings.select}</Text></Icon.Button>
              </View>
            </View>
        </View> 

      </View>
    )
  }
}

//-----------------------------------------------------------------------------------------
class LocationListItem extends Component {
  _onPress = () => {
    this.props.onPressItem(this.props.id);
  }

  _onEditLoc(id){
     this.props.onEditItem(this.props.id);
  }

  render() {
    return (
      <TouchableHighlight 
        //<style= {(this.props.id == this.props.selected) ? styles.listItemHilight :  styles.listItemNormal}
        onPress={this._onPress}
        underlayColor = "rgba(255,255,255,0.5)"
        >
        <View style= {(this.props.id == this.props.selected) ? styles.listItemHilight :  styles.listItemNormal}>
          <View style={styles.listItemInfoContainer} >
            <Text style={styles.listItemName}>{this.props.title}</Text>
             <View style={styles.listItemCoords} >
               <Text style={styles.flex05}>Lat. {this.props.lat}</Text>
               <Text style={styles.flex05}>UTC{formatGMT(this.props.gmt)}</Text>
            </View>
          </View>

          <View style={styles.listItemEditContainer} >
          <Icon.Button 
            borderRadius={50}
            size={50}
            style={styles.listItemEditButton} 
    
            color="rgba(50,50,55,0.8)"
            backgroundColor="transparent"
            iconStyle = {{borderRadius:50}}
            name="edit" 
            onPress = { () => this._onEditLoc(this.props.id)}
          />
          </View>

        </View>
      </TouchableHighlight>
    )
  }
}

//-----------------------------------------------------------------------------------------
export default class GeolocationManager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searching: false,

      selected: false,
      sort: ['time',1],
      editModalOpen:false,
      searchModalOpen:false,
      connected:true,
    };
    this.locList = [];
  }

  forwardSelectedLocation(place){
    this.setState({
      visible:false,
      selected:place.id,
    });
    this.props.gotNewLoc(place);
  }

  // Local storage list
  _keyExtractor = (item, index) => item.id;
  _onPressItem = (id) => {
    AsyncStorage.setItem('selectedPlace', JSON.stringify(id));
    this.forwardSelectedLocation( this.locList[id] );
  };

  _onEditItem = (id) => {
    var newState = {editModalOpen:id, searchModalOpen:false};
    if (!this.state.visible) {
      newState.visible = true;
    }
    this.setState(newState);
  };

  _renderItem = ({item}) => (
    <LocationListItem
      id={item.id}
      onPressItem={this._onPressItem}
      onEditItem={(id) => this._onEditItem(item.id)}
      selected={this.state.selected}

      title={item.name}
      lat={item.lat}
      gmt={item.gmt}
    />
  );

  _closeModal = () => {
    this.setState({ 
      editModalOpen:false,
      searchModalOpen:false,
    });
  }

  _updateLocation = (data) => {
    if (this.state.editModalOpen !== false){
      this.locList[this.state.editModalOpen] = data;
      AsyncStorage.setItem('places', JSON.stringify(this.locList));
      // force refresh list
      this.setState({ selected:-2 }, function() { 
        this.setState({ selected:this.state.editModalOpen}, function(){
          this._closeModal();
          this.forwardSelectedLocation( data );
        });
      }); 
    }
   
    if(this.state.searchModalOpen) {
      this.setState({
        selected: -1,
        name:data.name,
        lat: data.lat,
        lon: data.lon,
        alt: data.alt,
        gmt: data.gmt,
        dst: data.dst,
        searchModalOpen:false,
      }, function(){
         this.forwardSelectedLocation( data );
      });
    }
  }

  _deleteLocation = () => {
    if (this.locList.length > 1) {
      // Delete associated photos.
      if (this.state.selected>=0) {
        const currentFolder = '' + this.locList[this.state.editModalOpen].date;
        RNFetchBlob.fs.ls(appFolder+'/'+currentFolder).then((files) => { 
          for(var i=0; i<files.length; i++) {
            RNFetchBlob.fs.unlink(appFolder+'/'+currentFolder+'/'+files[i]);
          }
        });
      }

      // Delete list item.
      this.locList.splice(this.state.editModalOpen, 1);
      // Reset ids.
      var ii = 0; 
      for (var i in this.locList) {
        this.locList[i]['id'] = ii;
        ii++;
      }
      AsyncStorage.setItem('places', JSON.stringify(this.locList));

      var cursel = this.state.selected;
      if (this.state.selected == this.state.editModalOpen) {
        cursel = false;
        this.setState({ selected:cursel });
      }
      // Force refresh list.
      this.setState({ selected:-2 }, function() { 
        this.setState({ selected:cursel }, function(){
          this._closeModal();
        });
      }); 
    }
 }

  _addLocation = (data) => {
    // Create photos directory.
    const newFolderName = Date.now();
    RNFetchBlob.fs.mkdir(appFolder+'/'+newFolderName).then(() => {

      // Update location list.
      var newLoc = {
        id:this.locList.length,
        name: data.name,
        lat: data.lat,
        lon: data.lon,
        gmt: data.gmt,
        dst: data.dst,
        date: newFolderName,
      };
      this.locList.unshift(newLoc);
      // reset ids
      var ii = 0; 
      for (var i in this.locList) {
        this.locList[i]['id'] = ii;
        ii++;
      }
      AsyncStorage.setItem('places', JSON.stringify(this.locList));
      this.setState({ 'selected': 0 });
      AsyncStorage.setItem('selectedPlace', JSON.stringify(0));

      this.forwardSelectedLocation( newLoc );
    });
  }

  setVisible (visible) {
    if (typeof visible == 'undefined') {
      visible = !this.state.visible;
    }
    this.setState({
      editModalOpen:false, 
      searchModalOpen:false,
      visible:visible,
    });
  }

  _renderEditModal () {
    if (this.state.editModalOpen===false && !this.state.searchModalOpen) return null;
    return (
      <LocationEdit
        location = {this.state.searchModalOpen ? {id:-1, name:'', lat:0, lon:0} : this.locList[this.state.editModalOpen]}
        locationChanged = {this._updateLocation}
        deleteMe = {this._deleteLocation}
        addMe = {this._addLocation}
        closeMe = {this._closeModal}
        connected = {this.state.connected}
      />
    );
  }

  onSearchPress() {
    var newState = {searchModalOpen:true};
    if (!this.state.visible) {
      newState.visible = true;
    }
    this.setState(newState);
  };

  sortList(key) {
    let asc,
        selectedDate = this.locList[this.state.selected].date,
        selected = this.state.selected;

    if (key==this.state.sort[0]) {
      asc = -1*this.state.sort[1];
    }
    else if (key == 'name') {
      asc = 1;
    }
    else {
      asc = -1;
    }

    this.locList.sort(function(a, b){
      return  (( a[key] == b[key] ) ? 0 : ( ( a[key] > b[key] ) ? 1*asc : -1*asc ) );
    });
    // reset ids
    var ii = 0; 
    for (var i in this.locList) {
      this.locList[i]['id'] = ii;
      if (selectedDate == this.locList[i].date){
        selected = this.locList[i].id ;
      }
      ii++;
    }

      this.setState({ selected:-2 }, function() { 
        this.setState({ selected:selected});
      }); 

    this.setState({ sort:[key,asc] });
  }

  getLoc() {
    if(Platform.OS === 'android'){
      LocationServicesDialogBox.checkLocationServicesIsEnabled({
        enableHighAccuracy: false,
        showDialog: false, 
        openLocationServices: true, 
        preventOutSideTouch: false,
        preventBackClick: false
      }).then(function(success) {
            this.geoLocConfirmed();
          }.bind(this)
      ).catch((error) => {
        this.forwardSelectedLocation(false);
      });
    }
  }

  geoLocConfirmed(){
    if (!this.state.searching) {
      this.setState({searching:true});
      navigator.geolocation.getCurrentPosition (
        (position) => {

          this.setState({
            searching: false,
            lat: parseFloat(position.coords.latitude.toFixed(6)),
            lon: parseFloat(position.coords.longitude.toFixed(6)),
            alt: Math.round(position.coords.altitude, 10),
            selected: -1,
            gmt: DeviceInfo.UTC()/1000,
            dst: DeviceInfo.useDTS(),
          }, function(){

            if (this.state.connected ) {
              // Get location name
              // Geocoder.geocodePosition({
              //   lat: this.state.lat,
              //   lng: this.state.lon,
              // })
              // .then(res => {
              //   this.setState({ name: res[0].locality }, function() {
              //     this.forwardSelectedLocation({
              //       id:-1,
              //       name:this.state.name,
              //       lat: this.state.lat,
              //       lon: this.state.lon,
              //       gmt: this.state.gmt,
              //       dst: this.state.dst,
              //     });  
              //   });

              // })
              // .catch(err => console.log(err));
            }
            else {
              this.setState({
                name: 'Position actuelle',
              }, function() {
                this.forwardSelectedLocation({
                  id:-1,
                  name:this.state.name,
                  lat: this.state.lat,
                  lon: this.state.lon,
                  gmt: this.state.gmt,
                  dst: this.state.dst,
                });
              });
            }
          });
        },
        (error) => {
          this.setState({searching:0});
          this.forwardSelectedLocation(false);
        },
        {enableHighAccuracy: true, timeout: 20000, maximumAge: 1000}
      );
    }
  }

  onLocChanged = (value) => {
    this.setState({lat:value.lat, lon:value.lon });
  }


  componentWillMount() {
    // Get stored locations
    AsyncStorage.getItem('places', (err, places) => {

      if (err) {
        // Alert.alert('ERROR getting locations'+ JSON.stringify(err));
        places = [];
      }
      else {
        places = JSON.parse(places);
      }
      if (!places || !places.length) {
        // Set default data
        var addDate = Date.now(),
        places = [
          {
            "id":0,
            "name":strings.northpole,
            "lat": 90,
            "lon": 0,
            "gmt": 0,
            "dst": false,
            "date": addDate-1,
          },{
            "id":1,
            'name':'Grímsey ('+strings.arcticcircle+')',
            'lat':  66.541948,
            'lon': -18.002125,
            "gmt": 0,
            "dst": false,
            "date": addDate-2,
          },{
            "id":2,
            "name":'Greenwich',
            "lat":  51.476852,
            "lon":  -0.000500,
            "gmt": 0,
            "dst": true,
            "date": addDate-3,
          },{
            "id":3,
            'name': 'Mayapur ('+strings.cancertropic+')',
            'lat': 23.423201,
            'lon': 88.388268,
            "gmt": 19800,
            "dst": false,
            "date": addDate-4,
          },{
            "id":4,
            'name':'Singapore ('+strings.equator+')',
            'lat':   1.290270,
            'lon': 103.851959,
            "gmt": 27000,
            "dst": false,
            "date": addDate-5,
          },{
            "id":5,
            'name':'Antofagasta ('+strings.capricorntropic+')',
            'lat': -23.650000,
            'lon': -70.400002,
            "gmt": -14400,
            "dst": true,
            "date": addDate-6,
          },
        ];
        // Create folders for these locatons in case someone need it :S
        RNFetchBlob.fs.mkdir(appFolder+'/'+(addDate-1));
        RNFetchBlob.fs.mkdir(appFolder+'/'+(addDate-2));
        RNFetchBlob.fs.mkdir(appFolder+'/'+(addDate-3));
        RNFetchBlob.fs.mkdir(appFolder+'/'+(addDate-4));
        RNFetchBlob.fs.mkdir(appFolder+'/'+(addDate-5));
        RNFetchBlob.fs.mkdir(appFolder+'/'+(addDate-6));

        AsyncStorage.setItem('places', JSON.stringify(places));
      }
      this.locList = places;

      // Now get last selected location
      AsyncStorage.getItem('selectedPlace', (err, selectedPlace) => {
        if (err) {
          selectedPlace = 0;
        }
        else {
          selectedPlace = JSON.parse(selectedPlace);
          if (selectedPlace === null) {
            selectedPlace = 2;  // Greenwich.
          }
        } 
        AsyncStorage.setItem('selectedPlace', selectedPlace+'');
        if ( this.props.curLoc === false ) {
          this.forwardSelectedLocation( places[selectedPlace] );
        }
        else {

        }
      });
    });
  }

  componentDidMount() {
    if (this.props.curLoc !== false) {
      this.setState({
            selected: this.props.curLoc.id, 
            name : this.props.curLoc.name, 
            lat: this.props.curLoc.lat, 
            lon: this.props.curLoc.lon,
            gmt: this.props.curLoc.gmt,
            dst: this.props.curLoc.dst,
      });

      AsyncStorage.getItem('placesSort', (err, placesSort) => {
        if (err) {
          // Alert.alert('ERROR getting placesSort'+ JSON.stringify(err));
          placesSort = ['time',1];
        }
        else {
          placesSort = JSON.parse(placesSort);
          if (!placesSort) {
            placesSort = ['time',1];
          }
        }
        this.setState({sort:placesSort});
      });
    }

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

  _onAddLoc() {
    const newFolderName = Date.now();
    RNFetchBlob.fs.mkdir(appFolder+'/'+newFolderName).then(() => {
      var newLoc = {
        id:this.locList.length,
        name: this.state.name,
        lat: this.state.lat,
        lon: this.state.lon,
        gmt: this.state.gmt,
        dst: this.state.dst,
        date: newFolderName,
      };

      this.locList.unshift(newLoc);
      // reset ids
      var ii = 0; 
      for (var i in this.locList) {
        this.locList[i]['id'] = ii;
        ii++;
      }
      AsyncStorage.setItem('places', JSON.stringify(this.locList));
      this.setState({ 'selected': 0 });
      AsyncStorage.setItem('selectedPlace', JSON.stringify(0));

      this.forwardSelectedLocation( newLoc );
    });
  }

  _renderSearchButton() {
    if (this.state.connected) {
      return (
        <View style={ this.state.searching ? styles.width0  : styles.flex05  }>
          <Icon.Button   
            name="search"
            size={30}
            onPress={ () => this.onSearchPress() }
          >
          </Icon.Button>
        </View>
      );
    }
    else {
      return(
        <View style={ this.state.searching ? styles.width0  : styles.flex1  }>
          <Icon.Button   
            name="search"
            size={30}
            backgroundColor='grey'
          >
            <Text style={{fontSize:20, flex:1, textAlign:'center', color:'white', padding:3,}}>
            Pas de réseau
            </Text>
          </Icon.Button>
        </View>
      );
    }
  }

  _renderSearchResult() {
    if (this.state.selected < 0) {
      return (
        <TouchableHighlight 
          onPress={ () => this.setState({'visible':false}) }
          underlayColor = "rgba(255,255,255,0.5)"
          >
          <View style= {(this.state.selected < 0) ? styles.listItemHilight :  styles.listItemNormal}>
            <View style={styles.listItemInfoContainer} >
              <Text style={styles.listItemName}> {this.state.name} </Text>
              <View style={styles.listItemCoordSearch}>
                <Text  style={styles.flex05} > Lat. {this.state.lat} </Text>
                <Text  style={styles.flex05} > UTC{formatGMT(this.state.gmt)} </Text>
              </View>
            </View>
            <View style={styles.listItemEditContainer} >
              <Icon.Button 
                borderRadius={50}
                size={50}
                style={styles.listItemEditButton} 
                color="rgba(50,50,55,0.8)"
                backgroundColor = {'transparent'}
                iconStyle = {{ borderRadius:50}}
                name="plus-circle" 
                onPress = { () => this._onAddLoc()}
              />
            </View>
          </View>
        </TouchableHighlight>
      );
    }
    else {
      return null;
    }
  }


  _renderList(){
     if (this.state.editModalOpen!==false || this.state.searchModalOpen) return null;

     return(
      <View style={styles.flex1}>
        {this._renderSearchResult()}

        <View style={styles.sortButtonsContainer}>
            <View style={styles.sortButton}>
              <Icon.Button
                name = {'sort'}
                // backgroundColor = {this.state.sort[1]=='name' ? 'grey': 'blue'}
                backgroundColor = "transparent"
                underlayColor = "rgba(255,255,255,0.5)"
                color="white"
                style={{ height:30,}}  
                borderRadius={0}
                onPress={ () => this.sortList('name')} 
              >
                <Text style={{color:'white'}}>{strings.name}</Text>
              </Icon.Button>
            </View>
            <View style={styles.sortButton}>
              <Icon.Button
                name = 'sort'
                color="white"
                backgroundColor = "transparent"
                underlayColor = "rgba(255,255,255,0.5)"
                borderRadius={0}
                style={{ height:30,}} 
                onPress={ () => this.sortList('lat')} 
              >
                <Text style={{color:'white'}}>{strings.latitude}</Text>
              </Icon.Button>
            </View>
            <View style={styles.sortButton}>
              <Icon.Button
                name = {'sort'}
                color="white"
                backgroundColor = "transparent"
                underlayColor = "rgba(255,255,255,0.5)"
                borderRadius={0}
                style={{ height:30,}}
                onPress={ () => this.sortList('date')} 
              >
                <Text style={{color:'white'}}>{strings.adddate}</Text>
              </Icon.Button>
            </View>
        </View>

        <FlatList
          ref='FLATLIST'
          data={this.locList}
          extraData={[this.state.selected,this.state.sort]} 
          keyExtractor={this._keyExtractor}
          renderItem={this._renderItem}
        />
      </View>
    );
  }

  closeErrorModal = () => {
    this.setState({searching:false});
  }

  render() {
    if (!this.state.visible) return null;

    return (
      <View style={styles.mainContainer}>
        {this._renderList()}
        {this._renderEditModal()}
        {/*
        <GeoLocErrorModal
          ref = 'GeoLocErrorModal'
          // this.refs['sliderDays'].setNativeProps({ value: d0.getDOY() });
          // this.refs.scene.sendToBridge( JSON.stringify( {'sliderTime':d0.getTime()} ));
          open = {this.state.searching===0}
          closeMe = {this.closeErrorModal}
        />
        */}
      </View> 
    );
  }
}

const styles = StyleSheet.create({ 
  mainContainer:{
    position: 'absolute',
    top:0,
    bottom:0,
    right:0,
    left:0,
    backgroundColor:'rgba(250,250,255,0.5)',
  },

  map_container: {
    height:deviceWidth,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'black'
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  target_h: {
    position: 'absolute',
    top: deviceWidth/2,
    left: 0,
    right:0,
    height:1,
    backgroundColor:'red',
  },
  target_v: {
    position: 'absolute',
    top: 0,
    left: deviceWidth/2,
    bottom:0,
    width:1,
    backgroundColor:'red',
  },

    listItemNormal: {
      justifyContent: 'center',
      backgroundColor:'rgba(255,255,255,0.8)',
      padding: 10,
      marginBottom:1,
      flexDirection:'row'
    },
    listItemHilight: {
      backgroundColor:'rgba(255,255,255,1)',
      padding: 10,
      marginBottom:1,
      flexDirection:'row',
    },
      listItem:{
        
      },
        listItemInfoContainer: {
          flex:0.6,
        },

          listItemName: {
            fontSize: 20,
          },

          listItemCoords: {
            paddingTop:5,
            paddingBottom:10,
            flex:1,
            flexDirection:'row',
          },

        listItemEditContainer :{
          alignSelf: 'flex-end', 
        },

          listItemEditButton: {
            borderRadius:50,
            padding: 10,            
          },
          deletePhoto: {
            position:'absolute',
            right:10,
            top:10,
            alignItems:'center',
            justifyContent:'center',
            width:40,
            height:40,
            backgroundColor:'rgba(0,0,0,0.5)',
            borderRadius:100,    
          },
          editCoords:{
            flex:1,
            flexDirection:'row',
            margin:10,
          },

    geopicker: {
      backgroundColor:'rgba(255,255,255,0.5)',
      padding: 10,
      flexDirection:'row',
    },

    searchResult: {
      backgroundColor:'rgba(255,255,255,0.8)',
      padding: 10,
      paddingBottom: 10,
      flexDirection:'row',
      marginBottom:5,
    },

      listItemCoordSearch:{
        flexDirection:'row',
        paddingTop:10,
      },

    flex1:{
        flex:1,
    },
    width0:{
      width:0,
      height:0,
    },

    editLocation:{
      backgroundColor: 'rgba(250,250,255,0.8)',
      flex:1,
    },

    flex1Row:{
        flex:1,
        flexDirection:'row',
      },
     flex05:{
        flex:0.5,
      },
  sortButtonsContainer:{
    flexDirection:'row',
    backgroundColor:'rgba(50,50,55,0.8)',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortButton:{
    flex: 0.33,
    height: 30,
  },


  geolocErrorModal: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor:'rgba(10,20,30,0.8)',
  },
    geolocErrorModalInner: {
      backgroundColor:'#ffffff',
      margin:20,
      paddingTop:10,
      paddingBottom:20,
      paddingLeft:20,
      paddingRight:20, 
      borderRadius:10,
    },
    geolocErrorModalTitle: {
      fontWeight:'normal',
      textAlign:'center',
      fontSize:20,
      marginBottom:10,
      color:'black',
    },
    geolocErrorModalButtonContainer: {
      flexDirection:'row',
    },
      geolocErrorModalButton: {
        height:50,
        margin:5,
        flex:0.5,
        padding:10,
        backgroundColor:'#52afff',
        borderRadius:10,
      },
});
