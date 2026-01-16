let clock = document.querySelector(".clock");
for (var i = 0; i < 360; i += 30) {
  let spike = document.createElement("span");
  spike.className = "spike";
  spike.style.transform = `rotate(${i}deg) translateY(-100px)`;
  clock.appendChild(spike);
}
const interval = setInterval(() => {
  var date = new Date();
  let secondsPoint = document.querySelector(".seconds");
  let minutesPoint = document.querySelector(".minutes");
  let hoursPoint = document.querySelector(".hours");
  let datePoint = document.querySelector(".date");

  let secPosition = date.getSeconds() * 6;
  let minPosition = date.getMinutes() * 6;
  let hourPosition = date.getHours() * 30;

  let dayArray = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  datePoint.innerHTML = dayArray[date.getDay()] + " " + date.getDate();

  if (secPosition == 0) {
    secondsPoint.style.transition = "none";
    datePoint.style.transition = "none";
  } else {
    secondsPoint.style.transition = "0.25s";
    datePoint.style.transition = "0.25s";
  }
  if (minPosition == 0) {
    minutesPoint.style.transition = "none";
  } else {
    minutesPoint.style.transition = "0.25s";
  }
  secondsPoint.style.transform = `rotate(${secPosition}deg) translateY(-84px)`;
  minutesPoint.style.transform = `rotate(${minPosition - 180}deg) `;
  hoursPoint.style.transform = `rotate(${hourPosition - 180}deg) `;
  datePoint.style.transform = `rotate(${
    secPosition - 180
  }deg) translateY(-84px)`;
}, 1000);