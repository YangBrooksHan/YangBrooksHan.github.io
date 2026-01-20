(function () {
  function scrollToHash(hash) {
    if (!hash || hash.charAt(0) !== "#") return;
    var id = hash.slice(1);
    var el = document.getElementById(id);
    if (!el) return;

    // 平滑滚动
    el.scrollIntoView({ behavior: "smooth", block: "start" });

    // 关键：去掉地址栏的 #xxx
    if (history && history.replaceState) {
      history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a.js-scroll");
    if (!a) return;

    var target = a.getAttribute("data-target") || a.getAttribute("href");
    if (!target || target.charAt(0) !== "#") return;

    e.preventDefault();
    scrollToHash(target);
  });

  // 可选：如果用户手动打开 /en/#xxx，也能滚动后自动清掉 hash
  window.addEventListener("load", function () {
    if (window.location.hash) {
      var h = window.location.hash;
      scrollToHash(h);
    }
  });
})();
