(function () {
  "use strict";

  // Используем делегирование
  document.addEventListener('mousedown', function (e) {
    // если нажатие не левой кнопкой мыши, ничего не делаем
    if (e.which != 1) return;

    // проверяем нажатие на фильм в ле
    let elem = e.target.closest('.movie') || e.target.closest('.break') || e.target.closest('.showtime');

    // Если кликнуто не на фильм - ничего не делаем
    if (!elem) return;

    // убираем HTML5 drag&drop
    elem.ondragstart = function () {
      return false;
    };

    let dragMovie = elem;

    // если нажали на фильме в левом списке
    if (dragMovie.closest('.movie-list')) {
      DragFromList(dragMovie, e);

      return false;
    }

    // если изменяем перерыв после фильма
    if (dragMovie.closest('.break')) {
      UpdateBreak(dragMovie.parentNode, e);

      return false;
    }

    // если нажали на фильме в расписании зала
    if (dragMovie.closest('.dropzone')) {
      DragWithinDropzone(dragMovie.parentNode, e);

      return false;
    }
  });

  function DragFromList(movie, e) {
    let movieId = movie.dataset.movieId,
        movieDuration = movie.parentNode.querySelector('.movie__duration').value;

    let showtime = h.createShowtime(movie, movieDuration);

    moveAt(showtime, e);

    movie.parentNode.appendChild(showtime);

    function findDroppable(event) {
      showtime.hidden = true;
      var elem = document.elementFromPoint(event.clientX, event.clientY);
      showtime.hidden = false;

      if (elem == null) {
        // такое возможно, если курсор мыши "вылетел" за границу окна
        return null;
      }

      return elem.closest('.dropzone');
    }

    function moveAt(el, event) {
      //console.log(event.pageX, event.pageY);

      el.style.position = 'absolute';
      el.style.zIndex = '1000';
      el.style.left = event.pageX - el.offsetWidth / 2 + 'px';
      el.style.top = event.pageY - el.offsetHeight / 2 + 'px';
    }

    document.onmousemove = function (event) {
      moveAt(showtime, event);

      let dropzone = findDroppable(event);

      if (dropzone) {
        dropzone.classList.add('dropzone-mod_active');
      } else {
        //document.querySelector('.dropzone-mod_active').classList.remove('dropzone-mod_active');
      }
    };

    showtime.onmouseup = function (event) {
      var dropElem = findDroppable(event);

      if (dropElem) {
        showtime.style.top = '0';
        showtime.style.left = '0';

        dropElem.appendChild(showtime);

        showtime.hidden = true;
        h.promptStartTime(showtime);
        h.setStartEndTime(showtime);
        showtime.hidden = false;

        showtime.onmouseup = null;
        //DragWithinDropzone(movie, e);
      } else {
        showtime.parentNode.removeChild(showtime);
      }

      showtime.classList.remove('dragging');

      document.onmousemove = null;
      showtime.onmouseup = null;
    };
  }

  function DragWithinDropzone(showtime, e) {
    var initPos = e.pageX,
        initLeft = parseInt(showtime.style.left);

    document.onmousemove = function (e) {
        var curPos = e.pageX;

        var diff = curPos - initPos;

        //console.log(diff);
        //if (diff > 0)
        //  step += 10;
        //else
        //  step += -10;

        showtime.style.left = initLeft + diff + 'px';
    };

    showtime.onmouseup = function (e) {
      let endPos = parseInt(showtime.style.left);

      showtime.style.left = Math.round(endPos / 10) * 10 + 'px';

      h.setStartEndTime(showtime);

      document.onmousemove = null;
      showtime.onmouseup = null;
    };
  }

  function UpdateBreak(showtime, e) {
    let breakBar = showtime.querySelector('.break');

    var initMousePos = e.pageX,
        initLeftPos = parseInt(showtime.style.left);

    document.onmousemove = function (e) {
        let currentMousePos = e.pageX;

        if ( (initMousePos - currentMousePos) >= 10) {
          h.updateBreak(showtime, h.getBreak(showtime) - 5);

          initMousePos = currentMousePos;
        }

        if ( (initMousePos - currentMousePos) <= -10) {
          h.updateBreak(showtime, h.getBreak(showtime) + 5);

          initMousePos = currentMousePos;
        }
    };

    breakBar.onmouseup = function () {
      document.onmousemove = null;
      breakBar.onmouseup = null;
    }
  }


  /*
  ** Helper functions
  */
  var h = {
    createShowtime: function (movie, duration) {
      let showtime = document.createElement('div');

      showtime.classList.add('showtime-container');
      showtime.innerHTML = '<div class="showtime">' +
                              '<b></b>' +
                              '<s></s>' +
                              '<i></i>' +
                           '</div>' +
                           '<div class="break">' +
                              '' +
                           '</div>';

      showtime.querySelector('b').textContent = movie.textContent; // выставляем название фильма

      this.setDuration(showtime, duration); // выставляем хронометраж
      this.setBreak(showtime); // выставляем перерыв

      return showtime;
    },

    getDuration: function (showtime) {
      return +showtime.dataset.duration;
    },

    setDuration: function (showtime, duration) {
      showtime.dataset.duration = duration;
      showtime.querySelector('.showtime').style.width = duration * 2 + 'px';
    },

    setBreak: function (showtime) {
      let duration = h.getDuration(showtime),
          breakTime;

      if (duration % 5 != 0) {
        breakTime = 10 - duration % 5;
      } else {
        breakTime = 10;
      }

      showtime.dataset.break = breakTime;

      showtime.querySelector('.break').style.width = breakTime * 2 + 'px';
      showtime.querySelector('.break').textContent = breakTime + '`';
    },

    getBreak: function (showtime) {
      return +showtime.dataset.break;
    },

    updateBreak: function (showtime, newValue) {
      if (newValue <= 0) return;

      let breakBar = showtime.querySelector('.break');

      showtime.dataset.break = newValue;

      breakBar.style.width = newValue * 2 + 'px';
      breakBar.textContent = newValue + '`';
    },

    getTimeByPosition: function (position) {
      let hours = Math.floor(position / (60 * 2));
      let minutes = (position % (60 * 2)) / 2;

      if (minutes < 10)
        minutes = '0' + minutes;

      return hours + ':' + minutes;
    },

    setStartEndTime: function (showtime) {
      let pos = parseInt(showtime.style.left) + 120 * 5; // шкада отсчета с 5 утра
      let duration = showtime.dataset.duration;

      let startTime = this.getTimeByPosition(pos);
      let endTime   = this.getTimeByPosition(pos + duration * 2);

      showtime.dataset.startTime = startTime;
      showtime.dataset.endTime = endTime;

      showtime.querySelector('s').textContent = startTime;
      showtime.querySelector('i').textContent = endTime;
    },

    promptStartTime: function (showtime) {
      let lastShowtimeEndTime = this.lastShowtimeEndTime || '09:00';

      let startTime = prompt('Введите время начала сеанса', lastShowtimeEndTime);

      if (!startTime) return;

      let [startHour, startMinute] = startTime.split(':');

      // Начало шкалы - 5:00
      let initiateHour = 5;

      showtime.style.left = ( parseInt(startHour) - initiateHour ) * 60 * 2 + parseInt(startMinute) * 2 + 'px';
    },

    setDropzonesWidth: function () {
      let times = document.querySelector('.times'),
          dropzones = document.querySelectorAll('.dropzone');

      let timesWidth = times.scrollWidth;

      for (let i = 0; i < dropzones.length; i++) {
        dropzones[i].style.width = timesWidth + 'px';
      }
    },

    init: function () {
      this.setDropzonesWidth();

      document.querySelector('.showtimes').scrollLeft = 300;
    }
  };

  h.init();
})();