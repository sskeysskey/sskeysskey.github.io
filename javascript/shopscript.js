document.addEventListener("DOMContentLoaded", function() {
    // 初始化商品展示
    loadProducts(1);
    // 初始化分页按钮
    setupPagination();
});

function toggleSubmenu(arrowElement) {
    let submenu = arrowElement.nextElementSibling;
    submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
}

function loadProducts(pageNumber) {
    // 假设有一个getProducts函数用于获取商品数据
    let products = getProducts(pageNumber);
    let productsContainer = document.getElementById('products');
    productsContainer.innerHTML = ''; // 清空当前内容
    products.forEach(product => {
        let productDiv = document.createElement('div');
        productDiv.classList.add('product');
        // 填充商品信息，此处简化，实际应根据产品属性填充
        productDiv.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.name}">
            <div class="info">
                <h3>${product.name}</h3>
                <p>${product.uploadDate}</p>
            </div>`;
        productsContainer.appendChild(productDiv);
    });
}

function setupPagination() {
    // 假设有一个getPageCount函数用于获取总页数
    let pageCount = getPageCount();
    let paginationContainer = document.getElementById('pagination');
    for (let i = 1; i <= pageCount; i++) {
        let pageButton = document.createElement('span');
        pageButton.classList.add('pagination-btn');
        pageButton.textContent =i.toString();
        pageButton.addEventListener('click', function() {
            loadProducts(i);
            updatePagination(i);
        });
        paginationContainer.appendChild(pageButton);
    }
    updatePagination(1);
}

function updatePagination(activePage) {
    let buttons = document.querySelectorAll('.pagination-btn');
    buttons.forEach(button => {
        if (parseInt(button.textContent) === activePage) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// 示例函数，实际开发中应从服务器获取数据
function getProducts(pageNumber) {
    // 此处应该是一个AJAX请求，获取服务器上的产品数据
    // 以下是模拟数据
    return [
        { name: "产品1", imageUrl: "product1.jpg", uploadDate: "2024.2.29" },
        { name: "产品2", imageUrl: "product2.jpg", uploadDate: "2024.2.30" },
        // 更多商品...
    ];
}

function getPageCount() {
    // 此处应从服务器获取实际的页数
    // 以下是假定的页面数量
    return 10;
}