# Bao cao do an ban giay (Kich ban 1 thanh vien - 8 model)

## Tong quan
- Backend RESTful Node.js + MongoDB.
- 8 model: `users`, `roles`, `products`, `categories`, `brands`, `inventories`, `carts`, `reservations`.
- Co day du CRUD, xac thuc (authen), phan quyen (autho), upload anh/excel.

## Chay du an
1. Tao CSDL MongoDB local: `mongodb://localhost:27017/NNPTUD`.
2. Cai dependency va chay server:
   - `npm install`
   - `npm start`
3. Mo frontend: `http://localhost:3000/`

## Authen / Autho
- Dang ky tai khoan: `/api/v1/auth/register` tu dong gan role `CUSTOMER`.
- Dang nhap: `/api/v1/auth/login` tra ve token JWT.
- Truyen token cho nhung endpoint can quyen qua header:
  - `Authorization: Bearer <token>`

### Role mac dinh
Su dung 1 role du nhat de phan quyen:
- `ADMIN`
- `CUSTOMER` (tu dong tao neu chua co khi register)

## Upload
- Upload 1 anh: `POST /api/v1/upload/one_image` (form-data: `file`)
- Upload nhieu anh: `POST /api/v1/upload/multiple_images` (form-data: `files`)
- Upload excel: `POST /api/v1/upload/excel` (form-data: `file`)
- Lay file: `GET /api/v1/upload/:filename`

## Danh sach endpoint CRUD
### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/changepassword`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgotpassword`
- `POST /api/v1/auth/resetpassword/:token`

### Roles
- `GET /api/v1/roles`
- `GET /api/v1/roles/:id`
- `POST /api/v1/roles`
- `PUT /api/v1/roles/:id`
- `DELETE /api/v1/roles/:id`

### Users
- `GET /api/v1/users`
- `GET /api/v1/users/:id`
- `POST /api/v1/users`
- `POST /api/v1/users/bootstrap-admin` (chi dung lan dau)
- `PUT /api/v1/users/:id`
- `DELETE /api/v1/users/:id`

### Categories
- `GET /api/v1/categories`
- `GET /api/v1/categories/:id`
- `POST /api/v1/categories`
- `PUT /api/v1/categories/:id`
- `DELETE /api/v1/categories/:id`

### Brands
- `GET /api/v1/brands`
- `GET /api/v1/brands/:id`
- `POST /api/v1/brands`
- `PUT /api/v1/brands/:id`
- `DELETE /api/v1/brands/:id`

### Products
- `GET /api/v1/products`
- `GET /api/v1/products/:id`
- `POST /api/v1/products`
- `PUT /api/v1/products/:id`
- `DELETE /api/v1/products/:id`

### Inventories
- `GET /api/v1/inventories`
- `GET /api/v1/inventories/:id`
- `POST /api/v1/inventories`
- `PUT /api/v1/inventories/:id`
- `DELETE /api/v1/inventories/:id`

### Carts
- `GET /api/v1/carts`
- `POST /api/v1/carts/add`
- `POST /api/v1/carts/remove`

### Reservations
- `GET /api/v1/reservations`
- `GET /api/v1/reservations/me`
- `GET /api/v1/reservations/:id`
- `POST /api/v1/reservations`
- `PUT /api/v1/reservations/:id`
- `DELETE /api/v1/reservations/:id`

## Postman
Da tao file collection de test: `postman_collection.json`.
- Import vao Postman.
- Tao environment:
  - `baseUrl`: `http://localhost:3000`
  - `token`: token lay tu login

## Frontend
- Frontend thu cong su dung HTML/CSS/JS trong thu muc `public`.
- Cac trang:
  - `/index.html`: trang chu
  - `/login.html`: dang nhap
  - `/register.html`: dang ky
  - `/products.html`: danh sach san pham
  - `/product-detail.html?id=<id>`: chi tiet san pham
  - `/cart.html`: gio hang
  - `/admin.html`: trang admin (chi ADMIN)
- Chuc nang: dang nhap, dang ky, xem san pham, them vao gio, tao reservation, CRUD categories/brands/products, upload anh/excel.

## Chup anh Postman
Vui long chup anh cac chuc nang sau (lay tu collection):
- Auth: register, login, me
- CRUD tung model (1-2 request dai dien)
- Upload 1 anh va upload excel
