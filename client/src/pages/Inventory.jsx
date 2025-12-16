import { useState, useEffect } from 'react';
import Navbar from '../components/common/Navbar';
import { products } from '../services/api';

const Inventory = () => {
    const [productList, setProductList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        price: '',
        cost: '',
        stock: '',
        unit: 'pcs',
        description: ''
    });

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const response = await products.getAll();
            setProductList(response.data.products);
        } catch (error) {
            console.error('Load products error:', error);
            alert('Gagal memuat produk');
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingProduct) {
                await products.update(editingProduct.id, formData);
                alert('Produk berhasil diupdate');
            } else {
                await products.create(formData);
                alert('Produk berhasil ditambahkan');
            }

            setShowForm(false);
            setEditingProduct(null);
            setFormData({
                name: '',
                sku: '',
                price: '',
                cost: '',
                stock: '',
                unit: 'pcs',
                description: ''
            });
            loadProducts();
        } catch (error) {
            console.error('Save product error:', error);
            alert(error.response?.data?.error || 'Gagal menyimpan produk');
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            sku: product.sku || '',
            price: product.price,
            cost: product.cost || '',
            stock: product.stock,
            unit: product.unit || 'pcs',
            description: product.description || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (product) => {
        if (!confirm(`Hapus produk "${product.name}"?`)) return;

        try {
            await products.delete(product.id);
            alert('Produk berhasil dihapus');
            loadProducts();
        } catch (error) {
            console.error('Delete product error:', error);
            alert('Gagal menghapus produk');
        }
    };

    const handleAddNew = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            sku: '',
            price: '',
            cost: '',
            stock: '',
            unit: 'pcs',
            description: ''
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

                {loading ? (
                    <div className="loading">Memuat data...</div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nama Produk</th>
                                    <th>SKU</th>
                                    <th>Kategori</th>
                                    <th>Harga</th>
                                    <th>Stok</th>
                                    <th>Unit</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productList.map(product => (
                                    <tr key={product.id}>
                                        <td>{product.name}</td>
                                        <td>{product.sku || '-'}</td>
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {showForm && (
                    <div className="modal-overlay" onClick={() => setShowForm(false)}>
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
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>SKU</label>
                                        <input
                                            type="text"
                                            name="sku"
                                            value={formData.sku}
                                            onChange={handleInputChange}
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
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Unit</label>
                                        <input
                                            type="text"
                                            name="unit"
                                            value={formData.unit}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Deskripsi</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="3"
                                    />
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="btn btn-primary">
                                        {editingProduct ? 'Update' : 'Tambah'}
                                    </button>
                                    <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                                        Batal
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Inventory;
