// region login
// login.js
$(document).ready(function () {
  // Redirect if already logged in
  auth.redirectIfAuthenticated();

  $("form").submit(function (e) {
    e.preventDefault();

    const email = $("#email").val();
    const password = $("#password").val();

    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }

    // Set button to loading state
    const $btn = $('button[type="submit"]');
    $btn.html('<span class="spinner">Loading...</span>').prop("disabled", true);

    $.ajax({
      url: `${window.appConfig.API_BASE_URL}/doctor/signin`,
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({ email, password }),
      success: function (response) {
        // Store authentication data
        localStorage.setItem("doctorToken", response.token);
        localStorage.setItem("doctorData", JSON.stringify(response));

        // Set up auth headers
        auth.setupAuthHeaders();

        // Redirect to admin dashboard
        window.location.href = "/admin/overview.html";
      },
      error: function (xhr) {
        const errorMsg =
          xhr.responseJSON?.message || "Login failed. Please try again.";
        alert(errorMsg);
      },
      complete: function () {
        $btn.html("Sign In").prop("disabled", false);
      },
    });
  });
});
// endregion login

// region logout
function logout() {
  localStorage.removeItem("doctorToken");
  localStorage.removeItem("doctorData");
  window.location.href = "/login.html";
}

// Add click handler to logout button
$("#logout-btn").click(logout);
// endregion logout
