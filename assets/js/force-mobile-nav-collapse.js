document.addEventListener("DOMContentLoaded", function () {
  var nav = document.getElementById("site-nav");
  if (!nav) return;

  var btn = nav.querySelector("button.nav-toggle");
  if (!btn) return;

  btn.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  // Close menu when clicking a link (mobile UX)
  nav.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (!a) return;
    if (nav.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    }
  });
});
