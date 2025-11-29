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

    // iOS Safari：禁用长按弹出“存储图像/复制”等菜单 + 禁拖拽（轻量）
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

    // Android/Chrome 等：拦截长按触发的 contextmenu（捕获阶段更稳）
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
  // ✅ PC：A + B（降误判版）
  // - A(resize) 不再直接跳转，只用来更新尺寸/辅助
  // - B(outer/inner) 连续命中 >=2 次才跳转，避免窗口化误触
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
  // 2A. resize（不再“判死刑”跳转，避免窗口化/拖拽误触）
  // -------------------------------
  let lastWidth = window.innerWidth;
  let lastHeight = window.innerHeight;

  window.addEventListener("resize", () => {
    // 仅更新记录，保留扩展空间（比如你未来想上报日志/计数）
    lastWidth = window.innerWidth;
    lastHeight = window.innerHeight;
  });

  // -------------------------------
  // 2B. outer/inner 检测：连续命中才跳转（核心降误判）
  // -------------------------------
  function isDevtoolsOpen() {
    const threshold = 170;
    // 有些浏览器 outer 值异常，做个健壮性保护
    if (!window.outerHeight || !window.outerWidth) return false;

    return (
      Math.abs(window.outerHeight - window.innerHeight) > threshold ||
      Math.abs(window.outerWidth - window.innerWidth) > threshold
    );
  }

  let devtoolsHit = 0;
  const HIT_NEED = 2; // 连续 2 次命中才处理（500ms*2=1秒）

  function punish() {
    alert("检测到开发者工具已打开！");
    window.location.href = jumpUrl;
  }

  setInterval(() => {
    if (isDevtoolsOpen()) devtoolsHit++;
    else devtoolsHit = 0;

    if (devtoolsHit >= HIT_NEED) punish();
  }, 500);

  // -------------------------------
  // 3. 反调试 (PC)（保留你的逻辑：注意它可能带来性能影响）
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
