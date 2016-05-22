
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

var WhereUAtDateSlider = (function(){
	var _slider;
	var _sliderElemId;
	var _minTimeDate;
	var _maxTimeDate;
	var _sliderStep = 3600*1000;//seconds in an hour
	var _minSliderEpochTime;
	var _maxSliderEpochTime;
	var _minSliderDate;
	var _maxSliderDate;
	var _beforeLabelId;
	var _afterLabelId;
	var _timeZoneLabelId;

	var initialize = function(options){
		_sliderElemId = options.sliderId;
		setupTimeDates(options);
		setupLabels(options);
		_slider = new Slider(
			_sliderElemId,
			{
				min: _minSliderEpochTime,
				max: _maxSliderEpochTime,
				value: [_minSliderEpochTime, _maxSliderEpochTime],
				focus: true,
				step: _sliderStep,
				formatter: toolTipFormatter});
	};

	var setupLabels = function(options){
		_beforeLabelId = options.beforeLabelId;
		_afterLabelId = options.afterLabelId;
		_timeZoneLabelId = options.timeZoneLabelId;
		var beforeLabel = document.getElementById(_beforeLabelId);
		var afterLabel = document.getElementById(_afterLabelId);
		var timeZoneLabel = document.getElementById(_timeZoneLabelId);
		beforeLabel.innerHTML = getPrettyDate(_maxSliderDate);
		afterLabel.innerHTML = getPrettyDate(_minSliderDate);
		timeZoneLabel.innerHTML = getPrettyTimeZone(_minTimeDate);
	}

	var setupTimeDates = function(options){
		_minTimeDate = new Date(options.minSliderTime);
		_maxTimeDate = new Date(options.maxSliderTime);
		setupMinMaxSliderDates();
	};

	var setupMinMaxSliderDates = function(){
		_minSliderDate = new Date(_minTimeDate.getFullYear(), _minTimeDate.getMonth(), _minTimeDate.getDate(), 0, 0);
		_maxSliderDate = new Date(_maxTimeDate.getFullYear(), _maxTimeDate.getMonth(), _maxTimeDate.getDate(), 23, 59);
		_minSliderEpochTime = getUtcEpochTimeFromDate(_minSliderDate);
		_maxSliderEpochTime = getUtcEpochTimeFromDate(_maxSliderDate);
	};

	var getUtcEpochTimeFromDate = function (dateObj){
		return Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), dateObj.getHours(), dateObj.getSeconds());
	};

	var getEpochTimeFromDate = function(dateObj){
		return Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59);
	};

	var getPrettyTimeZone = function(date){
		if(date){
			return date.toString().match(/([A-Z]+[\+-][0-9]+.*)/)[1];
		}
		return "";
	};

	var getPrettyDate = function(date){
		return date.toLocaleString();
	};

	var toolTipFormatter = function(sliderEpochValues){
		var afterToolTipDate = new Date(sliderEpochValues[0]);
		var beforeToolTipDate = new Date(sliderEpochValues[1]);
		return "Show locations from: "+afterToolTipDate.toLocaleString()+" to: "+ beforeToolTipDate.toLocaleString();
	};
	
	return {
		initialize: initialize
	};
})();
