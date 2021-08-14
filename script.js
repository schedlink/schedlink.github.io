function newDateAdjusted() {
  return new Date(Date.now() - 1000);
}

var curPeriodI = null;
var curLunchI = null;
var curTotalMin;

var now = newDateAdjusted();
var pageLoadDate = now.toISOString().split('T')[0];
var schedName = JSON_calendar[now.getMonth()][now.getDate() - 1];
var schedule = JSON_schedule[schedName];

var updateClockFrame = 0;

var displayData = {
  items: {
    timer: {value: '(unset)', elementId: 'countdown__timer'},
    periodName: {value: '(unset)', elementId: 'period__name'},
    periodTime: {value: '(unset)', elementId: 'period__time'}
  },
  paint: function() {
    var pList = Object.keys(displayData.items);
    for (var p of pList) {
      if (typeof(displayData[p]) != 'undefined' && this.items[p].value != displayData[p]) {
        document.getElementById(this.items[p].elementId).textContent = displayData[p];
        this.items[p].value = displayData[p];
      }
    }
  }
};

function updateClock() {
  var minsLeft;
  now = newDateAdjusted();
  curTotalMin = (now.getHours() * 60) + now.getMinutes();
  
  if (pageLoadDate != now.toISOString().split('T')[0]) {
    // new day
    window.location.reload();
    return;
  } else if (!schedule) {
    // invalid schedule
    minsLeft = 0;
    displayPeriod();
  } else if (curPeriodI !== null && curLunchI !== null) {
    // period with lunches
    minsLeft = (schedule[curPeriodI].lunches[curLunchI].EHours * 60)
        + schedule[curPeriodI].lunches[curLunchI].EMin - curTotalMin - 1;
  } else if (curPeriodI !== null) {
    // normal period
    minsLeft = (schedule[curPeriodI].EHours * 60)
        + schedule[curPeriodI].EMin - curTotalMin - 1;
  } else {
    minsLeft = 0;
    checkCurPeriod();
  }
  if (minsLeft < 0) {
    // period over
    checkCurPeriod();
  }
  
  if (curPeriodI === null) {
    displayData.timer = '--:--';
  } else {
    var hours = Math.floor(minsLeft / 60).toString();
    var minutes = (minsLeft % 60).toString();
    var seconds = (59 - now.getSeconds()).toString();
    hours = hours == '0' ? '' : hours + ':';
    // minutes = hours ? (minutes.padStart(2, '0') + ':') : minutes == '0' ? '' : (minutes + ':');
    minutes = hours ? (minutes.padStart(2, '0') + ':') : (minutes + ':');
    seconds = hours || minutes ? seconds.padStart(2, '0') : seconds;
    
    displayData.timer = hours + minutes + seconds;
  }
  displayData.paint();
  window.cancelAnimationFrame(updateClockFrame);
  updateClockFrame = window.requestAnimationFrame(updateClock);
}

function checkCurPeriod() {
  curPeriodI = checkTimeFrame(schedule);
  curLunchI = null;
  
  if (curPeriodI !== null && 'lunches' in schedule[curPeriodI]) {
    curLunchI = checkTimeFrame(schedule[curPeriodI].lunches);
  }

  displayPeriod();
}

// Gets the current period's index
function checkTimeFrame(sched) {
  for (let i = 0; i < sched.length; i++) {
    // If it is currently between the start and end of the period
    if ((sched[i].SHours * 60) + sched[i].SMin <= curTotalMin && curTotalMin < (sched[i].EHours * 60) + sched[i].EMin) {
      return i;
    }
  }
  return null;
}

// Display the period name and start/end times
function displayPeriod() {
  var periodToDisplay;
  if (curPeriodI === null) {
    // no period
    displayData.periodName = newDateAdjusted().toLocaleDateString();
    if (!schedule) {
      displayData.periodTime = 'Unknown Schedule';
      document.getElementById('splash__body').innerHTML = 'Unfortunately, this schedule was not set up in SchedLink Lite. Sorry!';
      document.getElementById('splash').style.background = 'pink';
    } else if (schedule[0].noTimer) {
      displayData.periodTime = (schedule[0].message || schedName);
      if (schedule[0].unprogrammed) {
        document.getElementById('splash__body').innerHTML = 'Unfortunately, this schedule was not set up in SchedLink Lite. Sorry!';
        document.getElementById('splash').style.background = 'pink';
      }
    } else {
      displayData.periodTime = 'Not School Hours';
    }
    displayData.paint();
    return;
  } else if (curLunchI !== null) {
    // lunch period
    periodToDisplay = schedule[curPeriodI].lunches[curLunchI];
  } else {
    // normal period
    periodToDisplay = schedule[curPeriodI];
  }
  var periodStart = (periodToDisplay.SHours % 24) + ':' + periodToDisplay.SMin.toString().padStart(2, '0');
  var periodEnd = (periodToDisplay.EHours % 24) + ':' + periodToDisplay.EMin.toString().padStart(2, '0');
  displayData.periodTime = periodStart + ' - ' + periodEnd;
  displayData.periodName = periodToDisplay.name;
  displayData.paint();
}
