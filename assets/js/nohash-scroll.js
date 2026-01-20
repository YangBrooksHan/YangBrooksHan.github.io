document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("site-nav");
  if (!nav) return;

  nav.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const id = a.getAttribute("href");
    if (!id || id === "#") return;

    const el = document.querySelector(id);
    if (!el) return;

    e.preventDefault();

    // smooth scroll
    el.scrollIntoView({ behavior: "smooth", block: "start" });

    // remove hash from URL
    if (history.replaceState) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  });
});
