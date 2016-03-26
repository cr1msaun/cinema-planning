(function () {
  "use strict";

  // Изменяем дату
  document.querySelector('.date-selector').onchange = function (e) {
    location.href = this.value;
  };

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
    let movieDuration = movie.parentNode.querySelector('.movie__duration').value,
        movieFormat = movie.parentNode.querySelector('.movie__format').value;

    let showtime = h.createShowtime(movie, movieDuration, movieFormat);

    moveAt(showtime, e);

    movie.parentNode.appendChild(showtime);

    function findDropzone(event) {
      showtime.hidden = true;
      var elem = document.elementFromPoint(event.clientX, event.clientY);
      showtime.hidden = false;

      if (elem === null) {
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

      let dropzone = findDropzone(event);

      if (dropzone) {
        dropzone.classList.add('dropzone-mod_active');
      } else {
        //document.querySelector('.dropzone-mod_active').classList.remove('dropzone-mod_active');
      }
    };

    showtime.onmouseup = function (event) {
      var dropzone = findDropzone(event);

      if (dropzone) {
        showtime.style.top = '0';
        showtime.style.left = '0';

        dropzone.appendChild(showtime);

        //showtime.hidden = true;
        h.promptStartTime(showtime);
        //showtime.hidden = false;

        showtime.onmouseup = null;
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
        initLeft = h.getPosition(showtime);

    document.onmousemove = function (e) {
        var curPos = e.pageX;

        var diff = curPos - initPos;

        //console.log(diff);
        //if (diff > 0)
        //  step += 10;
        //else
        //  step += -10;

        h.setPosition(showtime, initLeft + diff);
    };

    showtime.onmouseup = function (e) {
      let endPos = h.getPosition(showtime);

      h.setPosition(showtime, Math.round(endPos / 10) * 10);
      h.updateStartEndTime(showtime);

      document.onmousemove = null;
      showtime.onmouseup = null;
    };
  }

  function UpdateBreak(showtime, e) {
    let breakBar = showtime.querySelector('.break');

    var initMousePos = e.pageX;

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
    };
  }


  /*
  ** Helper functions
  */
  var h = {
    createShowtime: function (movie, duration, format) {
      let showtime = document.createElement('div');

      showtime.classList.add('showtime-container');
      showtime.innerHTML = '<div class="showtime">' +
                              '<b></b>' +
                              '<s></s>' +
                              '<em></em>' +
                              '<i></i>' +
                           '</div>' +
                           '<div class="break">' +
                              '' +
                           '</div>';

      showtime.querySelector('b').textContent = movie.textContent; // выставляем название фильма

      this.setDuration(showtime, duration); // выставляем хронометраж
      this.setFormat(showtime, format); // выставляем формат
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

    getFormat: function (showtime) {
      return showtime.dataset.format;
    },

    setFormat: function (showtime, format) {
      showtime.dataset.format = format;
      showtime.querySelector('em').textContent = format;
    },

    setBreak: function (showtime) {
      let duration = h.getDuration(showtime),
          breakTime;

      if (duration % 5 !== 0) {
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
      let hours = Math.floor((position + (60 * 2) * 5) / (60 * 2));
      let minutes = (position % (60 * 2)) / 2;

      if (hours >= 24)
        hours = hours - 24;

      if (hours < 10)
        hours = '0' + hours;

      if (minutes < 10)
        minutes = '0' + minutes;

      return hours + ':' + minutes;
    },

    getFullDuration: function (showtime) {
      return h.getDuration(showtime) + h.getBreak(showtime); // TODO: make proper method
    },

    getPositionByTime: function (time) {
      // Начало шкалы - 5:00
      let initiateHour = 5;
      let [hours, minutes] = time.split(':');

      hours = parseInt(hours);
      minutes = parseInt(minutes);

      if (hours <= 4)
        hours = hours + 24;

      return (hours - initiateHour) * (60 * 2) + minutes * 2;
    },

    getPosition: function (showtime) {
      return parseInt(showtime.style.left);
    },

    setPosition: function (showtime, newValue) {
      showtime.style.left = newValue + 'px';
    },

    getStartTime: function (showtime) {
      return showtime.dataset.startTime;
    },

    setStartTime: function (showtime, time) {
      let startTime = time;
      let startTimePos = h.getPositionByTime(time);

      showtime.dataset.startTime = startTime;
      showtime.querySelector('s').textContent = startTime;

      h.setPosition(showtime, startTimePos);
    },

    // устанавливает время начала и конца сеанса
    setEndTime: function (showtime) {
      let duration = h.getDuration(showtime);

      let startTime = h.getPosition(showtime);
      let endTime   = h.getTimeByPosition(startTime + duration * 2);
      
      showtime.dataset.endTime = endTime;
      showtime.querySelector('i').textContent = endTime;
    },

    updateStartEndTime: function(showtime) {
      h.setStartTime(showtime, h.getTimeByPosition(h.getPosition(showtime)));
      h.setEndTime(showtime);
    },

    // устанавливает время окончания последнего сеанса
    getLastShowtimeEndTime: function (showtime) {
      let lastShowtime = showtime.closest('.dropzone').querySelector('.showtime-container:nth-last-child(2)');

      if (!lastShowtime) return 0;

      return h.getTimeByPosition(h.getPosition(lastShowtime) + h.getFullDuration(lastShowtime) * 2);
    },

    promptStartTime: function (showtime) {
      let lastShowtimeEndTime = h.getLastShowtimeEndTime(showtime) || '09:00';

      let startTime = prompt('Введите время начала сеанса', lastShowtimeEndTime);

      if (!startTime) return;

      h.setStartTime(showtime, startTime);
      h.setEndTime(showtime);
    },

    setDropzonesWidth: function () {
      let times = document.querySelector('.times'),
          dropzones = document.querySelectorAll('.dropzone');

      let timesWidth = times.scrollWidth;

      for (let i = 0; i < dropzones.length; i++) {
        dropzones[i].style.width = timesWidth + 'px';
      }
    },

    arrangeShowtimes: function() {
      let halls = document.querySelectorAll('.dropzone');

      for (let i = 0; i < halls.length; i++) {
        let hall = halls[i];
        let showtimes = hall.querySelectorAll('.showtime-container');

        for (let j = 0; j < showtimes.length; j++) {
          let showtime = showtimes[j];

          h.setPosition(showtime, h.getPositionByTime(h.getStartTime(showtime))); // выставляем позицию

          h.setDuration(showtime, h.getDuration(showtime)); // выставляем хронометраж
          h.setEndTime(showtime); // выставляем окончание фильма
          h.setFormat(showtime, h.getFormat(showtime)); // выставляем формат
          h.updateBreak(showtime, h.getBreak(showtime)); // выставляем перерыв
        }
      }
    },

    init: function () {
      this.setDropzonesWidth();

      document.querySelector('.showtimes').scrollLeft = 300;

      this.arrangeShowtimes();
    }
  };

  h.init();
  window.h = h;
})();