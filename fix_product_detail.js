const fs = require('fs');

const aboutContent = fs.readFileSync('d:/DoAnNN/NNPTUD-website-selling-shoes/public/about.html', 'utf8');

// Find start of content in about.html
const startMatch = aboutContent.match(/<section class="bg-success py-5">/);
// Find start of brands / footer
const endMatch = aboutContent.match(/<!-- Start Brands -->/);

if (startMatch && endMatch) {
    const header = aboutContent.substring(0, startMatch.index);
    const footer = aboutContent.substring(endMatch.index);

    const detailMiddle = `
    <!-- Open Content -->
    <section class="bg-light">
        <div class="container pb-5" id="product-detail-wrapper">
            <!-- Dynamic product detail renders here -->
        </div>
    </section>
    <!-- Close Content -->
    `;

    // Replace body data-page
    const finalHeader = header.replace('<body data-page="about">', '<body data-page="product-detail">').replace('<title>NNPTUD Shoes - About Page</title>', '<title>NNPTUD Shoes - Chi Tiết Sản Phẩm</title>');

    fs.writeFileSync('d:/DoAnNN/NNPTUD-website-selling-shoes/public/product-detail.html', finalHeader + detailMiddle + footer, 'utf8');
    console.log("Successfully fixed product-detail.html layout");
} else {
    console.log("Failed to match sections");
}
