const statusLog = document.getElementById("status-log");
const authStatus = document.getElementById("auth-status");
const productsEl = document.getElementById("products");
const categoriesEl = document.getElementById("categories");
const brandsEl = document.getElementById("brands");
const cartItemsEl = document.getElementById("cart-items");
const uploadResultEl = document.getElementById("upload-result");
const productCategorySelect = document.getElementById("product-category");
const productBrandSelect = document.getElementById("product-brand");

const getToken = () => localStorage.getItem("token") || "";
const setToken = (token) => {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
  updateAuthStatus();
};

const updateAuthStatus = () => {
  const token = getToken();
  authStatus.textContent = token ? "Da dang nhap" : "Chua dang nhap";
};

const logStatus = (message) => {
  const time = new Date().toLocaleTimeString();
  statusLog.textContent = `[${time}] ${message}\n` + statusLog.textContent;
};

const api = async (path, options = {}) => {
  const headers = options.headers ? { ...options.headers } : {};
  if (options.auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
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

const loadProducts = async () => {
  const title = document.getElementById("filter-title").value.trim();
  const min = document.getElementById("filter-min").value.trim();
  const max = document.getElementById("filter-max").value.trim();
  const params = new URLSearchParams();
  if (title) params.set("title", title);
  if (min) params.set("minprice", min);
  if (max) params.set("maxprice", max);
  const data = await api(`/api/v1/products?${params.toString()}`);
  productsEl.innerHTML = "";
  if (!data.length) {
    productsEl.textContent = "Khong co san pham";
    return;
  }
  data.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${item.title}</h3>
      <p class="price">${item.price} $</p>
      <p>Category: ${item.category?.name || "N/A"}</p>
      <p>Brand: ${item.brand?.name || "N/A"}</p>
      <p class="muted">${item._id}</p>
      <div class="stack">
        <input type="number" min="1" value="1" class="qty-input" />
        <button class="btn">Them vao gio</button>
      </div>
    `;
    const btn = card.querySelector("button");
    const qtyInput = card.querySelector(".qty-input");
    btn.addEventListener("click", async () => {
      try {
        await api("/api/v1/carts/add", {
          method: "POST",
          auth: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product: item._id,
            quantity: Number(qtyInput.value || 1),
          }),
        });
        logStatus("Da them vao gio hang");
      } catch (err) {
        logStatus(err.message);
      }
    });
    productsEl.appendChild(card);
  });
};

const loadCart = async () => {
  const data = await api("/api/v1/carts", { auth: true });
  renderList(cartItemsEl, data, (item) => `${item.product} x ${item.quantity}`);
};

const createReservationFromCart = async () => {
  const items = await api("/api/v1/carts", { auth: true });
  if (!items.length) {
    logStatus("Gio hang trong");
    return;
  }
  const payload = {
    items: items.map((i) => ({ product: i.product, quantity: i.quantity })),
    expiredIn: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
  };
  const result = await api("/api/v1/reservations", {
    method: "POST",
    auth: true,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  logStatus(`Da tao reservation: ${result._id}`);
};

document.getElementById("login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();
  try {
    const token = await api("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setToken(token);
    logStatus("Dang nhap thanh cong");
  } catch (err) {
    logStatus(err.message);
  }
});

document.getElementById("register-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = document.getElementById("register-username").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value.trim();
  try {
    await api("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    logStatus("Dang ky thanh cong. Hay dang nhap.");
  } catch (err) {
    logStatus(err.message);
  }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  setToken("");
  logStatus("Da dang xuat");
});

document.getElementById("me-btn").addEventListener("click", async () => {
  try {
    const data = await api("/api/v1/auth/me", { auth: true });
    logStatus(`Xin chao ${data.username} (${data.email})`);
  } catch (err) {
    logStatus(err.message);
  }
});

document.getElementById("filter-btn").addEventListener("click", loadProducts);
document.getElementById("load-cart").addEventListener("click", () => loadCart().catch((e) => logStatus(e.message)));
document.getElementById("create-reservation").addEventListener("click", () => createReservationFromCart().catch((e) => logStatus(e.message)));

document.getElementById("category-create").addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.getElementById("category-name").value.trim();
  try {
    await api("/api/v1/categories", {
      method: "POST",
      auth: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
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
      body: JSON.stringify({ name }),
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
      body: JSON.stringify({ name, logo, description }),
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
      body: JSON.stringify({ description }),
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
      body: JSON.stringify({ sku, title, price, description, images, category, brand }),
    });
    logStatus("Da tao san pham");
    await loadProducts();
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
      body: JSON.stringify(payload),
    });
    logStatus("Da cap nhat san pham");
    await loadProducts();
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
    await loadProducts();
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
      body: form,
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
      body: form,
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
      body: form,
    });
    uploadResultEl.textContent = JSON.stringify(result, null, 2);
    logStatus("Upload excel thanh cong");
  } catch (err) {
    logStatus(err.message);
  }
});

updateAuthStatus();
loadCategories().catch((e) => logStatus(e.message));
loadBrands().catch((e) => logStatus(e.message));
loadProducts().catch((e) => logStatus(e.message));
