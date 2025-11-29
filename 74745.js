(() => {
  // ---------------------------
  // 域名判断（仅允许 shli.io）
  // ---------------------------
  if (window.location.hostname !== "shli.io") {
    console.warn("脚本未授权的域名，停止执行");
    return;
  }

  const jumpUrl = "https://www.bing.com"; // PC 检测到后跳转

  // -------------------------------
  // 0. 判断是否是移动端（增强：iPadOS 桌面模式也算移动端）
  // -------------------------------
  const ua = navigator.userAgent || "";
  const isIPadOS = /Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1; // iPadOS 桌面版 UA
  const isMobile =
    /Android|iPhone|iPad|iPod|Windows Phone|Mobi/i.test(ua) || isIPadOS;

  // =====================================================================
  // ✅ 移动端：仅禁用“图片长按保存”
  // =====================================================================
  if (isMobile) {
    console.log("移动端访问：启用图片长按禁用");

    const style = document.createElement("style");
    style.innerHTML = `
      img {
        -webkit-touch-callout: none !important;
        -webkit-user-select: none !important;
        user-select: none !important;
        -webkit-user-drag: none !important;
        user-drag: none !important;
      }
    `;
    document.head.appendChild(style);

    // 拦截长按触发的菜单（捕获阶段更稳）
    document.addEventListener(
      "contextmenu",
      (e) => {
        const t = e.target;
        if (t && t.tagName && t.tagName.toLowerCase() === "img") {
          e.preventDefault();
        }
      },
      true
    );

    return; // ✅ 移动端到此结束，不执行 PC 防护
  }

  // =====================================================================
  // ✅ PC：防护（降误判版）
  // - resize：不直接跳转，只用于更新基线
  // - DevTools：用“基线 + 增量”判断，避免一进站就误判
  // =====================================================================

  // -------------------------------
  // 1. 禁用快捷键 (PC)
  // -------------------------------
  document.addEventListener("keydown", (e) => {
    if (
      e.keyCode === 123 || // F12
      (e.ctrlKey && e.shiftKey && e.keyCode === 67) || // Ctrl+Shift+C
      (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
      (e.ctrlKey && e.keyCode === 85) // Ctrl+U
    ) {
      e.preventDefault();
      alert("检测到开发者工具快捷键，操作被阻止");
      window.location.href = jumpUrl;
    }
  });

  // -------------------------------
  // 2. DevTools 检测（基线 + 增量）
  // -------------------------------
  let baseDiffH = null;
  let baseDiffW = null;

  function sampleBaseline() {
    const diffH = Math.abs(window.outerHeight - window.innerHeight);
    const diffW = Math.abs(window.outerWidth - window.innerWidth);
    baseDiffH = diffH;
    baseDiffW = diffW;
  }

  // 首次进入延迟采样（等浏览器 UI 稳定）
  setTimeout(sampleBaseline, 800);

  // 窗口变化后也更新基线（避免窗口化/拖动后误判）
  let baselineTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(baselineTimer);
    baselineTimer = setTimeout(sampleBaseline, 800);
  });

  function isDevtoolsOpenByDelta() {
    if (baseDiffH === null || baseDiffW === null) return false;

    // outer 在个别环境可能为 0/undefined，兜底
    if (!window.outerHeight || !window.outerWidth) return false;

    const diffH = Math.abs(window.outerHeight - window.innerHeight);
    const diffW = Math.abs(window.outerWidth - window.innerWidth);

    const deltaH = diffH - baseDiffH;
    const deltaW = diffW - baseDiffW;

    // 只看“增量”而不是绝对值，极大降低开局误判
    return deltaH > 220 || deltaW > 220;
  }

  let devtoolsHit = 0;
  const HIT_NEED = 2; // 连续命中 2 次（约 1s）才处理

  function punish() {
    alert("检测到开发者工具已打开！");
    window.location.href = jumpUrl;
  }

  setInterval(() => {
    if (isDevtoolsOpenByDelta()) devtoolsHit++;
    else devtoolsHit = 0;

    if (devtoolsHit >= HIT_NEED) punish();
  }, 500);

  // -------------------------------
  // 3. 反调试 (PC)（保留你的逻辑：可能有性能影响）
  // -------------------------------
  function antiDebug() {
    setInterval(() => {
      (function () {
        return false;
      })
        ["constructor"]("debugger")
        ["call"]();
    }, 50);
  }
  try {
    antiDebug();
  } catch (err) {}

  // -------------------------------
  // 4. 禁用右键（PC）
  // -------------------------------
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    alert("右键已被禁用");
  });

  // -------------------------------
  // 5. 禁止选中（PC）
  // -------------------------------
  document.addEventListener("selectstart", (e) => e.preventDefault());
  document.addEventListener("mousedown", (e) => {
    if (e.button === 2) e.preventDefault();
  });

  const stylePC = document.createElement("style");
  stylePC.innerHTML = `
    body {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
    }
  `;
  document.head.appendChild(stylePC);
})();
