const fs = require('fs');

const aboutContent = fs.readFileSync('d:/DoAnNN/NNPTUD-website-selling-shoes/public/about.html', 'utf8');

// Find start of content in about.html
const startMatch = aboutContent.match(/<section class="bg-success py-5">/);
// Find start of brands / footer
const endMatch = aboutContent.match(/<!-- Start Brands -->/);

if (startMatch && endMatch) {
    const header = aboutContent.substring(0, startMatch.index);
    const footer = aboutContent.substring(endMatch.index);

    const shopMiddle = `
    <!-- Start Content -->
    <div class="container py-5">
        <div class="row">

            <div class="col-lg-3">
                <h1 class="h2 pb-4">Danh Mục</h1>
                <ul class="list-unstyled templatemo-accordion">
                    <li class="pb-3">
                        <a class="collapsed d-flex justify-content-between h3 text-decoration-none" href="#">
                            GIỚI TÍNH
                            <i class="fa fa-fw fa-chevron-circle-down mt-1"></i>
                        </a>
                        <ul class="collapse show list-unstyled pl-3">
                            <li><a class="text-decoration-none" href="#">Nam</a></li>
                            <li><a class="text-decoration-none" href="#">Nữ</a></li>
                        </ul>
                    </li>
                    <li class="pb-3">
                        <a class="collapsed d-flex justify-content-between h3 text-decoration-none" href="#">
                            Giảm Giá
                            <i class="pull-right fa fa-fw fa-chevron-circle-down mt-1"></i>
                        </a>
                        <ul id="collapseTwo" class="collapse list-unstyled pl-3">
                            <li><a class="text-decoration-none" href="#">Sport</a></li>
                            <li><a class="text-decoration-none" href="#">Giày Thể Thao Cao Cấp</a></li>
                        </ul>
                    </li>
                    <li class="pb-3">
                        <a class="collapsed d-flex justify-content-between h3 text-decoration-none" href="#">
                            NHÃN HIỆU
                            <i class="pull-right fa fa-fw fa-chevron-circle-down mt-1"></i>
                        </a>
                        <ul id="collapseThree" class="collapse list-unstyled pl-3">
                            <li><a class="text-decoration-none" href="#">Nike</a></li>
                            <li><a class="text-decoration-none" href="#">Adidas</a></li>
                            <li><a class="text-decoration-none" href="#">Vans</a></li>
                            <li><a class="text-decoration-none" href="#">Converse</a></li>
                        </ul>
                    </li>
                </ul>
            </div>

            <div class="col-lg-9">
                <div class="row">
                    <div class="col-md-6">
                        <ul class="list-inline shop-top-menu pb-3 pt-1">
                            <li class="list-inline-item">
                                <a class="h3 text-dark text-decoration-none mr-3" href="#">Tất cả</a>
                            </li>
                            <li class="list-inline-item">
                                <a class="h3 text-dark text-decoration-none mr-3" href="#">Nam</a>
                            </li>
                            <li class="list-inline-item">
                                <a class="h3 text-dark text-decoration-none" href="#">Nữ</a>
                            </li>
                        </ul>
                    </div>
                    <div class="col-md-6 pb-4">
                        <div class="d-flex">
                            <select class="form-control">
                                <option>Nổi Bật</option>
                                <option>Sắp xếp A-Z</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Products container for app.js to populate -->
                <div class="row" id="products">
                </div>

                <div div="row">
                    <ul class="pagination pagination-lg justify-content-end" id="pagination">
                        <!-- Pagination dynamic -->
                    </ul>
                </div>
            </div>

        </div>
    </div>
    <!-- End Content -->
    `;

    // Replace <body data-page="about"> with products
    const finalHeader = header.replace('<body data-page="about">', '<body data-page="products">').replace('<title>NNPTUD Shoes - About Page</title>', '<title>NNPTUD Shoes - Danh Sách Sản Phẩm</title>');

    // Write correctly to products.html
    fs.writeFileSync('d:/DoAnNN/NNPTUD-website-selling-shoes/public/products.html', finalHeader + shopMiddle + footer, 'utf8');
    console.log("Successfully fixed products.html structure");
} else {
    console.log("Failed to match sections");
}
