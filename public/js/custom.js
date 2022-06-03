document.addEventListener("DOMContentLoaded", function (event) {

  const showNavbar = (toggleId, navId, bodyId, headerId) => {
    const toggle = document.getElementById(toggleId),
      nav = document.getElementById(navId),
      bodypd = document.getElementById(bodyId),
      headerpd = document.getElementById(headerId)

    // Validate that all variables exist
    if (toggle && nav && bodypd && headerpd) { 
      toggle.addEventListener('click', () => {
        // show navbar
        nav.classList.toggle('show1')
        // change icon
        toggle.classList.toggle('bx-x')
        // add padding to body
        bodypd.classList.toggle('body-pd')
        // add padding to header
        headerpd.classList.toggle('body-pd')
      })
    }
  }

  showNavbar('header-toggle', 'nav-bar', 'body-pd', 'header')

  /*===== LINK ACTIVE =====*/
  // const linkColor = document.querySelectorAll('.nav_link')

  // function colorLink() {
  //   if (linkColor) {
  //     linkColor.forEach(l => l.classList.remove('active'))
  //     this.classList.add('active')
  //   }
  // }
  // linkColor.forEach(l => l.addEventListener('click', colorLink))

  // Your code to run since DOM is loaded and ready
});


// sidebar for small screen
let toggle = document.getElementById('s-menu');
let nav = document.getElementById('nav-bar');
let body_pd = document.getElementById('body-pd');
const toggle1 = document.getElementById('header-toggle');
let header1 = document.getElementById('header');
toggle.addEventListener('click', () => {
  // show navbar
  nav.classList.toggle('show1');
  body_pd.style.paddingLeft = 0;
  header1.style.paddingLeft = 0;
  toggle1.classList.toggle('bx-x');
})


// student pie chart
var ctx2 = document.getElementById("myBarChart");

var myBarChart = new Chart(ctx2, {
  type: 'doughnut',
  data: {
    labels: ["2017", "2018"],
    datasets: [{
      label: '', //data lables text______________________________-
      data: [8, 4],
      backgroundColor: [
        '#3b3b3b',
        '#ffb606',
      ],
      borderColor: [
        '#3b3b3b',
        '#ffb606',
      ],
      borderWidth: 5
    }]
  },
  options: {
    responsive: false,
    cutout : 60,
    plugins: {
      legend: {
        display: true,
        onClick: null,
        labels: {
          color: 'rgb(255, 99, 132)',
          boxWidth: 10,
          padding: 30
        },
        position : 'right',
      },     
    },
    scales: {
      xAxes: [{
        ticks: {
          maxRotation: 90,
          minRotation: 80
        },
        gridLines: {
          offsetGridLines: true // à rajouter
        }
      },
      {
        position: "top",
        ticks: {
          maxRotation: 90,
          minRotation: 80
        },
        gridLines: {
          offsetGridLines: true // et matcher pareil ici
        }
      }],
      yAxes: [{
        ticks: {
          beginAtZero: true
        }
      }]
    }
  }
});




// student pie chart
var ctx2 = document.getElementById("adminBarChart");

var myBarChart = new Chart(ctx2, {
  type: 'doughnut',
  data: {
    labels: ["Derivative Analysis", "Technical Analysis", "Algo Bascis", "Algo Advance"],
    datasets: [{
      label: '', //data lables text______________________________-
      data: [8, 9, 18, 10],
      backgroundColor: [
        '#3b3b3b',
        '#ffb606',
        '#dd9d25',
        '#fff002' 
      ],
      borderColor: [
        '#3b3b3b',
        '#ffb606',
        '#dd9d25',
        '#fff002' 
      ],
      borderWidth: 5
    }]
  },
  options: {
    responsive: false,
    cutout : 60,
    plugins: {
      legend: {
        display: true,
        onClick: null,
        labels: {
          color: 'rgb(255, 99, 132)',
          boxWidth: 10,
          padding: 30
        },
        position : 'right',
      },     
    },
    scales: {
      xAxes: [{
        ticks: {
          maxRotation: 90,
          minRotation: 80
        },
        gridLines: {
          offsetGridLines: true // à rajouter
        }
      },
      {
        position: "top",
        ticks: {
          maxRotation: 90,
          minRotation: 80
        },
        gridLines: {
          offsetGridLines: true // et matcher pareil ici
        }
      }],
      yAxes: [{
        ticks: {
          beginAtZero: true
        }
      }]
    }
  }
});








// calender
const date = new Date();

const renderCalendar = () => {
  date.setDate(1);

  const monthDays = document.querySelector(".days");

  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDate();

  const prevLastDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    0
  ).getDate();

  const firstDayIndex = date.getDay();

  const lastDayIndex = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDay();

  const nextDays = 7 - lastDayIndex - 1;

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  document.querySelector(".date h1").innerHTML = months[date.getMonth()];

  document.querySelector(".date p").innerHTML = new Date().toDateString();

  let days = "";

  for (let x = firstDayIndex; x > 0; x--) {
    days += `<div class="prev-date">${prevLastDay - x + 1}</div>`;
  }

  for (let i = 1; i <= lastDay; i++) {
    if (
      i === new Date().getDate() &&
      date.getMonth() === new Date().getMonth()
    ) {
      days += `<div class="today">${i}</div>`;
    } else {
      days += `<div>${i}</div>`;
    }
  }

  for (let j = 1; j <= nextDays; j++) {
    days += `<div class="next-date">${j}</div>`;
    monthDays.innerHTML = days;
  }
};

document.querySelector(".prev").addEventListener("click", () => {
  date.setMonth(date.getMonth() - 1);
  renderCalendar();
});

document.querySelector(".next").addEventListener("click", () => {
  date.setMonth(date.getMonth() + 1);
  renderCalendar();
});

renderCalendar();



// grid-4 hover effects
(function () {
  const buttons = document.querySelectorAll(".btn-posnawr");

  buttons.forEach(button => {
    ["mouseenter", "mouseout"].forEach(evt => {
      button.addEventListener(evt, e => {
        let parentOffset = button.getBoundingClientRect(),
          relX = e.pageX - parentOffset.left,
          relY = e.pageY - parentOffset.top;

        const span = button.getElementsByTagName("span");

        span[0].style.top = relY + "px";
        span[0].style.left = relX + "px";
      });
    });
  });
})();

// originally forked from https://codepen.io/kkick/pen/oWZMov


