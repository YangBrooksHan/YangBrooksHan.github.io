(function () {
  function isMobile() {
    return window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
  }

  function forceCollapse() {
    var nav = document.getElementById("site-nav");
    if (!nav) return;

    var visible = nav.querySelector(".visible-links");
    var hidden = nav.querySelector(".hidden-links");
    if (!visible || !hidden) return;

    // 语言切换按钮所在的 li（你现在第一个 li）
    var langItem = visible.querySelector("li.masthead__menu-item--lg") || visible.firstElementChild;

    // 先把 hidden 里的都清回 visible（避免重复/错乱）
    var hiddenItems = Array.prototype.slice.call(hidden.querySelectorAll("li"));
    hiddenItems.forEach(function (li) {
      visible.appendChild(li);
    });

    if (!isMobile()) return;

    // 手机端：把除语言切换以外的所有菜单项挪进 hidden-links
    var items = Array.prototype.slice.call(visible.children);
    items.forEach(function (li) {
      if (li !== langItem) hidden.appendChild(li);
    });
  }

  document.addEventListener("DOMContentLoaded", forceCollapse);
  window.addEventListener("resize", forceCollapse);
})();
