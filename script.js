'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // Creating description
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
    return this.description;
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this.type = 'running';
    this.description = this._setDescription();
  }

  calcPace() {
    // min/km
    this.speed = this.duration / this.distance;
    return this.speed;
  }
}

class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this.type = 'cycling';
    this.description = this._setDescription();
  }

  calcSpeed() {
    // km/hr
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

////////////////////////////////
// Application Archiitecture

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const btn = document.querySelector('.btn');
const sorting = document.querySelector('.sorting');
const sortingLinks = document.querySelectorAll('.sorting__link');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];
  #markers = [];

  constructor() {
    // Get User's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', e => {
      const trashBin = e.target.closest('.workout__trash');
      if (!trashBin) return this._moveToPopup(e);
      else {
        const workoutEl = e.target.closest('.workout');
        if (!workoutEl) return;
        this._deleteWorkout(workoutEl.dataset.id);
      }
    });

    sorting.addEventListener('click', this._sortWorkouts.bind(this));
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
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    // Setting the map style
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));
    this._getCurrentPosition(coords);

    // Rendering the marker
    this.#workouts.forEach(workout => {
      this._renderWorkoutMarker(workout);
    });
  }

  _getCurrentPosition(coords) {
    const latLng = [coords[0], coords[1]];
    L.marker(latLng)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxwidth: 250,
          minwidth: 100,
          autoClose: false,
          closeOnClick: false,
        })
      )
      .setPopupContent(`📍 Current Location`)
      .openPopup();
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    // Displaying the form
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField(e) {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    // prettier-ignore
    // validating inputs
    const validInputs = (...inputs) => inputs.every(input => Number.isFinite(input));

    // validating if inputs are positive
    const allPositive = (...inputs) => inputs.every(input => input > 0);

    e.preventDefault();

    // Getting the coords of the area clicked on the map
    const { lat, lng } = this.#mapEvent.latlng;

    // Getting data from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;

    // If activity is running, create a running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers');

      // creating a running object
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If actiity is cycling, create a cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // Check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers');

      // creating a cycling object
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Adding new workout object to workout array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide form and Clear input fields
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    // Setting up the marker
    const marker = L.marker(workout.coords);
    this.#markers.push(marker);
    marker
      .addTo(this.#map)
      .bindPopup(
        // Adding custom properties
        L.popup({
          maxwidth: 250,
          minwidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      // Setting the popup content
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
          <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">
          <span>${workout.description}</span>

          <span class="workout__trash">🗑</span>
          </h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
          `;

    if (workout.type === 'running') {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>`;
    }

    if (workout.type === 'cycling') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _deleteWorkout(id) {
    const workout = document.querySelector(`[data-id='${id}']`);
    this.#workouts.forEach((workout, index) => {
      if (workout.id === id) {
        // Removing workout from
        this.#workouts.splice(index, 1);

        // Removing marker
        this.#markers[index].remove();
        this.#markers.splice(index, 1);
      }
    });

    this._setLocalStorage();
    workout.remove();
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    // console.log(workout);

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;
    // console.log(data);

    data.forEach(this._objectConversion.bind(this));

    this.#workouts.forEach(workout => {
      this._renderWorkout(workout);
    });
  }

  _objectConversion(obj) {
    let workout;
    if (obj.type === 'running') {
      workout = new Running(
        obj.coords,
        obj.distance,
        obj.duration,
        obj.cadence
      );
    }
    if (obj.type === 'cycling') {
      workout = new Cycling(
        obj.coords,
        obj.distance,
        obj.duration,
        obj.elevationGain
      );
    }
    workout.type = obj.type;
    workout.id = obj.id;
    workout.date = obj.date;
    workout.description = obj.description;
    this.#workouts.push(workout);
  }

  _sortWorkouts(e) {
    // Selecting the closest link (based on which to sort)
    const type = e.target.closest('.sorting__link');

    // Creating a new array for sortedItems
    let sortedArray = [];

    // Checking if link exists
    if (!type) return;

    // Toggling active class
    sortingLinks.forEach(link =>
      link.classList.remove('sorting__link--active')
    );
    type.classList.add('sorting__link--active');

    // Sorting based on category chosen
    if (type.classList.contains('distance'))
      sortedArray = this._sort('distance');
    if (type.classList.contains('duration'))
      sortedArray = this._sort('duration');
    if (type.classList.contains('speed')) sortedArray = this._sort('speed');
    if (type.classList.contains('type')) sortedArray = this._sort('type');

    // Removing all the activities before rendering sorted ones
    let allList = document.querySelectorAll('.workout');
    allList.forEach(list => {
      list.remove();
    });

    // Rendering sorted activities
    sortedArray.forEach(workout => {
      this._renderWorkout(workout);
    });
  }

  _sort(key) {
    // creating an empty array to hold the values of the category based on which to sort
    let array = [];

    // creating a new sorted array that will return the sorted workouts in order
    let sortedArray = [];

    // Adding all the values to the array
    this.#workouts.forEach(workout => {
      array.push(workout[key]);
    });

    // Sorting the array
    array = array.slice().sort((a, b) => Math.round(a) - Math.round(b));

    // Adding items in sorted order to sortedArray
    array.forEach(item => {
      this.#workouts.forEach(workout => {
        if (workout[key] == item) sortedArray.push(workout);
      });
    });

    // Removing duplicates if any by returning a set
    return new Set(sortedArray);
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();

btn.addEventListener('click', app.reset);
