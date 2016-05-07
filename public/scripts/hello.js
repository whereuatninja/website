$(document).ready(function() {
	function getLocations(){
		$.getJSON("http://192.168.99.100:3000/locations/84af3469-d270-407f-8717-01fd9ffac57e",function (json){
    		var location;
    		$.each(json.zones, function (i, item){
    			addMarker(item.lat,item.long)
    		})
    	});
	}  
});