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
  const isIPadOS = /Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1;
  const isMobile =
    /Android|iPhone|iPad|iPod|Windows Phone|Mobi/i.test(ua) || isIPadOS;

  // =====================================================================
  // ✅ 移动端：使用你这段里的“图片长按保护”原逻辑
  // =====================================================================
  if (isMobile) {
    console.log("移动端访问，启用图片长按保护");

    let touchTimer = null;

    document.addEventListener(
      "touchstart",
      (e) => {
        if (
          e.target &&
          e.target.tagName &&
          e.target.tagName.toLowerCase() === "img"
        ) {
          touchTimer = setTimeout(() => {
            alert("⚠️ 此图片已保护，不能保存！");
          }, 1000);
          e.preventDefault();
        }
      },
      { passive: false }
    );

    document.addEventListener("touchend", () => {
      clearTimeout(touchTimer);
    });
    document.addEventListener("touchmove", () => {
      clearTimeout(touchTimer);
    });

    document.addEventListener("contextmenu", (e) => {
      if (
        e.target &&
        e.target.tagName &&
        e.target.tagName.toLowerCase() === "img"
      )
        e.preventDefault();
    });

    const style = document.createElement("style");
    style.innerHTML = `
      img {
        -webkit-touch-callout: none !important;
      }
    `;
    document.head.appendChild(style);

    return; // 移动端到此结束，不执行 PC 防护
  }

  // =====================================================================
  // ✅ PC：更稳版（基线增量 + 绝对差值/比例）
  // =====================================================================

  // 1) 禁用快捷键 (PC)
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

  // 2) DevTools 检测：基线 + 增量
  let baseDiffH = null;
  let baseDiffW = null;

  function sampleBaseline() {
    const diffH = Math.abs(window.outerHeight - window.innerHeight);
    const diffW = Math.abs(window.outerWidth - window.innerWidth);
    baseDiffH = diffH;
    baseDiffW = diffW;
  }

  // 首次进入延迟采样（等 UI 稳定）
  setTimeout(sampleBaseline, 800);

  // 检测启用延迟 + resize 后延迟（减少误判）
  let devtoolsCheckEnabled = false;
  let enableTimer = setTimeout(() => (devtoolsCheckEnabled = true), 1200);

  let baselineTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(baselineTimer);
    baselineTimer = setTimeout(sampleBaseline, 800);

    devtoolsCheckEnabled = false;
    clearTimeout(enableTimer);
    enableTimer = setTimeout(() => (devtoolsCheckEnabled = true), 1200);
  });

  function isDevtoolsOpenByDelta() {
    if (baseDiffH === null || baseDiffW === null) return false;
    if (!window.outerHeight || !window.outerWidth) return false;

    const diffH = Math.abs(window.outerHeight - window.innerHeight);
    const diffW = Math.abs(window.outerWidth - window.innerWidth);

    const deltaH = diffH - baseDiffH;
    const deltaW = diffW - baseDiffW;

    return deltaH > 220 || deltaW > 220;
  }

  // 3) 开局已打开 DevTools：绝对差值 + 比例（更保守）
  function isDevtoolsOpenByAbs() {
    if (!window.outerHeight || !window.outerWidth) return false;

    const diffH = Math.abs(window.outerHeight - window.innerHeight);
    const diffW = Math.abs(window.outerWidth - window.innerWidth);

    const hRatio = window.innerHeight / window.outerHeight;
    const wRatio = window.innerWidth / window.outerWidth;

    const byH = diffH > 360 && hRatio < 0.78;
    const byW = diffW > 360 && wRatio < 0.78;

    return byH || byW;
  }

  function punish() {
    alert("检测到开发者工具已打开！");
    window.location.href = jumpUrl;
  }

  let hitDelta = 0;
  let hitAbs = 0;

  setInterval(() => {
    if (!devtoolsCheckEnabled) return;

    if (isDevtoolsOpenByDelta()) hitDelta++;
    else hitDelta = 0;

    if (isDevtoolsOpenByAbs()) hitAbs++;
    else hitAbs = 0;

    if (hitDelta >= 2 || hitAbs >= 3) punish();
  }, 500);

  // 4) 反调试 (PC)
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

  // 5) 禁用右键（PC）
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    alert("右键已被禁用");
  });

  // 6) 禁止选中（PC）
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
