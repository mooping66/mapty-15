'use strict';

//@@ Managing Workout Data: Creating Classes
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    //   this.date=...
    //   this.id=...
    //* [lat, lng]
    this.coords = coords;
    //* in km
    this.distance = distance;
    //* in min
    this.duration = duration;
  }

  _setDescription() {
    //* prettier-ignore
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    // this.type = 'running';
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    //* min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    // this.type = 'cycling';
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    //* km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([39, -12], 5.2, 24, 278);
// const cycling1 = new Running([39, -12], 27, 95, 523);
// console.log(run1, cycling1);
//Running {date: Tue Mar 02 2021 19:17:28 GMT+0700 (Indochina Time), id: "4687448043", coords: Array(2), distance: 5.2, duration: 24, …}
//Running {date: Tue Mar 02 2021 19:17:45 GMT+0700 (Indochina Time), id: "4687465128", coords: Array(2), distance: 27, duration: 95, …}

/******************************************************* */
//* APPLICATION ARCHITECTURE
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//@@ Refactoring for Project Architecture
class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];

  constructor() {
    //* Get user's position
    this._getPosition();
    //* Get data from local storage
    this._getLocalStorage();
    //* Attach event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    //@@ Using the Geolocation API
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    console.log(position);
    //GeolocationPosition {coords: GeolocationCoordinates, timestamp: 1614677739286}

    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(latitude, longitude);
    //13.772390399999999 100.4732416
    console.log(`https://www.google.co.th/maps/@${latitude},${longitude}`);
    //https://www.google.co.th/maps/@13.772390399999999,100.4732416

    //@@ Displaying a Map Using Leaflet Library
    //! Page load->Get current location coordinated->Render map on current location
    const coords = [latitude, longitude];

    //* https://leafletjs.com/index.html
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    // console.log(this.#map);
    //i {options: {…}, _handlers: Array(6), _layers: {…}, _zoomBoundLayers: {…}, _sizeChanged: false, …}

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    //   L.marker(coords)
    //     .addTo(map)
    //     .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
    //     .openPopup();

    //@@ Displaying a Map Marker
    //! User clicks on map->Render workout form
    //* Handling click on map
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    //* Empty inputs
    inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =
      '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  //@@ Rendering Workout Input Form
  //! User submit new workout->Render workout form
  _newWorkout(e) {
    //@@ Creating a New Workout
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    //* Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;

    let workout;

    //* if workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;

      //* Check if data is valid
      if (
        //     !Number.isFinite(distance) ||
        //     !Number.isFinite(duration) ||
        //     !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Inputs have to be positive numbers!');
      }

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //* if workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      //* Check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration, elevation)
      ) {
        return alert('Inputs have to be positive numbers!');
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //* Add new object to workout array
    this.#workouts.push(workout);
    // console.log(workout);

    //* Render workout on map as marker
    this._renderWorkoutMarker(workout);

    //* Render workout on list
    this._renderWorkout(workout);

    //* hide form + clear input fields
    //* clear input field
    this._hideForm();

    //* Set local storage to all workouts
    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    //* Display maker
    // console.log(this.#mapEvent);

    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃🏼‍♀️' : '🚴🏼‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  //@@ Rendering Workouts
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃🏼‍♀️' : '🚴🏼‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>`;
    if (workout.type === 'running')
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🛤</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>
    </li>`;
    if (workout.type === 'cycling')
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>`;

    form.insertAdjacentHTML('afterend', html);
  }

  //@@ Move to Marker On Click
  //! User submit new workout->Render workout in list
  _moveToPopup(e) {
    // BUGFIX: When we click on a workout before the map has loaded, we get an error. But there is an easy fix:
    if (!this.#map) {
      return;
    }

    const workoutEl = e.target.closest('.workout');
    // console.log(workoutEl);

    if (!workoutEl) {
      return;
    }

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

    //* using the public interface
    // workout.click();
  }

  //! User submit new workout->Store workout in local storage
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    // console.log(data);

    if (!data) {
      return;
    }

    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}
const app = new App();
