
var MapModule = (function(){
	var _locations;
	var _googleMapsLatLngLocations = [];
	var _activities;
	var _map;
	var _polyLines = [];
	var _markers = [];
	var _groupedLocations = [];
	var _currentLocationMarker;
	var _mostRecentLocation;

	var _groupedLocationsIndex;
	var _locationsIndex;


	var initialize = function(mapElem, locations, mostRecentLocation){
		setLocations(locations, mostRecentLocation);
		_initializeMap(mapElem);
		_drawLocations(_groupedLocations);
		_drawActivities(_activities);
		centerMap(_googleMapsLatLngLocations);
		addMarkerAtMostRecentPosition();
	};

	var setLocations = function(locations, mostRecentLocation){
		_locations = locations;
		_mostRecentLocation = mostRecentLocation;
		_groupedLocations = _getGroupedLocations(locations);
		_googleMapsLatLngLocations = _getGoogleMapsLatLngLocations(locations);
		_activities = _getActivities(locations);
	};

	var redraw = function(){
		_clearMap();
		_drawLocations(_groupedLocations);
		_drawActivities(_activities);
		centerMap(_googleMapsLatLngLocations);
		addMarkerAtMostRecentPosition();
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
			if(loc.message || loc.twitterUrl){
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
		marker.locId = loc.id;

		google.maps.event.addListener(marker, 'click', (function(marker) {
			var infowindow = new google.maps.InfoWindow({
				//maxWidth: 160
			});
			marker.infoWindow = infowindow;
			return function() {
				infowindow.setContent(title);
				infowindow.open(_map, marker);
			}
		})(marker));
		return marker;
	};

	var addMarkerAtMostRecentPosition = function(){
		_currentLocationMarker = createClickableMarker(_mostRecentLocation, "We're here right now!<br>");
		_currentLocationMarker.setMap(_map);
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
			if(_mostRecentLocation.id != activity.id){
				var marker = createClickableMarker(activity);
				marker.setMap(_map);
				_markers.push(marker);
			}

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

	var centerOnMostRecentLocation = function(){
		if(_mostRecentLocation){
			hideMarkerInfoWindows();
			_currentLocationMarker.infoWindow.setContent(_currentLocationMarker.title);
			_currentLocationMarker.infoWindow.open(_map, _currentLocationMarker);
			centerMapOnLocation(_mostRecentLocation.lat, _mostRecentLocation.long);
			window.scrollTo(0,0);
		}
	};

	var hideMarkerInfoWindows = function(){
		_markers.forEach(function(marker){
			marker.infoWindow.close();
		});
	};

	var centerMapOnLocation = function(lat, long, id){
		var position = new google.maps.LatLng(lat, long);
		var googleMapsLatLong = [position];
		centerMap(googleMapsLatLong);
		setZoom(16);
		_markers.forEach(function(marker){
			if(marker.locId == id){
				marker.infoWindow.setContent(marker.title);
				marker.infoWindow.open(_map, marker);
				return;
			}
		});
		//TODO pop up info window
		window.scrollTo(0,0);
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

		_currentLocationMarker.setMap(null);
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
			//done playing animation
			setPlayBackLabel("");
			addMarkerAtMostRecentPosition();
			setTimeout(function(){
				redraw();
			}, 1000);
			return;
		}
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
		var time = moment.utc(currentLocation.time).format("MMM DD YYYY hh:mm A z");
		setPlayBackLabel("Playback Information: ("+fromNow+") " + time);

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
			_polyLines.push(polyLine);
			markers.forEach(function(marker){
				_markers.push(marker);
			});
			playAnimation(--groupIndex);
		}
	};

	var setPlayBackLabel = function(str){
		$("#play-information b").text(str);
	}

	return {
		initialize: initialize,
		drawPolyLine: drawPolyLine,
		setLocations: setLocations,
		redraw: redraw,
		centerMapByLatLong: centerMapOnLocation,
		play: play,
		centerOnMostRecentLocation: centerOnMostRecentLocation
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

	var _beforeLabel;
	var _afterLabel;

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
				tooltip: 'hide'
				//formatter: toolTipFormatter
			}
		).on("slide", onChangeEvent);
	};

	var onChangeEvent = function(minMaxValues){
		drawMinMaxLabels(minMaxValues);
	};

	var drawMinMaxLabels = function(minMaxValues){
		_beforeLabel.innerHTML = moment(new Date(0).setUTCSeconds(minMaxValues[1])).format("MMM Do YYYY");
		_afterLabel.innerHTML = moment(new Date(0).setUTCSeconds(minMaxValues[0])).format("MMM Do YYYY");
	}

	var setupLabels = function(options){
		_beforeLabelId = options.beforeLabelId;
		_afterLabelId = options.afterLabelId;
		_timeZoneLabelId = options.timeZoneLabelId;
		_beforeLabel = document.getElementById(_beforeLabelId);
		_afterLabel = document.getElementById(_afterLabelId);
		drawMinMaxLabels([_minSliderDate.unix(), _maxSliderDate.unix()]);
		var timeZoneLabel = document.getElementById(_timeZoneLabelId);
		//timeZoneLabel.innerHTML = getPrettyTimeZone(_minMomentUtc);
	}

	var setupTimeDates = function(options){
		_minMomentUtc = moment.utc(options.minSliderTime);
		_maxMomentUtc = moment.utc(options.maxSliderTime);
		setupMinMaxSliderDates();
	};

	var setupMinMaxSliderDates = function(){
		_minSliderDate = moment.utc(_minMomentUtc).hour(0).minute(0).second(0);
		_maxSliderDate = moment.utc(_maxMomentUtc).add(1, 'days').hour(0).minute(0).second(0);
		_minSliderEpochTime = _minSliderDate.valueOf()/1000;
		_maxSliderEpochTime = _maxSliderDate.valueOf()/1000;
	};

	var getPrettyTimeZone = function(momentDate){
		if(momentDate){
			return "Times displayed in "+momentDate.format("z ZZ");
		}
		return "";
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
		/*$(_button).datepicker({
			title: "Pick a date",
			startDate: _minDate,
			endDate: _maxDate,
			autoclose: true
		}).on("changeDate", onChangeDate);*/
		$("#datepicker").datepicker({
			title: "Pick a date",
			startDate: _minDate,
			endDate: _maxDate,
			autoclose: true
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
	var _$locationContainer;

	var initialize = function(){
		_filterButton = new LoaderButton("button-filter");
		_$locationContainer = $(".location-cards");
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
		_$locationContainer.html("");
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
			MapModule.setLocations(response.locations, response['mostRecentLocation']);
			MapModule.redraw();
			_$locationContainer.html(response.locationListHtml);
			TwitterLoader.initialize();
		});

		$promise.fail(function(){
			alert("Ahhhh crap that didn't work...\nPlease sign out and sign back in! \n(Your session probably expired)");
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
		_$loadingSpinner = _$elem.children(".refresh-animate");
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
		var id = $form.children("[name=id]").val();
		MapModule.centerMapByLatLong(lat, long, id);
		return false;
	});

	TwitterLoader.initialize();

	$("#button-play").on("click", function(){
		MapModule.play();
	});

	$("#button-center-recent").on("click", function(){
		MapModule.centerOnMostRecentLocation();
	});
});
