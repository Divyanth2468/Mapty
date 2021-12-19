'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

if (navigator.geolocation)
  navigator.geolocation.getCurrentPosition(
    // Success call back function
    function (position) {
      // Getting lat and long coordinates from geolocation API and saving them into an array
      const { latitude } = position.coords;
      const { longitude } = position.coords;
      const coords = [latitude, longitude];

      // Creating the map and storing it inside a map variable
      const map = L.map('map').setView(coords, 13);
      // console.log(map);

      // Setting the map style
      L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Adding markers to the map
      map.on('click', function (mapEvent) {
        // Getting the coords of the area clicked on the map
        const { lat, lng } = mapEvent.latlng;

        // Setting up the marker
        L.marker([lat, lng])
          .addTo(map)
          .bindPopup(
            // Adding custom properties
            L.popup({
              maxwidth: 250,
              minwidth: 100,
              autoClose: false,
              closeOnClick: false,
              className: 'running-popup',
            })
          )
          // Setting the popup content
          .setPopupContent('running')
          .openPopup();
      });
    },
    // Failure call back function
    function () {
      alert('Could not get your current position');
    }
  );
