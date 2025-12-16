import { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import { pos, products as productsAPI } from '../services/api';

const POS = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [amountPaid, setAmountPaid] = useState('');

    useEffect(() => {
        loadProducts();
        loadCategories();
    }, []);

    useEffect(() => {
        loadProducts(search, selectedCategory);
    }, [selectedCategory]);

    const loadCategories = async () => {
        try {
            const response = await productsAPI.getCategories();
            setCategories(response.data);
        } catch (error) {
            console.error('Load categories error:', error);
        }
    };

    const loadProducts = async (searchTerm = '', category = null) => {
        try {
            setLoading(true);
            const response = await pos.getProducts(searchTerm);
            let filtered = response.data;

            if (category) {
                filtered = filtered.filter(p => p.category_id === category);
            }

            setProducts(filtered);
        } catch (error) {
            console.error('Load products error:', error);
            alert('Gagal memuat produk');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearch(value);
        loadProducts(value, selectedCategory);
    };

    const addToCart = (product) => {
        if (product.stock <= 0) {
            alert('Stok tidak tersedia');
            return;
        }

        const existingItem = cart.find(item => item.product_id === product.id);

        if (existingItem) {
            if (existingItem.quantity >= product.stock) {
                alert('Stok tidak cukup');
                return;
            }
            setCart(cart.map(item =>
                item.product_id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, {
                product_id: product.id,
                product_name: product.name,
                price: product.price,
                quantity: 1,
                image: product.image_large || product.image
            }]);
        }
    };

    const updateQuantity = (productId, newQty) => {
        const product = products.find(p => p.id === productId);

        if (newQty <= 0) {
            removeFromCart(productId);
            return;
        }

        if (product && newQty > product.stock) {
            alert('Stok tidak cukup');
            return;
        }

        setCart(cart.map(item =>
            item.product_id === productId
                ? { ...item, quantity: newQty }
                : item
        ));
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product_id !== productId));
    };

    const getTotalAmount = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const getChange = () => {
        const paid = parseFloat(amountPaid) || 0;
        const total = getTotalAmount();
        return paid - total;
    };

    const handleCheckout = () => {
        if (cart.length === 0) {
            alert('Keranjang masih kosong');
            return;
        }
        setShowPayment(true);
        setAmountPaid(getTotalAmount().toString());
    };

    const processPayment = async (paymentMethod = 'cash') => {
        const total = getTotalAmount();
        const paid = parseFloat(amountPaid) || 0;

        if (paid < total) {
            alert('Jumlah pembayaran kurang');
            return;
        }

        try {
            setProcessing(true);

            const orderData = {
                items: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity
                })),
                payment_method: paymentMethod
            };

            const response = await pos.createOrder(orderData);

            const change = getChange();
            alert(`✅ Transaksi berhasil!\n\nNo. Order: ${response.data.order_number}\nTotal: Rp ${total.toLocaleString('id-ID')}\nBayar: Rp ${paid.toLocaleString('id-ID')}\nKembali: Rp ${change.toLocaleString('id-ID')}`);

            // Reset
            setCart([]);
            setShowPayment(false);
            setAmountPaid('');
            loadProducts(search, selectedCategory); // Refresh to update stock
        } catch (error) {
            console.error('Payment error:', error);
            alert(error.response?.data?.error || 'Gagal memproses pembayaran');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="page-container">
            <Navbar />

            <div className="pos-layout">
                {/* Categories Sidebar */}
                <div className="pos-sidebar">
                    <h3>Kategori</h3>
                    <div
                        className={`category-item ${!selectedCategory ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(null)}
                    >
                        📦 Semua Produk
                    </div>
                    {categories.map(cat => (
                        <div
                            key={cat.id}
                            className={`category-item ${selectedCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat.id)}
                        >
                            {cat.name}
                        </div>
                    ))}
                </div>

                {/* Products Section */}
                <div className="pos-products-section">
                    <div className="pos-search-bar">
                        <input
                            type="text"
                            className="pos-search-input"
                            placeholder="🔍 Cari produk..."
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>

                    <div className="pos-product-grid">
                        {loading ? (
                            <div className="pos-loading">Memuat produk...</div>
                        ) : products.length === 0 ? (
                            <div className="pos-empty">Tidak ada produk</div>
                        ) : (
                            products.map(product => (
                                <div
                                    key={product.id}
                                    className="pos-product-card"
                                    onClick={() => addToCart(product)}
                                >
                                    <div className="pos-product-image">
                                        {product.image_large || product.image ? (
                                            <img
                                                src={`data:image/png;base64,${product.image_large || product.image}`}
                                                alt={product.name}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className="pos-image-placeholder" style={{ display: product.image_large || product.image ? 'none' : 'flex' }}>
                                            📦
                                        </div>
                                    </div>
                                    <div className="pos-product-info">
                                        <h4 className="pos-product-name">{product.name}</h4>
                                        <p className="pos-product-price">Rp {product.price.toLocaleString('id-ID')}</p>
                                        <span className={`pos-product-stock ${product.stock < 10 ? 'low' : ''}`}>
                                            Stok: {product.stock}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Cart Panel */}
                <div className="pos-cart-panel">
                    <div className="pos-cart-header">
                        <h3>Keranjang</h3>
                        <span className="cart-count">{cart.length} item</span>
                    </div>

                    {cart.length === 0 ? (
                        <div className="pos-cart-empty">
                            <div className="empty-icon">🛒</div>
                            <p>Keranjang kosong</p>
                        </div>
                    ) : (
                        <>
                            <div className="pos-cart-items">
                                {cart.map(item => (
                                    <div key={item.product_id} className="pos-cart-item">
                                        <div className="cart-item-image">
                                            {item.image ? (
                                                <img src={`data:image/png;base64,${item.image}`} alt={item.product_name} />
                                            ) : (
                                                <div className="cart-image-placeholder">📦</div>
                                            )}
                                        </div>
                                        <div className="cart-item-details">
                                            <h5>{item.product_name}</h5>
                                            <p className="cart-item-price">Rp {item.price.toLocaleString('id-ID')}</p>
                                        </div>
                                        <div className="cart-item-quantity">
                                            <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)}>−</button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}>+</button>
                                        </div>
                                        <div className="cart-item-total">
                                            Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                                        </div>
                                        <button
                                            className="cart-item-remove"
                                            onClick={() => removeFromCart(item.product_id)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="pos-cart-summary">
                                <div className="cart-total-row">
                                    <span>Total:</span>
                                    <span className="cart-total-amount">
                                        Rp {getTotalAmount().toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <button className="pos-pay-button" onClick={handleCheckout}>
                                    💳 Bayar
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {showPayment && (
                <div className="modal-overlay" onClick={() => !processing && setShowPayment(false)}>
                    <div className="pos-payment-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Pembayaran</h3>

                        <div className="payment-summary">
                            <div className="payment-row">
                                <span>Total Belanja:</span>
                                <strong>Rp {getTotalAmount().toLocaleString('id-ID')}</strong>
                            </div>

                            <div className="payment-input-group">
                                <label>Jumlah Bayar:</label>
                                <input
                                    type="number"
                                    className="payment-amount-input"
                                    value={amountPaid}
                                    onChange={(e) => setAmountPaid(e.target.value)}
                                    placeholder="0"
                                    autoFocus
                                />
                            </div>

                            <div className="payment-row change-row">
                                <span>Kembalian:</span>
                                <strong className={getChange() < 0 ? 'text-danger' : 'text-success'}>
                                    Rp {Math.max(0, getChange()).toLocaleString('id-ID')}
                                </strong>
                            </div>
                        </div>

                        <div className="payment-methods">
                            <h4>Metode Pembayaran:</h4>
                            <div className="payment-buttons">
                                <button
                                    className="payment-method-btn cash"
                                    onClick={() => processPayment('cash')}
                                    disabled={processing || getChange() < 0}
                                >
                                    💵 Cash
                                </button>
                                <button
                                    className="payment-method-btn card"
                                    onClick={() => processPayment('card')}
                                    disabled={processing || getChange() < 0}
                                >
                                    💳 Kartu
                                </button>
                                <button
                                    className="payment-method-btn ewallet"
                                    onClick={() => processPayment('ewallet')}
                                    disabled={processing || getChange() < 0}
                                >
                                    📱 E-Wallet
                                </button>
                            </div>
                        </div>

                        <button
                            className="btn btn-outline btn-block"
                            onClick={() => setShowPayment(false)}
                            disabled={processing}
                        >
                            Batal
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;
