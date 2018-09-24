THREE.PanoramaControls = function( object ) {

            var target = new THREE.Vector3();

            var lon = 0, lat = 0;
            var phi = 0, theta = 0;

            var touchX, touchY;


	var scope = this;

	this.object = object;
	this.object.rotation.reorder( "YXZ" );

	this.enabled = true;

	this.deviceOrientation = {};
	this.screenOrientation = 0;

	this.alpha = 0;
	this.alphaOffsetAngle = 0;


	var onDeviceOrientationChangeEvent = function( event ) {

		scope.deviceOrientation = event;

	};

	var onScreenOrientationChangeEvent = function() {

		scope.screenOrientation = window.orientation || 0;

	};


	this.orientation = false;
	this.connect = function() {

		onScreenOrientationChangeEvent(); // run once on load
        document.addEventListener( 'mousedown', onDocumentMouseDown, false );
        document.addEventListener( 'wheel', onDocumentMouseWheel, false );
        document.addEventListener( 'touchstart', onDocumentTouchStart, false );
        document.addEventListener( 'touchmove', onDocumentTouchMove, false );
        window.addEventListener( 'resize', onWindowResize, false );
		scope.enabled = true;

	};

	this.disconnect = function() {
        document.removeEventListener( 'mousedown', onDocumentMouseDown, false );
        document.removeEventListener( 'wheel', onDocumentMouseWheel, false );
        document.removeEventListener( 'touchstart', onDocumentTouchStart, false );
        document.removeEventListener( 'touchmove', onDocumentTouchMove, false );
        window.removeEventListener( 'resize', onWindowResize, false );
		scope.enabled = false;

	};

	this.update = function() {

		if ( scope.enabled === false ) return;

			lat = Math.max( - 90, Math.min( 90, lat ) );
			phi = THREE.Math.degToRad( 90 - lat );
			theta = THREE.Math.degToRad( lon + this.alphaOffsetAngle);
			target.x = Math.sin( phi ) * Math.cos( theta );
			target.y = Math.cos( phi );
			target.z = Math.sin( phi ) * Math.sin( theta );
			scope.object.lookAt( target );

			this.orientation = {
				'lat': lat.toFixed(2),
				'lon': ((lon%360)+180).toFixed(2), 
				'gamma': 0,
			};
	};

	this.updateAlphaOffsetAngle = function( angle ) {

		this.alphaOffsetAngle = angle;
		this.update();

	};
	
	this.updateInitAzimuth = function( angle ) {
	};

	this.dispose = function() {
		this.disconnect();
	};


            function onWindowResize() {

                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();

                renderer.setSize( window.innerWidth, window.innerHeight );

            }

            function onDocumentMouseDown( event ) {

                event.preventDefault();

                document.addEventListener( 'mousemove', onDocumentMouseMove, false );
                document.addEventListener( 'mouseup', onDocumentMouseUp, false );

            }

            function onDocumentMouseMove( event ) {
                var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
                var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

                lon -= movementX * 0.1;
                lat += movementY * 0.1;

            }

            function onDocumentMouseUp( event ) {

                document.removeEventListener( 'mousemove', onDocumentMouseMove );
                document.removeEventListener( 'mouseup', onDocumentMouseUp );

            }

            function onDocumentMouseWheel( event ) {

                camera.fov += event.deltaY * 0.05;
                camera.updateProjectionMatrix();

            }

            function onDocumentTouchStart( event ) {

                event.preventDefault();

                var touch = event.touches[ 0 ];

                touchX = touch.screenX;
                touchY = touch.screenY;

            }

            function onDocumentTouchMove( event ) {

                event.preventDefault();

                var touch = event.touches[ 0 ];

                lon -= ( touch.screenX - touchX ) * 0.1;
                lat += ( touch.screenY - touchY ) * 0.1;

                touchX = touch.screenX;
                touchY = touch.screenY;

            }


	this.connect();


};
