import { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import { ConfirmModal, AlertModal } from '../components/common/Modal';
import { products } from '../services/api';

const Inventory = () => {
    const [productList, setProductList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Modal states
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, product: null });
    const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info', title: 'Notifikasi' });

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        cost: '',
        stock: '',
        unit: 'pcs',
        description: '',
        image: null
    });

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const response = await products.getAll();
            console.log('API response:', response);

            // Handle different response structures
            const productData = response.data?.products || response.data || [];
            setProductList(Array.isArray(productData) ? productData : []);
        } catch (error) {
            console.error('Load products error:', error);
            setProductList([]); // Set empty array on error
            alert('Gagal memuat produk: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Calculate new dimensions
                    if (width > height) {
                        if (width > maxWidth) {
                            height = (height * maxWidth) / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = (width * maxHeight) / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to base64
                    const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedBase64);
                };

                img.onerror = (error) => reject(error);
            };

            reader.onerror = (error) => reject(error);
        });
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('File harus berupa gambar');
            e.target.value = '';
            return;
        }

        try {
            setUploading(true);

            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            console.log(`📁 Original file: ${fileSizeMB} MB`);

            // Compress image with smaller dimensions for Odoo
            const compressedDataUrl = await compressImage(file, 600, 600, 0.85);
            const base64 = compressedDataUrl.split(',')[1];

            const compressedSizeKB = (base64.length * 0.75 / 1024).toFixed(2);
            console.log(`✅ Compressed to: ${compressedSizeKB} KB (base64 length: ${base64.length})`);

            // Validation - Odoo image field usually accepts up to ~3MB base64
            if (base64.length > 3 * 1024 * 1024) {
                alert('Gambar masih terlalu besar setelah kompresi. Silakan pilih gambar yang lebih kecil.');
                e.target.value = '';
                setUploading(false);
                return;
            }

            setImageFile(file);
            setImagePreview(compressedDataUrl);
            setFormData(prevData => ({
                ...prevData,
                image: base64
            }));

            console.log('✅ Image ready to upload, size:', compressedSizeKB, 'KB');

        } catch (error) {
            console.error('Image processing error:', error);
            alert('Gagal memproses gambar: ' + error.message);
            e.target.value = '';
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log('📤 Submitting product:', {
            ...formData,
            image: formData.image ? `IMAGE_${formData.image.length}_chars` : 'NO_IMAGE'
        });

        try {
            setLoading(true);

            const response = editingProduct
                ? await products.update(editingProduct.id, formData)
                : await products.create(formData);

            if (response.status === 200 || response.status === 201) {
                setAlertModal({
                    isOpen: true,
                    message: `Produk berhasil ${editingProduct ? 'diperbarui' : 'ditambahkan'}`,
                    type: 'success',
                    title: 'Berhasil'
                });
            }

            setShowForm(false);
            setEditingProduct(null);
            setImageFile(null);
            setImagePreview(null);
            setFormData({
                name: '',
                price: '',
                cost: '',
                stock: '',
                unit: 'pcs',
                description: '',
                image: null
            });
            loadProducts();
        } catch (error) {
            console.error('Save product error:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Gagal menyimpan produk';
            setAlertModal({
                isOpen: true,
                message: errorMsg,
                type: 'error',
                title: 'Error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setImageFile(null);

        // Show existing image if available
        if (product.image) {
            setImagePreview(`data:image/png;base64,${product.image}`);
        } else {
            setImagePreview(null);
        }

        setFormData({
            name: product.name,
            price: product.price,
            cost: product.cost || '',
            stock: product.stock,
            unit: product.unit || 'pcs',
            description: product.description || '',
            image: null  // Don't include existing image, only new uploads
        });
        setShowForm(true);
    };

    const handleDelete = (product) => {
        setConfirmModal({
            isOpen: true,
            product: product
        });
    };

    const confirmDelete = async () => {
        try {
            await products.delete(confirmModal.product.id);
            setAlertModal({
                isOpen: true,
                message: 'Produk berhasil dihapus',
                type: 'success',
                title: 'Berhasil'
            });
            loadProducts();
        } catch (error) {
            console.error('Delete product error:', error);
            setAlertModal({
                isOpen: true,
                message: 'Gagal menghapus produk',
                type: 'error',
                title: 'Error'
            });
        }
    };

    const handleAddNew = () => {
        setEditingProduct(null);
        setImageFile(null);
        setImagePreview(null);
        setFormData({
            name: '',
            sku: '',
            price: '',
            cost: '',
            stock: '',
            unit: 'pcs',
            description: '',
            image: null
        });
        setShowForm(true);
    };

    return (
        <div className="page-container">
            <Navbar />

            <div className="content-container">
                <div className="page-header">
                    <h1>📦 Manajemen Inventory</h1>
                    <button className="btn btn-primary" onClick={handleAddNew}>
                        + Tambah Produk
                    </button>
                </div>

                {loading && !showForm ? (
                    <div className="loading">Memuat data...</div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Gambar</th>
                                    <th>Nama Produk</th>
                                    <th>Kategori</th>
                                    <th>Harga</th>
                                    <th>Stok</th>
                                    <th>Unit</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productList && productList.length > 0 ? (
                                    productList.map(product => (
                                        <tr key={product.id}>
                                            <td>
                                                {product.image ? (
                                                    <img
                                                        src={`data:image/png;base64,${product.image}`}
                                                        alt={product.name}
                                                        className="product-thumbnail"
                                                    />
                                                ) : (
                                                    <div className="product-image-placeholder">
                                                        📦
                                                    </div>
                                                )}
                                            </td>
                                            <td>{product.name}</td>
                                            <td>{product.category || '-'}</td>
                                            <td>Rp {product.price.toLocaleString('id-ID')}</td>
                                            <td className={product.stock < 20 ? 'low-stock' : ''}>{product.stock}</td>
                                            <td>{product.unit}</td>
                                            <td>
                                                <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(product)}>
                                                    Edit
                                                </button>
                                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(product)}>
                                                    Hapus
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                            {loading ? 'Memuat data...' : 'Tidak ada produk'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {showForm && (
                    <div className="modal-overlay" onClick={() => !loading && setShowForm(false)}>
                        <div className="modal-content form-modal" onClick={(e) => e.stopPropagation()}>
                            <h3>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>

                            <form onSubmit={handleSubmit}>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Nama Produk *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Harga Jual *</label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            required
                                            min="0"
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Harga Modal</label>
                                        <input
                                            type="number"
                                            name="cost"
                                            value={formData.cost}
                                            onChange={handleInputChange}
                                            min="0"
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Stok *</label>
                                        <input
                                            type="number"
                                            name="stock"
                                            value={formData.stock}
                                            onChange={handleInputChange}
                                            required
                                            min="0"
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Unit</label>
                                        <input
                                            type="text"
                                            name="unit"
                                            value={formData.unit}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Gambar Produk</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        disabled={uploading || loading}
                                    />
                                    <small style={{ color: '#64748b', fontSize: '0.875rem', display: 'block', marginTop: '0.5rem' }}>
                                        📸 Format: JPG, PNG. Gambar akan otomatis dikompres (max 800x800px)
                                    </small>

                                    {uploading && (
                                        <div style={{ marginTop: '1rem', color: '#2563eb' }}>
                                            ⏳ Memproses gambar...
                                        </div>
                                    )}

                                    {imagePreview && !uploading && (
                                        <div style={{ marginTop: '1rem' }}>
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                style={{
                                                    maxWidth: '200px',
                                                    maxHeight: '200px',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                    border: '2px solid #e2e8f0'
                                                }}
                                            />
                                            <p style={{ fontSize: '0.875rem', color: '#10b981', marginTop: '0.5rem' }}>
                                                ✅ Gambar siap diupload
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label>Deskripsi</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="3"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading || uploading}
                                    >
                                        {loading ? '⏳ Menyimpan...' : (editingProduct ? 'Update' : 'Tambah')}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => setShowForm(false)}
                                        disabled={loading}
                                    >
                                        Batal
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, product: null })}
                onConfirm={confirmDelete}
                title="Konfirmasi Hapus"
                message={`Apakah Anda yakin ingin menghapus produk "${confirmModal.product?.name}"?`}
                confirmText="Hapus"
                cancelText="Batal"
                confirmStyle="danger"
            />

            {/* Alert Modal */}
            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ isOpen: false, message: '', type: 'info', title: 'Notifikasi' })}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
            />
        </div>
    );
};

export default Inventory;
