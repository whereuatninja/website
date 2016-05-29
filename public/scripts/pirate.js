
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
	var _sliderStep = 3600*12;//seconds in an hour*half a day of hours
	var _minSliderEpochTime;
	var _maxSliderEpochTime;
	var _minSliderDate;
	var _maxSliderDate;
	var _beforeLabelId;
	var _afterLabelId;
	var _timeZoneLabelId;

	var _minMomentUtc;
	var _maxMomentUtc;


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
		timeZoneLabel.innerHTML = getPrettyTimeZone(_minMomentUtc);
	}

	var setupTimeDates = function(options){
		_minMomentUtc = moment.utc(options.minSliderTime);
		_maxMomentUtc = moment.utc(options.maxSliderTime);
		setupMinMaxSliderDates();
	};

	var setupMinMaxSliderDates = function(){
		_minSliderDate = moment.utc(_minMomentUtc).add(1, 'days').hour(0).minute(0).second(0);
		_maxSliderDate = moment.utc(_maxMomentUtc).hour(0).minute(0).second(0);
		_minSliderEpochTime = _minSliderDate.valueOf()/1000;
		_maxSliderEpochTime = _maxSliderDate.valueOf()/1000;
	};

	var getPrettyTimeZone = function(momentDate){
		if(momentDate){
			return "Times displayed in "+momentDate.format("z ZZ");
		}
		return "";
	};

	var getPrettyDate = function(date){
		return date.toLocaleString();
	};

	var toolTipFormatter = function(sliderEpochValues){
		var afterToolTipDate = new Date(0);
		afterToolTipDate.setUTCSeconds(sliderEpochValues[0]);
		var beforeToolTipDate = new Date(0);
		beforeToolTipDate.setUTCSeconds(sliderEpochValues[1]);
		return "Show locations from: "+afterToolTipDate.toUTCString()+" to: "+ beforeToolTipDate.toUTCString();
	};

	var getSliderValues = function(){
		return _slider.getValue();
	};

	var setSliderToDateByEpoch = function(startDateEpoch){
		var endOfDayEpoch = startDateEpoch + (24*60*60);
		_slider.setValue([startDateEpoch, endOfDayEpoch]);
	};
	
	return {
		initialize: initialize,
		getSliderValues: getSliderValues,
		setSliderToDateByEpoch: setSliderToDateByEpoch
	};
})();

var LocationDatePicker = (function(){
	var _button;
	var _minDate;
	var _maxDate;

	var initialize = function(minEpoch, maxEpoch){
		_button = document.getElementById("button-datepicker");
		setupTimeDates(minEpoch, maxEpoch);
		setupDatePicker();
	};

	var setupDatePicker = function(){
		$(_button).datepicker({
			title: "Pick a date range",
			startDate: _minDate,
			endDate: _maxDate
		}).on("changeDate", onChangeDate);
	};


	var onChangeDate = function(e){
		console.dir(e);
		var selectedDate = e.date;
		var minEpoch = Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())/1000;
		WhereUAtDateSlider.setSliderToDateByEpoch(minEpoch);
	};

	var setupTimeDates = function(minEpoch, maxEpoch){
		_minDate = new Date(minEpoch);
		_maxDate = new Date(maxEpoch);
	};

	return {
		initialize: initialize
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
