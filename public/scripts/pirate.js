
var MapModule = (function(){
	var _locations;
	var _googleMapsLatLng = [];
	var _map;
	var _polyLine;
	var _currentLocationMarker;

	var initialize = function(mapElem, locations){
		setLocations(locations);
		_initializeMap(mapElem);
		drawPolyLine(_googleMapsLatLng);
		centerMap(_googleMapsLatLng);
		addMarkerAtMostRecentPosition();
	};

	var setLocations = function(locations){
		_locations = locations;
		_googleMapsLatLng = _getGoogleMapsLatLng(locations);
	};

	var redraw = function(){
		_polyLine.setMap(null);
		_currentLocationMarker.setMap(null);
		drawPolyLine(_googleMapsLatLng);
		centerMap(_googleMapsLatLng);
	};

	var _getGoogleMapsLatLng = function(locations){
		var googleMapsLatLng = [];
		locations.forEach(function(loc){
			googleMapsLatLng.push(new google.maps.LatLng(loc.lat, loc.long));
		});
		return googleMapsLatLng;
	};

	var addMarkerAtMostRecentPosition = function(){
		var mostRecentPosition = _googleMapsLatLng[_googleMapsLatLng.length-1];
		_currentLocationMarker = addMarker(mostRecentPosition, "We\'re here right now!");
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
		return marker;
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
		_polyLine = new google.maps.Polyline({
			path: googleMapsLatLng,
    	geodesic: true,
    	strokeColor: '#FF0000',
    	strokeOpacity: 1.0,
    	strokeWeight: 2
		});
		_polyLine.setMap(_map);
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
		drawPolyLine: drawPolyLine,
		setLocations: setLocations,
		redraw: redraw
	};
})();

var WhereUAtDateSlider = (function(){
	var _slider;
	var _sliderElemId;
	var _minTimeDate;
	var _maxTimeDate;
	var _sliderStep = 3600;//seconds in an hour
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
		_maxSliderDate = new Date(_maxTimeDate.getFullYear(), _maxTimeDate.getMonth(), _maxTimeDate.getDate(), 24, 00);
		_minSliderEpochTime = getUtcEpochTimeFromDate(_minSliderDate);
		_maxSliderEpochTime = getUtcEpochTimeFromDate(_maxSliderDate);
	};

	var getUtcEpochTimeFromDate = function (dateObj){
		return Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), dateObj.getHours(), dateObj.getSeconds())/1000;
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
		//var afterToolTipDate = new Date(sliderEpochValues[0]*1000);
		//var beforeToolTipDate = new Date(sliderEpochValues[1]*1000);
		var afterToolTipDate = new Date(0);
		afterToolTipDate.setUTCSeconds(sliderEpochValues[0]);
		var beforeToolTipDate = new Date(0);
		beforeToolTipDate.setUTCSeconds(sliderEpochValues[1]);
		return "Show locations from: "+afterToolTipDate.toUTCString()+" to: "+ beforeToolTipDate.toUTCString();
	};

	var getSliderValues = function(){
		return _slider.getValue();
	};
	
	return {
		initialize: initialize,
		getSliderValues: getSliderValues
	};
})();

var LocationLoader = (function(){
	var _filterButton;
	var _$locationTbody;

	var initialize = function(){
		_filterButton = new LoaderButton("button-filter");
		_$locationTbody = $("#whereubeen>tbody");
		setupEventListeners();
	};

	var setupEventListeners = function(){
		_filterButton.get().on("click", onFilterButtonClick);
	};

	var onFilterButtonClick = function(e){
		_filterButton.showLoading();
		showTableLoading();
		getLocations();
	};

	var showTableLoading = function(){
		_$locationTbody.html("");
		$("#activityLoader").show();
	};

	var hideTableLoading = function(){
		$("#activityLoader").hide();
	};

	var getQueryParameters = function(){
		var sliderValues = WhereUAtDateSlider.getSliderValues();
		var params = {
			after: sliderValues[0],
			before: sliderValues[1]
		};
		return $.param(params);
	};

	var getLocations = function(){
		var queryParameters = getQueryParameters();
		var options = {
			url: "/locations/"+ninjaId+"?"+queryParameters,
			method: "GET",
			dataType: "json"
		};
		var $promise = $.ajax(options);
		$promise.done(function(response){
			_filterButton.hideLoading();
			hideTableLoading();
			MapModule.setLocations(response.locations);
			MapModule.redraw();
			_$locationTbody.html(response.locationListHtml);
		});

		$promise.fail(function(){
			alert("Ahhhh crap that didn't work...")
		});
	};

	return {
		initialize: initialize
	};
})();

var LoaderButton = function(id){
	var _id;
	var _$elem;
	var _$loadingSpinner;

	function initialize(id){
		_id = id;
		_$elem = $("#"+id);
		_$loadingSpinner = _$elem.children(".glyphicon-refresh");
	}

	function showLoading(){
		_$loadingSpinner.css("display", "inline-block");
	}

	function hideLoading(){
		_$loadingSpinner.css("display", "none");
	}

	function get(){
		return _$elem;
	}

	initialize(id);

	return {
		showLoading: showLoading,
		hideLoading: hideLoading,
		get: get
	};
}
