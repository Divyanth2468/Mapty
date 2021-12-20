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

class App {
  #map;
  #mapEvent;
  constructor() {
    this._getPosition();

    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleElevationField);
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        // Success call back function
        this._loadMap.bind(this),
        // Failure call back function
        function () {
          alert('Could not get your current position');
        }
      );
  }

  _loadMap(position) {
    // Getting lat and long coordinates from geolocation API and saving them into an array
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    // Creating the map and storing it inside a map variable
    this.#map = L.map('map').setView(coords, 13);

    // Setting the map style
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    // Displaying the form
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField(e) {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    // Clear input fields
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    // Getting the coords of the area clicked on the map
    const { lat, lng } = this.#mapEvent.latlng;

    // Setting up the marker
    L.marker([lat, lng])
      .addTo(this.#map)
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
      .setPopupContent('Workout')
      .openPopup();
  }
}

const app = new App();
