// Service data
const services = [
  {
    id: 1,
    title: "Rhinoplasty",
    description: "Lorem Ipsum Is Simply Dummy Text Of The Printing.",
    imageUrl: "./assets/images/rhinoplasty.png",
    iconPath: "./assets/icons/rhinoplasty.svg",
  },
  {
    id: 2,
    title: "Botox Injection",
    description: "Lorem Ipsum Is Simply Dummy Text Of The Printing.",
    imageUrl: "./assets/images/beautician.jpg",
    iconPath: "./assets/icons/botox.svg",
  },
  {
    id: 3,
    title: "Body Shaping",
    description: "Lorem Ipsum Is Simply Dummy Text Of The Printing.",
    imageUrl: "./assets/images/body-shaping.png",
    iconPath: "./assets/icons/body.svg",
  },
  {
    id: 4,
    title: "Body Shaping",
    description: "Lorem Ipsum Is Simply Dummy Text Of The Printing.",
    imageUrl: "./assets/images/rhinoplasty.png",
    iconPath: "./assets/icons/rhinoplasty.svg",
  },
  {
    id: 5,
    title: "Botox Injection",
    description: "Lorem Ipsum Is Simply Dummy Text Of The Printing.",
    imageUrl: "./assets/images/beautician.jpg",
    iconPath: "./assets/icons/botox.svg",
  },
  {
    id: 6,
    title: "Body Shaping",
    description: "Lorem Ipsum Is Simply Dummy Text Of The Printing.",
    imageUrl: "./assets/images/body-shaping.png",
    iconPath: "./assets/icons/body.svg",
  },
];

// Function to create a service card
function createServiceCard(service) {
  return `
        <div class="relative rounded-2xl h-full  group pb-24">
          <img
            src="${service.imageUrl}"
            alt="${service.title} procedure"
            class="w-full h-[452px] object-cover shadow-md rounded-2xl"
          />
          <div class="absolute bottom-4 left-4 right-4 bg-white p-5 rounded-2xl shadow-lg">
            <div class="flex items-start mb-2">
              <div class="p-2  mr-3">
               <img
            src="${service.iconPath}"
            alt="${service.title} procedure"
            class="w-8 h-8"
                />
                 </div>

          <div class="flex flex-col space-y-1">
           <h3 class="text-2xl font-semibold cormorant">${service.title}</h3>
           <p class="text-[#828282] text-sm font-medium mb-3">
              ${service.description}
            </p>
                <a
              href="#"
              class="inline-flex items-center text-primary font-medium text-base flex item-center hover:text-teal-600 transition-colors"
            >
              Explore Service
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </a>
            
              </div>
             
            </div>
           
           
          </div>
        </div>
      `;
}

// When the DOM is loaded, render the service cards
// document.addEventListener("DOMContentLoaded", function () {
//   const container = document.getElementById("services-container");

//   // Clear existing content (if any)
//   container.innerHTML = "";

//   // Generate and append each service card
//   services.forEach((service) => {
//     const cardHTML = createServiceCard(service);
//     container.insertAdjacentHTML("beforeend", cardHTML);
//   });
// });

// Physician data
const physicians = [
  {
    id: 1,
    name: "Dr. Allison Skye",
    title: "Dermatology Director",
    imageUrl: "./assets/images/dr1.png",
    iconPath: "./assets/icons/physician.svg", // Assuming you have an icon for physicians
  },
  {
    id: 2,
    name: "Dermi Bella",
    title: "Cosmetic Dermatology",
    imageUrl: "./assets/images/dr2.png",
    iconPath: "./assets/icons/physician.svg",
  },
  {
    id: 3,
    name: "Olivia Wellton",
    title: "Skincare Specialist",
    imageUrl: "./assets/images/dr3.png",
    iconPath: "./assets/icons/physician.svg",
  },
];

// Function to create a physician card (matching the service card style)
function createPhysicianCard(physician) {
  return `
    <div class="relative rounded-2xl h-full group pb-10">
    
    <div class="bg-white rounded shadow-[1px_1px_15px_0px_rgba(0,0,0,0.1)] shadow-[-1px_-1px_15px_0px_rgba(0,0,0,0.1)] px-6 py-8 relative">
      <img
        src="${physician.imageUrl}"
        alt="${physician.name}"
        class="w-full h-[452px] object-cover "
      />
       </div>
        <div class="max-w-[315px] absolute bottom-3 left-0 right-4 bg-white py-4 px-6  shadow-[2px_2px_6px_0px_rgba(0,0,0,0.1)] shadow-[-2px_0px_6px_0px_rgba(0,0,0,0.12)]">
          <div class="flex flex-col space-y-1">
            <h3 class="text-2xl font-semibold cormorant text-primary">${physician.name}</h3>
            <p class="text-[#828282] text-sm font-medium">
              ${physician.title}
            </p>
        </div>
      </div>
    </div>
  `;
}

// When the DOM is loaded, render both service and physician cards
document.addEventListener("DOMContentLoaded", function () {
  // Render services
  const servicesContainer = document.getElementById("services-container");
  servicesContainer.innerHTML = "";
  services.forEach((service) => {
    const cardHTML = createServiceCard(service);
    servicesContainer.insertAdjacentHTML("beforeend", cardHTML);
  });

  // Render physicians
  const physiciansContainer = document.getElementById("physicians-grid");
  physiciansContainer.innerHTML = "";
  physicians.forEach((physician) => {
    const cardHTML = createPhysicianCard(physician);
    physiciansContainer.insertAdjacentHTML("beforeend", cardHTML);
  });
});

// for review swipe
document.addEventListener("DOMContentLoaded", function () {
  const cards = document.querySelectorAll(".testimonial-card");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const indicators = document.querySelectorAll("#indicator-container button");

  let currentIndex = 0;
  const cardCount = cards.length;

  // Function to update the visible card
  function updateCards() {
    cards.forEach((card, index) => {
      if (index === currentIndex) {
        card.classList.remove("opacity-0", "pointer-events-none");
        card.style.transform = "translateX(0)";
        card.style.zIndex = "10";
      } else if (index < currentIndex) {
        card.classList.add("opacity-0", "pointer-events-none");
        card.style.transform = "translateX(-100%)";
        card.style.zIndex = "1";
      } else {
        card.classList.add("opacity-0", "pointer-events-none");
        card.style.transform = "translateX(100%)";
        card.style.zIndex = "1";
      }
    });

    // Update indicators
    indicators.forEach((indicator, index) => {
      if (index === currentIndex) {
        indicator.classList.remove("bg-gray-300");
        indicator.classList.add("bg-teal-500");
      } else {
        indicator.classList.remove("bg-teal-500");
        indicator.classList.add("bg-gray-300");
      }
    });
  }

  // Event listeners for navigation buttons
  prevBtn.addEventListener("click", function () {
    currentIndex = (currentIndex - 1 + cardCount) % cardCount;
    updateCards();
  });

  nextBtn.addEventListener("click", function () {
    currentIndex = (currentIndex + 1) % cardCount;
    updateCards();
  });

  // Event listeners for indicators
  indicators.forEach((indicator, index) => {
    indicator.addEventListener("click", function () {
      currentIndex = index;
      updateCards();
    });
  });

  // Touch events for mobile swiping
  const container = document.getElementById("testimonial-container");
  let touchStartX = 0;
  let touchEndX = 0;

  container.addEventListener("touchstart", function (e) {
    touchStartX = e.changedTouches[0].screenX;
  });

  container.addEventListener("touchend", function (e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });

  function handleSwipe() {
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) {
      // Swipe left - go to next card
      currentIndex = (currentIndex + 1) % cardCount;
      updateCards();
    } else if (touchEndX > touchStartX + swipeThreshold) {
      // Swipe right - go to previous card
      currentIndex = (currentIndex - 1 + cardCount) % cardCount;
      updateCards();
    }
  }

  // Auto-play functionality
  let autoplayInterval;

  function startAutoplay() {
    autoplayInterval = setInterval(function () {
      currentIndex = (currentIndex + 1) % cardCount;
      updateCards();
    }, 5000); // Change card every 5 seconds
  }

  function stopAutoplay() {
    clearInterval(autoplayInterval);
  }

  // Start autoplay
  // startAutoplay();

  // Pause autoplay on hover or touch
  container.addEventListener("mouseenter", stopAutoplay);
  container.addEventListener("touchstart", stopAutoplay);

  // Resume autoplay when mouse leaves
  // container.addEventListener("mouseleave", startAutoplay);

  // Initialize the cards
  updateCards();
});
