// Measure every HUD component first, then mutate the DOM. Multiple network or
// timer updates in one frame become one paint using the newest state.
(() => {
  const jobs = new Map(),
    warmJobs = new Map();
  let frame = 0,
    warming = false;
  function flush() {
    frame = 0;
    const batch = [...jobs.values()];
    jobs.clear();
    const measured = batch.map((j) => [j, j.read()]);
    for (const [j, data] of measured) j.write(data);
  }
  function warmNext() {
    if (warming || !warmJobs.size) return;
    warming = true;
    const idle = window.requestIdleCallback ?? ((f) => setTimeout(f, 16));
    idle.call(
      window,
      () => {
        warming = false;
        const entry = warmJobs.entries().next().value;
        if (entry) {
          warmJobs.delete(entry[0]);
          entry[1]();
        }
        warmNext();
      },
      { timeout: 250 },
    );
  }
  window.__royalUiFrame = {
    schedule(key, read, write) {
      jobs.set(key, { read, write });
      if (!frame) frame = requestAnimationFrame(flush);
    },
    text(node, value) {
      if (node && node.textContent !== String(value))
        node.textContent = String(value);
    },
    attr(node, name, value) {
      if (node && node.getAttribute(name) !== String(value))
        node.setAttribute(name, String(value));
    },
    style(node, name, value) {
      if (node && node.style[name] !== value) node.style[name] = value;
    },
    warm(key, job) {
      if (!warmJobs.has(key)) warmJobs.set(key, job);
      warmNext();
    },
  };
})();
