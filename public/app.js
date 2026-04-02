const page = document.body.dataset.page || "";
const statusLog = document.getElementById("status-log");

const getToken = () => localStorage.getItem("token") || "";
const getNextUrl = () => {
  const next = new URLSearchParams(window.location.search).get("next");
  return next || "";
};
const redirectToLogin = () => {
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/login.html?next=${next}`;
};
const setToken = (token) => {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
};

const formatVnd = (value) => {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const logoutUser = async () => {
  try {
    await api("/api/v1/auth/logout", { method: "POST", auth: true });
  } catch (err) {
    // ignore logout errors
  }
  setToken("");
};

const logStatus = (message) => {
  if (!statusLog) return;
  const time = new Date().toLocaleTimeString();
  statusLog.textContent = `[${time}] ${message}\n` + statusLog.textContent;
};

const api = async (path, options = {}) => {
  const headers = options.headers ? { ...options.headers } : {};
  if (options.auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(path, { ...options, headers });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  if (!response.ok) {
    const errorMessage = typeof payload === "string" ? payload : JSON.stringify(payload);
    throw new Error(errorMessage);
  }
  return payload;
};

const renderList = (el, items, formatter) => {
  if (!el) return;
  el.innerHTML = "";
  if (!items || items.length === 0) {
    el.textContent = "Khong co du lieu";
    return;
  }
  items.forEach((item) => {
    const div = document.createElement("div");
    div.textContent = formatter(item);
    el.appendChild(div);
  });
};

const updateAuthStatus = async () => {
  const authStatus = document.getElementById("auth-status");
  if (!authStatus) return;
  try {
    const data = await api("/api/v1/auth/me", { auth: true });
    authStatus.textContent = `Da dang nhap: ${data.username} (${data.role?.name || "N/A"})`;
  } catch (err) {
    authStatus.textContent = "Chua dang nhap";
  }
};

const updateTopbar = async () => {
  const topUser = document.getElementById("top-user");
  const topAuthBtn = document.getElementById("top-auth-btn");
  const adminLink = document.querySelector('.auth-actions a[href="/admin.html"]');
  if (!topUser || !topAuthBtn) return;
  try {
    const me = await api("/api/v1/auth/me", { auth: true });
    topUser.textContent = me.username;
    topAuthBtn.classList.remove("hidden");
    topAuthBtn.textContent = "Dang xuat";
    if (adminLink) {
      if (me.role?.name === "ADMIN") adminLink.classList.remove("hidden");
      else adminLink.classList.add("hidden");
    }
    topAuthBtn.onclick = () => {
      logoutUser().finally(() => {
        topUser.textContent = "";
        if (adminLink) adminLink.classList.add("hidden");
        window.location.href = "/index.html";
      });
    };
  } catch (err) {
    topUser.textContent = "";
    topAuthBtn.classList.remove("hidden");
    topAuthBtn.textContent = "Dang nhap";
    if (adminLink) adminLink.classList.add("hidden");
    topAuthBtn.onclick = () => {
      window.location.href = "/login.html";
    };
  }
};

const bindAuthButtons = () => {
  const meBtn = document.getElementById("me-btn");
  const logoutBtn = document.getElementById("logout-btn");
  if (meBtn) {
    meBtn.addEventListener("click", async () => {
      try {
        const data = await api("/api/v1/auth/me", { auth: true });
        logStatus(`Xin chao ${data.username} (${data.email})`);
      } catch (err) {
        logStatus(err.message);
      }
    });
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logoutUser().finally(() => {
        logStatus("Da dang xuat");
        updateAuthStatus();
        updateTopbar();
      });
    });
  }
};

const loadHome = async () => {
  updateTopbar();
  await updateAuthStatus();
  bindAuthButtons();
  try {
    const data = await api("/api/v1/products");
    const featured = data.slice(0, 4);
    const featuredEl = document.getElementById("featured-products");
    if (featuredEl) {
      featuredEl.innerHTML = "";
      featured.forEach((item) => {
        const card = document.createElement("div");
        card.className = "col-12 col-md-4 mb-4";
        card.innerHTML = `
          <div class="card h-100">
              <a href="/product-detail.html?id=${item._id}">
                  <img src="${item.images && item.images[0] ? item.images[0] : '/assets/img/feature_prod_01.jpg'}" class="card-img-top" alt="..." style="height:300px; object-fit:cover;">
              </a>
              <div class="card-body">
                  <ul class="list-unstyled d-flex justify-content-between">
                      <li>
                          <i class="text-warning fa fa-star"></i>
                          <i class="text-warning fa fa-star"></i>
                          <i class="text-warning fa fa-star"></i>
                      </li>
                      <li class="text-muted text-right">${formatVnd(item.price)}</li>
                  </ul>
                  <a href="/product-detail.html?id=${item._id}" class="h2 text-decoration-none text-dark">${item.title}</a>
                  <p class="card-text">
                      ${item.description || "Category: " + (item.category?.name || "N/A")}
                  </p>
              </div>
          </div>
        `;
        featuredEl.appendChild(card);
      });
    }
    const statsEl = document.getElementById("home-stats");
    renderList(statsEl, [
      { label: "Tong san pham", value: data.length },
      { label: "Dang nhap", value: getToken() ? "Co" : "Khong" }
    ], (item) => `${item.label}: ${item.value}`);
  } catch (err) {
    logStatus(err.message);
  }
};

const loadProducts = async () => {
  updateTopbar();
  const productsEl = document.getElementById("products");
  const titleEl = document.getElementById("filter-title");
  const minEl = document.getElementById("filter-min");
  const maxEl = document.getElementById("filter-max");
  const title = titleEl ? titleEl.value.trim() : "";
  const min = minEl ? minEl.value.trim() : "";
  const max = maxEl ? maxEl.value.trim() : "";
  
  const params = new URLSearchParams();
  if (title) params.set("title", title);
  if (min) params.set("minprice", min);
  if (max) params.set("maxprice", max);
  
  if (typeof currentCategory !== 'undefined' && currentCategory) params.set("category", currentCategory);
  if (typeof currentBrand !== 'undefined' && currentBrand) params.set("brand", currentBrand);
  
  const data = await api(`/api/v1/products?${params.toString()}`);
  productsEl.innerHTML = "";
  if (!data.length) {
    productsEl.textContent = "Khong co san pham";
    return;
  }
  data.forEach((item) => {
    const sizeOptions = (item.sizes || []).map(s => `<option value="${s.size}">${s.size}</option>`).join("");
    const card = document.createElement("div");
    card.className = "col-md-4";
    card.innerHTML = `
      <div class="card mb-4 product-wap rounded-0">
          <div class="card rounded-0">
              <img class="card-img rounded-0 img-fluid" src="${item.images && item.images[0] ? item.images[0] : '/assets/img/shop_01.jpg'}" style="height:300px; object-fit:cover;">
              <div class="card-img-overlay rounded-0 product-overlay d-flex align-items-center justify-content-center">
                  <ul class="list-unstyled">
                      <li><a class="btn btn-success text-white" href="/product-detail.html?id=${item._id}"><i class="far fa-heart"></i></a></li>
                      <li><a class="btn btn-success text-white mt-2" href="/product-detail.html?id=${item._id}"><i class="far fa-eye"></i></a></li>
                      <li><button class="btn btn-success text-white mt-2 add-to-cart-btn"><i class="fas fa-cart-plus"></i></button></li>
                  </ul>
              </div>
          </div>
          <div class="card-body">
              <a href="/product-detail.html?id=${item._id}" class="h3 text-decoration-none">${item.title}</a>
              <ul class="w-100 list-unstyled d-flex justify-content-between mb-0">
                  <li>Brand: ${item.brand?.name || "N/A"}</li>
                  <li class="pt-2">
                      <span class="product-color-dot color-dot-red float-left rounded-circle ml-1"></span>
                      <span class="product-color-dot color-dot-blue float-left rounded-circle ml-1"></span>
                      <span class="product-color-dot color-dot-black float-left rounded-circle ml-1"></span>
                      <span class="product-color-dot color-dot-light float-left rounded-circle ml-1"></span>
                      <span class="product-color-dot color-dot-green float-left rounded-circle ml-1"></span>
                  </li>
              </ul>
              <ul class="list-unstyled d-flex justify-content-center mb-1">
                  <li>
                      <i class="text-warning fa fa-star"></i>
                      <i class="text-warning fa fa-star"></i>
                      <i class="text-warning fa fa-star"></i>
                  </li>
              </ul>
              <p class="text-center mb-0">${formatVnd(item.price)}</p>
              <div class="d-flex justify-content-between align-items-center mt-2">
                  <select class="form-select form-select-sm size-select">
                      ${sizeOptions || '<option value="">Khong co size</option>'}
                  </select>
                  <input type="hidden" value="1" class="qty-input" />
              </div>
          </div>
      </div>
    `;
    const btn = card.querySelector(".add-to-cart-btn");
    const qtyInput = card.querySelector(".qty-input");
    const sizeSelect = card.querySelector(".size-select");
    btn.addEventListener("click", async () => {
      try {
        if (!getToken()) {
          redirectToLogin();
          return;
        }
        const size = sizeSelect ? sizeSelect.value : "";
        if (!size) {
          logStatus("Vui long chon size");
          return;
        }
        await api("/api/v1/carts/add", {
          method: "POST",
          auth: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product: item._id,
            size: size,
            quantity: Number(qtyInput.value || 1)
          })
        });
        window.location.href = '/cart.html';
      } catch (err) {
        logStatus(err.message);
      }
    });
    productsEl.appendChild(card);
  });
};

const loadProductDetail = async () => {
  updateTopbar();
  const detailEl = document.getElementById("product-detail-wrapper");
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) {
    if (detailEl) detailEl.textContent = "Khong co ID san pham";
    return;
  }
  try {
    const item = await api(`/api/v1/products/${id}`);
    const imgUrl = item.images && item.images[0] ? item.images[0] : '/assets/img/product_single_10.jpg';
    const sizes = item.sizes || [];
    const sizeOptions = sizes.map(s => `<option value="${s.size}" data-stock="${s.stock}">${s.size}</option>`).join("");
    const firstStock = sizes.length ? sizes[0].stock : 0;
    detailEl.innerHTML = `
      <div class="row">
          <div class="col-lg-5 mt-5">
              <div class="card mb-3">
                  <img class="card-img img-fluid" src="${imgUrl}" alt="Card image cap" id="product-detail">
              </div>
          </div>
          <div class="col-lg-7 mt-5">
              <div class="card">
                  <div class="card-body">
                      <h1 class="h2">${item.title}</h1>
                      <p class="h3 py-2">${formatVnd(item.price)}</p>
                      <ul class="list-inline">
                          <li class="list-inline-item">
                              <h6>Brand:</h6>
                          </li>
                          <li class="list-inline-item">
                              <p class="text-muted"><strong>${item.brand?.name || "N/A"}</strong></p>
                          </li>
                      </ul>

                      <h6>Description:</h6>
                      <p>${item.description || ""}</p>
                      <ul class="list-inline">
                          <li class="list-inline-item">
                              <h6>Category :</h6>
                          </li>
                          <li class="list-inline-item">
                              <p class="text-muted"><strong>${item.category?.name || "N/A"}</strong></p>
                          </li>
                      </ul>
                      <div class="mb-3">
                          <label class="form-label">Size</label>
                          <select class="form-select" id="detail-size">
                              ${sizeOptions || '<option value="">Khong co size</option>'}
                          </select>
                      </div>
                      <p class="text-muted">So luong con: <span id="detail-stock">${firstStock}</span></p>

                      <div class="row pb-3 mt-4">
                          <div class="col d-grid">
                              <button class="btn btn-success btn-lg" id="detail-add">Add To Cart</button>
                          </div>
                      </div>
                      <input id="detail-qty" type="hidden" value="1" />
                  </div>
              </div>
          </div>
      </div>
    `;
    const sizeSelect = document.getElementById("detail-size");
    const stockEl = document.getElementById("detail-stock");
    if (sizeSelect && stockEl) {
      sizeSelect.addEventListener("change", () => {
        const opt = sizeSelect.options[sizeSelect.selectedIndex];
        stockEl.textContent = opt ? opt.dataset.stock || "0" : "0";
      });
    }
    document.getElementById("detail-add").addEventListener("click", async () => {
      try {
        if (!getToken()) {
          redirectToLogin();
          return;
        }
        const quantity = Number(document.getElementById("detail-qty").value || 1);
        const size = sizeSelect ? sizeSelect.value : "";
        if (!size) {
          logStatus("Vui long chon size");
          return;
        }
        await api("/api/v1/carts/add", {
          method: "POST",
          auth: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product: item._id, size: size, quantity })
        });
        window.location.href = '/cart.html';
      } catch (err) {
        logStatus(err.message);
      }
    });
  } catch (err) {
    detailEl.textContent = err.message;
  }
};

const loadCart = async () => {
  updateTopbar();
  const cartItemsEl = document.getElementById("cart-items");
  const cartEmptyEl = document.getElementById("cart-empty");
  const subtotalEl = document.getElementById("cart-subtotal");
  const totalEl = document.getElementById("cart-total");
  const data = await api("/api/v1/carts", { auth: true });
  cartItemsEl.innerHTML = "";
  if (!data.length) {
    if (cartEmptyEl) cartEmptyEl.textContent = "Gio hang trong";
    if (subtotalEl) subtotalEl.textContent = formatVnd(0);
    if (totalEl) totalEl.textContent = formatVnd(0);
    return;
  }
  if (cartEmptyEl) cartEmptyEl.textContent = "";
  let subtotal = 0;
  data.forEach((item) => {
    const product = item.product || {};
    const productId = product._id || item.product;
    const price = Number(product.price) || 0;
    const lineTotal = price * item.quantity;
    subtotal += lineTotal;
    const img = product.images && product.images[0] ? product.images[0] : "/assets/img/shop_01.jpg";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <div class="d-flex align-items-center">
          <img src="${img}" alt="" style="width:64px;height:64px;object-fit:cover" class="rounded me-3">
          <div>
            <div class="fw-bold">${product.title || item.product}</div>
            <small class="text-muted">ID: ${product._id || item.product}</small>
          </div>
        </div>
      </td>
      <td>${item.size}</td>
      <td>${formatVnd(price)}</td>
      <td>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-outline-secondary qty-minus">-</button>
          <span class="fw-bold">${item.quantity}</span>
          <button class="btn btn-sm btn-outline-secondary qty-plus">+</button>
        </div>
      </td>
      <td>${formatVnd(lineTotal)}</td>
      <td><button class="btn btn-sm btn-outline-danger qty-remove">Xoa 1</button></td>
    `;
    row.querySelector(".qty-minus").addEventListener("click", async () => {
      try {
        await api("/api/v1/carts/remove", {
          method: "POST",
          auth: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product: productId, size: item.size, quantity: 1 })
        });
        await loadCart();
      } catch (err) {
        logStatus(err.message);
      }
    });
    row.querySelector(".qty-plus").addEventListener("click", async () => {
      try {
        await api("/api/v1/carts/add", {
          method: "POST",
          auth: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product: productId, size: item.size, quantity: 1 })
        });
        await loadCart();
      } catch (err) {
        logStatus(err.message);
      }
    });
    row.querySelector(".qty-remove").addEventListener("click", async () => {
      try {
        await api("/api/v1/carts/remove", {
          method: "POST",
          auth: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product: productId, size: item.size, quantity: item.quantity })
        });
        await loadCart();
      } catch (err) {
        logStatus(err.message);
      }
    });
    cartItemsEl.appendChild(row);
  });
  if (subtotalEl) subtotalEl.textContent = formatVnd(subtotal);
  if (totalEl) totalEl.textContent = formatVnd(subtotal);
};

const createReservationFromCart = async () => {
  const items = await api("/api/v1/carts", { auth: true });
  if (!items.length) {
    logStatus("Gio hang trong");
    return;
  }
  const addressEl = document.getElementById("shipping-address");
  const nameEl = document.getElementById("shipping-name");
  const phoneEl = document.getElementById("shipping-phone");
  const noteEl = document.getElementById("shipping-note");
  const shippingAddress = addressEl ? addressEl.value.trim() : "";
  const shippingName = nameEl ? nameEl.value.trim() : "";
  const shippingPhone = phoneEl ? phoneEl.value.trim() : "";
  const shippingNote = noteEl ? noteEl.value.trim() : "";
  if (!shippingName || !shippingPhone || !shippingAddress) {
    logStatus("Vui long nhap ho ten, so dien thoai va dia chi giao hang");
    return;
  }
  const payload = {
    items: items.map((i) => ({ product: i.product, size: i.size, quantity: i.quantity })),
    expiredIn: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    shippingAddress: shippingAddress,
    shippingName: shippingName,
    shippingPhone: shippingPhone,
    shippingNote: shippingNote
  };
  const result = await api("/api/v1/reservations", {
    method: "POST",
    auth: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  logStatus(`Da tao reservation: ${result._id}`);
  return result;
};

const loadAdmin = async () => {
  updateTopbar();
  const adminStatus = document.getElementById("admin-status");
  try {
    if (!getToken()) {
      redirectToLogin();
      return;
    }
    const me = await api("/api/v1/auth/me", { auth: true });
    if (me.role?.name !== "ADMIN") {
      window.location.href = "/index.html";
      return;
    }
    adminStatus.textContent = `Xin chao ${me.username} (ADMIN)`;
  } catch (err) {
    adminStatus.textContent = "Chua dang nhap";
    return;
  }

  const categoriesEl = document.getElementById("categories");
  const brandsEl = document.getElementById("brands");
  const productsAdminEl = document.getElementById("products-admin");
  const loadProductsBtn = document.getElementById("load-products-admin");
  const productCategorySelect = document.getElementById("product-category");
  const productBrandSelect = document.getElementById("product-brand");
  const uploadResultEl = document.getElementById("upload-result");

  const loadCategories = async () => {
    const data = await api("/api/v1/categories");
    if (categoriesEl) {
      categoriesEl.innerHTML = data.map((item) => `
        <div class="d-flex justify-content-between align-items-center border-bottom py-1">
          <span>${item.name}</span>
          <button class="btn btn-sm btn-outline-secondary" data-id="${item._id}" data-name="${item.name}">Chon</button>
        </div>
      `).join("");
      categoriesEl.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", () => {
          document.getElementById("category-id").value = btn.dataset.id;
          document.getElementById("category-id-delete").value = btn.dataset.id;
          document.getElementById("category-name-update").value = btn.dataset.name;
        });
      });
    }
    productCategorySelect.innerHTML = "";
    data.forEach((item) => {
      const option = document.createElement("option");
      option.value = item._id;
      option.textContent = item.name;
      productCategorySelect.appendChild(option);
    });
  };

  const loadBrands = async () => {
    const data = await api("/api/v1/brands");
    if (brandsEl) {
      brandsEl.innerHTML = data.map((item) => `
        <div class="d-flex justify-content-between align-items-center border-bottom py-1">
          <span>${item.name}</span>
          <button class="btn btn-sm btn-outline-secondary" data-id="${item._id}" data-name="${item.name}" data-logo="${item.logo || ""}" data-desc="${item.description || ""}">Chon</button>
        </div>
      `).join("");
      brandsEl.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", () => {
          document.getElementById("brand-id").value = btn.dataset.id;
          document.getElementById("brand-id-delete").value = btn.dataset.id;
          document.getElementById("brand-name-update").value = btn.dataset.name || "";
          document.getElementById("brand-logo-update").value = btn.dataset.logo || "";
          document.getElementById("brand-desc-update").value = btn.dataset.desc;
        });
      });
    }
    productBrandSelect.innerHTML = "<option value=''>Khong co</option>";
    data.forEach((item) => {
      const option = document.createElement("option");
      option.value = item._id;
      option.textContent = item.name;
      productBrandSelect.appendChild(option);
    });
  };

  async function loadProductsAdmin() {
    if (!productsAdminEl) return;
    productsAdminEl.textContent = "Dang tai san pham...";
    try {
      const data = await api("/api/v1/products");
      if (!data.length) {
        productsAdminEl.textContent = "Chua co san pham";
        return;
      }
      productsAdminEl.innerHTML = data.map((item) => {
        const sizes = (item.sizes || []).map(s => `${s.size}:${s.stock}`).join(", ");
        return `
          <div class="d-flex justify-content-between align-items-center border-bottom py-1">
            <div>
              <div class="fw-bold">${item.title} <span class="text-muted">(${formatVnd(item.price)})</span></div>
              <small class="text-muted">Size: ${sizes || "N/A"} | ID: ${item._id}</small>
            </div>
            <button class="btn btn-sm btn-outline-secondary" data-id="${item._id}" data-title="${item.title}" data-price="${item.price}">Chon</button>
          </div>
        `;
      }).join("");
      productsAdminEl.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", () => {
          document.getElementById("product-id").value = btn.dataset.id;
          document.getElementById("product-id-delete").value = btn.dataset.id;
          document.getElementById("product-title-update").value = btn.dataset.title;
          document.getElementById("product-price-update").value = btn.dataset.price;
        });
      });
    } catch (err) {
      productsAdminEl.textContent = "Loi tai san pham";
      logStatus(err.message);
    }
  }

  if (loadProductsBtn) {
    loadProductsBtn.addEventListener("click", () => loadProductsAdmin());
  }

  document.getElementById("category-create").addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("category-name").value.trim();
    try {
      await api("/api/v1/categories", {
        method: "POST",
        auth: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      logStatus("Da tao danh muc");
      await loadCategories();
    } catch (err) {
      logStatus(err.message);
    }
  });

  document.getElementById("category-update").addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.getElementById("category-id").value.trim();
    const name = document.getElementById("category-name-update").value.trim();
    try {
      await api(`/api/v1/categories/${id}`, {
        method: "PUT",
        auth: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      logStatus("Da cap nhat danh muc");
      await loadCategories();
    } catch (err) {
      logStatus(err.message);
    }
  });

  document.getElementById("category-delete").addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.getElementById("category-id-delete").value.trim();
    try {
      await api(`/api/v1/categories/${id}`, { method: "DELETE", auth: true });
      logStatus("Da xoa danh muc");
      await loadCategories();
    } catch (err) {
      logStatus(err.message);
    }
  });

  document.getElementById("brand-create").addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("brand-name").value.trim();
    const logo = document.getElementById("brand-logo").value.trim();
    const description = document.getElementById("brand-desc").value.trim();
    try {
      await api("/api/v1/brands", {
        method: "POST",
        auth: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, logo, description })
      });
      logStatus("Da tao thuong hieu");
      await loadBrands();
    } catch (err) {
      logStatus(err.message);
    }
  });

  document.getElementById("brand-update").addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.getElementById("brand-id").value.trim();
    const description = document.getElementById("brand-desc-update").value.trim();
    const name = document.getElementById("brand-name-update").value.trim();
    const logo = document.getElementById("brand-logo-update").value.trim();
    const payload = {};
    if (description) payload.description = description;
    if (name) payload.name = name;
    if (logo) payload.logo = logo;
    try {
      await api(`/api/v1/brands/${id}`, {
        method: "PUT",
        auth: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      logStatus("Da cap nhat thuong hieu");
      await loadBrands();
    } catch (err) {
      logStatus(err.message);
    }
  });

  document.getElementById("brand-delete").addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.getElementById("brand-id-delete").value.trim();
    try {
      await api(`/api/v1/brands/${id}`, { method: "DELETE", auth: true });
      logStatus("Da xoa thuong hieu");
      await loadBrands();
    } catch (err) {
      logStatus(err.message);
    }
  });

  document.getElementById("product-create").addEventListener("submit", async (event) => {
    event.preventDefault();
    const sku = document.getElementById("product-sku").value.trim();
    const title = document.getElementById("product-title").value.trim();
    const price = Number(document.getElementById("product-price").value);
    const sizesRaw = document.getElementById("product-sizes").value.trim();
    const description = document.getElementById("product-desc").value.trim();
    const imagesRaw = document.getElementById("product-images").value.trim();
    const category = productCategorySelect.value;
    const brand = productBrandSelect.value || undefined;
    const images = imagesRaw ? imagesRaw.split(",").map((i) => i.trim()).filter(Boolean) : [];
    const sizes = sizesRaw
      ? sizesRaw.split(",").map((pair) => {
          const [size, stock] = pair.split(":").map((v) => v.trim());
          return { size: size, stock: Number(stock) || 0 };
        }).filter((s) => s.size)
      : [];
    try {
      const created = await api("/api/v1/products", {
        method: "POST",
        auth: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, title, price, description, images, category, brand, sizes })
      });
      if (!created || !created.product) {
        throw new Error("Tao san pham that bai");
      }
      logStatus("Da tao san pham");
      await loadProductsAdmin();
    } catch (err) {
      logStatus(err.message);
    }
  });

  document.getElementById("product-update").addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.getElementById("product-id").value.trim();
    const price = document.getElementById("product-price-update").value.trim();
    const title = document.getElementById("product-title-update").value.trim();
    const sizesRaw = document.getElementById("product-sizes-update").value.trim();
    const payload = {};
    if (price) payload.price = Number(price);
    if (title) payload.title = title;
    if (sizesRaw) {
      payload.sizes = sizesRaw.split(",").map((pair) => {
        const [size, stock] = pair.split(":").map((v) => v.trim());
        return { size: size, stock: Number(stock) || 0 };
      }).filter((s) => s.size);
    }
    try {
      await api(`/api/v1/products/${id}`, {
        method: "PUT",
        auth: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      logStatus("Da cap nhat san pham");
      await loadProductsAdmin();
    } catch (err) {
      logStatus(err.message);
    }
  });

  document.getElementById("product-delete").addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.getElementById("product-id-delete").value.trim();
    try {
      await api(`/api/v1/products/${id}`, { method: "DELETE", auth: true });
      logStatus("Da xoa san pham");
      await loadProductsAdmin();
    } catch (err) {
      logStatus(err.message);
    }
  });

  document.getElementById("upload-one").addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = document.getElementById("upload-one-file").files[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      const result = await api("/api/v1/upload/one_image", {
        method: "POST",
        auth: true,
        body: form
      });
      uploadResultEl.textContent = JSON.stringify(result, null, 2);
      logStatus("Upload 1 anh thanh cong");
    } catch (err) {
      logStatus(err.message);
    }
  });

  document.getElementById("upload-multi").addEventListener("submit", async (event) => {
    event.preventDefault();
    const files = document.getElementById("upload-multi-files").files;
    if (!files.length) return;
    const form = new FormData();
    Array.from(files).forEach((file) => form.append("files", file));
    try {
      const result = await api("/api/v1/upload/multiple_images", {
        method: "POST",
        auth: true,
        body: form
      });
      uploadResultEl.textContent = JSON.stringify(result, null, 2);
      logStatus("Upload nhieu anh thanh cong");
    } catch (err) {
      logStatus(err.message);
    }
  });

  document.getElementById("upload-excel").addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = document.getElementById("upload-excel-file").files[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      const result = await api("/api/v1/upload/excel", {
        method: "POST",
        auth: true,
        body: form
      });
      uploadResultEl.textContent = JSON.stringify(result, null, 2);
      logStatus("Upload excel thanh cong");
    } catch (err) {
      logStatus(err.message);
    }
  });

  await loadCategories();
  await loadBrands();
  await loadProductsAdmin();
};

const bindLogin = () => {
  updateTopbar();
  const form = document.getElementById("login-form");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();
    try {
      const token = await api("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      setToken(token);
      logStatus("Dang nhap thanh cong");
      const next = getNextUrl();
      if (next) {
        window.location.href = next;
      } else {
        window.location.href = "/index.html";
      }
    } catch (err) {
      logStatus(err.message);
    }
  });
};

const bindRegister = () => {
  updateTopbar();
  const form = document.getElementById("register-form");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("register-username").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value.trim();
    try {
      await api("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });
      logStatus("Dang ky thanh cong. Hay dang nhap.");
    } catch (err) {
      logStatus(err.message);
    }
  });
};

let currentCategory = "";
let currentBrand = "";

window.setCategory = (id) => {
    currentCategory = id;
    loadProducts().catch((e) => logStatus(e.message));
};

window.setBrand = (id) => {
    currentBrand = id;
    loadProducts().catch((e) => logStatus(e.message));
};

const loadSidebarFilters = async () => {
    try {
        const categories = await api("/api/v1/categories");
        const brands = await api("/api/v1/brands");
        
        const catEl = document.getElementById("sidebar-categories");
        if (catEl) {
            catEl.innerHTML = `<li><a class="text-decoration-none fw-bold" href="javascript:void(0)" onclick="setCategory('')">Tất cả</a></li>`;
            categories.forEach(c => {
                catEl.innerHTML += `<li><a class="text-decoration-none" href="javascript:void(0)" onclick="setCategory('${c._id}')">${c.name}</a></li>`;
            });
        }
        
        const brandEl = document.getElementById("sidebar-brands");
        if (brandEl) {
            brandEl.innerHTML = `<li><a class="text-decoration-none fw-bold" href="javascript:void(0)" onclick="setBrand('')">Tất cả</a></li>`;
            brands.forEach(b => {
                brandEl.innerHTML += `<li><a class="text-decoration-none" href="javascript:void(0)" onclick="setBrand('${b._id}')">${b.name}</a></li>`;
            });
        }
    } catch(err) {
        logStatus(err.message);
    }
};

const bindProductsPage = () => {
  updateTopbar();
  loadSidebarFilters().catch((e) => logStatus(e.message));
  const filterBtn = document.getElementById("filter-btn");
  if (filterBtn) filterBtn.addEventListener("click", () => loadProducts().catch((e) => logStatus(e.message)));
  loadProducts().catch((e) => logStatus(e.message));
};

const bindCartPage = () => {
  updateTopbar();
  if (!getToken()) {
    redirectToLogin();
    return;
  }
  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) checkoutBtn.addEventListener("click", async () => {
    try {
      const reservation = await createReservationFromCart();
      if (!reservation || !reservation._id) return;
      const momo = await api("/api/v1/payments/momo/create", {
        method: "POST",
        auth: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId: reservation._id })
      });
      if (momo && momo.payUrl) {
        window.location.href = momo.payUrl;
      }
    } catch (err) {
      logStatus(err.message);
    }
  });
  loadCart().catch((e) => logStatus(e.message));
};

const loadHistory = async () => {
  updateTopbar();
  if (!getToken()) {
    redirectToLogin();
    return;
  }
  const msgEl = document.getElementById("history-msg");
  const itemsEl = document.getElementById("history-items");
  const emptyEl = document.getElementById("history-empty");
  const params = new URLSearchParams(window.location.search);
  if (msgEl) {
    if (params.get("momo") === "success") msgEl.textContent = "Thanh toan MoMo thanh cong.";
    else if (params.get("momo") === "failed") msgEl.textContent = "Thanh toan MoMo that bai.";
    else msgEl.textContent = "";
  }
  try {
    const data = await api("/api/v1/reservations/me", { auth: true });
    itemsEl.innerHTML = "";
    if (!data.length) {
      if (emptyEl) emptyEl.textContent = "Chua co don hang";
      return;
    }
    if (emptyEl) emptyEl.textContent = "";
    data.forEach((order) => {
      const itemsHtml = (order.items || []).map(i => `
        <tr>
          <td>${i.title}</td>
          <td>${i.size}</td>
          <td>${i.quantity}</td>
          <td>${formatVnd(i.price)}</td>
          <td>${formatVnd(i.subtotal)}</td>
        </tr>
      `).join("");
      const card = document.createElement("div");
      card.className = "card border-0 shadow-sm";
      card.innerHTML = `
        <div class="card-body">
          <div class="d-flex justify-content-between flex-wrap gap-2">
            <div>
              <div class="fw-bold">Ma don: ${order._id}</div>
              <div class="text-muted small">Ngay: ${new Date(order.createdAt).toLocaleString()}</div>
            </div>
            <div class="text-end">
              <div class="badge bg-success">${order.paymentStatus || order.status}</div>
              <div class="small text-muted mt-1">Phuong thuc: ${order.paymentMethod || "COD"}</div>
            </div>
          </div>
          <div class="row mt-3 g-3">
            <div class="col-md-6">
              <h6 class="mb-2">Thong tin giao hang</h6>
              <div>Ho ten: ${order.shippingName || "-"}</div>
              <div>So dien thoai: ${order.shippingPhone || "-"}</div>
              <div>Dia chi: ${order.shippingAddress || "-"}</div>
              <div>Ghi chu: ${order.shippingNote || "-"}</div>
            </div>
            <div class="col-md-6">
              <h6 class="mb-2">Thanh toan</h6>
              <div>Tong tien: <strong>${formatVnd(order.amount)}</strong></div>
            </div>
          </div>
          <div class="table-responsive mt-3">
            <table class="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>San pham</th>
                  <th>Size</th>
                  <th>So luong</th>
                  <th>Gia</th>
                  <th>Tam tinh</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml || `<tr><td colspan="5" class="text-muted">Khong co san pham</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      `;
      itemsEl.appendChild(card);
    });
  } catch (err) {
    logStatus(err.message);
  }
};

if (page === "home") {
  loadHome();
} else if (page === "login") {
  bindLogin();
} else if (page === "register") {
  bindRegister();
} else if (page === "products") {
  bindProductsPage();
} else if (page === "product-detail") {
  loadProductDetail();
} else if (page === "cart") {
  bindCartPage();
} else if (page === "admin") {
  loadAdmin();
} else if (page === "history") {
  loadHistory();
}
