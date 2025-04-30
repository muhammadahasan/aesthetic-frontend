// auth.js - Authentication utilities
function isAuthenticated() {
  return localStorage.getItem("doctorToken") !== null;
}

/**
 * Gets the current user's data
 */
function getUserData() {
  const userData = localStorage.getItem("doctorData");
  if (!userData) return null;
  try {
    return JSON.parse(userData);
  } catch (e) {
    return null;
  }
}

/**
 * Redirects to login if not authenticated
 */
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = "/admin/login.html";
    return false;
  }
  return true;
}

/**
 * Redirects if user is already authenticated
 */
function redirectIfAuthenticated() {
  if (isAuthenticated()) {
    window.location.href = "/admin/overview.html";
  }
}

// Set up axios/jQuery with auth token
function setupAuthHeaders() {
  const token = localStorage.getItem("doctorToken");
  if (token) {
    // For jQuery
    $.ajaxSetup({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // If using axios:
    // axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}

// Make functions available globally
window.auth = {
  isAuthenticated,
  getUserData,
  requireAuth,
  redirectIfAuthenticated,
  setupAuthHeaders,
};

// Initialize auth headers when loaded
setupAuthHeaders();
