/* ==========================================================
   Body Soap — shared script (ใช้ร่วมทุกหน้า)
   ตรวจจาก element ที่มีในหน้า แล้วรันเฉพาะฟังก์ชันที่เกี่ยวข้อง
   ========================================================== */

(function () {
  "use strict";

  var STORAGE_KEY = "bodyScentOrders";

  var MOODS = [
    { key: "all", label: "ทั้งหมด" },
    { key: "fresh", label: "Fresh" },
    { key: "sweet", label: "Sweet" },
    { key: "confident", label: "Confident" },
    { key: "romance", label: "Romance" }
  ];

  var MOOD_LABELS = {
    fresh: "Fresh",
    sweet: "Sweet",
    confident: "Confident",
    romance: "Romance"
  };

  var TYPE_LABELS = {
    spray: "สเปรย์",
    rollon: "โรลออน"
  };

  /* ---------- Helpers ---------- */

  function formatPrice(n) {
    return Number(n).toLocaleString("th-TH");
  }

  function setFieldValue(el, value) {
    if (!el) return;
    if ("value" in el) {
      el.value = value;
    } else {
      el.textContent = value;
    }
  }

  function getFieldValue(el) {
    if (!el) return "";
    return ("value" in el ? el.value : el.textContent || "").trim();
  }

  function getField(form, name) {
    return (form.elements && form.elements[name]) || form.querySelector("#" + name) || null;
  }

  function readOrders() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("อ่านข้อมูลคำสั่งซื้อไม่สำเร็จ:", err);
      return [];
    }
  }

  /* ==========================================================
     product.html
     ========================================================== */

  function initProductPage() {
    var list = document.getElementById("product-list");
    var filterBar = document.getElementById("filter-bar");
    if (!list) return;

    var products = [];
    var activeMood = "all";

    function buildOrderUrl(p) {
      var itemName = p.name + (p.size ? " (" + p.size + ")" : "");
      var params = new URLSearchParams();
      params.set("item", itemName);
      params.set("price", String(p.price));
      return "order.html?" + params.toString();
    }

    function createCard(p) {
      var card = document.createElement("article");
      card.className = "product-card";
      card.setAttribute("data-mood", p.mood);

      var media = document.createElement("div");
      media.className = "product-card__media";
      var img = document.createElement("img");
      img.src = p.image;
      img.alt = p.name;
      img.loading = "lazy";
      media.appendChild(img);

      var body = document.createElement("div");
      body.className = "product-card__body";

      var mood = document.createElement("div");
      mood.className = "product-card__mood";
      var dot = document.createElement("span");
      dot.className = "mood-dot";
      var moodText = document.createElement("span");
      moodText.textContent = MOOD_LABELS[p.mood] || p.mood;
      mood.appendChild(dot);
      mood.appendChild(moodText);

      var name = document.createElement("h3");
      name.className = "product-card__name";
      name.textContent = p.name;

      var meta = document.createElement("div");
      meta.className = "product-card__meta";
      var metaParts = [TYPE_LABELS[p.type] || p.type];
      if (p.size) metaParts.push(p.size);
      meta.textContent = metaParts.join(" • ");

      var desc = document.createElement("p");
      desc.className = "product-card__desc";
      desc.textContent = p.description || "";

      var footer = document.createElement("div");
      footer.className = "product-card__footer";

      var price = document.createElement("span");
      price.className = "price";
      price.textContent = formatPrice(p.price);
      var unit = document.createElement("small");
      unit.textContent = "บาท";
      price.appendChild(unit);

      var btn = document.createElement("a");
      btn.className = "btn btn--outline";
      btn.href = buildOrderUrl(p);
      btn.textContent = "สั่งซื้อ";

      footer.appendChild(price);
      footer.appendChild(btn);

      body.appendChild(mood);
      body.appendChild(name);
      body.appendChild(meta);
      body.appendChild(desc);
      body.appendChild(footer);

      card.appendChild(media);
      card.appendChild(body);
      return card;
    }

    function renderProducts() {
      list.innerHTML = "";
      var filtered = products.filter(function (p) {
        return activeMood === "all" || p.mood === activeMood;
      });

      if (filtered.length === 0) {
        var empty = document.createElement("p");
        empty.textContent = "ไม่พบสินค้าในหมวดนี้";
        list.appendChild(empty);
        return;
      }

      filtered.forEach(function (p) {
        list.appendChild(createCard(p));
      });
    }

    function updateButtons() {
      if (!filterBar) return;
      var buttons = filterBar.querySelectorAll("button[data-mood]");
      buttons.forEach(function (b) {
        var isActive = b.getAttribute("data-mood") === activeMood;
        b.classList.toggle("is-active", isActive);
        b.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    }

    function setMood(mood, updateUrl) {
      activeMood = mood;
      updateButtons();
      renderProducts();

      if (updateUrl && window.history && history.replaceState) {
        var url = new URL(window.location.href);
        if (mood === "all") {
          url.searchParams.delete("mood");
        } else {
          url.searchParams.set("mood", mood);
        }
        history.replaceState(null, "", url.toString());
      }
    }

    function buildFilterBar() {
      if (!filterBar) return;
      filterBar.classList.add("filters");
      filterBar.innerHTML = "";

      MOODS.forEach(function (m) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "chip";
        b.setAttribute("data-mood", m.key);

        if (m.key !== "all") {
          var dot = document.createElement("span");
          dot.className = "mood-dot";
          // ใช้ data-mood บน wrapper เพื่อให้ .mood-dot ได้สีของ mood นั้น
          var holder = document.createElement("span");
          holder.setAttribute("data-mood", m.key);
          holder.appendChild(dot);
          b.appendChild(holder);
        }

        var label = document.createElement("span");
        label.textContent = m.label;
        b.appendChild(label);

        b.addEventListener("click", function () {
          setMood(m.key, true);
        });
        filterBar.appendChild(b);
      });
    }

    function getInitialMood() {
      var param = new URLSearchParams(window.location.search).get("mood");
      if (!param) return "all";
      param = param.toLowerCase();
      return MOODS.some(function (m) { return m.key === param; }) ? param : "all";
    }

    buildFilterBar();

    fetch("products.json")
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        products = Array.isArray(data) ? data : [];
        setMood(getInitialMood(), false);
      })
      .catch(function (err) {
        console.error("โหลด products.json ไม่สำเร็จ:", err);
        list.innerHTML = "";
        var msg = document.createElement("p");
        msg.textContent = "ไม่สามารถโหลดข้อมูลสินค้าได้ กรุณาลองใหม่อีกครั้ง";
        list.appendChild(msg);
      });
  }

  /* ==========================================================
     order.html
     ========================================================== */

  function initOrderPage() {
    var form = document.getElementById("orderForm");
    if (!form) return;

    var itemsEl = document.getElementById("items");
    var totalEl = document.getElementById("total");

    // เติม item / price จาก URL ลงทั้งสองช่อง
    var params = new URLSearchParams(window.location.search);
    var item = params.get("item") || "";
    var price = params.get("price") || "";

    setFieldValue(itemsEl, item);
    setFieldValue(totalEl, price);

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var totalRaw = getFieldValue(totalEl);
      var totalNum = Number(totalRaw);

      var payload = {
        customerName: getFieldValue(getField(form, "customerName")),
        contact: getFieldValue(getField(form, "contact")),
        items: getFieldValue(itemsEl),
        total: totalRaw !== "" && !isNaN(totalNum) ? totalNum : totalRaw,
        note: getFieldValue(getField(form, "note")),
        timestamp: new Date().toISOString()
      };

      try {
        var orders = readOrders();
        orders.push(payload);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
      } catch (err) {
        console.error("บันทึกคำสั่งซื้อไม่สำเร็จ:", err);
        alert("ไม่สามารถบันทึกคำสั่งซื้อได้ กรุณาลองใหม่อีกครั้ง");
        return;
      }

      window.location.href = "thankyou.html";
    });
  }

  /* ==========================================================
     admin.html
     ========================================================== */

  function initAdminPage() {
    var table = document.getElementById("ordersTable");
    if (!table) return;

    var tbody = table.querySelector("tbody");
    if (!tbody) {
      tbody = document.createElement("tbody");
      table.appendChild(tbody);
    }

    var headCells = table.querySelectorAll("thead th").length || 6;
    var orders = readOrders();

    tbody.innerHTML = "";

    if (orders.length === 0) {
      var emptyRow = document.createElement("tr");
      var emptyCell = document.createElement("td");
      emptyCell.colSpan = headCells;
      emptyCell.textContent = "ยังไม่มีคำสั่งซื้อ";
      emptyCell.style.textAlign = "center";
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
      return;
    }

    // เรียงจาก timestamp ล่าสุดขึ้นก่อน
    orders.sort(function (a, b) {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    orders.forEach(function (o) {
      var tr = document.createElement("tr");

      var date = new Date(o.timestamp);
      var dateText = isNaN(date.getTime()) ? "-" : date.toLocaleString("th-TH");

      var totalText = "-";
      if (o.total !== undefined && o.total !== null && o.total !== "") {
        totalText = isNaN(Number(o.total))
          ? String(o.total)
          : formatPrice(o.total) + " บาท";
      }

      var cells = [
        dateText,
        o.customerName || "-",
        o.contact || "-",
        o.items || "-",
        totalText,
        o.note || "-"
      ];

      cells.forEach(function (text) {
        var td = document.createElement("td");
        td.textContent = text; // textContent ป้องกัน HTML injection
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  }

  /* ---------- Init ---------- */

  function init() {
    initProductPage();
    initOrderPage();
    initAdminPage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
