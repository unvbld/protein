import { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import { AlertModal, ConfirmModal } from '../components/common/Modal';
import { pos, products as productsAPI } from '../services/api';
import jsPDF from 'jspdf';

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

    // Modal states
    const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'warning', title: 'Peringatan' });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, paymentData: null });
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState(null);

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
            setAlertModal({
                isOpen: true,
                message: `Stok produk "${product.name}" tidak tersedia`,
                type: 'warning',
                title: 'Stok Habis'
            });
            return;
        }

        const existingItem = cart.find(item => item.product_id === product.id);

        if (existingItem) {
            if (existingItem.quantity >= product.stock) {
                setAlertModal({
                    isOpen: true,
                    message: `Stok produk "${product.name}" tidak cukup. Tersedia: ${product.stock}`,
                    type: 'warning',
                    title: 'Stok Tidak Cukup'
                });
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
        const cartItem = cart.find(item => item.product_id === productId);

        if (newQty <= 0) {
            removeFromCart(productId);
            return;
        }

        if (product && newQty > product.stock) {
            setAlertModal({
                isOpen: true,
                message: `Stok produk "${cartItem?.product_name}" tidak cukup. Tersedia: ${product.stock}`,
                type: 'warning',
                title: 'Stok Tidak Cukup'
            });
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
            setAlertModal({
                isOpen: true,
                message: 'Keranjang masih kosong',
                type: 'warning',
                title: 'Peringatan'
            });
            return;
        }
        setShowPayment(true);
        setAmountPaid(getTotalAmount().toString());
    };

    const processPayment = (paymentMethod = 'cash') => {
        const total = getTotalAmount();
        const paid = parseFloat(amountPaid) || 0;

        if (paid < total) {
            setAlertModal({
                isOpen: true,
                message: 'Jumlah pembayaran kurang dari total belanja',
                type: 'warning',
                title: 'Pembayaran Kurang'
            });
            return;
        }

        // Show confirmation modal
        const change = paid - total;
        setConfirmModal({
            isOpen: true,
            paymentData: {
                total,
                paid,
                change,
                paymentMethod
            }
        });
    };

    const confirmPayment = async () => {
        const { total, paid, change, paymentMethod } = confirmModal.paymentData;

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

            // Prepare receipt data (store for optional print)
            const receipt = {
                orderId: response.data.order_number || response.data.order_id || 'N/A',
                date: new Date().toLocaleString('id-ID', {
                    dateStyle: 'short',
                    timeStyle: 'short'
                }),
                items: cart.map(item => ({
                    name: item.name || item.product_name || 'Unknown',
                    quantity: item.quantity,
                    price: item.price
                })),
                subtotal: total,
                total: total,
                paymentMethod: paymentMethod === 'cash' ? 'Cash' : 'Card',
                amountPaid: paid,
                change: change
            };

            // Store receipt data for optional print
            setReceiptData(receipt);

            // Show success alert (NOT auto-show receipt modal)
            setAlertModal({
                isOpen: true,
                message: `Transaksi berhasil!\n\nNo. Order: ${receipt.orderId}\nTotal: Rp ${total.toLocaleString('id-ID')}\nBayar: Rp ${paid.toLocaleString('id-ID')}\nKembali: Rp ${change.toLocaleString('id-ID')}\n\nKlik tombol di bawah untuk cetak struk.`,
                type: 'success',
                title: 'Pembayaran Berhasil',
                showPrintButton: true // Flag for print button
            });

            setConfirmModal({ isOpen: false, paymentData: null });
            setShowPayment(false);

            // Reset cart
            setCart([]);
            setAmountPaid('');
            loadProducts(search, selectedCategory); // Refresh to update stock
        } catch (error) {
            console.error('Payment error:', error);
            setAlertModal({
                isOpen: true,
                message: error.response?.data?.error || 'Gagal memproses pembayaran',
                type: 'error',
                title: 'Error'
            });
        } finally {
            setProcessing(false);
        }
    };

    const generateReceiptPDF = (receiptData) => {
        try {
            console.log('Generating PDF with data:', receiptData);

            // Validate receipt data
            if (!receiptData || !receiptData.items || !Array.isArray(receiptData.items)) {
                throw new Error('Data struk tidak valid');
            }

            const doc = new jsPDF({
                unit: 'mm',
                format: [80, 200]
            });

            let y = 10;
            const lineHeight = 5;
            const pageWidth = 80;

            // Helper function to add centered text
            const addCenteredText = (text, fontSize = 12, isBold = false) => {
                doc.setFontSize(fontSize);
                if (isBold) doc.setFont(undefined, 'bold');
                else doc.setFont(undefined, 'normal');
                const textWidth = doc.getTextWidth(String(text));
                const x = (pageWidth - textWidth) / 2;
                doc.text(String(text), x, y);
                y += lineHeight;
            };

            // Helper function to add right-aligned text
            const addRightText = (text, fontSize = 9) => {
                doc.setFontSize(fontSize);
                const textWidth = doc.getTextWidth(String(text));
                doc.text(String(text), pageWidth - 5 - textWidth, y);
            };

            // Helper function to add line
            const addLine = (char = '-') => {
                doc.setFontSize(10);
                doc.text(char.repeat(40), 5, y);
                y += lineHeight;
            };

            // Header
            addCenteredText('SIGWAN ATK', 14, true);
            addCenteredText('Sistem Manajemen Toko', 10);
            addLine('=');

            // Transaction Info
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.text(`Tanggal: ${receiptData.date || 'N/A'}`, 5, y);
            y += lineHeight;
            doc.text(`No. Transaksi: ${receiptData.orderId || 'N/A'}`, 5, y);
            y += lineHeight;
            addLine();

            // Items Header
            doc.setFont(undefined, 'bold');
            doc.text('ITEM', 5, y);
            doc.text('QTY', 45, y);
            doc.text('HARGA', 55, y);
            y += lineHeight;
            addLine();

            // Items
            doc.setFont(undefined, 'normal');
            receiptData.items.forEach(item => {
                const itemName = (item.name || 'Unknown').length > 18
                    ? (item.name || 'Unknown').substring(0, 18)
                    : (item.name || 'Unknown');
                doc.text(itemName, 5, y);
                doc.text(String(item.quantity || 0), 45, y);
                const itemTotal = (item.price || 0) * (item.quantity || 0);
                addRightText(itemTotal.toLocaleString('id-ID'));
                y += lineHeight;
            });

            addLine();

            // Subtotal
            doc.text('Subtotal:', 5, y);
            addRightText(`Rp ${(receiptData.subtotal || 0).toLocaleString('id-ID')}`);
            y += lineHeight;

            // Total
            doc.setFont(undefined, 'bold');
            doc.setFontSize(11);
            doc.text('TOTAL:', 5, y);
            addRightText(`Rp ${(receiptData.total || 0).toLocaleString('id-ID')}`, 11);
            y += lineHeight;
            addLine('=');

            // Payment Info
            doc.setFont(undefined, 'normal');
            doc.setFontSize(9);
            doc.text(`Metode Bayar: ${receiptData.paymentMethod || 'N/A'}`, 5, y);
            y += lineHeight;
            doc.text('Bayar:', 5, y);
            addRightText(`Rp ${(receiptData.amountPaid || 0).toLocaleString('id-ID')}`);
            y += lineHeight;
            doc.text('Kembali:', 5, y);
            addRightText(`Rp ${(receiptData.change || 0).toLocaleString('id-ID')}`);
            y += lineHeight;
            addLine('=');

            // Footer
            y += 2;
            addCenteredText('Terima Kasih!', 10, true);
            addCenteredText('Selamat Berbelanja Kembali', 9);

            // Open PDF in new tab for print preview
            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            const printWindow = window.open(pdfUrl, '_blank');

            if (printWindow) {
                console.log('PDF opened in new tab');
            } else {
                console.error('Failed to open print window');
                alert('Gagal membuka tab PDF. Pastikan popup tidak diblokir.');
            }

            // Clean up URL after a delay
            setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert(`Gagal membuat PDF struk: ${error.message}`);
        }
    };

    const handlePrintReceipt = () => {
        console.log('Print button clicked');
        console.log('Receipt data:', receiptData);

        if (receiptData) {
            generateReceiptPDF(receiptData);
        } else {
            console.error('No receipt data available');
            alert('Data struk tidak tersedia');
        }
    };

    const handleNewTransaction = () => {
        setShowReceipt(false);
        setReceiptData(null);
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
                        Semua Produk
                    </div>
                    {categories
                        .filter(cat => cat.name.toLowerCase() !== 'all')
                        .map(cat => (
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
                            placeholder="Cari produk..."
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
                                                <div className="cart-image-placeholder"></div>
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
                                    Bayar
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
                                    Cash
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

            {/* Confirm Payment Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, paymentData: null })}
                onConfirm={confirmPayment}
                title="Konfirmasi Pembayaran"
                message={confirmModal.paymentData ?
                    `Total Belanja: Rp ${confirmModal.paymentData.total.toLocaleString('id-ID')}\nJumlah Bayar: Rp ${confirmModal.paymentData.paid.toLocaleString('id-ID')}\nKembalian: Rp ${confirmModal.paymentData.change.toLocaleString('id-ID')}\n\nProses pembayaran?`
                    : ''
                }
                confirmText="Proses"
                cancelText="Batal"
                confirmStyle="primary"
            />

            {/* Alert Modal */}
            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ isOpen: false, message: '', type: 'warning', title: 'Peringatan' })}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
                showPrintButton={alertModal.showPrintButton}
                onPrint={handlePrintReceipt}
            />

            {/* Receipt Modal */}
            {showReceipt && receiptData && (
                <div className="modal-overlay" onClick={handleNewTransaction}>
                    <div className="modal-container modal-large receipt-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="receipt-content" id="receipt-print">
                            <div className="receipt-header">
                                <h2>SIGWAN ATK</h2>
                                <p>Sistem Manajemen Toko</p>
                            </div>

                            <div className="receipt-divider"></div>

                            <div className="receipt-info">
                                <div className="receipt-row">
                                    <span>Tanggal:</span>
                                    <span>{receiptData.date}</span>
                                </div>
                                <div className="receipt-row">
                                    <span>No. Transaksi:</span>
                                    <span>{receiptData.orderId}</span>
                                </div>
                            </div>

                            <div className="receipt-divider"></div>

                            <div className="receipt-items">
                                <div className="receipt-items-header">
                                    <span>ITEM</span>
                                    <span>QTY</span>
                                    <span>HARGA</span>
                                </div>
                                {receiptData.items.map((item, index) => (
                                    <div key={index} className="receipt-item-row">
                                        <span className="item-name">{item.name}</span>
                                        <span className="item-qty">{item.quantity}</span>
                                        <span className="item-price">
                                            {(item.price * item.quantity).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="receipt-divider"></div>

                            <div className="receipt-total">
                                <div className="receipt-row">
                                    <span>Subtotal:</span>
                                    <span>Rp {receiptData.subtotal.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="receipt-row receipt-grand-total">
                                    <span>TOTAL:</span>
                                    <span>Rp {receiptData.total.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            <div className="receipt-divider"></div>

                            <div className="receipt-payment">
                                <div className="receipt-row">
                                    <span>Metode Bayar:</span>
                                    <span>{receiptData.paymentMethod}</span>
                                </div>
                                <div className="receipt-row">
                                    <span>Bayar:</span>
                                    <span>Rp {receiptData.amountPaid.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="receipt-row">
                                    <span>Kembali:</span>
                                    <span>Rp {receiptData.change.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            <div className="receipt-divider"></div>

                            <div className="receipt-footer">
                                <p>Terima Kasih!</p>
                                <p>Selamat Berbelanja Kembali</p>
                            </div>
                        </div>

                        <div className="receipt-actions no-print">
                            <button
                                className="btn btn-primary"
                                onClick={handlePrintReceipt}
                            >
                                Cetak Struk
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={handleNewTransaction}
                            >
                                Transaksi Baru
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;
