
var MapModule = (function(){
	var _locations;
	var _googleMapsLatLng = [];
	var _map;

	var initialize = function(mapElem, locations){
		_locations = locations;
		_googleMapsLatLng = _getGoogleMapsLatLng();

		_initializeMap(mapElem);
		drawPolyLine(_googleMapsLatLng);
		centerMap(_googleMapsLatLng);
		addMarkerAtMostRecentPosition();
	};

	var _getGoogleMapsLatLng = function(){
		var googleMapsLatLng = [];
		_locations.forEach(function(loc){
			googleMapsLatLng.push(new google.maps.LatLng(loc.lat, loc.long));
		});
		return googleMapsLatLng;
	};

	var addMarkerAtMostRecentPosition = function(){
		var mostRecentPosition = _googleMapsLatLng[_googleMapsLatLng.length-1];
		addMarker(mostRecentPosition, "We\'re here right now!");
	};

	var addMarker = function(googleMapsLatLng, content){
		var marker = new google.maps.Marker({
	    position: googleMapsLatLng,
	    map: _map,
	    title: 'We\'re here right now!'
	  });

		google.maps.event.addListener(marker, 'click', (function(marker) {
			var infowindow = new google.maps.InfoWindow({
			      maxWidth: 160
			});
    	return function() {
      		infowindow.setContent(content);
      		infowindow.open(_map, marker);
      	}
    })(marker));
	};

	var _initializeMap = function(mapElem){
		_map = new google.maps.Map(mapElem, {
		    zoom: 10,
		    center: _googleMapsLatLng[_googleMapsLatLng.length-1],
		    mapTypeId: google.maps.MapTypeId.ROADMAP,
		    mapTypeControl: false,
		    streetViewControl: false,
		    panControl: false,
		    zoomControlOptions: {
		    	position: google.maps.ControlPosition.LEFT_BOTTOM
			}
		});
	};

	var drawPolyLine = function(googleMapsLatLng){
		var travelPath = new google.maps.Polyline({
			path: googleMapsLatLng,
    	geodesic: true,
    	strokeColor: '#FF0000',
    	strokeOpacity: 1.0,
    	strokeWeight: 2
		});
		travelPath.setMap(_map);
	}

	var centerMap = function(googleMapsLatLng){
		//  Create a new viewpoint bound
		var bounds = new google.maps.LatLngBounds();
		googleMapsLatLng.forEach(function(position){
			bounds.extend(position);
		})
		//  Fit these bounds to the map
		_map.fitBounds(bounds);
	};

	return {
		initialize: initialize,
		drawPolyLine: drawPolyLine
	};
})();
