/**
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 *
 * W3C Device Orientation control (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
 */

THREE.DeviceOrientationControls = function( object, initialAzimuth) {
  		var target = new THREE.Vector3();
        var lonTouch = 0, latTouch = 0;
        var phi = 0, theta = 0;
        var touchX, touchY;

	var scope = this;

	this.object = object;
	this.object.rotation.reorder( "YXZ" );

	this.enabled = true;

	this.deviceOrientation = {};
	this.screenOrientation = 0;
	this.initialAzimuth = typeof initialAzimuth=='undefined' ? 0 : initialAzimuth;
	this.alphaOffsetAngle = 0;
	this.latOffsetAngle = 0;
	this.rolOffsetAngle = 0;

	this.trueHeading = -1;
	this.orientation = {alpha:0,beta:0,gamma:0};

	var alpha0 = function() {
		return (360-scope.deviceOrientation.alpha)%360;
	}


	var onDeviceOrientationChangeEvent = function( event ) {

		scope.deviceOrientation = event;

	};

	var onScreenOrientationChangeEvent = function() {

		scope.screenOrientation = window.orientation || 0;

	};

	// The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

	var setObjectQuaternion = function() {

		var zee = new THREE.Vector3( 0, 0, 1 );

		var euler = new THREE.Euler();

		var q0 = new THREE.Quaternion();

		var q1 = new THREE.Quaternion( - Math.sqrt( 0.5 ), 0, 0, Math.sqrt( 0.5 ) ); // - PI/2 around the x-axis

		return function( quaternion, alpha, beta, gamma, orient ) {

			euler.set( beta, (2*Math.PI - alpha + Math.PI/2)%(2*Math.PI), - gamma, 'YXZ' ); // 'ZXY' for the device, but 'YXZ' for us

			quaternion.setFromEuler( euler ); // orient the device

			quaternion.multiply( q1 ); // camera looks out the back of the device, not the top

			quaternion.multiply( q0.setFromAxisAngle( zee, - orient ) ); // adjust for screen orientation

		}

	}();

	this.connect = function() {

        document.addEventListener( 'touchstart', onDocumentTouchStart, false );
        document.addEventListener( 'touchmove', onDocumentTouchMove, false );

		onScreenOrientationChangeEvent(); // run once on load
		window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
		
		if ('ondeviceorientation' in window) {
			window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );
		}
		else {
			scope.deviceOrientation = false;
		}
		scope.enabled = true;

	};

	this.disconnect = function() {

		window.removeEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
		if ('ondeviceorientation' in window) {
			window.removeEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );
		}
		scope.enabled = false;

	};


	this.update = function() {

		if ( scope.enabled === false ) {
			return;
		}

		var alpha = scope.deviceOrientation.alpha 
					? (360+alpha0() + this.initialAzimuth + this.alphaOffsetAngle)%360
					: (360+this.initialAzimuth + this.alphaOffsetAngle)%360;
		var beta = scope.deviceOrientation.beta ? THREE.Math.degToRad( scope.deviceOrientation.beta ) : 0; // X'
		var gamma = scope.deviceOrientation.gamma ? THREE.Math.degToRad( scope.deviceOrientation.gamma ) : 0; // Y''
		var orient = scope.screenOrientation ? THREE.Math.degToRad( scope.screenOrientation ) : 0; // O

		setObjectQuaternion( scope.object.quaternion, THREE.Math.degToRad(alpha), beta, gamma, orient );
		
		// Apply touch correction.
		scope.object.rotation.x += latTouch;
		scope.object.rotation.y += lonTouch

		// Apply slider correction.
		scope.object.rotation.x += THREE.Math.degToRad(this.latOffsetAngle) ;

		this.orientation = {
			'lat': Math.round(THREE.Math.radToDeg(scope.object.rotation.x) *100 ,10) /100,
			'lon': Math.round(THREE.Math.radToDeg((2*Math.PI + (-scope.object.rotation.y + Math.PI/2)) % (2*Math.PI)) *100 ,10) /100, 
			'roll':  Math.round(THREE.Math.radToDeg(scope.object.rotation.z) * 100, 10) / 100 ,
		};
	};

	this.updateAlphaOffsetAngle = function( angle , incr=false) {
		if (incr) {
			this.alphaOffsetAngle += angle;
		}
		else {
			this.alphaOffsetAngle = angle;
		}
		this.update();
	};


	this.updateLatOffsetAngle = function( angle /* degrees */ , incr=false) {
		// scope.deviceOrientation.beta // degrees
		// scope.deviceOrientation.gamma 


		if (incr) {
			this.latOffsetAngle += angle;
		}
		else {
			this.latOffsetAngle = angle;
		}
		this.update();
	};


	this.azimuthReset = function( angle ) {
		if ( scope.enabled === false || typeof scope.deviceOrientation.alpha == "undefined" ) {
			return;
		}
		if (typeof angle == "undefined"){
			angle = 0;
		}

		// Azimuth retrieved via native component.
		this.initialAzimuth = angle;

		// Corections via sliders.
		this.latOffsetAngle = 0;
		this.alphaOffsetAngle = 0;

		// Corections via touch-swipe.
		latTouch = 0;
		lonTouch = 0;
		
		this.update();
	};

	this.dispose = function() {

		this.disconnect();

	};

    function onDocumentTouchStart( event ) {

        event.preventDefault();

        const touch = event.touches[ 0 ],
			  roll = scope.object.rotation.z;


        touchX = touch.screenX;
        touchY = touch.screenY;

    }

    function onDocumentTouchMove( event ) {

        event.preventDefault();

		const roll = scope.object.rotation.z,
			  touch = event.touches[ 0 ];

		// Get swipe distance.
		let hypot = Math.pow(touch.screenX - touchX ,2) + Math.pow(touch.screenY - touchY ,2);
		if (hypot < 0 ){
			hypot = -1 * hypot;
			hypot = Math.sqrt(hypot);
			hypot = -1 * hypot;
		}
		else {
			hypot = Math.sqrt(hypot);
		}

		// Get swipe angle..
		angle = Math.acos( (touch.screenY - touchY) / hypot);
		if (touch.screenX < touchX) {
			angle = -1 * angle;
		}
		// ..relatively to current roll.
		angle = roll + angle; 

		hypot =  scope.object.fov * hypot / window.innerHeight;
		hypot = THREE.Math.degToRad(hypot%360);
		
		latTouch += hypot * Math.cos(angle);
		lonTouch +=  hypot * Math.sin(angle);

        touchX = touch.screenX;
        touchY = touch.screenY;
    }

	this.connect();
};
