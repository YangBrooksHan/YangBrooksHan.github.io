(function () {
  function getHeaderOffset() {
    // Minimal Mistakes masthead height compensation
    var masthead = document.querySelector(".masthead");
    return masthead ? masthead.offsetHeight + 8 : 0;
  }

  function scrollToId(id) {
    var el = document.getElementById(id);
    if (!el) return;

    var top = el.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset();
    window.scrollTo({ top: top, behavior: "smooth" });
  }

  function clearHash() {
    // Keep pathname (/ or /en/) without #...
    history.replaceState(null, document.title, window.location.pathname + window.location.search);
  }

  // Intercept clicks on in-page anchors
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;

    var href = a.getAttribute("href");
    if (!href || href === "#") return;

    var id = href.slice(1);
    if (!id) return;

    var target = document.getElementById(id);
    if (!target) return;

    e.preventDefault();
    scrollToId(id);
    // remove hash from address bar
    setTimeout(clearHash, 50);
  });

  // If user lands with a hash (e.g., /en/#-gzjl), scroll then clear it
  window.addEventListener("load", function () {
    if (!window.location.hash) return;
    var id = window.location.hash.slice(1);
    if (!id) return;

    var target = document.getElementById(id);
    if (!target) return;

    scrollToId(id);
    setTimeout(clearHash, 50);
  });
})();
