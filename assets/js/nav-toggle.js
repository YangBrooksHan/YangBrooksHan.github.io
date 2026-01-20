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

    var justToggled = false;

    function openCloseToggle(e) {
      // 移动端常见：pointer/touch + click 双触发，必须拦截
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      nav.classList.toggle("is-open");

      justToggled = true;
      window.setTimeout(function () {
        justToggled = false;
      }, 350);
    }

    // 兼容 click + touch/pointer
    btn.addEventListener("click", openCloseToggle, { passive: false });
    btn.addEventListener("touchstart", openCloseToggle, { passive: false });
    btn.addEventListener("pointerdown", function (e) {
      // 防止 pointerdown 冒泡导致“外部点击关闭”立即触发
      e.preventDefault();
      e.stopPropagation();
    });

    // 点击菜单项后关闭（仅当点到 <a>）
    nav.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a) return;
      nav.classList.remove("is-open");
    });

    // 点击外部关闭（用 pointerdown 更可靠）
    document.addEventListener(
      "pointerdown",
      function (e) {
        if (justToggled) return;
        if (!nav.contains(e.target)) nav.classList.remove("is-open");
      },
      { passive: true }
    );

    // 兜底：有些浏览器不会触发 pointerdown
    document.addEventListener(
      "click",
      function (e) {
        if (justToggled) return;
        if (!nav.contains(e.target)) nav.classList.remove("is-open");
      },
      { passive: true }
    );
  });
})();
