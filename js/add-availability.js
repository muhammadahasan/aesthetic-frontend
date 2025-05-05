// modules/availability-manager.js

// State management (closure-based)
const availabilityManager = (function () {
  // Private state
  let slots = [];
  let selectedDate = new Date().toISOString().split("T")[0];

  // DOM elements
  const elements = {
    dateInput: null,
    todayBtn: null,
    slotGrid: null,
    addBtn: null,
    dateDisplay: null,
  };

  // Initialize the module
  function init() {
    // Cache DOM elements
    elements.dateInput = document.querySelector("[data-availability-date]");
    elements.todayBtn = document.querySelector("[data-today-btn]");
    elements.slotGrid = document.querySelector("[data-slot-grid]");
    elements.addBtn = document.querySelector("[data-add-btn]");
    elements.dateDisplay = document.querySelector("[data-date-display]");

    if (!validateElements()) {
      console.error("Availability Manager: Required DOM elements not found");
      return;
    }

    // Set up event handlers
    bindEvents();

    // Load initial data
    elements.dateInput.value = selectedDate;
    updateDateDisplay();
    loadAvailability();
  }

  // Validate all required elements exist
  function validateElements() {
    return Object.values(elements).every((el) => el !== null);
  }

  // Bind event listeners
  function bindEvents() {
    // Date change handler
    elements.dateInput.addEventListener("change", (e) => {
      selectedDate = e.target.value;
      updateDateDisplay();
      loadAvailability();
    });

    // Today button handler
    elements.todayBtn.addEventListener("click", () => {
      selectedDate = new Date().toISOString().split("T")[0];
      elements.dateInput.value = selectedDate;
      updateDateDisplay();
      loadAvailability();
    });

    // Save button handler
    elements.addBtn.addEventListener("click", saveAvailability);

    // Event delegation for slot grid
    elements.slotGrid.addEventListener("click", (e) => {
      // Handle delete button click
      if (e.target.classList.contains("delete-slot")) {
        const slot = e.target.parentElement.dataset.slot;
        removeSlot(slot);
        e.stopPropagation();
        return;
      }

      // Handle slot button click
      const slotBtn = e.target.closest(".slot-btn");
      if (slotBtn) {
        const slot = slotBtn.dataset.slot;
        toggleSlot(slot);
      }
    });
  }

  // Update the date display with formatted date
  function updateDateDisplay() {
    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    elements.dateDisplay.textContent = new Date(
      selectedDate
    ).toLocaleDateString("en-US", options);
  }

  // Load availability data from API
  async function loadAvailability() {
    try {
      showLoadingState();
      const response = await fetchAvailability();
      slots = response.slots || [];
      renderSlots();
    } catch (error) {
      console.error("Error loading availability:", error);
      showErrorState("Failed to load availability data");
    }
  }

  // Show loading state in slot grid
  function showLoadingState() {
    elements.slotGrid.innerHTML = `
        <div class="col-span-full text-center py-6">
          <div class="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          <p class="mt-2 text-gray-600">Loading slots...</p>
        </div>
      `;
  }

  // Show error state in slot grid
  function showErrorState(message) {
    elements.slotGrid.innerHTML = `
        <div class="col-span-full text-center py-6">
          <div class="text-red-500 mb-2">⚠️</div>
          <p class="text-red-500">${message}</p>
          <button class="mt-2 text-blue-500 hover:underline" onclick="availabilityManager.retry()">Try Again</button>
        </div>
      `;
  }

  // Fetch availability data from API
  async function fetchAvailability() {
    const doctorId =
      JSON.parse(localStorage.getItem("doctorData"))?._id ||
      "68120aba8af2c0b4edeb5a5a";
    const params = new URLSearchParams({
      doctorId: doctorId,
      date: selectedDate,
    });

    const res = await fetch(
      `${window.appConfig.API_BASE_URL}/doctor/get-availability?${params}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("doctorToken")}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    return await res.json();
  }

  // Generate all possible time slots
  function generateTimeSlots(start, end, interval) {
    const slots = [];
    let current = new Date(`1970-01-01T${start}:00`);
    const endTime = new Date(`1970-01-01T${end}:00`);

    while (current < endTime) {
      const startStr = current.toTimeString().substring(0, 5);
      current.setMinutes(current.getMinutes() + interval);

      // Don't add a slot if we've gone past the end time
      if (current > endTime) break;

      const endStr = current.toTimeString().substring(0, 5);
      slots.push(`${startStr}-${endStr}`);
    }

    return slots;
  }

  // Render all slots to the grid
  function renderSlots() {
    elements.slotGrid.innerHTML = "";

    // Generate all possible 45-min slots from 9:00 to 20:00
    const allSlots = generateTimeSlots("09:00", "20:00", 45);

    // Create a document fragment for better performance
    const fragment = document.createDocumentFragment();

    allSlots.forEach((slot) => {
      const isBooked = slots.includes(slot);
      const slotEl = document.createElement("button");

      // Set slot properties
      slotEl.className = `slot-btn ${
        isBooked
          ? "booked bg-[#405570] text-white"
          : "available bg-gray-200 hover:bg-gray-300"
      } rounded p-2 relative text-sm`;
      slotEl.textContent = formatSlotTime(slot);
      slotEl.dataset.slot = slot;

      // Add delete button for booked slots
      if (isBooked) {
        const deleteIcon = document.createElement("span");
        deleteIcon.className =
          "delete-slot absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600";
        deleteIcon.innerHTML = "&times;";
        slotEl.appendChild(deleteIcon);
      }

      fragment.appendChild(slotEl);
    });

    elements.slotGrid.appendChild(fragment);
  }

  // Format slot time for display (e.g., "0900-0945" to "09:00 - 09:45")
  function formatSlotTime(slot) {
    return slot.replace(
      /(\d{2})(\d{2})-(\d{2})(\d{2})/,
      (_, h1, m1, h2, m2) => `${h1}:${m1} - ${h2}:${m2}`
    );
  }

  // Toggle a slot's booking status
  function toggleSlot(slot) {
    if (slots.includes(slot)) {
      slots = slots.filter((s) => s !== slot);
    } else {
      slots.push(slot);
      // Sort slots chronologically
      slots.sort();
    }
    renderSlots();
  }

  // Remove a slot and save changes
  async function removeSlot(slot) {
    slots = slots.filter((s) => s !== slot);
    await saveAvailability();
  }

  // Save availability data to API
  async function saveAvailability() {
    try {
      // Show saving state
      elements.addBtn.disabled = true;
      elements.addBtn.textContent = "Saving...";
      elements.addBtn.classList.add("opacity-75");

      const doctorId =
        JSON.parse(localStorage.getItem("doctorData"))?._id ||
        "68120aba8af2c0b4edeb5a5a";

      const response = await fetch(
        `${window.appConfig.API_BASE_URL}/doctor/update-availability`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("doctorToken")}`,
          },
          body: JSON.stringify({
            doctorId: doctorId,
            date: selectedDate,
            slots: slots,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Show success feedback
      showToast("Availability updated successfully", "success");

      // Refresh slots display
      renderSlots();
    } catch (error) {
      console.error("Error saving availability:", error);
      showToast("Failed to update availability", "error");
    } finally {
      // Reset button state
      elements.addBtn.disabled = false;
      elements.addBtn.textContent = "SAVE CHANGES";
      elements.addBtn.classList.remove("opacity-75");
    }
  }

  // Show toast notification
  function showToast(message, type = "info") {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      toastContainer.className = "fixed bottom-4 right-4 z-50";
      document.body.appendChild(toastContainer);
    }

    // Determine toast color
    const bgColor =
      {
        success: "bg-green-500",
        error: "bg-red-500",
        info: "bg-blue-500",
      }[type] || "bg-blue-500";

    // Create toast element
    const toastId = `toast-${Date.now()}`;
    const toast = document.createElement("div");
    toast.id = toastId;
    toast.className = `${bgColor} text-white rounded px-4 py-3 mb-3 shadow-lg flex items-center justify-between`;
    toast.style.minWidth = "280px";
    toast.style.transform = "translateX(400px)";
    toast.style.opacity = "0";
    toast.style.transition = "all 0.3s ease-out";

    // Toast content
    toast.innerHTML = `
        <span>${message}</span>
        <button class="ml-4 text-white hover:text-gray-200 font-bold">×</button>
      `;

    // Add to container
    toastContainer.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = "translateX(0)";
      toast.style.opacity = "1";
    }, 10);

    // Set up dismissal
    toast.querySelector("button").addEventListener("click", () => {
      dismissToast(toastId);
    });

    // Auto dismiss
    setTimeout(() => {
      dismissToast(toastId);
    }, 5000);
  }

  // Dismiss toast animation
  function dismissToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
      toast.style.transform = "translateX(400px)";
      toast.style.opacity = "0";
      setTimeout(() => {
        toast.remove();
      }, 300);
    }
  }

  // Retry loading availability
  function retry() {
    loadAvailability();
  }

  // Public API
  return {
    init,
    retry,
  };
})();

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", availabilityManager.init);

// Make it globally accessible but with limited API
window.availabilityManager = availabilityManager;
