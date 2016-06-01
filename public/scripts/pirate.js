
var MapModule = (function(){
	var _locations;
	var _googleMapsLatLngLocations = [];
	var _activities;
	var _map;
	var _polyLines = [];
	var _markers = [];
	var _groupedLocations = [];
	var _currentLocationMarker;

	var _groupedLocationsIndex;
	var _locationsIndex;


	var initialize = function(mapElem, locations){
		setLocations(locations);
		_initializeMap(mapElem);
		_drawLocations(_groupedLocations);
		//drawActivities(_googleMapsActivities);
		_drawActivities(_activities);
		centerMap(_googleMapsLatLngLocations);
		addMarkerAtMostRecentPosition(locations);
	};

	var setLocations = function(locations){
		_locations = locations;
		_groupedLocations = _getGroupedLocations(locations);
		_googleMapsLatLngLocations = _getGoogleMapsLatLngLocations(locations);
		_activities = _getActivities(locations);
	};

	var redraw = function(){
		_drawLocations(_groupedLocations);
		centerMap(_googleMapsLatLngLocations);
	};

	var _getGoogleMapsLatLngLocations = function(locations){
		var googleMapsLatLng = [];
		locations.forEach(function(loc){
			googleMapsLatLng.push(new google.maps.LatLng(loc.lat, loc.long));
		});
		return googleMapsLatLng;
	};

	var _getGroupedLocations = function(locations){
		if(locations.length == 0) return [];
		var groupings = [];
		var currentGroup = [locations[0]];//prime with first location
		var lastTimeMoment = moment.utc(locations[0].time);
		locations.forEach(function(loc){
			var currTime = moment.utc(loc.time);
			var diffHours = lastTimeMoment.diff(currTime, 'hours');
			if(diffHours > 2){
				groupings.push(currentGroup);
				currentGroup = [loc];
			}
			else{
				currentGroup.push(loc);
			}
			lastTimeMoment = currTime;
		});
		if(currentGroup.length > 0){
			groupings.push(currentGroup);
		}
		return groupings;
	};

	var _getActivities = function(locations){
		var activities = [];
		locations.forEach(function(loc){
			if(loc.message){
				activities.push(loc);
			}
		});
		return activities;
	};

	var createClickableMarker = function(loc, message){
		var fromNow = "<b>("+moment(loc.time).fromNow()+")</b>";
		var title = fromNow+"<br>"+(message || "")+(loc.message||"");
		var marker = new google.maps.Marker({
			position: {lat: loc.lat, lng: loc.long},
			title: title
		});

		google.maps.event.addListener(marker, 'click', (function(marker) {
			var infowindow = new google.maps.InfoWindow({
				//maxWidth: 160
			});
			return function() {
				infowindow.setContent(title);
				infowindow.open(_map, marker);
			}
		})(marker));
		return marker;
	};

	var addMarkerAtMostRecentPosition = function(locations){
		var mostRecentLocation = locations[locations.length-1];
		_currentLocationMarker = createClickableMarker(mostRecentLocation, "We're here right now! ");
	};

	var _initializeMap = function(mapElem){
		_map = new google.maps.Map(mapElem, {
		    zoom: 10,
		    //center: _googleMapsLatLngLocations[_googleMapsLatLngLocations.length-1],
		    mapTypeId: google.maps.MapTypeId.ROADMAP,
		    mapTypeControl: true,
		    streetViewControl: true,
		    panControl: false,
		    zoomControlOptions: {
		    	position: google.maps.ControlPosition.LEFT_BOTTOM
			}
		});
	};

	var _convertArrayToLatLngArray = function(locations){
		var latLngArray = [];
		locations.forEach(function(loc){
			latLngArray.push(new google.maps.LatLng(loc.lat, loc.long));
		});
		return latLngArray;
	};

	var _drawLocations = function(groupedLocations){
		groupedLocations.forEach(function(group){
			var latLngGroup = _convertArrayToLatLngArray(group);
			drawPolyLine(latLngGroup);
		});
	};

	var drawPolyLine = function(googleMapsLatLng){
		var currentPolyLine = new google.maps.Polyline({
			path: googleMapsLatLng,
			geodesic: true,
			strokeColor: '#FF0000',
			strokeOpacity: 1.0,
			strokeWeight: 3
		});
		currentPolyLine.setMap(_map);
		_polyLines.push(currentPolyLine);
	};

	var _drawActivities = function(activities){
		activities.forEach(function(activity){
			var marker = createClickableMarker(activity);
			marker.setMap(_map);
			_markers.push(marker);
		});
	};

	var centerMap = function(googleMapsLatLng){
		//  Create a new viewpoint bound
		var bounds = new google.maps.LatLngBounds();
		googleMapsLatLng.forEach(function(position){
			bounds.extend(position);
		});
		//  Fit these bounds to the map
		_map.fitBounds(bounds);
	};

	var centerMapByLatLong = function(lat, long){
		var position = new google.maps.LatLng(lat, long);
		var googleMapsLatLong = [position];
		centerMap(googleMapsLatLong);
		setZoom(16);
	};

	var setZoom = function(zoomLevel){
		_map.setZoom(zoomLevel);
	};

	var _clearMap = function(){
		_polyLines.forEach(function(polyline){
			polyline.setMap(null);
		});

		_markers.forEach(function(marker){
			marker.setMap(null);
		});
	};

	var play = function(){
		_clearMap();
		_groupedLocationsIndex = 0;
		_locationsIndex = _locations.length-1;

		playAnimation();
	};

	var playAnimation = function(groupIndex){
		if(groupIndex == null){
			groupIndex = _groupedLocations.length-1;
		}
		else if(groupIndex <= 0){
			console.log("Im done playing");
			return;
		}
		console.log("Group index: "+groupIndex);
		var index = _groupedLocations[groupIndex].length-1;
		_playLocationGroup(null, null, groupIndex, index);
	};

	var _playLocationGroup = function(polyLine, markers, groupIndex, index){
		if(!polyLine){
			var _latlngFromGroup = _convertArrayToLatLngArray(_groupedLocations[groupIndex]);
			centerMap(_latlngFromGroup);
			polyLine = new google.maps.Polyline({
				geodesic: true,
				strokeColor: '#FF0000',
				strokeOpacity: 1.0,
				strokeWeight: 3,
				map: _map
			});
			markers = [];
		}
		var currentLocation = _groupedLocations[groupIndex][index];
		var path = polyLine.getPath();
		var newPosition = new google.maps.LatLng(currentLocation.lat, currentLocation.long);
		path.push(newPosition);
		var fromNow = moment.utc(currentLocation.time).fromNow();
		var time = moment.utc(currentLocation.time).format("MMM DD YYYY hh:mm A");
		$("#play-information b").text("("+fromNow+") " + time);

		if(currentLocation.message){
			var titleFromNow = "<b>("+moment(currentLocation.time).fromNow()+")</b>";
			var title = titleFromNow+"<br>"+(currentLocation.message||"");
			var infowindow = new google.maps.InfoWindow({
				content: title
			});
			var marker = new google.maps.Marker({
				position: newPosition,
				title: title
			});
			marker.setMap(_map);
			infowindow.open(_map, marker);

			markers.push(marker);
		}

		if(--index > 0){
			setTimeout(function(){
				_playLocationGroup(polyLine, markers, groupIndex, index);
			}, 500);
		}
		else{
			console.log("Im done playing the group");
			_polyLines.push(polyLine);
			playAnimation(--groupIndex);
		}
	}

	return {
		initialize: initialize,
		drawPolyLine: drawPolyLine,
		setLocations: setLocations,
		redraw: redraw,
		centerMapByLatLong: centerMapByLatLong,
		play: play
	};
})();

var WhereUAtDateSlider = (function(){
	var _slider;
	var _sliderElemId;
	var _sliderStep = 3600*24;//seconds in an hour*half a day of hours
	var _minSliderEpochTime;
	var _maxSliderEpochTime;
	var _minSliderDate;//This is the date shown on the left hand of the slider, min date truncated to midnight
	var _maxSliderDate;//This is the date shown on the right of the slider, added a day and truncated to midnight
	var _beforeLabelId;
	var _afterLabelId;
	var _timeZoneLabelId;

	var _minMomentUtc;//actual moment obj converted to UTC from time passed into module
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
		_maxSliderDate = moment.utc(_maxMomentUtc).add(1, 'days').hour(0).minute(0).second(0);
		_minSliderDate = moment.utc(_minMomentUtc).hour(0).minute(0).second(0);
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
		return moment(date).format("MMM Do YYYY");
		//return date.toLocaleString();
	};

	var toolTipFormatter = function(sliderEpochValues){
		var afterToolTipDate = new Date(0);
		afterToolTipDate.setUTCSeconds(sliderEpochValues[0]);
		var beforeToolTipDate = new Date(0);
		beforeToolTipDate.setUTCSeconds(sliderEpochValues[1]);
		return ""+moment(afterToolTipDate).format("MMM Do YYYY")+" - "+moment(beforeToolTipDate).format("MMM Do YYYY");
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

	var initialize = function(minLocationTimeUtc, maxLocationTimeUtc){
		_button = document.getElementById("button-datepicker");
		setupTimeDates(minLocationTimeUtc, maxLocationTimeUtc);
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

	var setupTimeDates = function(minLocationTimeUtc, maxLocationTimeUtc){
		var minMomentUtc = moment.utc(minLocationTimeUtc);
		var maxMomentUtc = moment.utc(maxLocationTimeUtc);
		//chop off hours, min, seconds so when JS converts to local TZ, it doesnt try to +/- day of month
		_minDate = new Date(minMomentUtc.year(), minMomentUtc.month(), minMomentUtc.date());
		_maxDate = new Date(maxMomentUtc.year(), maxMomentUtc.month(), maxMomentUtc.date());
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
			TwitterLoader.initialize();
		});

		$promise.fail(function(){
			alert("Ahhhh crap that didn't work...You might need to log out and log back in.")
		});
	};

	return {
		initialize: initialize
	};
})();

var TwitterLoader = (function () {
	var initialize = function(){
		loadEmbendedTweets();
	};

	var loadEmbendedTweets = function(){
		$("#whereubeen form.twitter").each(function(){
			var $form = $(this);
			var $formContainer = $form.parent();
			var $twitterHolder = $formContainer.children(".twitterHolder");
			var twitterUrl = $form.children("[name=twitterUrl]").val();
			var $promise = $.ajax({
				url: "/twitter/embeddedTweet?url="+twitterUrl,
				method: "GET",
				dataType: "json"
			});

			$promise.done(function(twitterJson){
				$twitterHolder.html(twitterJson.html);
			});
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
};

$(document).ready(function(){
	$(document).on("submit", ".centerActivity", function(e){
		e.stopImmediatePropagation();
		var $form = $(this);
		var lat = $form.children("[name=lat]").val();
		var long = $form.children("[name=long]").val();
		MapModule.centerMapByLatLong(lat, long);
		return false;
	});

	TwitterLoader.initialize();

	$("#button-play").on("click", function(){
		MapModule.play();
	});
});
