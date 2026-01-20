(function () {
  function getOffset() { return 20; }

  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;

    var href = a.getAttribute("href");
    if (!href || href === "#") return;

    var id = href.slice(1);
    var target = document.getElementById(id);
    if (!target) return;

    // Block any other handlers (including theme/jQuery smoothScroll)
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

    var rect = target.getBoundingClientRect();
    var top = window.pageYOffset + rect.top - getOffset();
    window.scrollTo({ top: top, behavior: "smooth" });

    // Ensure URL has no hash
    if (history.replaceState) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, true); // IMPORTANT: capture phase
})();
