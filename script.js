// API credentials and sheet information
// IMPORTANT: Replace these with your actual keys and IDs.
const API_KEY = "AIzaSyANHxkVsDT_nN0BHgyReFrkJYVvF5_Sl-Q";
const HOMEPAGE_SPREADSHEET_ID = "1uKNlnpZsmQbmIPkfEWvWK5qLHpgGOUeneaHM8wXPG3E";
const CATEGORY_SHEET_NAME = "Sheet1";
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1414181704515584143/qRwIDc9bpt-RClxCrfFOf8xReDD9iAWCFoI_RUK7160iFEHBuCNtd7YQ6Fim2Xxud-gT";

// Utility function to show a custom message modal instead of alert()
function showMessage(message) {
    const modal = document.getElementById('message-modal');
    const messageText = document.getElementById('message-text');
    messageText.textContent = message;
    modal.style.display = 'block';

    const closeButtons = modal.querySelectorAll('.close-button');
    closeButtons.forEach(button => {
        button.onclick = () => {
            modal.style.display = 'none';
        };
    });
}

// Function to fetch data from a specific spreadsheet ID and sheet
async function fetchSheetData(spreadsheetId, sheetName = 'Sheet1') {
    // A to I columns, including tags
    const range = `${sheetName}!A:I`; 
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${API_KEY}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data.values;
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}

// Sidebar and menu toggle logic
function setupSidebar() {
    const hamburgerBtn = document.getElementById('hamburger-menu-btn');
    const sideMenu = document.getElementById('side-menu');
    hamburgerBtn.addEventListener('click', () => {
        sideMenu.classList.toggle('open');
    });
}

// Cart logic (using localStorage for a simple demo)
function getCart() {
    try {
        return JSON.parse(localStorage.getItem('cart')) || {};
    } catch (e) {
        console.error("Error parsing cart data from localStorage:", e);
        return {};
    }
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function addToCart(item, quantity = 1) {
    try {
        const cart = getCart();
        if (cart[item.id]) {
            cart[item.id].quantity += quantity;
        } else {
            cart[item.id] = { ...item, quantity };
        }
        saveCart(cart);
        showMessage(`Added ${quantity} of ${item.name} to cart!`);
        console.log('Item added to cart:', item);
    } catch (error) {
        console.error('Error adding item to cart:', error);
        alert('Failed to add item to cart. Please try again.');
    }
}

function updateCartCount() {
    const cart = getCart();
    const count = Object.values(cart).reduce((total, item) => total + item.quantity, 0);
    const cartCountElements = document.querySelectorAll('#cart-count');
    cartCountElements.forEach(el => el.textContent = count);
}

// Homepage Functions
async function loadHomepage() {
    setupSidebar();
    updateCartCount();

    const categoriesData = await fetchSheetData(HOMEPAGE_SPREADSHEET_ID, CATEGORY_SHEET_NAME);
    const categoriesContainer = document.getElementById('categories-container');
    
    if (!categoriesData) {
        categoriesContainer.innerHTML = "<p>Couldn't load categories, my bad.</p>";
        return;
    }
    
    // Skip header row
    const categories = categoriesData.slice(1);
    
    categories.forEach(row => {
        const categoryName = row[0];
        const categorySheetId = row[1];
        if (categoryName && categorySheetId) {
            const link = document.createElement('a');
            link.href = `category.html?cat=${encodeURIComponent(categoryName)}&id=${encodeURIComponent(categorySheetId)}`;
            link.classList.add('category-link');
            link.textContent = categoryName;
            categoriesContainer.appendChild(link);
        }
    });

    // Slideshow logic
    let slideIndex = 0;
    const slides = document.querySelectorAll('.slideshow .slide');
    const showSlides = () => {
        for (let i = 0; i < slides.length; i++) {
            slides[i].style.display = 'none';
        }
        slideIndex++;
        if (slideIndex > slides.length) { slideIndex = 1; }
        slides[slideIndex - 1].style.display = 'block';
        setTimeout(showSlides, 3000); // Change image every 3 seconds
    };
    if (slides.length > 0) {
        showSlides();
    }
    // Setup floating cart button listener
    const floatingCartBtn = document.getElementById('floating-cart-btn');
    if (floatingCartBtn) {
        floatingCartBtn.addEventListener('click', () => {
            window.location.href = 'cart.html';
        });
    }
}

// Category Page Functions
async function loadCategoryPage() {
    setupSidebar();
    updateCartCount();

    const urlParams = new URLSearchParams(window.location.search);
    const categoryName = urlParams.get('cat');
    const categorySheetId = urlParams.get('id');

    const categoryHeader = document.getElementById('category-name-header');
    const productsContainer = document.getElementById('products-container');
    
    if (!categoryName || !categorySheetId) {
        productsContainer.innerHTML = "<p>No category selected, my bad.</p>";
        return;
    }

    categoryHeader.textContent = categoryName;
    document.getElementById('category-page-title').textContent = categoryName;
    
    const productsData = await fetchSheetData(categorySheetId);
    
    if (!productsData) {
        productsContainer.innerHTML = "<p>No products found in this category, fam.</p>";
        return;
    }

    // Skip header row
    const products = productsData.slice(1);
    
    products.forEach(row => {
        const itemName = row[0];
        const brandName = row[1];
        const weight = row[2];
        const mainPrice = parseFloat(row[3]);
        const discountedPrice = parseFloat(row[4]);
        const imageLink = row[5];
        const productId = row[6];
        const tags = row[7];

        const productCard = document.createElement('div');
        productCard.classList.add('product-card');

        let priceHtml = `<p class="price">$${mainPrice.toFixed(2)}</p>`;
        if (discountedPrice && discountedPrice < mainPrice) {
            priceHtml = `<p class="price discounted"><span class="main-price-strikethrough">$${mainPrice.toFixed(2)}</span>$${discountedPrice.toFixed(2)}</p>`;
        }
        
        productCard.innerHTML = `
            <img src="${imageLink}" alt="${itemName}" onerror="this.onerror=null; this.src='https://placehold.co/150x150/8C7047/ffffff?text=Image+Not+Found'">
            <h3>${itemName}</h3>
            ${priceHtml}
            <button class="add-to-cart-btn" data-id="${productId}" data-name="${itemName}" data-price="${discountedPrice < mainPrice ? discountedPrice : mainPrice}" data-image="${imageLink}">Add to Cart</button>
        `;
        productsContainer.appendChild(productCard);

        // Add event listener for item popup
        productCard.addEventListener('click', (e) => {
            if (!e.target.classList.contains('add-to-cart-btn')) {
                showItemModal({
                    id: productId,
                    name: itemName,
                    brand: brandName,
                    weight: weight,
                    mainPrice: mainPrice,
                    discountedPrice: discountedPrice,
                    image: imageLink,
                    tags: tags
                });
            }
        });
    });

    // Cart functionality is now handled by the global event listener in window.onload

    // Setup floating cart button listener
    const floatingCartBtn = document.getElementById('floating-cart-btn');
    if (floatingCartBtn) {
        floatingCartBtn.addEventListener('click', () => {
            window.location.href = 'cart.html';
        });
    }
}

function showItemModal(item) {
    const modal = document.getElementById('item-modal');
    const modalInner = document.getElementById('modal-content-inner');
    
    let priceHtml = `<p class="price">$${item.mainPrice.toFixed(2)}</p>`;
    if (item.discountedPrice && item.discountedPrice < item.mainPrice) {
        priceHtml = `<p class="price discounted"><span class="main-price-strikethrough">$${item.mainPrice.toFixed(2)}</span>$${item.discountedPrice.toFixed(2)}</p>`;
    }

    modalInner.innerHTML = `
        <div class="item-modal-content">
            <img src="${item.image}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p><strong>Brand:</strong> ${item.brand}</p>
            <p><strong>Weight:</strong> ${item.weight}</p>
            ${priceHtml}
            <p><strong>Product ID:</strong> ${item.id}</p>
            <p><strong>Tags:</strong> ${item.tags}</p>
            <button class="add-to-cart-btn" data-id="${item.id}" data-name="${item.name}" data-price="${item.discountedPrice < item.mainPrice ? item.discountedPrice : item.mainPrice}" data-image="${item.image}">Add to Cart</button>
        </div>
    `;
    modal.style.display = 'block';

    const closeButton = modal.querySelector('.close-button');
    closeButton.onclick = () => {
        modal.style.display = 'none';
    };

    // Cart functionality is now handled by the global event listener in window.onload
    // Just need to close the modal when the button is clicked
    modalInner.querySelector('.add-to-cart-btn').addEventListener('click', function() {
        modal.style.display = 'none';
    });
}

// Cart Page Functions
function loadCartPage() {
    setupSidebar();
    updateCartCount();

    const cart = getCart();
    const cartItemsContainer = document.getElementById('cart-items-container');
    const totalPriceContainer = document.getElementById('total-price-container');
    let totalPrice = 0;

    cartItemsContainer.innerHTML = '';
    if (Object.keys(cart).length === 0) {
        cartItemsContainer.innerHTML = "<p>Your cart is empty, fam.</p>";
    } else {
        for (const itemId in cart) {
            const item = cart[itemId];
            const itemCard = document.createElement('div');
            itemCard.classList.add('cart-item-card');
            
            const itemTotal = item.price * item.quantity;
            totalPrice += itemTotal;

            itemCard.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>Price: $${item.price.toFixed(2)} x ${item.quantity}</p>
                    <p>Total: $${itemTotal.toFixed(2)}</p>
                    <div class="cart-item-actions">
                        <button class="quantity-btn decrease" data-id="${itemId}">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn increase" data-id="${itemId}">+</button>
                        <button class="delete-btn" data-id="${itemId}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(itemCard);
        }

        cartItemsContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            
            const itemId = btn.dataset.id;
            const cart = getCart();
            
            if (btn.classList.contains('increase')) {
                cart[itemId].quantity++;
            } else if (btn.classList.contains('decrease')) {
                if (cart[itemId].quantity > 1) {
                    cart[itemId].quantity--;
                }
            } else if (btn.classList.contains('delete-btn')) {
                delete cart[itemId];
            }
            saveCart(cart);
            loadCartPage(); // Reload the cart page to reflect changes
        });
    }

    totalPriceContainer.innerHTML = `Total: $${totalPrice.toFixed(2)}`;

    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmit);
    }
}

async function handleOrderSubmit(e) {
    e.preventDefault();
    const cart = getCart();
    const customerName = document.getElementById('customer-name').value;
    const customerPhone = document.getElementById('customer-phone').value;
    const customerAddress = document.getElementById('customer-address').value;
    
    if (Object.keys(cart).length === 0) {
        showMessage("Your cart is empty, add some items to order!");
        return;
    }
    
    if (!customerName || !customerPhone) {
        showMessage("Please fill in your name and phone number to complete the order.");
        return;
    }

    const orderDetails = {
        customerName,
        customerPhone,
        customerAddress,
        items: Object.values(cart),
        totalPrice: Object.values(cart).reduce((total, item) => total + (item.price * item.quantity), 0)
    };

    const webhookData = {
        "content": "New Order Received!",
        "embeds": [{
            "title": "Order Receipt",
            "color": 6737517, // Brown in decimal
            "fields": [
                {
                    "name": "Customer Info",
                    "value": `Name: ${orderDetails.customerName}\nPhone: ${orderDetails.customerPhone}\nAddress: ${orderDetails.customerAddress || 'N/A'}`,
                    "inline": false
                },
                {
                    "name": "Items",
                    "value": orderDetails.items.map(item => `- ${item.name} x${item.quantity} ($${item.price.toFixed(2)})`).join('\n'),
                    "inline": false
                },
                {
                    "name": "Total Price",
                    "value": `$${orderDetails.totalPrice.toFixed(2)}`,
                    "inline": false
                }
            ],
            "footer": {
                "text": "Order received from Nitto Sodai"
            },
            "timestamp": new Date().toISOString()
        }]
    };
    
    try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookData),
        });
        
        if (response.ok) {
            showMessage("Order placed successfully! Thank you!");
            localStorage.removeItem('cart');
            loadCartPage();
        } else {
            throw new Error(`Discord Webhook failed with status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error sending webhook:', error);
        showMessage("Error placing order. Please try again.");
    }
}

// Route the script based on the current page
window.onload = () => {
    // Initialize cart from localStorage
    updateCartCount();
    
    // Determine which page we're on
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    
    // Setup floating cart button listener
    const floatingCartBtn = document.getElementById('floating-cart-btn');
    if (floatingCartBtn) {
        floatingCartBtn.addEventListener('click', () => {
            window.location.href = 'cart.html';
        });
    }

    // Setup global event listener for all Add to Cart buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart-btn')) {
            e.preventDefault();
            e.stopPropagation();
            const btn = e.target;
            const item = {
                id: btn.dataset.id,
                name: btn.dataset.name,
                price: parseFloat(btn.dataset.price),
                image: btn.dataset.image
            };
            addToCart(item);
            return false;
        }
    }, true);

    // Load appropriate page content
    if (filename.includes('category.html')) {
        loadCategoryPage();
    } else if (filename.includes('cart.html')) {
        loadCartPage();
    } else {
        loadHomepage();
    }
};

