(function () {
  function removeHash() {
    if (history && history.replaceState) {
      history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }
  }

  function scrollToTarget(hash) {
    if (!hash || hash.charAt(0) !== "#") return;
    var id = hash.slice(1);
    var el = document.getElementById(id);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "start" });
    removeHash();
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a.js-scroll");
    if (!a) return;

    var target = a.getAttribute("data-target") || a.getAttribute("href");
    if (!target || target.charAt(0) !== "#") return;

    e.preventDefault();
    scrollToTarget(target);
  });

  // If user lands with a hash in URL, scroll then remove it.
  window.addEventListener("load", function () {
    if (window.location.hash) {
      var h = window.location.hash;
      removeHash();
      setTimeout(function () {
        scrollToTarget(h);
      }, 0);
    }
  });
})();
