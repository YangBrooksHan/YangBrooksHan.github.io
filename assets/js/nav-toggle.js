(function () {
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var nav = document.getElementById("site-nav");
    if (!nav) return;

    var btn = nav.querySelector("button");
    if (!btn) return;

    // toggle menu
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      nav.classList.toggle("is-open");
    });

    // close on link click (mobile)
    nav.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a) return;
      nav.classList.remove("is-open");
    });

    // close when clicking outside
    document.addEventListener("click", function (e) {
      if (!nav.contains(e.target)) nav.classList.remove("is-open");
    });
  });
})();
