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
  // ✅ 移动端：仅禁用“图片长按保存”
  // =====================================================================
  if (isMobile) {
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

    return; // ✅ 移动端到此结束，PC 端不执行
  }

  // -------------------------------
  // 1. 禁用快捷键 (PC)
  // -------------------------------
  const punishOnce = (() => {
    let punished = false;
    return (msg) => {
      if (punished) return;
      punished = true;
      alert(msg);
      window.location.href = jumpUrl;
    };
  })();

  document.addEventListener("keydown", (e) => {
    if (
      e.keyCode === 123 || // F12
      (e.ctrlKey && e.shiftKey && e.keyCode === 67) || // Ctrl+Shift+C
      (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
      (e.ctrlKey && e.keyCode === 85) || // Ctrl+U
      e.keyCode === 80 // Ctrl+P (禁止打印)
    ) {
      e.preventDefault();
      punishOnce("检测到不允许的快捷键，操作被阻止");
    }

    // 禁止右键菜单（Ctrl+Shift+I）
    if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
      e.preventDefault();
      punishOnce("检测到开发者工具快捷键，操作被阻止");
    }
  });

  // -------------------------------
  // 2. 禁用右键（PC）
  // -------------------------------
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    alert("右键已被禁用");
  });

  // -------------------------------
  // 3. 禁止选中（PC）
  // -------------------------------
  document.addEventListener("selectstart", (e) => e.preventDefault());
  document.addEventListener("mousedown", (e) => {
    if (e.button === 2) e.preventDefault(); // 禁止右键按下
  });

  // 禁止拖拽
  document.addEventListener("dragstart", (e) => e.preventDefault());
  document.addEventListener("drop", (e) => e.preventDefault());

  const stylePC = document.createElement("style");
  stylePC.innerHTML = `
    body {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
      -webkit-user-drag: none !important;
      user-drag: none !important;
    }
  `;
  document.head.appendChild(stylePC);
})();
