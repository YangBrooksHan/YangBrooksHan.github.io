document.addEventListener("DOMContentLoaded", function () {
  var nav = document.getElementById("site-nav");
  if (!nav) return;

  // 兼容：button 可能没有 nav-toggle class
  var btn = nav.querySelector("button.nav-toggle") || nav.querySelector("button");
  if (!btn) return;

  btn.addEventListener("click", function (e) {
    e.preventDefault();
    var open = nav.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  // 点击菜单项后自动收起（移动端体验）
  nav.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (!a) return;
    if (nav.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    }
  });
});
