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
  const topLogout = document.getElementById("top-logout");
  const loginLink = document.querySelector('.auth-actions a[href="/login.html"]');
  const registerLink = document.querySelector('.auth-actions a[href="/register.html"]');
  if (!topUser || !topLogout || !loginLink || !registerLink) return;
  try {
    const me = await api("/api/v1/auth/me", { auth: true });
    topUser.textContent = me.username;
    topLogout.classList.remove("hidden");
    loginLink.classList.add("hidden");
    registerLink.classList.add("hidden");
    topLogout.onclick = () => {
      setToken("");
      window.location.href = "/index.html";
    };
  } catch (err) {
    topUser.textContent = "";
    topLogout.classList.add("hidden");
    loginLink.classList.remove("hidden");
    registerLink.classList.remove("hidden");
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
      setToken("");
      logStatus("Da dang xuat");
      updateAuthStatus();
      updateTopbar();
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
                      <li class="text-muted text-right">$${item.price}</li>
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
              <p class="text-center mb-0">$${item.price}</p>
              <input type="hidden" value="1" class="qty-input" />
          </div>
      </div>
    `;
    const btn = card.querySelector(".add-to-cart-btn");
    const qtyInput = card.querySelector(".qty-input");
    btn.addEventListener("click", async () => {
      try {
        if (!getToken()) {
          redirectToLogin();
          return;
        }
        await api("/api/v1/carts/add", {
          method: "POST",
          auth: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product: item._id,
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
                      <p class="h3 py-2">$${item.price}</p>
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
    document.getElementById("detail-add").addEventListener("click", async () => {
      try {
        if (!getToken()) {
          redirectToLogin();
          return;
        }
        const quantity = Number(document.getElementById("detail-qty").value || 1);
        await api("/api/v1/carts/add", {
          method: "POST",
          auth: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product: item._id, quantity })
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
  const data = await api("/api/v1/carts", { auth: true });
  cartItemsEl.innerHTML = "";
  if (!data.length) {
    cartItemsEl.textContent = "Gio hang trong";
    return;
  }
  data.forEach((item) => {
    const row = document.createElement("div");
    row.className = "list-row";
    row.innerHTML = `
      <span>${item.product}</span>
      <span>x ${item.quantity}</span>
      <button class="btn ghost">Giam 1</button>
    `;
    row.querySelector("button").addEventListener("click", async () => {
      try {
        await api("/api/v1/carts/remove", {
          method: "POST",
          auth: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ product: item.product, quantity: 1 })
        });
        await loadCart();
      } catch (err) {
        logStatus(err.message);
      }
    });
    cartItemsEl.appendChild(row);
  });
};

const createReservationFromCart = async () => {
  const items = await api("/api/v1/carts", { auth: true });
  if (!items.length) {
    logStatus("Gio hang trong");
    return;
  }
  const payload = {
    items: items.map((i) => ({ product: i.product, quantity: i.quantity })),
    expiredIn: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  };
  const result = await api("/api/v1/reservations", {
    method: "POST",
    auth: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  logStatus(`Da tao reservation: ${result._id}`);
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
      adminStatus.textContent = "Khong du quyen ADMIN";
      const sections = document.getElementById("admin-sections");
      const sections2 = document.getElementById("admin-sections-2");
      if (sections) sections.classList.add("hidden");
      if (sections2) sections2.classList.add("hidden");
      return;
    }
    adminStatus.textContent = `Xin chao ${me.username} (ADMIN)`;
  } catch (err) {
    adminStatus.textContent = "Chua dang nhap";
    return;
  }

  const categoriesEl = document.getElementById("categories");
  const brandsEl = document.getElementById("brands");
  const productCategorySelect = document.getElementById("product-category");
  const productBrandSelect = document.getElementById("product-brand");
  const uploadResultEl = document.getElementById("upload-result");

  const loadCategories = async () => {
    const data = await api("/api/v1/categories");
    renderList(categoriesEl, data, (item) => `${item._id} - ${item.name}`);
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
    renderList(brandsEl, data, (item) => `${item._id} - ${item.name}`);
    productBrandSelect.innerHTML = "<option value=''>Khong co</option>";
    data.forEach((item) => {
      const option = document.createElement("option");
      option.value = item._id;
      option.textContent = item.name;
      productBrandSelect.appendChild(option);
    });
  };

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
    try {
      await api(`/api/v1/brands/${id}`, {
        method: "PUT",
        auth: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description })
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
    const description = document.getElementById("product-desc").value.trim();
    const imagesRaw = document.getElementById("product-images").value.trim();
    const category = productCategorySelect.value;
    const brand = productBrandSelect.value || undefined;
    const images = imagesRaw ? imagesRaw.split(",").map((i) => i.trim()).filter(Boolean) : [];
    try {
      await api("/api/v1/products", {
        method: "POST",
        auth: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, title, price, description, images, category, brand })
      });
      logStatus("Da tao san pham");
    } catch (err) {
      logStatus(err.message);
    }
  });

  document.getElementById("product-update").addEventListener("submit", async (event) => {
    event.preventDefault();
    const id = document.getElementById("product-id").value.trim();
    const price = document.getElementById("product-price-update").value.trim();
    const title = document.getElementById("product-title-update").value.trim();
    const payload = {};
    if (price) payload.price = Number(price);
    if (title) payload.title = title;
    try {
      await api(`/api/v1/products/${id}`, {
        method: "PUT",
        auth: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      logStatus("Da cap nhat san pham");
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
  const loadBtn = document.getElementById("load-cart");
  const createBtn = document.getElementById("create-reservation");
  if (loadBtn) loadBtn.addEventListener("click", () => loadCart().catch((e) => logStatus(e.message)));
  if (createBtn) createBtn.addEventListener("click", () => createReservationFromCart().catch((e) => logStatus(e.message)));
  loadCart().catch((e) => logStatus(e.message));
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
}
