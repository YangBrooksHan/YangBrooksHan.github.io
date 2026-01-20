document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("site-nav");
  if (!nav) return;

  const btn = nav.querySelector(".nav-toggle");
  const links = nav.querySelector(".visible-links");
  if (!btn || !links) return;

  // 初始化：关闭
  nav.classList.remove("is-open");
  btn.setAttribute("aria-expanded", "false");

  btn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(isOpen));
  });

  // 关键：从移动切到桌面时强制收起，避免状态残留
  const mq = window.matchMedia("(min-width: 769px)");
  const onChange = () => {
    if (mq.matches) {
      nav.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    }
  };

  if (mq.addEventListener) mq.addEventListener("change", onChange);
  else mq.addListener(onChange);
});
