// Define global variables for depature and arrival location in coorindates
var o_lat;
var o_lng;
var d_lat;
var d_lng;

// Define global variables for depature and arrival times entered in the webpage
var arrive_time;
var depart_time;

// Load Google Chart - Bar Chart
google.charts.load("current", { packages: ["corechart", "bar"] });

// Function to load Google Maps in the webpage
function initMap() {
  // Set initial map centre location for google maps
  const directionsRenderer = new google.maps.DirectionsRenderer();
  const directionsService = new google.maps.DirectionsService();
  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -33.8688, lng: 151.2195 },
    zoom: 13
  });
  directionsRenderer.setMap(map);
  // define info windows
  const card = document.getElementById("pac-card");
  const card2 = document.getElementById("pac-card2");
  // define input windows
  const origin_input = document.getElementById("pac-origin");
  const destination_input = document.getElementById("pac-destination");
  // let info windows showing on the top right corner of the map
  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(card);
  map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(card2);

  const origin_auto = new google.maps.places.Autocomplete(origin_input);
  const destination_auto = new google.maps.places.Autocomplete(
    destination_input
  );

  // Bind the map's bounds (viewport) property to the autocomplete object,
  // so that the autocomplete requests use the current map bounds for the
  // bounds option in the request.
  origin_auto.bindTo("bounds", map);
  destination_auto.bindTo("bounds", map);
  // Set the data fields to return when the user selects a place.
  origin_auto.setFields(["name", "geometry", "place_id"]);
  destination_auto.setFields(["name", "geometry", "place_id"]);
  // This is to define Google maps information windows
  const infowindow = new google.maps.InfoWindow();
  const infowindowContent = document.getElementById("infowindow-content");
  infowindow.setContent(infowindowContent);
  const marker = new google.maps.Marker({
    map,
    anchorPoint: new google.maps.Point(0, -29)
  });
  // This is to define bounds for origin location and destination
  var bounds = new google.maps.LatLngBounds();

  // This section is to put red pins at the autocompleted origin location on the map
  origin_auto.addListener("place_changed", () => {
    infowindow.close();
    marker.setVisible(false);
    const o_place = origin_auto.getPlace();
    const d_place = destination_auto.getPlace();
    if (!o_place.geometry) {
      // User entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      window.alert("No details available for input: '" + o_place.name + "'");
      return;
    }

    if (d_place == null) {
      // Center the origin location on map
      map.setCenter(o_place.geometry.location);
      map.setZoom(17);
      // Put Marker on the origin location on map
      marker.setPosition(o_place.geometry.location);
      marker.setVisible(true);
    } else {
      o_lat = o_place.geometry.location.lat();
      o_lng = o_place.geometry.location.lng();
      d_lat = d_place.geometry.location.lat();
      d_lng = d_place.geometry.location.lng();
      var locations = [["origin", o_lat, o_lng], ["destination", d_lat, d_lng]];
      for (i = 0; i < locations.length; i++) {
        route_marker = new google.maps.Marker({
          position: new google.maps.LatLng(locations[i][1], locations[i][2]),
          map: map
        });
        bounds.extend(route_marker.position);
      }
      map.fitBounds(bounds);
    }
  });

  // This section is to put red pin at the autocompleted destination location on the map
  destination_auto.addListener("place_changed", () => {
    infowindow.close();
    marker.setVisible(false);
    const o_place = origin_auto.getPlace();
    const d_place = destination_auto.getPlace();

    if (!d_place.geometry) {
      // User entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      window.alert("No details available for input: '" + d_place.name + "'");
      return;
    }
    if (o_place == null) {
      // Center the origin location on map
      map.setCenter(d_place.geometry.location);
      map.setZoom(17); // Why 17? Because it looks good.
      // Put Marker on the origin location on map
      marker.setPosition(d_place.geometry.location);
      marker.setVisible(true);
    } else {
      o_lat = o_place.geometry.location.lat();
      o_lng = o_place.geometry.location.lng();
      d_lat = d_place.geometry.location.lat();
      d_lng = d_place.geometry.location.lng();
      var locations = [["origin", o_lat, o_lng], ["destination", d_lat, d_lng]];
      for (i = 0; i < locations.length; i++) {
        route_marker = new google.maps.Marker({
          position: new google.maps.LatLng(locations[i][1], locations[i][2]),
          map: map
        });
        bounds.extend(route_marker.position);
      }
      map.fitBounds(bounds);
    }
  });

  // Define which function to call out if "Visualize" Button is clicked
  const onChangeHandler = function() {
    calculateAndDisplayRoute(directionsService, directionsRenderer);
  };
  // Callout the function if "Visualize" Button is clicked
  document.getElementById("route").addEventListener("click", onChangeHandler);
}

// Define a async function to record all possible route given certain time period
async function calculateAndDisplayRoute(directionsService, directionsRenderer) {
  // Obtain Selected Depature Time from Html flatpicker
  var timepicker1 = flatpickr("#flatpickr1", {
    enableTime: true,
    dateFormat: "Y-m-d H:i"
  });
  depart_time = timepicker1.selectedDates[0];

  const selectedMode = "TRANSIT";
  var data = new google.visualization.DataTable();
  data.addColumn("timeofday", "Time of Day");
  data.addColumn("number", "Total Commute Time");

  // Loop to obtain all routes information and duration during 2 hours after selected time (the interval between each depature time is 5 mintues)
  for (i = 1; i <= 24; i++) {
    update_status(i, 24);
    const direction_results = await calculateRoute(
      directionsService,
      directionsRenderer,
      depart_time,
      selectedMode
    );
    depart_time.setMinutes(depart_time.getMinutes() + 5);
    depature_time_text =
      direction_results.routes[0].legs[0].departure_time.text;
    depature_time_value =
      direction_results.routes[0].legs[0].departure_time.value;
    arrive_time_text = direction_results.routes[0].legs[0].arrival_time.text;
    arrive_time_value = direction_results.routes[0].legs[0].arrival_time.value;
    route_duration_minutes = Math.floor(
      direction_results.routes[0].legs[0].duration.value / 60
    );
    // Save all routes information in data matrix
    data.addRows([
      [
        {
          v: [depature_time_value.getHours(), depature_time_value.getMinutes()],
          f:
            "Depature Time:" +
            depature_time_text +
            "; Arrival Time:" +
            arrive_time_text
        },
        route_duration_minutes
      ]
    ]);
    // Render this route on the map if the duration time is the minimum compare to all other duration time in data matrix
    min_commuting_time = data.getColumnRange(1).min;
    if (route_duration_minutes <= min_commuting_time) {
      await RenderRoute(
        directionsService,
        directionsRenderer,
        depart_time,
        selectedMode
      );
    }
    // Interval between each enquiry to avoid exceeding enquiry limit for google maps API
    sleep(800);
  }
  // Plot all information in data matrix in a chart
  drawMultSeries(data, directionsService, directionsRenderer);
}

// Function to wait for a given amount of milliseconds
function sleep(milliSeconds) {
  var startTime = new Date().getTime();
  while (new Date().getTime() < startTime + milliSeconds);
}

// make the table adjustable to screen size
function calculateRoute(
  directionsService,
  depart_time,
  selectedMode
) {
  return new Promise(function(resolve, reject) {
    directionsService.route(
      {
        origin: { lat: o_lat, lng: o_lng },
        destination: { lat: d_lat, lng: d_lng },
        // Note that Javascript allows us to access the constant
        // using square brackets and a string value as its
        // "property."
        transitOptions: {
          departureTime: depart_time
        },
        travelMode: google.maps.TravelMode[selectedMode]
      },
      (response, status) => {
        if (status == "OK") {
          resolve(response);
        } else {
          reject(window.alert("Directions request failed due to " + status));
        }
      }
    );
  });
}

// This is the function to render routes on Google Map
function RenderRoute(
  directionsService,
  directionsRenderer,
  depart_time,
  selectedMode
) {
  return new Promise(function(resolve, reject) {
    directionsService.route(
      {
        origin: { lat: o_lat, lng: o_lng },
        destination: { lat: d_lat, lng: d_lng },
        // Note that Javascript allows us to access the constant
        // using square brackets and a string value as its
        // "property."
        transitOptions: {
          departureTime: depart_time
        },
        travelMode: google.maps.TravelMode[selectedMode]
      },
      (response, status) => {
        if (status == "OK") {
          resolve(response);
          directionsRenderer.setDirections(response);
        } else {
          reject(window.alert("Directions request failed due to " + status));
        }
      }
    );
  });
}

// This is the function to make the chart bigger
function returnBiggerviewWindow(axis_min, axis_max) {
  axis_hour_min = axis_min[0];
  axis_min_min = axis_min[1];
  axis_hour_max = axis_max[0];
  axis_min_max = axis_max[1];
  gap = 5;
  if (axis_min_min - gap < 0) {
    axis_min_min = axis_min_min + 60 - gap;
    axis_hour_min = axis_hour_min - 1;
  } else {
    axis_min_min = axis_min_min - gap;
  }

  if (axis_min_max + gap > 60) {
    axis_hour_max = axis_hour_max + 1;
    axis_min_max = axis_min_max - 60 + gap;
  } else {
    axis_min_max = axis_min_max + gap;
  }

  return axis_hour_min, axis_min_min, axis_hour_max, axis_min_max;
}

// This is the function to plot the bar chart
function drawMultSeries(data) {
  axis_min = data.getColumnRange(0).min;
  axis_max = data.getColumnRange(0).max;
  returnBiggerviewWindow(axis_min, axis_max);
  var options = {
    height: 350,
    title: "Commute Time vs Time of the day",
    hAxis: {
      title: "Time of Day",
      format: "h:mm a",
      viewWindow: {
        min: [axis_hour_min, axis_min_min],
        max: [axis_hour_max, axis_min_max]
      }
    },
    vAxis: {
      title: "Total Commute Time (Minutes)"
    }
  };

  var chart = new google.visualization.ColumnChart(
    document.getElementById("chart_div")
  );

  chart.draw(data, options);
  $(window).resize(function() {
    drawMultSeries(data);
  });
}

// This is the function to show the progress of data collecting
function update_status(i, total) {
  var x = document.getElementById("status");
  status_percent = (i / total) * 100;
  x.innerHTML =
    "Please Wait Data is Being Collected - Total Progress " +
    status_percent.toFixed(0) +
    " %";
}
