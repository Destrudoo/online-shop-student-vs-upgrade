// Класс для управления корзиной
class CartManager {
    constructor(storageKey = 'upgrade_cart') {
        this.storageKey = storageKey;
        this.cart = { items: {} };
        this.listeners = [];
        this.loadCart();
    }

    // Загрузка из localStorage
    loadCart() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                this.cart = JSON.parse(saved);
            } catch (e) {
                this.cart = { items: {} };
            }
        } else {
            this.cart = { items: {} };
        }
        this.notifyListeners();
    }

    // Сохранение в localStorage
    saveCart() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.cart));
        this.notifyListeners();
    }

    // Добавление товара
    addItem(id, name, price) {
        if (this.cart.items[id]) {
            this.cart.items[id].quantity += 1;
        } else {
            this.cart.items[id] = { 
                name: name, 
                price: price, 
                quantity: 1 
            };
        }
        this.saveCart();
        this.showNotification(`➕ ${name} добавлен в корзину`);
    }

    // Удаление товара
    removeItem(id) {
        if (this.cart.items[id]) {
            const itemName = this.cart.items[id].name;
            delete this.cart.items[id];
            this.saveCart();
            this.showNotification(`✖️ ${itemName} удален из корзины`);
        }
    }

    // Изменение количества
    updateQuantity(id, newQuantity) {
        if (this.cart.items[id]) {
            if (newQuantity <= 0) {
                this.removeItem(id);
            } else {
                this.cart.items[id].quantity = newQuantity;
                this.saveCart();
            }
        }
    }

    // Очистка корзины
    clearCart() {
        this.cart.items = {};
        this.saveCart();
        this.showNotification('🗑️ Корзина очищена');
    }

    // Подсчет общей суммы
    getTotal() {
        return Object.values(this.cart.items).reduce((sum, item) => {
            return sum + (item.price * item.quantity);
        }, 0);
    }

    // Подсчет количества товаров
    getTotalItems() {
        return Object.values(this.cart.items).reduce((sum, item) => {
            return sum + item.quantity;
        }, 0);
    }

    // Получение всех товаров
    getItems() {
        return this.cart.items;
    }

    // Добавление слушателя изменений
    addListener(callback) {
        this.listeners.push(callback);
    }

    // Уведомление слушателей
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.cart.items));
    }

    // Показ уведомления
    showNotification(message) {
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--dark);
            color: white;
            padding: 15px 25px;
            border-radius: 50px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            border-left: 4px solid var(--primary);
        `;
        
        document.body.appendChild(notification);
        
        // Удаляем через 2 секунды
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
}

// Основной класс приложения
class App {
    constructor() {
        this.cartManager = new CartManager();
        this.products = [
            { id: 1, name: 'Учебник C++', price: 899, emoji: '📚' },
            { id: 2, name: 'Наушники', price: 1990, emoji: '🎧' },
            { id: 3, name: 'Мех. клавиатура', price: 4590, emoji: '⌨️' },
            { id: 4, name: 'Кружка Java', price: 650, emoji: '☕' },
            { id: 5, name: 'Мышка Logitech', price: 3200, emoji: '🖱️' },
            { id: 6, name: 'Монитор 24"', price: 12900, emoji: '🖥️' }
        ];
        
        this.init();
    }

    init() {
        this.renderProducts();
        this.renderCart();
        this.setupEventListeners();
        
        // Подписываемся на изменения корзины
        this.cartManager.addListener(() => {
            this.renderCart();
        });
    }

    renderProducts() {
        const grid = document.getElementById('productGrid');
        if (!grid) return;

        grid.innerHTML = this.products.map(product => `
            <div class="product-card" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">
                <div class="product-image">${product.emoji}</div>
                <h3>${product.name}</h3>
                <div class="product-price">
                    ${product.price.toLocaleString()} <small>₽</small>
                </div>
                <div class="add-hint">👆 Нажмите, чтобы добавить</div>
            </div>
        `).join('');

        // Добавляем обработчики на карточки товаров
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Предотвращаем срабатывание при клике на кнопки внутри
                if (e.target.closest('button')) return;
                
                const id = card.dataset.id;
                const name = card.dataset.name;
                const price = parseFloat(card.dataset.price);
                
                this.cartManager.addItem(id, name, price);
                
                // Анимация карточки
                card.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    card.style.transform = '';
                }, 200);
            });
        });
    }

    renderCart() {
        const cartItems = document.getElementById('cartItems');
        const cartCount = document.getElementById('cartCount');
        const cartTotal = document.getElementById('cartTotal');
        
        if (!cartItems || !cartCount || !cartTotal) return;

        const items = this.cartManager.getItems();
        const entries = Object.entries(items);

        // Обновляем счетчик
        cartCount.textContent = this.cartManager.getTotalItems();

        if (entries.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">Корзина пуста</p>';
            cartTotal.textContent = '0 ₽';
            return;
        }

        // Отрисовываем товары в корзине
        cartItems.innerHTML = entries.map(([id, item]) => `
            <div class="cart-item" data-id="${id}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${item.price} ₽</div>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" data-action="decrease" data-id="${id}">−</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn" data-action="increase" data-id="${id}">+</button>
                    <button class="remove-item" data-action="remove" data-id="${id}">✕</button>
                </div>
            </div>
        `).join('');

        // Обновляем общую сумму
        cartTotal.textContent = this.cartManager.getTotal().toLocaleString() + ' ₽';

        // Добавляем обработчики для кнопок
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                const currentItem = items[id];
                
                if (!currentItem) return;

                if (action === 'increase') {
                    this.cartManager.updateQuantity(id, currentItem.quantity + 1);
                } else if (action === 'decrease') {
                    this.cartManager.updateQuantity(id, currentItem.quantity - 1);
                }
            });
        });

        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                this.cartManager.removeItem(id);
            });
        });
    }

    setupEventListeners() {
        // Очистка корзины
        const clearBtn = document.getElementById('clearCart');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.cartManager.clearCart();
            });
        }

        // Добавляем стили для анимаций
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes fadeOut {
                from {
                    opacity: 1;
                }
                to {
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Запускаем приложение после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    new App();
});