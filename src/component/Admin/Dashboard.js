import React, { useState, useEffect } from 'react';
import { FaBox, FaList, FaPlus, FaRightFromBracket, FaTrash, FaBullhorn, FaCreditCard, FaFileExcel, FaPen, FaCloudArrowUp as FaCloudUploadAlt, FaImage, FaLayerGroup, FaArrowUp, FaArrowDown, FaStar, FaGears } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { BASE_URL, getImgSrc } from '../../utils/config';

const PAYMENT_METHOD_KEYS = ['phonepe', 'gpay', 'paytm', 'bhim'];
const PAYMENT_METHOD_OPTIONS = [
    { key: 'phonepe', label: 'PhonePe QR' },
    { key: 'gpay', label: 'Google Pay / GPay QR' },
    { key: 'paytm', label: 'Paytm QR' },
    { key: 'bhim', label: 'BHIM / UPI QR' }
];

const normalizePaymentConfig = (config = {}) => {
    const upiConfig = { ...config };
    delete upiConfig.key;
    delete upiConfig.salt;
    delete upiConfig.payuKey;
    delete upiConfig.payuSalt;

    return {
        ...upiConfig,
        upiId: typeof config.upiId === 'string' ? config.upiId : '',
        merchantName: typeof config.merchantName === 'string' ? config.merchantName : '',
        methodUpiIds: PAYMENT_METHOD_KEYS.reduce((methods, method) => {
            methods[method] = typeof config.methodUpiIds?.[method] === 'string'
                ? config.methodUpiIds[method]
                : '';
            return methods;
        }, {})
    };
};

const sanitizePaymentConfig = (config) => {
    const normalized = normalizePaymentConfig(config);

    return {
        ...normalized,
        upiId: normalized.upiId.trim(),
        merchantName: normalized.merchantName.trim(),
        methodUpiIds: PAYMENT_METHOD_KEYS.reduce((methods, method) => {
            methods[method] = normalized.methodUpiIds[method].trim();
            return methods;
        }, {})
    };
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem('adminActiveTab') || 'add-product');
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        localStorage.setItem('adminActiveTab', activeTab);
    }, [activeTab]);
    const [editId, setEditId] = useState(null);

    // ... (Existing State) ...
    // --- State Management ---
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [banners, setBanners] = useState([]);

    const [pixelId, setPixelId] = useState('');
    const [pixelConfig, setPixelConfig] = useState('');
    const [paymentConfig, setPaymentConfig] = useState(() => normalizePaymentConfig());

    // Forms
    const [productForm, setProductForm] = useState({
        title: '',
        price: '',
        cancelprice: '', // NEW: Discount/Original Price (MRP)
        category: '',
        description: '',
        specifications: [],
        images: ['']
    });

    const [categoryForm, setCategoryForm] = useState({
        name: '',
        image: ''
    });

    // --- Reviews State ---
    const [activeReviewProductId, setActiveReviewProductId] = useState(null);
    const [adminReviews, setAdminReviews] = useState([]);
    const [reviewEditId, setReviewEditId] = useState(null);
    const [adminReviewForm, setAdminReviewForm] = useState({
        author: 'Admin',
        rating: 5,
        text: '',
        date: new Date().toLocaleDateString(),
        images: []
    });

    const [bannerForm, setBannerForm] = useState({ image: '', desktopImage: '', link: '' });

    // --- Product Groups State ---
    const [productGroups, setProductGroups] = useState([]);
    const [groupEditId, setGroupEditId] = useState(null);
    const [productGroupForm, setProductGroupForm] = useState({
        title: '',
        tagline: '',
        productIds: [],
        type: 'standard', // 'standard' | 'micro' | 'micro-grid'
        image: '',
        badgeText: '',
        subItems: [] // For micro-grid: [{title, badgeText, image, link}]
    });

    // Temp State for adding sub-items
    const [tempSubItem, setTempSubItem] = useState({ title: '', badgeText: '', image: '', link: '' });

    const handleAddSubItem = () => {
        if (!tempSubItem.title && !tempSubItem.link) return alert("Title or Link is required");
        setProductGroupForm({
            ...productGroupForm,
            subItems: [...(productGroupForm.subItems || []), tempSubItem]
        });
        setTempSubItem({ title: '', badgeText: '', image: '', link: '' });
    };

    const handleRemoveSubItem = (idx) => {
        const newItems = [...productGroupForm.subItems];
        newItems.splice(idx, 1);
        setProductGroupForm({ ...productGroupForm, subItems: newItems });
    };

    // --- Bulk Reviews State ---
    const [bulkReviewForm, setBulkReviewForm] = useState({
        author: 'Flipkart Customer',
        rating: 5,
        text: '',
        date: new Date().toLocaleDateString(),
        sentiment: 'Excellent'
    });

    const handleBulkReviewSubmit = async (e) => {
        e.preventDefault();
        if (!window.confirm("This will add this review to ALL products in your database. This action cannot be easily undone (you'd have to delete them one by one). Continue?")) return;

        try {
            const res = await fetch(BASE_URL + '/api/reviews/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bulkReviewForm)
            });

            if (res.ok) {
                const data = await res.json();
                alert(data.message);
                setBulkReviewForm({
                    author: 'Flipkart Customer',
                    rating: 5,
                    text: '',
                    date: new Date().toLocaleDateString(),
                    sentiment: 'Excellent'
                });
            } else {
                const err = await res.json();
                alert("Failed: " + err.message);
            }
        } catch (error) {
            console.error(error);
            alert("Error submitting bulk reviews.");
        }
    };

    // --- API & MySQL Integration ---
    const [bannerEditId, setBannerEditId] = useState(null);
    const [isBackendConnected, setIsBackendConnected] = useState(false);
    const [defaultReviews, setDefaultReviews] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetching from MySQL Backend
                const [catRes, prodRes, setRes, bannersRes, groupsRes] = await Promise.all([
                    fetch(BASE_URL + '/api/categories'),
                    fetch(BASE_URL + '/api/products'),
                    fetch(BASE_URL + '/api/settings'),
                    fetch(BASE_URL + '/api/banners'),
                    fetch(BASE_URL + '/api/product-groups')
                ]);

                if (catRes.ok && prodRes.ok) {
                    const dbCats = await catRes.json();
                    const dbProds = await prodRes.json();
                    setCategories(dbCats);
                    setProducts(dbProds);

                    if (setRes.ok) {
                        const settings = await setRes.json();
                        setPixelId(settings.meta_pixel_id || '');
                        setPixelConfig(settings.meta_pixel_config || '');
                        if (settings.meta_payment_config) {
                            try {
                                setPaymentConfig(normalizePaymentConfig(JSON.parse(settings.meta_payment_config)));
                            } catch (e) {
                                console.error("Error parsing payment config", e);
                            }
                        }
                        // Default reviews
                        if (settings.default_reviews) {
                            try {
                                setDefaultReviews(JSON.parse(settings.default_reviews));
                            } catch (e) { setDefaultReviews([]) }
                        }
                    }

                    if (bannersRes.ok) {
                        setBanners(await bannersRes.json());
                    }

                    if (groupsRes.ok) {
                        setProductGroups(await groupsRes.json());
                    }

                    setIsBackendConnected(true);
                    console.log("Loaded data from MySQL Database");
                }
            } catch (err) {
                console.warn("Backend API Offline.", err);
            }
        };
        fetchData();
    }, []);

    // LocalStorage effects removed in favor of API calls on save


    // Set default category for product form if available
    useEffect(() => {
        if (categories.length > 0 && !productForm.category && !editMode) {
            setProductForm(prev => ({ ...prev, category: categories[0].name }));
        }
    }, [categories, editMode]);

    // Fetch Reviews when entering Manage Review tab
    useEffect(() => {
        if (activeTab === 'manage-reviews' && activeReviewProductId) {
            fetch(`${BASE_URL}/api/reviews?product_id=${activeReviewProductId}`)
                .then(res => res.json())
                .then(data => setAdminReviews(data))
                .catch(err => console.error("Error fetching reviews", err));
        }
    }, [activeTab, activeReviewProductId]);


    // --- Handlers ---
    const saveSetting = async (key, value) => {
        try {
            const finalValue = typeof value === 'object' ? JSON.stringify(value) : value;
            const response = await fetch(BASE_URL + '/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value: finalValue })
            });

            if (!response.ok) {
                throw new Error(`Failed to save setting (${response.status})`);
            }

            return true;
        } catch (error) {
            console.error("Error saving setting:", error);
            alert("Failed to save setting.");
            return false;
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isAdmin');
        const adminPath = process.env.REACT_APP_ADMIN_PATH || '/admin';
        navigate(adminPath);
    };

    // IMAGE UPLOAD HANDLER (Dual Mode: Server -> Fallback to Base64)
    // IMAGE UPLOAD HANDLER (Dual Mode: Server -> Fallback with Confirm)
    const handleImageUpload = async (e, setter, field, isArray = false, index = 0) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Determine Upload Type
            let type = 'products';
            if (!isArray && field === 'image') type = 'categories';
            if (field === 'banner') type = 'banners';

            // Try Uploading to Local Server first
            const formData = new FormData();
            formData.append('image', file);

            try {
                const response = await fetch(`${BASE_URL}/upload/${type}`, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    const serverPath = `${data.path}?v=${Date.now()}`;

                    if (isArray) {
                        const newImages = [...productForm.images];
                        newImages[index] = serverPath;
                        setter({ ...productForm, images: newImages });
                    } else {
                        setter(prev => ({ ...prev, [field]: serverPath }));
                    }
                    // Success Message
                    alert(`✅ File Saved to Project Folder:\n${serverPath}\n\nDB Entry Updated.`);
                    return; // Stop here if successful
                }
            } catch (err) {
                console.warn("Local Server Upload Failed", err);
            }

            // Fallback Confirmation
            const useBase64 = window.confirm(
                "⚠️ Image Server Offline!\n\nDo you want to save this image as 'Database Code' (Base64) instead?\n\nCancel = No (I will run 'npm run dev' to fix this).\nOK = Yes (Save strictly in DB)."
            );

            if (useBase64) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result;
                    if (isArray) {
                        const newImages = [...productForm.images];
                        newImages[index] = base64String;
                        setter({ ...productForm, images: newImages });
                    } else {
                        setter(prev => ({ ...prev, [field]: base64String }));
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    };


    // Helper to try converting external URL to Base64 (for "Save from URL")
    const saveImageFromUrl = async (url, setter, field, isArray = false, index = 0) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                if (isArray) {
                    const newImages = [...productForm.images];
                    newImages[index] = base64String;
                    setter({ ...productForm, images: newImages });
                } else {
                    setter(prev => ({ ...prev, [field]: base64String }));
                }
                alert("Image successfully saved to local DB!");
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error("CORS Error or Invalid URL", error);
            alert("Could not downlod image from this particular URL due to security (CORS) or invalid link. Please download the image to your computer manually, then use the 'Upload Image' button.");
        }
    };

    // Bulk Upload Handler
    const handleBulkUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            if (data.length === 0) {
                alert("Excel file is empty!");
                return;
            }

            const newProducts = data.map(item => {
                const imageString = item.Image || item.image || '';
                // Allow multiple images separated by comma
                const imageList = imageString.toString().split(',').map(img => img.trim()).filter(img => img !== '');

                // Handle Price Mapping (Selling Price & MRP)
                const sellingPrice = item['Selling Price'] || item['SellingPrice'] || item.Price || item.price || 0;
                const mrp = item['Original Price'] || item['MRP'] || item.cancelprice || (sellingPrice * 1.3).toFixed(0);

                // Smart Category Matching
                let rawCat = (item.Category || item.category || 'Uncategorized').toString().trim();
                let matchedCat = rawCat;

                // Try to find an existing category that matches (Case Insensitive)
                const exactMatch = categories.find(c => c.name.toLowerCase() === rawCat.toLowerCase());
                if (exactMatch) {
                    matchedCat = exactMatch.name;
                } else {
                    // Try removing trailing 's' (e.g. 'Mobiles' -> 'Mobile')
                    if (rawCat.toLowerCase().endsWith('s')) {
                        const singular = rawCat.slice(0, -1);
                        const singularMatch = categories.find(c => c.name.toLowerCase() === singular.toLowerCase());
                        if (singularMatch) matchedCat = singularMatch.name;
                    }
                }

                return {
                    id: Date.now() + Math.random(),
                    title: item.Title || item.title || 'Untitled Product',
                    price: sellingPrice,
                    cancelprice: mrp,
                    category: matchedCat,
                    description: item.Description || item.description || '',
                    images: imageList.length > 0 ? imageList : ['']
                };
            });



            // Upload to Backend
            fetch(BASE_URL + '/api/products/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProducts)
            })
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error('Bulk upload failed');
                })
                .then(savedProducts => {
                    setProducts(prev => [...savedProducts, ...prev]);
                    alert(`Successfully added ${savedProducts.length} products!`);
                })
                .catch(err => {
                    console.error(err);
                    alert("Bulk upload failed. Please checking your file and try again.");
                });
        };
        reader.readAsBinaryString(file);
    };

    const downloadTemplate = () => {
        const exampleCategory = categories.length > 0 ? categories[0].name : 'Mobiles';
        const template = [
            { Title: 'Sample Mobile', 'Selling Price': 10000, 'Original Price': 15000, Category: exampleCategory, Description: 'Good battery', Image: 'https://link.com/img1.jpg, https://link.com/img2.jpg' },
            { Title: 'Sample Shirt', 'Selling Price': 500, 'Original Price': 999, Category: 'Fashion', Description: 'Cotton fabric', Image: 'https://link.com/shirt.jpg' }
        ];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "products_template.xlsx");
    };

    // Product Form Handlers
    const handleProductUrlChange = (index, value) => {
        const newImages = [...productForm.images];
        newImages[index] = value;
        setProductForm({ ...productForm, images: newImages });
    };

    const addProductUrlField = () => {
        setProductForm({ ...productForm, images: [...productForm.images, ''] });
    };

    const removeProductUrlField = (index) => {
        const newImages = productForm.images.filter((_, i) => i !== index);
        setProductForm({ ...productForm, images: newImages.length ? newImages : [''] });
    };

    const addSpecificationSection = () => {
        setProductForm(prev => ({
            ...prev,
            specifications: [
                ...(prev.specifications || []),
                { title: '', items: [{ name: '', value: '' }] }
            ]
        }));
    };

    const updateSpecificationSection = (sectionIndex, title) => {
        setProductForm(prev => ({
            ...prev,
            specifications: prev.specifications.map((section, index) =>
                index === sectionIndex ? { ...section, title } : section
            )
        }));
    };

    const removeSpecificationSection = (sectionIndex) => {
        setProductForm(prev => ({
            ...prev,
            specifications: prev.specifications.filter((_, index) => index !== sectionIndex)
        }));
    };

    const addSpecificationItem = (sectionIndex) => {
        setProductForm(prev => ({
            ...prev,
            specifications: prev.specifications.map((section, index) =>
                index === sectionIndex
                    ? { ...section, items: [...section.items, { name: '', value: '' }] }
                    : section
            )
        }));
    };

    const updateSpecificationItem = (sectionIndex, itemIndex, field, value) => {
        setProductForm(prev => ({
            ...prev,
            specifications: prev.specifications.map((section, index) => {
                if (index !== sectionIndex) return section;

                return {
                    ...section,
                    items: section.items.map((item, currentItemIndex) =>
                        currentItemIndex === itemIndex ? { ...item, [field]: value } : item
                    )
                };
            })
        }));
    };

    const removeSpecificationItem = (sectionIndex, itemIndex) => {
        setProductForm(prev => ({
            ...prev,
            specifications: prev.specifications.map((section, index) => {
                if (index !== sectionIndex) return section;

                return {
                    ...section,
                    items: section.items.filter((_, currentItemIndex) => currentItemIndex !== itemIndex)
                };
            })
        }));
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        const cleanImages = productForm.images.filter(img => img.trim() !== '');
        if (cleanImages.length === 0) {
            alert("Please add at least one product image.");
            return;
        }

        const specifications = (productForm.specifications || [])
            .map(section => ({
                title: section.title.trim(),
                items: (section.items || [])
                    .map(item => ({ name: item.name.trim(), value: item.value.trim() }))
                    .filter(item => item.name && item.value)
            }))
            .filter(section => section.title && section.items.length > 0);

        const payload = {
            ...productForm,
            price: Number(productForm.price),
            cancelprice: Number(productForm.cancelprice) || (Number(productForm.price) * 1.3).toFixed(0),
            category: productForm.category || (categories[0] && categories[0].name) || 'Uncategorized',
            description: productForm.description.trim(),
            specifications,
            images: cleanImages // Send array directly (Backend handles)
        };

        try {
            if (editMode && editId) {
                const response = await fetch(`${BASE_URL}/api/products/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    const updatedProduct = await response.json();
                    setProducts(products.map(p => p.id === editId ? updatedProduct : p));
                    alert("Product Updated Successfully!");
                    cancelEdit(); // Helper to reset mode
                } else {
                    alert("Failed to update product.");
                }
            } else {
                const response = await fetch(BASE_URL + '/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    const newProduct = await response.json();
                    setProducts([newProduct, ...products]);
                    alert("Product Added Successfully!");
                } else {
                    alert("Failed to add product.");
                }
            }
        } catch (err) {
            console.error(err);
            alert("Error saving product.");
        }

        setProductForm({ title: '', price: '', cancelprice: '', category: categories[0]?.name || '', description: '', specifications: [], images: [''] });
        setActiveTab('products');
    };

    const handleEditProduct = (prod) => {
        setProductForm({
            title: prod.title,
            price: prod.price,
            cancelprice: prod.cancelprice || '',
            category: prod.category,
            description: prod.description || '',
            specifications: Array.isArray(prod.specifications) ? prod.specifications : [],
            images: prod.images || ['']
        });
        setEditId(prod.id);
        setEditMode(true);
        setActiveTab('add-product');
    };

    const cancelEdit = () => {
        setEditMode(false);
        setEditId(null);
        setProductForm({ title: '', price: '', cancelprice: '', category: categories[0]?.name || '', description: '', specifications: [], images: [''] });
        setCategoryForm({ name: '', image: '' });
    };

    // Category Form Handlers
    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        if (!categoryForm.name || !categoryForm.image) {
            alert("Please provide both Name and Image URL for the category.");
            return;
        }

        const payload = {
            name: categoryForm.name,
            image: categoryForm.image
        };

        try {
            if (editMode && editId !== null) {
                const response = await fetch(`${BASE_URL}/api/categories/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    const updatedCategory = await response.json();
                    setCategories(categories.map(c => c.id === editId ? updatedCategory : c));
                    alert("Category Updated Successfully!");
                    cancelEdit();
                } else {
                    console.error("Failed to update category. Status:", response.status);
                    alert(`Failed to update category. Status: ${response.status}`);
                }
            } else {
                const response = await fetch(BASE_URL + '/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    const newCategory = await response.json();
                    setCategories([...categories, newCategory]);
                    alert("Category Added Successfully!");
                } else {
                    console.error("Failed to add category. Status:", response.status);
                    alert("Failed to add category.");
                }
            }
        } catch (e) {
            console.error("Error saving category:", e);
            alert("Error saving category.");
        }
        setCategoryForm({ name: '', image: '' });
    };

    const handleEditCategory = (cat) => {
        setCategoryForm({ name: cat.name, image: cat.image });
        setEditId(cat.id);
        setEditMode(true);
    };

    const handleDeleteCategory = async (id) => {
        if (window.confirm("Delete this category?")) {
            try {
                const response = await fetch(`${BASE_URL}/api/categories/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    setCategories(categories.filter(c => c.id !== id));
                } else {
                    alert("Failed to delete category");
                }
            } catch (err) {
                console.error("Error deleting category:", err);
                alert("Error deleting category");
            }
        }
    };

    const handleDeleteProduct = async (id) => {
        if (window.confirm("Delete this product?")) {
            try {
                const response = await fetch(`${BASE_URL}/api/products/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    setProducts(products.filter(p => p.id !== id));
                } else {
                    alert("Failed to delete product");
                }
            } catch (err) {
                console.error("Error deleting product:", err);
                alert("Error deleting product");
            }
        }
    };

    const handleMoveCategory = (index, direction) => {
        const newCategories = [...categories];
        const targetIndex = index + direction;

        if (targetIndex >= 0 && targetIndex < newCategories.length) {
            // Swap
            const temp = newCategories[index];
            newCategories[index] = newCategories[targetIndex];
            newCategories[targetIndex] = temp;
            setCategories(newCategories);
        }
    };

    // --- Review Handlers ---
    const handleManageReviews = (prodId) => {
        setActiveReviewProductId(prodId);
        setActiveTab('manage-reviews');
        // Reset form
        setAdminReviewForm({
            author: 'Flipkart Customer',
            rating: 5,
            text: '',
            date: new Date().toLocaleDateString(),
            images: []
        });
    };

    const handleReviewImageUpload = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('image', file);

            try {
                const response = await fetch(`${BASE_URL}/upload/reviews`, {
                    method: 'POST',
                    body: formData
                });
                if (response.ok) {
                    const data = await response.json();
                    setAdminReviewForm(prev => ({ ...prev, images: [...prev.images, data.path] }));
                    alert(`Review Photo uploaded to ${data.path}`);
                    return;
                }
            } catch (err) {
                console.warn("Upload Server Unavailable. Using Base64.", err);
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                setAdminReviewForm(prev => ({ ...prev, images: [...prev.images, base64String] }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAdminReviewSubmit = async (e) => {
        e.preventDefault();
        const sentimentMap = { 5: 'Excellent', 4: 'Very Good', 3: 'Good', 2: 'Fair', 1: 'Poor' };
        const payload = {
            productId: activeReviewProductId,
            ...adminReviewForm,
            rating: Number(adminReviewForm.rating),
            sentiment: sentimentMap[adminReviewForm.rating],
            verified: true
        };

        try {
            let res;
            if (reviewEditId) {
                // Update Existing Review
                res = await fetch(`${BASE_URL}/api/reviews/${reviewEditId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                // Create New Review
                res = await fetch(BASE_URL + '/api/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                // Refresh list from server to ensure sync
                fetch(`${BASE_URL}/api/reviews?product_id=${activeReviewProductId}`)
                    .then(res => res.json())
                    .then(data => setAdminReviews(data))
                    .catch(e => console.error("Refresh reviews failed", e));

                setAdminReviewForm({
                    author: 'Flipkart Customer',
                    rating: 5,
                    text: '',
                    date: new Date().toLocaleDateString(),
                    images: []
                });
                setReviewEditId(null);
                alert(reviewEditId ? "Review Updated Successfully!" : "Review Added Successfully!");
            } else {
                let errorMsg = res.statusText;
                try {
                    const text = await res.text();
                    try {
                        const data = JSON.parse(text);
                        errorMsg = data.error || errorMsg;
                    } catch {
                        // Not JSON, use raw text
                        if (text) errorMsg = text.substring(0, 150);
                    }
                } catch (e) {
                    console.error("Error reading fail response", e);
                }
                alert(`Failed to save review: ${errorMsg}`);
            }
        } catch (err) {
            console.error(err);
            alert(`Error saving review: ${err.message}`);
        }
    };

    const handleEditAdminReview = (review) => {
        setAdminReviewForm({
            author: review.author,
            rating: review.rating,
            text: review.text,
            date: review.date,
            images: review.images || []
        });
        setReviewEditId(review.id);
        const form = document.querySelector('form[name="reviewForm"]');
        if (form) form.scrollIntoView({ behavior: 'smooth' });
    };

    const cancelReviewEdit = () => {
        setReviewEditId(null);
        setAdminReviewForm({
            author: 'Flipkart Customer',
            rating: 5,
            text: '',
            date: new Date().toLocaleDateString(),
            images: []
        });
    };

    const handleDeleteAdminReview = async (reviewId) => {
        if (window.confirm("Delete this review?")) {
            try {
                const res = await fetch(`${BASE_URL}/api/reviews/${reviewId}`, { method: 'DELETE' });
                if (res.ok) {
                    setAdminReviews(adminReviews.filter(r => r.id !== reviewId));
                } else {
                    alert("Failed to delete review.");
                }
            } catch (err) { console.error(err); }
        }
    };

    // --- Banner Handlers ---
    // --- Banner Handlers ---
    const handleAddBanner = async (e) => {
        e.preventDefault();
        const { image, desktopImage, link } = bannerForm;
        if (!image && !desktopImage) {
            alert("Please provide at least one image (Mobile or Desktop).");
            return;
        }

        try {
            let res;
            if (bannerEditId) {
                res = await fetch(`${BASE_URL}/api/banners/${bannerEditId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image, desktopImage, link })
                });
            } else {
                res = await fetch(BASE_URL + '/api/banners', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image, desktopImage, link })
                });
            }

            if (res.ok) {
                const savedBanner = await res.json();
                if (bannerEditId) {
                    setBanners(banners.map(b => b.id === bannerEditId ? savedBanner : b));
                } else {
                    setBanners([...banners, savedBanner]);
                }
                setBannerForm({ image: '', link: '' }); // Reset Form State
                setBannerEditId(null);
                alert(bannerEditId ? "Banner updated successfully!" : "Banner added successfully!");
            } else {
                const errorData = await res.json();
                alert("Failed to save banner: " + (errorData.message || res.statusText));
            }
        } catch (err) {
            console.error(err);
            alert("Failed to save banner. Check console.");
        }
    };

    const cancelBannerEdit = () => {
        setBannerEditId(null);
        setBannerForm({ image: '', desktopImage: '', link: '' });
    };

    const handleDeleteBanner = async (id) => {
        if (window.confirm("Delete this banner?")) {
            try {
                await fetch(`${BASE_URL}/api/banners/${id}`, { method: 'DELETE' });
                setBanners(banners.filter(b => b.id !== id));
            } catch (err) {
                console.error(err);
            }
        }
    };

    // --- Default Reviews Handlers ---
    const [newDefaultReview, setNewDefaultReview] = useState({ author: 'Flipkart Customer', rating: 5, text: '', sentiment: 'Excellent' });

    const handleAddDefaultReview = async (e) => {
        e.preventDefault();
        const updated = [...defaultReviews, newDefaultReview];
        setDefaultReviews(updated);
        await saveSetting('default_reviews', JSON.stringify(updated));
        setNewDefaultReview({ author: 'Flipkart Customer', rating: 5, text: '', sentiment: 'Excellent' });
        alert("Template Added!");
    };

    const handleRemoveDefaultReview = async (idx) => {
        if (!window.confirm("Remove this template?")) return;
        const updated = defaultReviews.filter((_, i) => i !== idx);
        setDefaultReviews(updated);
        await saveSetting('default_reviews', JSON.stringify(updated));
    };

    // --- Product Group Handlers ---
    const handleGroupSubmit = async (e) => {
        e.preventDefault();
        const payload = { ...productGroupForm };
        try {
            let res;
            if (groupEditId) {
                res = await fetch(`${BASE_URL}/api/product-groups/${groupEditId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(BASE_URL + '/api/product-groups', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                const savedGroup = await res.json();
                if (groupEditId) {
                    setProductGroups(productGroups.map(g => g.id === groupEditId ? savedGroup : g));
                } else {
                    setProductGroups([...productGroups, savedGroup]);
                }
                setProductGroupForm({ title: '', tagline: '', productIds: [], type: 'standard', image: '', badgeText: '', subItems: [] });
                setGroupEditId(null);
                alert("Group Saved!");
            } else {
                alert("Failed to save group");
            }
        } catch (err) {
            console.error(err);
            alert("Error saving group");
        }
    };

    const handleDeleteGroup = async (id) => {
        if (!window.confirm("Delete this group?")) return;
        try {
            await fetch(`${BASE_URL}/api/product-groups/${id}`, { method: 'DELETE' });
            setProductGroups(productGroups.filter(g => g.id !== id));
        } catch (err) { console.error(err); }
    };

    const toggleProductInGroup = (prodId) => {
        const currentIds = productGroupForm.productIds || [];
        if (currentIds.includes(prodId)) {
            setProductGroupForm({ ...productGroupForm, productIds: currentIds.filter(id => id !== prodId) });
        } else {
            setProductGroupForm({ ...productGroupForm, productIds: [...currentIds, prodId] });
        }
    };

    const handleMoveGroup = async (index, direction) => {
        const newGroups = [...productGroups];
        if (direction === 'up' && index > 0) {
            [newGroups[index], newGroups[index - 1]] = [newGroups[index - 1], newGroups[index]];
        } else if (direction === 'down' && index < newGroups.length - 1) {
            [newGroups[index], newGroups[index + 1]] = [newGroups[index + 1], newGroups[index]];
        } else {
            return;
        }

        setProductGroups(newGroups);

        // Send new order to backend
        try {
            const orderedIds = newGroups.map(g => g.id);
            await fetch(BASE_URL + '/api/product-groups/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderedIds })
            });
        } catch (error) {
            console.error("Error reordering groups", error);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans">
            {/* Sidebar */}
            <div className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
                <div className="p-6 text-2xl font-bold border-b border-slate-700 flex items-center gap-2">
                    Flipkart Admin
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button onClick={() => setActiveTab('add-product')} className={`flex items-center gap-3 w-full px-4 py-3 rounded transition-colors ${activeTab === 'add-product' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
                        <FaPlus /> Add Product
                    </button>
                    <button onClick={() => setActiveTab('categories')} className={`flex items-center gap-3 w-full px-4 py-3 rounded transition-colors ${activeTab === 'categories' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
                        <FaList /> Categories
                    </button>
                    <button onClick={() => setActiveTab('products')} className={`flex items-center gap-3 w-full px-4 py-3 rounded transition-colors ${activeTab === 'products' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
                        <FaBox /> Product List
                    </button>
                    <button onClick={() => setActiveTab('bulk-reviews')} className={`flex items-center gap-3 w-full px-4 py-3 rounded transition-colors ${activeTab === 'bulk-reviews' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
                        <FaStar /> Bulk Reviews
                    </button>
                    <button onClick={() => setActiveTab('bulk-upload')} className={`flex items-center gap-3 w-full px-4 py-3 rounded transition-colors ${activeTab === 'bulk-upload' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
                        <FaFileExcel /> Bulk Upload
                    </button>
                    <button
                        onClick={() => setActiveTab('Settings')}
                        className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'Settings' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
                    >
                        <FaGears /> Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('ReviewTemplates')}
                        className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'ReviewTemplates' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
                    >
                        <FaStar /> Review Templates
                    </button>
                    <button onClick={() => setActiveTab('banners')} className={`flex items-center gap-3 w-full px-4 py-3 rounded transition-colors ${activeTab === 'banners' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
                        <FaImage /> Banners
                    </button>
                    <button onClick={() => setActiveTab('product-groups')} className={`flex items-center gap-3 w-full px-4 py-3 rounded transition-colors ${activeTab === 'product-groups' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
                        <FaLayerGroup /> Group Menu
                    </button>
                    <button onClick={() => setActiveTab('marketing')} className={`flex items-center gap-3 w-full px-4 py-3 rounded transition-colors ${activeTab === 'marketing' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
                        <FaBullhorn /> Marketing / Pixel
                    </button>
                    <button onClick={() => setActiveTab('payment')} className={`flex items-center gap-3 w-full px-4 py-3 rounded transition-colors ${activeTab === 'payment' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}>
                        <FaCreditCard /> Payment Settings
                    </button>
                </nav>
                <div className="p-4 border-t border-slate-700 space-y-2">
                    <button onClick={handleLogout} className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors w-full">
                        <FaRightFromBracket /> Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            < div className="flex-1 h-screen overflow-y-auto" >
                <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">
                            {activeTab === 'add-product' && (editMode ? 'Edit Product' : 'Add New Product')}
                            {activeTab === 'categories' && 'Manage Categories'}
                            {activeTab === 'products' && 'Product List'}
                            {activeTab === 'marketing' && 'Marketing Settings'}
                            {activeTab === 'payment' && 'Payment Gateway Configuration'}
                            {activeTab === 'bulk-upload' && 'Bulk Product Upload'}
                            {activeTab === 'manage-reviews' && 'Manage Reviews'}
                            {activeTab === 'banners' && 'Manage Banners'}
                            {activeTab === 'banners' && 'Manage Banners'}
                            {activeTab === 'banners' && 'Manage Banners'}
                            {activeTab === 'product-groups' && 'Manage Home Page Groups'}
                            {activeTab === 'bulk-reviews' && 'Bulk Review Upload (All Products)'}
                        </h1>
                        <button onClick={handleLogout} className="md:hidden text-red-600 font-semibold border border-red-200 px-3 py-1 rounded">Logout</button>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 min-h-[500px]">
                        {/* --- ADD PRODUCT TAB --- */}
                        {
                            activeTab === 'add-product' && (
                                <form onSubmit={handleProductSubmit} className="space-y-6 max-w-3xl mx-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Product Title</label>
                                            <input type="text" className="w-full px-4 py-2 border rounded focus:border-blue-500 outline-none" placeholder="e.g. iPhone 15 Pro" value={productForm.title} onChange={(e) => setProductForm({ ...productForm, title: e.target.value })} required />
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Selling Price (₹)</label>
                                                <input type="number" className="w-full px-4 py-2 border rounded focus:border-blue-500 outline-none" placeholder="e.g. 59999" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Original Price/MRP (₹)</label>
                                                <input type="number" className="w-full px-4 py-2 border rounded focus:border-blue-500 outline-none text-gray-500" placeholder="e.g. 79999" value={productForm.cancelprice} onChange={(e) => setProductForm({ ...productForm, cancelprice: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                                        <select className="w-full px-4 py-2 border rounded focus:border-blue-500 outline-none bg-white" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} required>
                                            <option value="" disabled>Select Category</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                            ))}
                                        </select>
                                        {/* {categories.length === 0 && <p className="text-xs text-red-500 mt-1">No categories found. Please add categories first.</p>} */}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                        <textarea className="w-full px-4 py-2 border rounded focus:border-blue-500 outline-none h-32" placeholder="Describe the product, its key benefits and important details..." value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}></textarea>
                                        <p className="mt-1 text-xs text-gray-400">Line breaks and paragraphs will be preserved on the product page.</p>
                                    </div>

                                    <div>
                                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700">Specifications</label>
                                                <p className="mt-1 text-xs text-gray-400">Create sections such as General, Display or Audio Features.</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addSpecificationSection}
                                                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                                            >
                                                <FaPlus size={12} /> Add section
                                            </button>
                                        </div>

                                        {productForm.specifications.length === 0 ? (
                                            <button
                                                type="button"
                                                onClick={addSpecificationSection}
                                                className="w-full p-6 text-sm text-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-300 hover:text-blue-600"
                                            >
                                                + Add product specifications
                                            </button>
                                        ) : (
                                            <div className="space-y-4">
                                                {productForm.specifications.map((section, sectionIndex) => (
                                                    <div key={sectionIndex} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <input
                                                                type="text"
                                                                value={section.title}
                                                                onChange={(e) => updateSpecificationSection(sectionIndex, e.target.value)}
                                                                placeholder="Section title (e.g. General)"
                                                                className="flex-1 px-3 py-2 font-semibold bg-white border rounded outline-none focus:border-blue-500"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSpecificationSection(sectionIndex)}
                                                                className="p-2 text-red-500 rounded hover:bg-red-50"
                                                                title="Remove section"
                                                                aria-label="Remove specification section"
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </div>

                                                        <div className="space-y-2">
                                                            {section.items.map((item, itemIndex) => (
                                                                <div key={itemIndex} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                                                                    <input
                                                                        type="text"
                                                                        value={item.name}
                                                                        onChange={(e) => updateSpecificationItem(sectionIndex, itemIndex, 'name', e.target.value)}
                                                                        placeholder="Specification name"
                                                                        className="min-w-0 px-3 py-2 text-sm bg-white border rounded outline-none focus:border-blue-500"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={item.value}
                                                                        onChange={(e) => updateSpecificationItem(sectionIndex, itemIndex, 'value', e.target.value)}
                                                                        placeholder="Value"
                                                                        className="min-w-0 px-3 py-2 text-sm bg-white border rounded outline-none focus:border-blue-500"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeSpecificationItem(sectionIndex, itemIndex)}
                                                                        className="p-2 text-gray-400 rounded hover:text-red-500 hover:bg-red-50"
                                                                        title="Remove specification"
                                                                        aria-label="Remove specification"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => addSpecificationItem(sectionIndex)}
                                                            className="mt-3 text-sm font-semibold text-blue-600 hover:underline"
                                                        >
                                                            + Add specification
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Product Images</label>
                                        <div className="space-y-3 p-4 bg-gray-50 rounded border border-dashed border-gray-300">
                                            {productForm.images.map((url, index) => (
                                                <div key={index} className="flex gap-2 items-start">
                                                    <div className="flex-1">
                                                        <input type="text" className="w-full px-3 py-2 border rounded text-sm mb-2" placeholder={`Image URL ${index + 1}`} value={url} onChange={(e) => handleProductUrlChange(index, e.target.value)} />
                                                        <div className="flex gap-2 items-center mb-2">
                                                            {url && url.startsWith('http') && (
                                                                <>
                                                                    <img src={url} alt="Preview" className="h-20 w-20 object-contain bg-white border rounded" onError={(e) => e.target.style.display = 'none'} />
                                                                    <button type="button" onClick={() => saveImageFromUrl(url, setProductForm, 'images', true, index)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200" title="Convert external link to saved local data">
                                                                        ⬇ Save to DB
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button type="button" onClick={() => removeProductUrlField(index)} className="text-red-500 p-2 hover:bg-red-50 rounded">✕</button>
                                                </div>
                                            ))}
                                            <div className="flex justify-between items-start pt-4 border-t border-gray-100">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">OPTION A: Upload Image (Saves to DB)</label>
                                                    <label className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold border border-blue-200 rounded px-3 py-2 w-max bg-blue-50">
                                                        <FaPlus size={12} /> Upload Image File
                                                        <input type="file" onChange={(e) => handleImageUpload(e, setProductForm, 'images', true, 0)} accept="image/*" className="hidden" />
                                                    </label>
                                                </div>

                                                <div className="flex-1 border-l border-gray-200 pl-4">
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">OPTION B: Use Local Project File</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="filename.jpg"
                                                            className="px-2 py-1 border rounded text-sm w-32"
                                                            onChange={(e) => {
                                                                if (e.target.value) {
                                                                    const path = `/uploads/products/${e.target.value}`;
                                                                    // Only update if not empty
                                                                    const newImages = [...productForm.images];
                                                                    if (newImages[0] === '' && newImages.length === 1) newImages[0] = path;
                                                                    else newImages.push(path);
                                                                    setProductForm({ ...productForm, images: newImages });
                                                                }
                                                            }}
                                                        />
                                                        <span className="text-xs text-gray-400 self-center">→ /public/uploads/products/</span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 mt-1">Manual: Copy image to project folder first.</p>
                                                </div>
                                            </div>

                                            <div className="mt-2">
                                                <button type="button" onClick={addProductUrlField} className="text-blue-600 font-semibold text-sm hover:underline">+ Add another URL / Path</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button type="submit" className={`flex-1 text-white font-bold py-3 rounded hover:opacity-90 transition shadow-lg ${editMode ? 'bg-green-600' : 'bg-blue-600'}`}>
                                            {editMode ? 'Update Product' : 'Add Product'}
                                        </button>
                                        {editMode && (
                                            <button type="button" onClick={cancelEdit} className="bg-gray-500 text-white font-bold py-3 px-6 rounded hover:bg-gray-600 transition">
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </form>
                            )
                        }


                        {/* --- BULK UPLOAD TAB --- */}
                        {
                            activeTab === 'bulk-upload' && (
                                <div className="max-w-2xl mx-auto py-8">
                                    <div className="bg-green-50 p-8 rounded-lg mb-8 border border-green-100 text-center">
                                        <h3 className="text-2xl font-bold text-green-800 mb-4 flex items-center justify-center gap-2">
                                            <FaFileExcel /> Bulk Upload Products
                                        </h3>
                                        <p className="text-gray-700 mb-6">
                                            Upload an Excel file (.xlsx) to add multiple products at once. <br />
                                            Make sure your file follows the template format.
                                        </p>

                                        <div className="space-y-4">
                                            <button
                                                onClick={downloadTemplate}
                                                className="px-6 py-2 bg-white text-green-700 font-bold border border-green-300 rounded hover:bg-green-50 transition"
                                            >
                                                Download Template
                                            </button>

                                            <div className="flex justify-center">
                                                <label className="cursor-pointer bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition flex items-center gap-2">
                                                    <FaPlus /> Select Excel File
                                                    <input
                                                        type="file"
                                                        accept=".xlsx, .xls"
                                                        onChange={handleBulkUpload}
                                                        className="hidden"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded border border-gray-200">
                                        <h4 className="font-bold text-gray-800 mb-2">Instructions:</h4>
                                        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                                            <li>Download the template file first.</li>
                                            <li>Fill in the product details (Title, Selling Price, Original Price, Category, etc.).</li>
                                            <li>For <strong>Category</strong>, use names that exactly match your created categories.</li>
                                            <li>For <strong>Image</strong>, paste a valid direct image URL. For multiple images, separate them with a comma (e.g., url1, url2).</li>
                                            <li>Save the file and upload it here.</li>
                                        </ul>
                                    </div>
                                </div>
                            )
                        }

                        {/* --- CATEGORIES TAB --- */}
                        {
                            activeTab === 'categories' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Add Category Form */}
                                    <div className="lg:col-span-1 border-r border-gray-100 pr-0 lg:pr-8">
                                        <h2 className="text-lg font-bold text-gray-700 mb-4">{editMode ? 'Edit Category' : 'Add Category'}</h2>
                                        <form onSubmit={handleCategorySubmit} className="space-y-4">
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">Category Name</label>
                                                <input type="text" className="w-full px-3 py-2 border rounded focus:border-blue-500 outline-none" placeholder="e.g. Mobiles" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Category Image Option</label>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 mb-1">OPTION A: Upload to Public Folder (Recommended)</label>
                                                        <label className="cursor-pointer flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded text-sm hover:bg-blue-100 transition w-full justify-center">
                                                            <FaPlus /> Upload File
                                                            <input type="file" onChange={(e) => handleImageUpload(e, setCategoryForm, 'image')} accept="image/*" className="hidden" />
                                                        </label>
                                                    </div>

                                                    <div className="relative border-t border-gray-100 pt-3">
                                                        <label className="block text-xs font-bold text-gray-500 mb-1">OPTION B: Use Local Path</label>
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-[10px] text-gray-400">/uploads/categories/</span>
                                                            <input
                                                                type="text"
                                                                className="flex-1 px-2 py-1 border rounded text-sm"
                                                                placeholder="icon.png"
                                                                onChange={(e) => {
                                                                    if (e.target.value) setCategoryForm({ ...categoryForm, image: `/uploads/categories/${e.target.value}` });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {categoryForm.image && (
                                                    <div className="mt-4 text-center border p-2 rounded bg-gray-50 relative">
                                                        <p className="text-[10px] text-gray-400 mb-1">Preview:</p>
                                                        <img src={getImgSrc(categoryForm.image)} className="h-16 mx-auto object-contain" alt="Preview" onError={(e) => e.target.src = 'https://via.placeholder.com/50?text=Error'} />
                                                        {categoryForm.image.startsWith('http') && (
                                                            <button type="button" onClick={() => saveImageFromUrl(categoryForm.image, setCategoryForm, 'image')} className="absolute top-1 right-1 text-[10px] bg-blue-600 text-white px-1 rounded">Save</button>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Hidden input for manual URL paste if really needed, or just let them use the above logic */}
                                                <input type="text" className="w-full mt-2 px-2 py-1 border-b text-xs text-gray-400 focus:text-gray-800 focus:border-blue-500 outline-none" placeholder="Or paste full URL here..." value={categoryForm.image} onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })} />
                                            </div>
                                            <button type="submit" className={`w-full text-white py-2 rounded font-semibold transition ${editMode ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-800 hover:bg-slate-900'}`}>
                                                {editMode ? 'Update Category' : 'Add Category'}
                                            </button>
                                            {editMode && (
                                                <button type="button" onClick={cancelEdit} className="w-full bg-gray-300 text-gray-700 py-2 rounded font-semibold hover:bg-gray-400 mt-2">
                                                    Cancel Edit
                                                </button>
                                            )}
                                        </form>
                                    </div>

                                    {/* Categories List */}
                                    <div className="lg:col-span-2">
                                        <h2 className="text-lg font-bold text-gray-700 mb-4">All Categories ({categories.length})</h2>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-100 text-gray-600 text-sm border-b">
                                                        <th className="p-3">Logo</th>
                                                        <th className="p-3">Name</th>
                                                        <th className="p-3 text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {categories.map((cat, index) => (
                                                        <tr key={cat.id} className="border-b hover:bg-gray-50">
                                                            <td className="p-3">
                                                                <div className="w-12 h-12 bg-white border rounded flex items-center justify-center p-1">
                                                                    <img src={getImgSrc(cat.image)} className="max-w-full max-h-full object-contain" alt={cat.name} />
                                                                </div>
                                                            </td>
                                                            <td className="p-3 font-medium text-gray-800">{cat.name}</td>
                                                            <td className="p-3 text-right flex justify-end gap-1">
                                                                <div className="flex flex-col mr-2">
                                                                    <button
                                                                        onClick={() => handleMoveCategory(index, -1)}
                                                                        disabled={index === 0}
                                                                        className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-30"
                                                                        title="Move Up"
                                                                    >
                                                                        ▲
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleMoveCategory(index, 1)}
                                                                        disabled={index === categories.length - 1}
                                                                        className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-30"
                                                                        title="Move Down"
                                                                    >
                                                                        ▼
                                                                    </button>
                                                                </div>
                                                                <button onClick={() => handleEditCategory(cat)} className="text-blue-500 hover:text-blue-700 p-2"><FaPen /></button>
                                                                <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 hover:text-red-700 p-2"><FaTrash /></button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {categories.length === 0 && (
                                                        <tr><td colSpan="3" className="text-center p-4 text-gray-500">No categories added yet.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        {/* --- MANAGE REVIEWS TAB --- */}
                        {
                            activeTab === 'manage-reviews' && (
                                <div className="space-y-8">
                                    <div className="flex items-center gap-4 mb-4">
                                        <button onClick={() => setActiveTab('products')} className="text-blue-600 hover:underline">← Back to Product List</button>
                                        <h2 className="text-xl font-bold text-gray-800">
                                            Reviews for: <span className="text-blue-600">{products.find(p => p.id === activeReviewProductId)?.title || activeReviewProductId}</span>
                                        </h2>
                                    </div>

                                    {/* Add/Edit Review Form */}
                                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
                                        <h3 className="font-bold text-lg text-purple-900 mb-4">{reviewEditId ? 'Edit Review' : 'Add Manual Review'}</h3>
                                        <form name="reviewForm" onSubmit={handleAdminReviewSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Name</label>
                                                <input type="text" className="w-full px-4 py-2 border rounded focus:border-purple-500 outline-none" placeholder="Reviewer Name" value={adminReviewForm.author} onChange={(e) => setAdminReviewForm({ ...adminReviewForm, author: e.target.value })} required />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Rating</label>
                                                <select className="w-full px-4 py-2 border rounded focus:border-purple-500 outline-none bg-white" value={adminReviewForm.rating} onChange={(e) => setAdminReviewForm({ ...adminReviewForm, rating: Number(e.target.value) })}>
                                                    <option value="5">5 Stars (Excellent)</option>
                                                    <option value="4">4 Stars (Very Good)</option>
                                                    <option value="3">3 Stars (Good)</option>
                                                    <option value="2">2 Stars (Fair)</option>
                                                    <option value="1">1 Star (Poor)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                                                <input type="text" className="w-full px-4 py-2 border rounded focus:border-purple-500 outline-none" placeholder="e.g. 10/10/2023" value={adminReviewForm.date} onChange={(e) => setAdminReviewForm({ ...adminReviewForm, date: e.target.value })} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Review Content</label>
                                                <textarea className="w-full px-4 py-2 border rounded focus:border-purple-500 outline-none h-24" placeholder="Review text..." value={adminReviewForm.text} onChange={(e) => setAdminReviewForm({ ...adminReviewForm, text: e.target.value })} required></textarea>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Review Photos</label>
                                                <div className="flex gap-4 flex-wrap">
                                                    {adminReviewForm.images.map((img, idx) => (
                                                        <img key={idx} src={img} alt="review" className="h-16 w-16 object-cover rounded border" />
                                                    ))}
                                                    <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 px-4 py-2 rounded shadow-sm text-sm flex items-center gap-2">
                                                        <FaPlus /> Add Photo
                                                        <input type="file" accept="image/*" onChange={handleReviewImageUpload} className="hidden" />
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="md:col-span-2 flex gap-4">
                                                <button type="submit" className="flex-1 bg-purple-600 text-white font-bold py-3 rounded hover:bg-purple-700 transition">
                                                    {reviewEditId ? 'Update Review' : 'Add Review'}
                                                </button>
                                                {reviewEditId && (
                                                    <button type="button" onClick={cancelReviewEdit} className="bg-gray-400 text-white font-bold py-3 px-6 rounded hover:bg-gray-500 transition">
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </form>
                                    </div>

                                    {/* Existing Reviews List */}
                                    <div className="bg-white rounded border border-gray-200">
                                        <div className="p-4 bg-gray-50 border-b border-gray-100 font-bold text-gray-700">Existing Reviews ({Array.isArray(adminReviews) ? adminReviews.length : 0})</div>
                                        <div className="divide-y divide-gray-100">
                                            {Array.isArray(adminReviews) && adminReviews.map((review) => (
                                                <div key={review.id} className="p-4 hover:bg-gray-50 flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-gray-800">{review.author}</span>
                                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{review.rating} ★</span>
                                                            <span className="text-xs text-gray-500">{review.date}</span>
                                                        </div>
                                                        <p className="text-gray-600 text-sm">{review.text}</p>
                                                        {review.images && review.images.length > 0 && (
                                                            <div className="flex gap-2 mt-2">
                                                                {review.images.map((img, i) => (
                                                                    <img key={i} src={img} alt="review-img" className="h-12 w-12 object-cover rounded border" />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleEditAdminReview(review)} className="text-blue-500 hover:text-blue-700 p-2"><FaPen /></button>
                                                        <button onClick={() => handleDeleteAdminReview(review.id)} className="text-red-500 hover:text-red-700 p-2"><FaTrash /></button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!Array.isArray(adminReviews) || adminReviews.length === 0) && <div className="p-8 text-center text-gray-500">No reviews found for this product.</div>}
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        {/* --- PRODUCTS LIST TAB --- */}
                        {
                            activeTab === 'products' && (
                                <div>
                                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-100 text-gray-700 font-semibold uppercase">
                                                <tr>
                                                    <th className="p-4">Image</th>
                                                    <th className="p-4">Product Name</th>
                                                    <th className="p-4">Category</th>
                                                    <th className="p-4">Price</th>
                                                    <th className="p-4">MRP</th>
                                                    <th className="p-4">Reviews</th>
                                                    <th className="p-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {products.map((prod) => (
                                                    <tr key={prod.id} className="hover:bg-gray-50">
                                                        <td className="p-4">
                                                            <img src={prod.images[0]} className="h-12 w-12 object-contain rounded border bg-white" alt={prod.title} />
                                                        </td>
                                                        <td className="p-4 font-medium text-gray-900">{prod.title}</td>
                                                        <td className="p-4">
                                                            <span className="bg-blue-50 text-blue-700 py-1 px-3 rounded-full text-xs font-semibold border border-blue-100">
                                                                {prod.category}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-gray-600">₹{prod.price}</td>
                                                        <td className="p-4 text-gray-400 line-through">₹{prod.cancelprice}</td>
                                                        <td className="p-4">
                                                            <button onClick={() => handleManageReviews(prod.id)} className="text-purple-600 hover:text-purple-800 text-xs font-bold border border-purple-200 bg-purple-50 px-3 py-1 rounded">
                                                                Manage Reviews
                                                            </button>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <button onClick={() => handleEditProduct(prod)} className="text-blue-500 hover:text-blue-700 p-2 mr-2"><FaPen /></button>
                                                            <button onClick={() => handleDeleteProduct(prod.id)} className="text-red-500 hover:text-red-700"><FaTrash /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {products.length === 0 && (
                                                    <tr><td colSpan="7" className="text-center p-8 text-gray-500">No products added yet.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )
                        }


                        {/* --- MARKETING / PIXEL TAB --- */}
                        {
                            activeTab === 'marketing' && (
                                <div className="max-w-3xl mx-auto py-8">
                                    <div className="bg-blue-50 p-6 rounded-lg mb-8 border border-blue-100">
                                        <h3 className="text-lg font-bold text-blue-800 mb-2 flex items-center gap-2">
                                            <FaBullhorn /> Meta (Facebook) Pixel Integration
                                        </h3>
                                        <p className="text-sm text-blue-900 mb-6">
                                            Configure your Meta Pixel to track visitors. You can set a default pixel for all traffic, or specific pixels for different domains (e.g., if you run multiple sites from this admin).
                                        </p>

                                        {/* Default Pixel */}
                                        <div className="bg-white p-4 rounded border border-blue-200 mb-6 shadow-sm">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Default Pixel ID (Fallback)</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 border rounded focus:border-blue-500 outline-none"
                                                placeholder="e.g. 1234567890"
                                                value={pixelId}
                                                onChange={(e) => setPixelId(e.target.value)}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Used if no specific domain match is found below.</p>
                                            <button
                                                onClick={() => saveSetting('meta_pixel_id', pixelId).then(ok => ok && alert('Default Pixel ID Saved!'))}
                                                className="mt-2 px-4 py-1 bg-blue-600 text-white text-sm font-bold rounded hover:bg-blue-700 transition"
                                            >
                                                Save Default
                                            </button>
                                        </div>

                                        {/* Multi-Domain Config */}
                                        <div className="bg-white p-4 rounded border border-blue-200 shadow-sm">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Multi-Domain Configuration</label>
                                            <p className="text-xs text-gray-600 mb-2">
                                                Enter one mapping per line in the format: <strong>domain.com=PIXEL_ID</strong>
                                            </p>
                                            <textarea
                                                className="w-full px-4 py-2 border rounded focus:border-blue-500 outline-none h-40 font-mono text-sm"
                                                placeholder={`example.com=11111111\nanother-shop.com=22222222\nmy-store.net=33333333`}
                                                value={pixelConfig}
                                                onChange={(e) => setPixelConfig(e.target.value)}
                                            ></textarea>
                                            <button
                                                onClick={() => saveSetting('meta_pixel_config', pixelConfig).then(ok => ok && alert('Domain Configuration Saved!'))}
                                                className="mt-3 px-4 py-2 bg-slate-800 text-white font-bold rounded hover:bg-slate-900 transition"
                                            >
                                                Save Domain Config
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        {/* --- PAYMENT METHOD TAB --- */}
                        {
                            activeTab === 'payment' && (
                                <div className="max-w-2xl mx-auto py-8">
                                    <div className="bg-orange-50 p-6 rounded-lg mb-8 border border-orange-100">
                                        <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
                                            <FaCreditCard /> Direct UPI Payment Setup
                                        </h3>

                                        <form onSubmit={(e) => {
                                            e.preventDefault();
                                            const configToSave = sanitizePaymentConfig(paymentConfig);
                                            saveSetting('meta_payment_config', configToSave).then(ok => {
                                                if (ok) {
                                                    setPaymentConfig(configToSave);
                                                    alert("UPI QR configurations saved!");
                                                }
                                            });
                                        }}>
                                            <div className="space-y-4">
                                                <div className="p-4 bg-white border border-orange-200 rounded-lg shadow-sm">
                                                    <h4 className="mb-1 font-bold text-gray-800">Default UPI QR</h4>
                                                    <p className="mb-4 text-xs text-gray-500">Shown when the payment page first loads and used whenever a method-specific UPI ID is empty.</p>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-bold text-gray-700 mb-1">Default UPI ID (VPA)</label>
                                                            <input
                                                                type="text"
                                                                className="w-full px-4 py-2 border rounded focus:border-orange-500 outline-none"
                                                                placeholder="e.g. yourbusiness@okicici"
                                                                value={paymentConfig.upiId}
                                                                onChange={(e) => setPaymentConfig({ ...paymentConfig, upiId: e.target.value })}
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-bold text-gray-700 mb-1">Merchant / Business Name</label>
                                                            <input
                                                                type="text"
                                                                className="w-full px-4 py-2 border rounded focus:border-orange-500 outline-none"
                                                                placeholder="e.g. My Online Store"
                                                                value={paymentConfig.merchantName}
                                                                onChange={(e) => setPaymentConfig({ ...paymentConfig, merchantName: e.target.value })}
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                    {PAYMENT_METHOD_OPTIONS.map(method => (
                                                        <div key={method.key} className="p-4 bg-white border border-orange-100 rounded-lg">
                                                            <label className="block text-sm font-bold text-gray-800 mb-1">{method.label}</label>
                                                            <p className="mb-3 text-xs text-gray-500">Optional. Leave empty to use the default UPI QR.</p>
                                                            <input
                                                                type="text"
                                                                className="w-full px-4 py-2 border rounded focus:border-orange-500 outline-none"
                                                                placeholder="Method-specific UPI ID"
                                                                value={paymentConfig.methodUpiIds[method.key]}
                                                                onChange={(e) => setPaymentConfig({
                                                                    ...paymentConfig,
                                                                    methodUpiIds: {
                                                                        ...paymentConfig.methodUpiIds,
                                                                        [method.key]: e.target.value
                                                                    }
                                                                })}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="pt-2">
                                                    <button type="submit" className="w-full bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-700 transition">
                                                        Save All UPI QR Details
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                        <p className="text-xs text-orange-900 mt-4 bg-orange-200 p-2 rounded">
                                            <strong>Note:</strong> The merchant name and selected UPI ID are embedded in each desktop QR code. Mobile app links continue using the default UPI configuration.
                                        </p>
                                    </div>
                                </div>
                            )
                        }

                        {/* --- BANNERS TAB --- */}
                        {
                            activeTab === 'banners' && (
                                <div className="space-y-8">
                                    <div className="bg-white p-6 rounded shadow-sm border border-gray-100">
                                        <h3 className="text-xl font-bold mb-4">Add New Banner</h3>
                                        <form onSubmit={handleAddBanner} className="flex flex-col gap-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                                <div>
                                                    <label className="block text-sm font-semibold mb-1">Mobile Banner Image</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            name="image"
                                                            type="text"
                                                            className="flex-1 px-4 py-2 border rounded"
                                                            placeholder="Image Path / URL"

                                                            value={bannerForm.image}
                                                            onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })}
                                                        />
                                                        <label className="cursor-pointer bg-blue-100 text-blue-700 px-4 py-2 rounded font-semibold hover:bg-blue-200 whitespace-nowrap">
                                                            Upload
                                                            <input type="file" className="hidden" onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    const formData = new FormData();
                                                                    formData.append('image', file);

                                                                    // Show loading state if needed, or just upload
                                                                    fetch(`${BASE_URL}/upload/banners`, { method: 'POST', body: formData })
                                                                        .then(res => {
                                                                            if (!res.ok) throw new Error("Upload failed");
                                                                            return res.json();
                                                                        })
                                                                        .then(data => {
                                                                            const fullPath = `${BASE_URL}${data.path}`;
                                                                            setBannerForm(prev => ({ ...prev, image: fullPath }));
                                                                        })
                                                                        .catch(err => alert("Upload failed: " + err.message));
                                                                }
                                                                // Reset value so same file can be selected again
                                                                e.target.value = null;
                                                            }} />
                                                        </label>
                                                    </div>
                                                    {/* PREVIEW IMAGE */}
                                                    {bannerForm.image && (
                                                        <div className="mt-2 p-2 border border-gray-100 bg-gray-50 rounded">
                                                            <p className="text-xs text-gray-500 mb-1">Mobile Preview:</p>
                                                            <img
                                                                src={bannerForm.image}
                                                                alt="Preview"
                                                                className="h-32 object-contain bg-white border rounded"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                }}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* DESKTOP BANNER INPUT */}
                                                    <div className="mt-4 border-t pt-4">
                                                        <label className="block text-sm font-semibold mb-1">Desktop Banner Image (Optional)</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                name="desktopImage"
                                                                type="text"
                                                                className="flex-1 px-4 py-2 border rounded"
                                                                placeholder="Desktop Image Path / URL"
                                                                value={bannerForm.desktopImage}
                                                                onChange={(e) => setBannerForm({ ...bannerForm, desktopImage: e.target.value })}
                                                            />
                                                            <label className="cursor-pointer bg-purple-100 text-purple-700 px-4 py-2 rounded font-semibold hover:bg-purple-200 whitespace-nowrap">
                                                                Upload
                                                                <input type="file" className="hidden" onChange={(e) => {
                                                                    const file = e.target.files[0];
                                                                    if (file) {
                                                                        const formData = new FormData();
                                                                        formData.append('image', file);

                                                                        fetch(`${BASE_URL}/upload/banners`, { method: 'POST', body: formData })
                                                                            .then(res => {
                                                                                if (!res.ok) throw new Error("Upload failed");
                                                                                return res.json();
                                                                            })
                                                                            .then(data => {
                                                                                const fullPath = `${BASE_URL}${data.path}`;
                                                                                setBannerForm(prev => ({ ...prev, desktopImage: fullPath }));
                                                                            })
                                                                            .catch(err => alert("Upload failed: " + err.message));
                                                                    }
                                                                    e.target.value = null;
                                                                }} />
                                                            </label>
                                                        </div>
                                                        {bannerForm.desktopImage && (
                                                            <div className="mt-2 p-2 border border-gray-100 bg-gray-50 rounded">
                                                                <p className="text-xs text-gray-500 mb-1">Desktop Preview:</p>
                                                                <img
                                                                    src={bannerForm.desktopImage}
                                                                    alt="Preview"
                                                                    className="h-32 w-full object-cover bg-white border rounded"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                    }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold mb-1">Link Target</label>

                                                    <div className="flex flex-col gap-3 p-3 border rounded bg-gray-50">
                                                        {/* Link Type Selector */}
                                                        <select
                                                            className="w-full px-3 py-2 border rounded bg-white text-sm"
                                                            onChange={(e) => {
                                                                const type = e.target.value;
                                                                if (type === 'custom') setBannerForm({ ...bannerForm, link: '' });
                                                                // Don't clear fully if just switching types, but maybe safer to clear
                                                            }}
                                                        >
                                                            <option value="custom">Custom URL / Manual Path</option>
                                                            <option value="category">Category Page</option>
                                                            <option value="product">Specific Product</option>
                                                        </select>

                                                        {/* Dynamic Inputs based on selection - using refs or just rendering inputs that update the main 'link' state */}
                                                        <div className="flex gap-2 items-center">
                                                            <span className="text-sm font-medium whitespace-nowrap w-20">URL:</span>

                                                            {/* We render ALL selectors but hide/show based on parent (simplified by using one visible input concept for now or swapping logic) */}
                                                            {/* Actually, let's keep it simple: Render a SELECT for picking, updating the INPUT below */}

                                                            <select
                                                                className="flex-1 px-3 py-2 border rounded text-sm"
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    if (!val) return;
                                                                    setBannerForm({ ...bannerForm, link: val });
                                                                }}
                                                            >
                                                                <option value="">-- Quick Select Destination --</option>
                                                                <optgroup label="Categories">
                                                                    {categories.map(cat => (
                                                                        <option key={cat.id} value={`/?category=${cat.name}`}>{cat.name}</option>
                                                                    ))}
                                                                </optgroup>
                                                                <optgroup label="Product Groups">
                                                                    {productGroups.map(grp => (
                                                                        <option key={grp.id} value={`/?group=${grp.title}`}>{grp.title}</option>
                                                                    ))}
                                                                </optgroup>
                                                                <optgroup label="Recent Products">
                                                                    {products.slice(0, 20).map(prod => (
                                                                        <option key={prod.id} value={`/product/${prod.id}`}>{prod.title.substring(0, 40)}...</option>
                                                                    ))}
                                                                </optgroup>
                                                            </select>
                                                        </div>

                                                        {/* Manual Override Input */}
                                                        <input
                                                            name="link"
                                                            type="text"
                                                            className="w-full px-4 py-2 border rounded text-sm"
                                                            placeholder="Final URL (e.g. /category/mobiles)"
                                                            value={bannerForm.link}
                                                            onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })}
                                                        />
                                                        <p className="text-[11px] text-gray-400">Select a destination above or type manually.</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button type="submit" className="bg-blue-600 text-white font-bold px-6 py-2 rounded hover:bg-blue-700 w-full md:w-auto">
                                                    {bannerEditId ? 'Update Banner' : 'Add Banner'}
                                                </button>
                                                {bannerEditId && (
                                                    <button type="button" onClick={cancelBannerEdit} className="bg-gray-500 text-white font-bold px-6 py-2 rounded hover:bg-gray-600">
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </form>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {banners.map(banner => (
                                            <div key={banner.id} className="relative group border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                                                <div className="flex flex-col h-48 bg-gray-100">
                                                    {banner.image ? (
                                                        <img src={banner.image} alt="Mobile" className="w-full h-1/2 object-contain border-b" title="Mobile Banner" />
                                                    ) : (
                                                        <div className="h-1/2 flex items-center justify-center text-xs text-gray-400 border-b">No Mobile Image</div>
                                                    )}
                                                    {banner.desktopImage ? (
                                                        <img src={banner.desktopImage} alt="Desktop" className="w-full h-1/2 object-cover" title="Desktop Banner" />
                                                    ) : (
                                                        <div className="h-1/2 flex items-center justify-center text-xs text-gray-400">No Desktop Image</div>
                                                    )}
                                                </div>
                                                <div className="absolute top-2 right-2 flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setBannerEditId(banner.id);
                                                            setBannerEditId(banner.id);
                                                            setBannerForm({ image: banner.image || '', desktopImage: banner.desktopImage || '', link: banner.link || '' });
                                                            // Scroll to form
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className="bg-white text-blue-600 p-2 rounded-full shadow hover:bg-blue-50"
                                                        title="Edit Banner"
                                                    >
                                                        <FaPen size={12} />
                                                    </button>
                                                    <button onClick={() => handleDeleteBanner(banner.id)} className="bg-red-600 text-white p-2 rounded-full shadow hover:bg-red-700" title="Delete Banner">
                                                        <FaTrash size={12} />
                                                    </button>
                                                </div>
                                                <div className="p-2 bg-white text-xs text-gray-500 truncate border-t">
                                                    Link: {banner.link || 'None'}
                                                </div>
                                            </div>
                                        ))}
                                        {banners.length === 0 && <p className="text-gray-500 col-span-2 text-center py-8">No banners added yet.</p>}
                                    </div>
                                </div>
                            )
                        }

                        {/* --- PRODUCT GROUPS TAB --- */}
                        {
                            activeTab === 'product-groups' && (
                                <div className="space-y-8">
                                    <div className="bg-white p-6 rounded shadow-sm border border-gray-100">
                                        <h3 className="text-xl font-bold mb-4">{groupEditId ? 'Edit Group' : 'Create New Group'}</h3>
                                        <form onSubmit={handleGroupSubmit} className="flex flex-col gap-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-semibold mb-1">Group Title</label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-4 py-2 border rounded"
                                                        placeholder="e.g. Best of Electronics"
                                                        value={productGroupForm.title}
                                                        onChange={(e) => setProductGroupForm({ ...productGroupForm, title: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold mb-1">Tagline (Optional)</label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-4 py-2 border rounded"
                                                        placeholder="e.g. Best Selling"
                                                        value={productGroupForm.tagline}
                                                        onChange={(e) => setProductGroupForm({ ...productGroupForm, tagline: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold mb-1">Background Color (Mobile Box)</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            className="h-10 w-10 border rounded cursor-pointer p-0.5"
                                                            value={productGroupForm.backgroundColor || '#E2F2E4'}
                                                            onChange={(e) => setProductGroupForm({ ...productGroupForm, backgroundColor: e.target.value })}
                                                        />
                                                        <input
                                                            type="text"
                                                            className="flex-1 px-4 py-2 border rounded"
                                                            placeholder="#E2F2E4"
                                                            value={productGroupForm.backgroundColor || ''}
                                                            onChange={(e) => setProductGroupForm({ ...productGroupForm, backgroundColor: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Type Selection */}
                                                <div>
                                                    <label className="block text-sm font-semibold mb-1">Group Type</label>
                                                    <select
                                                        className="w-full px-4 py-2 border rounded bg-white"
                                                        value={productGroupForm.type || 'standard'}
                                                        onChange={(e) => setProductGroupForm({ ...productGroupForm, type: e.target.value })}
                                                    >
                                                        <option value="standard">Standard Slider (Products)</option>
                                                        <option value="micro-grid">Micro Grid (Collection Cards)</option>
                                                    </select>
                                                </div>

                                                {/* Micro Grid Sub-Item Management */}
                                                {productGroupForm.type === 'micro-grid' && (
                                                    <div className="md:col-span-2 bg-gray-50 p-4 rounded border">
                                                        <h4 className="font-bold mb-3 text-sm uppercase text-gray-500">Add Collection Card</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                            <input type="text" placeholder="Title / Caption (e.g. Walking Shoes)" className="border p-2 rounded"
                                                                value={tempSubItem.title} onChange={e => setTempSubItem({ ...tempSubItem, title: e.target.value })} />
                                                            <input type="text" placeholder="Badge Text (e.g. Min 50% Off)" className="border p-2 rounded"
                                                                value={tempSubItem.badgeText} onChange={e => setTempSubItem({ ...tempSubItem, badgeText: e.target.value })} />
                                                            <input type="text" placeholder="Filter Link (e.g. Shoes)" className="border p-2 rounded"
                                                                value={tempSubItem.link} onChange={e => setTempSubItem({ ...tempSubItem, link: e.target.value })} />

                                                            <div className="flex gap-2 items-center">
                                                                {tempSubItem.image && <img src={tempSubItem.image} className="h-8 w-8 object-cover" alt="" />}
                                                                <input type="file" className="text-xs" onChange={async (e) => {
                                                                    const file = e.target.files[0];
                                                                    if (!file) return;
                                                                    const formData = new FormData();
                                                                    formData.append('image', file);
                                                                    try {
                                                                        const res = await fetch('/upload/banners', { method: 'POST', body: formData });
                                                                        const data = await res.json();
                                                                        if (res.ok) setTempSubItem({ ...tempSubItem, image: data.path });
                                                                    } catch (err) { console.error(err); }
                                                                }} />
                                                            </div>
                                                        </div>
                                                        <button type="button" onClick={handleAddSubItem} className="bg-green-600 text-white px-4 py-1 rounded text-sm font-bold mb-4">
                                                            + Add Card
                                                        </button>

                                                        {/* List of Added Sub Items */}
                                                        <div className="space-y-2">
                                                            {(productGroupForm.subItems || []).map((item, idx) => (
                                                                <div key={idx} className="flex items-center gap-3 bg-white p-2 border rounded">
                                                                    <img src={item.image || 'https://via.placeholder.com/40'} className="h-10 w-10 object-contain mix-blend-multiply" alt="" />
                                                                    <div className="flex-1">
                                                                        <p className="font-bold text-sm">{item.title}</p>
                                                                        <p className="text-xs text-pink-600">{item.badgeText}</p>
                                                                    </div>
                                                                    <button type="button" onClick={() => handleRemoveSubItem(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                                                        <FaTrash />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* OLD Micro Group Fields (single item) - Deprecated but keeping for compatibility if strictly needed, or replacing? I will replace. */}
                                                {/* Removed old micro logic to favor the new multi-item logic */}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Select Products ({productGroupForm.productIds.length} selected)</label>
                                                <div className="h-64 overflow-y-auto border rounded p-2 bg-gray-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                    {products.map(prod => (
                                                        <div key={prod.id}
                                                            className={`flex items-center gap-2 p-2 rounded cursor-pointer border ${productGroupForm.productIds.includes(prod.id) ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-200 hover:border-blue-300'}`}
                                                            onClick={() => toggleProductInGroup(prod.id)}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={productGroupForm.productIds.includes(prod.id)}
                                                                readOnly
                                                                className="accent-blue-600"
                                                            />
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                <img src={prod.images[0]} className="h-8 w-8 object-contain" alt="" />
                                                                <span className="text-sm truncate">{prod.title}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button type="submit" className="bg-blue-600 text-white font-bold px-6 py-2 rounded hover:bg-blue-700">
                                                    {groupEditId ? 'Update Group' : 'Create Group'}
                                                </button>
                                                {groupEditId && (
                                                    <button type="button" onClick={() => { setGroupEditId(null); setProductGroupForm({ title: '', tagline: '', productIds: [] }); }} className="bg-gray-500 text-white font-bold px-6 py-2 rounded">
                                                        Cancel
                                                    </button>
                                                )}
                                            </div>
                                        </form>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {productGroups.map((group, index) => (
                                            <div key={group.id} className="bg-white p-4 rounded shadow border border-gray-100 flex justify-between items-center">
                                                <div>
                                                    <h4 className="font-bold text-lg">{group.title}</h4>
                                                    <p className="text-sm text-gray-500">{group.tagline}</p>
                                                    <p className="text-xs text-blue-600 mt-1">{group.productIds.length} Products Linked</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="flex flex-col gap-1 mr-2">
                                                        <button
                                                            onClick={() => handleMoveGroup(index, 'up')}
                                                            disabled={index === 0}
                                                            className={`p-1 rounded ${index === 0 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                                                        >
                                                            <FaArrowUp size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleMoveGroup(index, 'down')}
                                                            disabled={index === productGroups.length - 1}
                                                            className={`p-1 rounded ${index === productGroups.length - 1 ? 'text-gray-300' : 'text-gray-600 hover:bg-gray-100'}`}
                                                        >
                                                            <FaArrowDown size={12} />
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setGroupEditId(group.id);
                                                            setProductGroupForm({
                                                                title: group.title,
                                                                tagline: group.tagline,
                                                                productIds: group.productIds || [],
                                                                backgroundColor: group.backgroundColor,
                                                                type: group.type || 'standard',
                                                                image: group.image || '',
                                                                badgeText: group.badgeText || '',
                                                                subItems: group.subItems || []
                                                            });
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className="text-blue-500 hover:bg-blue-50 p-2 rounded"
                                                    >
                                                        <FaPen />
                                                    </button>
                                                    <button onClick={() => handleDeleteGroup(group.id)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {productGroups.length === 0 && <p className="text-center text-gray-400 py-8">No groups created yet.</p>}
                                    </div>
                                </div>
                            )
                        }

                        {/* --- REVIEW TEMPLATES TAB --- */}
                        {
                            activeTab === 'ReviewTemplates' && (
                                <div className="max-w-2xl mx-auto space-y-8">
                                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
                                        <h3 className="text-xl font-bold text-purple-900 mb-2">Automated Review Templates</h3>
                                        <p className="text-sm text-purple-800 mb-4">
                                            These reviews will be <strong>automatically added</strong> to any NEW product you create (Single or Bulk Upload).
                                            <br />This helps new products look popular immediately.
                                        </p>

                                        <form onSubmit={handleAddDefaultReview} className="bg-white p-4 rounded border border-purple-100 shadow-sm flex flex-col gap-3">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Review Text (e.g. Amazing product!)"
                                                    className="flex-1 px-3 py-2 border rounded"
                                                    value={newDefaultReview.text}
                                                    onChange={e => setNewDefaultReview({ ...newDefaultReview, text: e.target.value })}
                                                    required
                                                />
                                                <select
                                                    className="px-3 py-2 border rounded"
                                                    value={newDefaultReview.rating}
                                                    onChange={e => setNewDefaultReview({ ...newDefaultReview, rating: Number(e.target.value) })}
                                                >
                                                    <option value="5">5 ★</option>
                                                    <option value="4">4 ★</option>
                                                    <option value="3">3 ★</option>
                                                    <option value="2">2 ★</option>
                                                    <option value="1">1 ★</option>
                                                </select>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Author Name (e.g. Flipkart Customer)"
                                                    className="flex-1 px-3 py-2 border rounded"
                                                    value={newDefaultReview.author}
                                                    onChange={e => setNewDefaultReview({ ...newDefaultReview, author: e.target.value })}
                                                />
                                                <button type="submit" className="bg-purple-600 text-white font-bold px-6 py-2 rounded hover:bg-purple-700">
                                                    + Add Template
                                                </button>
                                            </div>
                                        </form>
                                    </div>

                                    {/* List of Active Templates */}
                                    <div className="bg-white rounded shadow-sm border">
                                        <div className="p-4 border-b bg-gray-50 font-bold flex justify-between items-center">
                                            <span>Active Templates ({defaultReviews.length})</span>
                                            <div className="flex gap-2 items-center">
                                                <label className="cursor-pointer bg-green-600 text-white px-3 py-1 rounded text-sm font-bold hover:bg-green-700 flex items-center gap-2">
                                                    <FaFileExcel /> Upload Excel
                                                    <input
                                                        type="file"
                                                        accept=".xlsx, .xls"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files[0];
                                                            if (!file) return;

                                                            const reader = new FileReader();
                                                            reader.onload = (evt) => {
                                                                const bstr = evt.target.result;
                                                                const wb = XLSX.read(bstr, { type: 'binary' });
                                                                const wsname = wb.SheetNames[0];
                                                                const ws = wb.Sheets[wsname];
                                                                const data = XLSX.utils.sheet_to_json(ws);

                                                                if (data.length === 0) {
                                                                    alert("Excel file is empty!");
                                                                    return;
                                                                }

                                                                if (window.confirm(`Found ${data.length} templates. Add them to your list?`)) {
                                                                    const newTemplates = data.map(item => ({
                                                                        author: item.Author || item.author || 'Flipkart Customer',
                                                                        rating: item.Rating || item.rating || 5,
                                                                        text: item.Text || item.text || item.Review || item.review || '',
                                                                        sentiment: item.Sentiment || item.sentiment || 'Excellent',
                                                                        date: new Date().toLocaleDateString()
                                                                    })).filter(t => t.text); // Ensure text exists

                                                                    const updated = [...defaultReviews, ...newTemplates];
                                                                    setDefaultReviews(updated);
                                                                    saveSetting('default_reviews', updated); // Save to DB
                                                                    alert(`Successfully added ${newTemplates.length} templates!`);
                                                                }
                                                            };
                                                            reader.readAsBinaryString(file);
                                                            e.target.value = null;
                                                        }}
                                                    />
                                                </label>
                                                {defaultReviews.length > 0 && <span className="text-xs text-green-600 font-normal">Auto-applying to new products</span>}
                                            </div>
                                        </div>
                                        <div className="divide-y">
                                            {defaultReviews.map((r, i) => (
                                                <div key={i} className="p-4 flex gap-4 items-start hover:bg-gray-50">
                                                    <div className="mt-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                                                        {r.rating} ★
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-800">{r.text}</p>
                                                        <p className="text-xs text-gray-500">- {r.author}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveDefaultReview(i)}
                                                        className="text-red-400 hover:text-red-600 p-2"
                                                        title="Remove Template"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            ))}
                                            {defaultReviews.length === 0 && (
                                                <p className="p-8 text-center text-gray-400 italic">
                                                    No templates configured. New products will start with 0 reviews.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        {/* --- BULK REVIEWS TAB --- */}
                        {
                            activeTab === 'bulk-reviews' && (
                                <div className="max-w-2xl mx-auto">
                                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-6 text-yellow-800 text-sm">
                                        <strong>Warning:</strong> The review creating here will be added to <strong>EVERY SINGLE PRODUCT</strong> in your database ({products.length} products).
                                        Use this for store-wide positive sentiment injection.
                                    </div>
                                    <form onSubmit={handleBulkReviewSubmit} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Author Name</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 border rounded"
                                                value={bulkReviewForm.author}
                                                onChange={(e) => setBulkReviewForm({ ...bulkReviewForm, author: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Rating</label>
                                            <div className="flex gap-4">
                                                {[5, 4, 3, 2, 1].map(r => (
                                                    <label key={r} className="flex items-center gap-1 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="rating"
                                                            value={r}
                                                            checked={parseInt(bulkReviewForm.rating) === r}
                                                            onChange={(e) => setBulkReviewForm({ ...bulkReviewForm, rating: parseInt(e.target.value) })}
                                                        />
                                                        <span className="font-bold">{r} Stars</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Review Text</label>
                                            <textarea
                                                className="w-full px-4 py-2 border rounded h-32"
                                                placeholder="Write a generic review that applies to all products..."
                                                value={bulkReviewForm.text}
                                                onChange={(e) => setBulkReviewForm({ ...bulkReviewForm, text: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Date</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 border rounded"
                                                value={bulkReviewForm.date}
                                                onChange={(e) => setBulkReviewForm({ ...bulkReviewForm, date: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-1">Sentiment Label</label>
                                            <select
                                                className="w-full px-4 py-2 border rounded bg-white"
                                                value={bulkReviewForm.sentiment}
                                                onChange={(e) => setBulkReviewForm({ ...bulkReviewForm, sentiment: e.target.value })}
                                            >
                                                <option value="Excellent">Excellent</option>
                                                <option value="Very Good">Very Good</option>
                                                <option value="Good">Good</option>
                                                <option value="Average">Average</option>
                                                <option value="Must Buy">Must Buy</option>
                                                <option value="Value for Money">Value for Money</option>
                                            </select>
                                        </div>
                                        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 shadow-lg">
                                            🚀 Submit Review into {products.length} Products
                                        </button>
                                    </form>

                                    {/* EXCEL UPLOAD SECTION */}
                                    <div className="mt-12 pt-8 border-t border-gray-200">
                                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                            <FaFileExcel className="text-green-600" /> Upload Bulk Excel
                                        </h3>
                                        <div className="bg-green-50 border border-green-200 p-4 rounded text-sm text-green-800 mb-4">
                                            <p className="font-bold">Instructions:</p>
                                            <ul className="list-disc ml-4 mt-2 mb-2">
                                                <li>Upload an .xlsx file with multiple reviews.</li>
                                                <li><strong>EACH Review</strong> in the file will be added to <strong>ALL Products</strong>.</li>
                                                <li>Columns required: <code>Author</code>, <code>Rating</code>, <code>Text</code>, <code>Date</code>, <code>Sentiment</code> (Optional).</li>
                                            </ul>
                                        </div>

                                        <input
                                            type="file"
                                            accept=".xlsx, .xls"
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;

                                                const reader = new FileReader();
                                                reader.onload = (evt) => {
                                                    const bstr = evt.target.result;
                                                    const wb = XLSX.read(bstr, { type: 'binary' });
                                                    const wsname = wb.SheetNames[0];
                                                    const ws = wb.Sheets[wsname];
                                                    const data = XLSX.utils.sheet_to_json(ws);

                                                    if (window.confirm(`Found ${data.length} reviews in Excel. This will generate ${data.length * products.length} total reviews (Review Count * Product Count). Proceed?`)) {
                                                        // Send to backend
                                                        fetch(BASE_URL + '/api/reviews/bulk-list', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ reviews: data })
                                                        })
                                                            .then(res => res.json())
                                                            .then(resp => {
                                                                alert(resp.message);
                                                            })
                                                            .catch(err => {
                                                                alert("Upload Failed: " + err.message);
                                                            });
                                                    }
                                                };
                                                reader.readAsBinaryString(file);
                                                e.target.value = null; // Reset
                                            }}
                                        />
                                    </div>
                                </div>
                            )
                        }

                    </div >
                </div >
            </div >
        </div >
    );
};

export default AdminDashboard;
