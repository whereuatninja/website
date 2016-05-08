var slider = new Slider("#ex16b", { min: 0, max: 50, value: [0, 50], focus: true });

function initialize() {
	console.log( "ready!" );
	addTable();
}

// $( document ).ready(function() {
    
//     $.ajax({
//     	type: "GET",
//     	 data: data,
//     	dataType: 'jsonp',
//     	url: "http://192.168.99.100:3000/locations/84af3469-d270-407f-8717-01fd9ffac57e",
//     	success: function(data){
// 			$.each(data, function (key, val) {
//     			movementCoordinates.push([item.lat, item.long]);
//     		});

//     		console.log( "WTF");
//     	}
// 	});
// });
// Define your locations: HTML content for the info window, latitude, longitude
var locations = [
	['<h4>Arc de Triomphe</h4>', 48.873804, 2.294994],
    ['<h4>Eiffel Tower</h4>', 48.858398, 2.294438],
    ['<h4>Louvre Pyramid</h4>', 48.861430, 2.335880],
    ['<h4>Restaurant Guy Savoy</h4>', 48.856832, 2.339122],
    ['<h4>LHotel</h4>', 48.856535, 2.335270]
];
      
// Setup the different icons and shadows
var iconURLPrefix = 'http://maps.google.com/mapfiles/ms/icons/';
var icons = [	iconURLPrefix + 'red-dot.png',
    			iconURLPrefix + 'green-dot.png',
      			iconURLPrefix + 'blue-dot.png',
      			iconURLPrefix + 'orange-dot.png',
      			iconURLPrefix + 'purple-dot.png',
      			iconURLPrefix + 'pink-dot.png',
      			iconURLPrefix + 'yellow-dot.png'
      		]
var iconsLength = icons.length;
var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 10,
    center: new google.maps.LatLng(48.861430, 2.335880),
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: false,
    streetViewControl: false,
    panControl: false,
    zoomControlOptions: {
    	position: google.maps.ControlPosition.LEFT_BOTTOM
	}
});

var infowindow = new google.maps.InfoWindow({
      maxWidth: 160
});

function addMarker(lat,lng) {
        marker = new google.maps.Marker({
            position: new google.maps.LatLng(lat,lng),
            map: map,
            icon: redImage
        });
        markersArray.push(marker);
}

var markers = new Array();
var iconCounter = 0;
//Add the markers and infowindows to the map
for (var i = 0; i < locations.length; i++) {
	var marker = new google.maps.Marker({
    	position: new google.maps.LatLng(locations[i][1], locations[i][2]),
    	map: map,
    	icon: icons[iconCounter]
    });
    markers.push(marker);
    google.maps.event.addListener(marker, 'click', (function(marker, i) {
    	return function() {
      		infowindow.setContent(locations[i][0]);
      		infowindow.open(map, marker);
      	}
    })(marker, i));
    
    iconCounter++;
    // We only have a limited number of possible icon colors, so we may have to restart the counter
    if(iconCounter >= iconsLength) {
    	iconCounter = 0;
    }
}

function autoCenter() {
	//  Create a new viewpoint bound
    var bounds = new google.maps.LatLngBounds();
    //  Go through each...
    for (var i = 0; i < markers.length; i++) {
    	bounds.extend(markers[i].position);
    }
    //  Fit these bounds to the map
    map.fitBounds(bounds);
}
autoCenter();
//var movementCoordinates = getMovementCoordinates();
var movementCoordinates =
[   
      {lat: 48.873804, lng: 2.294994},
      {lat: 48.871887, lng: 2.300871},
      {lat: 48.868394, lng: 2.301139},
      {lat: 48.862762, lng: 2.301686},
      {lat: 48.860651, lng: 2.295516},
      {lat: 48.858908, lng: 2.293467},
      {lat: 48.858195, lng: 2.293124},
      {lat: 48.858153, lng: 2.294379},
      {lat: 48.857440, lng: 2.293885},
      {lat: 48.857913, lng: 2.295194},
      {lat: 48.856875, lng: 2.294818},
      {lat: 48.856423, lng: 2.296406},
      {lat: 48.858992, lng: 2.293498},
      {lat: 48.860551, lng: 2.295648},
      {lat: 48.854305, lng: 2.305410},
      {lat: 48.853698, lng: 2.314733},
      {lat: 48.857997, lng: 2.315227},
      {lat: 48.862896, lng: 2.315216},
      {lat: 48.862614, lng: 2.318982},
      {lat: 48.864072, lng: 2.320059},
      {lat: 48.860149, lng: 2.333288},
      {lat: 48.860798, lng: 2.334372},
      {lat: 48.860664, lng: 2.335477},
      {lat: 48.861172, lng: 2.335509},
      {lat: 48.861179, lng: 2.335970},
      {lat: 48.860515, lng: 2.335820},
      {lat: 48.861193, lng: 2.333803},
      {lat: 48.858511, lng: 2.332505},
      {lat: 48.857868, lng: 2.336195},
      {lat: 48.857332, lng: 2.338298},
      {lat: 48.856732, lng: 2.339028},
      {lat: 48.856619, lng: 2.338964},
      {lat: 48.856563, lng: 2.339093},
      {lat: 48.856888, lng: 2.339190},
      {lat: 48.856069, lng: 2.340413},
      {lat: 48.853676, lng: 2.338385},
      {lat: 48.852511, lng: 2.338771},
      {lat: 48.852920, lng: 2.337001},
      {lat: 48.854995, lng: 2.336819},
      {lat: 48.856280, lng: 2.336562},
      {lat: 48.856435, lng: 2.335253}
];

var travelPath = new google.maps.Polyline({
		path: movementCoordinates,
      	geodesic: true,
      	strokeColor: '#FF0000',
      	strokeOpacity: 1.0,
      	strokeWeight: 2
    });
travelPath.setMap(map);

//ADD TABLE
function addTable() {
	var myTableDiv = document.getElementById("whereubeen")
    var table = document.createElement('TABLE')
    
    table.className = "table table-striped"
    var tableBody = document.createElement('TBODY')
    table.appendChild(tableBody);
    
    var heading = new Array();
    heading[0] = "Marker"
    heading[1] = "Date/Time"
    heading[2] = "Caption"
    heading[3] = "Message"
    
    var stock = new Array()
    stock[0] = new Array(icons[0], "June, 15 2016 10:30", "Arc de Triomphe", "first stop")
    stock[1] = new Array(icons[1], "June, 15 2016 11:13", "Eiffel Tower", "second stop")
    stock[2] = new Array(icons[2], "June, 15 2016 14:02", "Louvre Pyramid", "third stop")
    stock[3] = new Array(icons[3], "June, 15 2016 16:12", "Restaurant Guy Savoy", "fourth stop")
    stock[4] = new Array(icons[4], "June, 15 2016 19:44", "LHotel", "fifth stop")
    stock[5] = new Array("", "June, 15 2016 19:58", "Going Ninja", "")
    
    //TABLE COLUMNS      
    var tr = document.createElement('TR');
    tableBody.appendChild(tr);
    
    for (i = 0; i < heading.length; i++) {
      	var th = document.createElement('TH')
      	th.appendChild(document.createTextNode(heading[i]));
      	tr.appendChild(th);
    }
      //TABLE ROWS
    for (i = 0; i < stock.length; i++) {
    	var tr = document.createElement('TR');
      	for (j = 0; j < stock[i].length; j++) {
    		var td = document.createElement('TD')
      		td.appendChild(document.createTextNode(stock[i][j]));
      		tr.appendChild(td)
      	}
      	tableBody.appendChild(tr);
    }
    myTableDiv.appendChild(table)
}