document.addEventListener("DOMContentLoaded", function() {
    // 初始化商品展示
    fetchProducts();
    // 初始化分页按钮
    setupPagination();

    // 绑定菜单按钮的点击事件
    var menuButton = document.querySelector('.menu-btn');
    if (menuButton) {
        menuButton.addEventListener('click', toggleMenu);
    }
});

function toggleMenu() {
    var categories = document.getElementById('categories');
    var mask = document.querySelector('.menu-mask');
    
    // 切换分类列表的显示状态
    if (categories.classList.contains('active')) {
        categories.classList.remove('active');
        mask.classList.remove('active');
    } else {
        categories.classList.add('active');
        mask.classList.add('active');
    }
}

// 修改已有的 toggleSubmenu 函数以适应小屏幕
function toggleSubmenu(arrow) {
    var submenu = arrow.nextElementSibling;
    if (submenu.style.display === 'block') {
        submenu.style.display = 'none';
    } else {
        // 隐藏其他所有子菜单
        var submenus = document.getElementsByClassName('submenu');
        for (var i = 0; i < submenus.length; i++) {
            submenus[i].style.display = 'none';
        }
        // 显示当前子菜单
        submenu.style.display = 'block';
    }
}

function fetchProducts(page) {
    fetch(`http://localhost:3000/api/products?page=${page}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        updateProductsDisplay(data.products);
        // 这里还需要添加分页按钮的生成和处理代码
      })
      .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
      });
  }

function updateProductsDisplay(products) {
    let productsContainer = document.getElementById('products');
    productsContainer.innerHTML = ''; // 清空当前内容
    products.forEach(product => {
        let productDiv = document.createElement('div');
        productDiv.classList.add('product');
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
    fetch(`http://localhost:3000/api/products/pages`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            let pageCount = data.pageCount; // 使用服务器返回的页数
            updatePaginationButtons(pageCount);
        })
        .catch(error => {
            console.error('Error fetching page count:', error);
        });
}

function updatePaginationButtons(pageCount) {
    let paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';
    
    for (let i = 1; i <= pageCount; i++) {
        (function(page) {
            let pageButton = document.createElement('button');
            pageButton.classList.add('pagination-btn');
            pageButton.textContent = page.toString();
            pageButton.addEventListener('click', function() {
                fetchProducts(page);
                updatePagination(page);
            });
            paginationContainer.appendChild(pageButton);
        })(i); // 立即执行该函数，并将当前的i值作为参数传递
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