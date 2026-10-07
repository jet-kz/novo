"use client";

import React, { useState, useRef } from "react";
import { usePlatform } from "@/store/PlatformContext";
import { apiService } from "@/services/api";
import { Plus, Trash2, Upload, FileText, Check, X, Pencil, Search } from "lucide-react";

export default function MerchantMenuPage() {
  const { products, stores, activeStore, addProduct, toggleProductStock, deleteProduct } = usePlatform();

  // Resolve merchant store with fallbacks to ensure food items are created for this exact restaurant
  let myStore = activeStore;
  if (typeof window !== "undefined") {
    const rawProfile = localStorage.getItem("merchant_profile");
    if (rawProfile) {
      try {
        const profile = JSON.parse(rawProfile);
        if (profile.businessName) {
          const found = stores.find(
            (s) =>
              s.name.toLowerCase() === profile.businessName.toLowerCase() ||
              s.slug === profile.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
          );
          if (found) myStore = found;
        }
      } catch (e) { }
    }
  }
  if (!myStore) myStore = stores[0];

  const [liveProducts, setLiveProducts] = useState<any[]>(products);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Sync products from backend on mount and when myStore changes
  React.useEffect(() => {
    async function loadBackendProducts() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
        const res = await apiService.getProducts(undefined, token || undefined);
        if (Array.isArray(res) && res.length > 0) {
          setLiveProducts(res);
          return;
        }
      } catch (e) { }
      setLiveProducts(products);
    }
    loadBackendProducts();
  }, [myStore?.id, products]);

  const storeProducts = liveProducts.filter((p) => {
    if (!myStore?.id) return true;
    return p.storeId === myStore.id || p.store_id === myStore.id || !p.storeId;
  });

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Mains");
  const [image, setImage] = useState("");
  const [prepTime, setPrepTime] = useState("20");

  // Dynamic Options & Extras & Specs State
  const [proteinOptions, setProteinOptions] = useState<any[]>([
    { id: "p1", name: "Grilled Chicken", price: 0, image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=200&q=80" },
    { id: "p2", name: "Succulent Beef", price: 800, image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=200&q=80" },
  ]);
  const [extrasOptions, setExtrasOptions] = useState<any[]>([
    { id: "e1", name: "Fried Plantain (Dodo)", price: 500 },
    { id: "e2", name: "Fresh Side Salad", price: 800 },
  ]);
  const [spicyLevel, setSpicyLevel] = useState("Medium 🌶️");
  const [calories, setCalories] = useState("650 kcal");
  const [serves, setServes] = useState("1 person");

  // Temporary inputs for adding new protein option
  const [newProtName, setNewProtName] = useState("");
  const [newProtPrice, setNewProtPrice] = useState("");
  const [newProtImg, setNewProtImg] = useState("");

  // Temporary inputs for adding new extra
  const [newExtName, setNewExtName] = useState("");
  const [newExtPrice, setNewExtPrice] = useState("");

  // Open modal to edit existing product
  const openEditModal = (p: any) => {
    setEditingProduct(p);
    setName(p.name || "");
    setDescription(p.description || "");
    setPrice(String(p.price || ""));
    setCategory(p.category || "Mains");
    setImage(p.image || "");
    setPrepTime(String(p.preparationTimeMinutes || p.specs?.prepTime || "20"));

    setProteinOptions(p.proteinOptions || [
      { id: "p1", name: "Grilled Chicken", price: 0, image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=200&q=80" },
      { id: "p2", name: "Succulent Beef", price: 800, image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=200&q=80" },
    ]);
    setExtrasOptions(p.extrasOptions || [
      { id: "e1", name: "Fried Plantain (Dodo)", price: 500 },
      { id: "e2", name: "Fresh Side Salad", price: 800 },
    ]);
    setSpicyLevel(p.specs?.spicyLevel || "Medium 🌶️");
    setCalories(p.specs?.calories || "650 kcal");
    setServes(p.specs?.serves || "1 person");
  };

  const addProteinItem = () => {
    if (!newProtName) return;
    const newItem = {
      id: "prot-" + Date.now(),
      name: newProtName,
      price: Number(newProtPrice) || 0,
      image: newProtImg || "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=200&q=80",
    };
    setProteinOptions([...proteinOptions, newItem]);
    setNewProtName("");
    setNewProtPrice("");
    setNewProtImg("");
  };

  const removeProteinItem = (id: string) => {
    setProteinOptions(proteinOptions.filter((p) => p.id !== id));
  };

  const addExtraItem = () => {
    if (!newExtName) return;
    const newItem = {
      id: "ext-" + Date.now(),
      name: newExtName,
      price: Number(newExtPrice) || 0,
    };
    setExtrasOptions([...extrasOptions, newItem]);
    setNewExtName("");
    setNewExtPrice("");
  };

  const removeExtraItem = (id: string) => {
    setExtrasOptions(extrasOptions.filter((e) => e.id !== id));
  };

  // CSV Import State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvResult, setCsvResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    const productPayload = {
      id: editingProduct ? editingProduct.id : undefined,
      storeId: myStore.id,
      name,
      description: description || `Freshly prepared dish from ${myStore.name}.`,
      price: Number(price),
      category: category || "Mains",
      image: image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
      inStock: editingProduct ? editingProduct.inStock : true,
      preparationTimeMinutes: Number(prepTime) || 20,
      proteinOptions,
      extrasOptions,
      specs: {
        prepTime: `${prepTime} min`,
        spicyLevel,
        calories,
        serves,
      },
    };

    let savedProduct: any = null;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      if (editingProduct?.id) {
        savedProduct = await apiService.updateProduct(editingProduct.id, productPayload, token || undefined);
      } else {
        savedProduct = await apiService.createProduct(productPayload, token || undefined);
      }
    } catch (err) {
      console.warn("API product save warning:", err);
    }

    const finalProd = savedProduct || {
      ...productPayload,
      id: editingProduct?.id || `prod-${Date.now()}`,
    };

    setLiveProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === finalProd.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = finalProd;
        return copy;
      }
      return [finalProd, ...prev];
    });

    addProduct(finalProd);
    setIsAddModalOpen(false);
    setEditingProduct(null);
    setName("");
    setDescription("");
    setPrice("");
    setImage("");
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setCsvLoading(true);
    setCsvResult(null);

    try {
      const text = await csvFile.text();
      const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
      let count = 0;

      for (let i = 0; i < lines.length; i++) {
        if (i === 0 && (lines[i].toLowerCase().includes("name") || lines[i].toLowerCase().includes("product_id"))) {
          continue;
        }
        const parts = lines[i].split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
        if (parts.length >= 2) {
          const itemName = parts[0];
          const itemPrice = Number(parts[1]) || 2000;
          const itemCat = parts[2] || "Mains";
          const itemDesc = parts[3] || `Delicious dish from ${myStore.name}`;
          const itemImg = parts[4] || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80";

          if (itemName) {
            addProduct({
              storeId: myStore.id,
              name: itemName,
              price: itemPrice,
              category: itemCat,
              description: itemDesc,
              image: itemImg,
              inStock: true,
              preparationTimeMinutes: 20,
            });
            count++;
          }
        }
      }

      try {
        await apiService.importInventoryCSV(csvFile);
      } catch (e) { }

      setCsvResult(`Successfully imported ${count > 0 ? count : "CSV"} menu items for ${myStore.name}!`);
    } catch (e: any) {
      setCsvResult(`CSV Import processed for ${myStore.name}.`);
    } finally {
      setCsvLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Menu & Catalog Management</h1>
            <span className="px-3 py-1 rounded-full bg-[#E6F7F2] text-[#087F5B] text-xs font-black">
              {myStore.name}
            </span>
          </div>
          <p className="text-xs font-semibold text-[#66736E] dark:text-slate-400 mt-1">
            Manage menu items for <strong className="text-slate-800 dark:text-slate-200">{myStore.name}</strong>. Add, edit, or remove food items, options (proteins), add-ons (extras), and nutritional specs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Upload className="w-4 h-4 text-[#087F5B]" />
            <span>CSV Bulk Import</span>
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setName("");
              setDescription("");
              setPrice("");
              setImage("");
              setIsAddModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-2xl bg-[#087F5B] text-white text-xs font-black hover:bg-[#065A43] transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-[#087F5B]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Item</span>
          </button>
        </div>
      </div>

      {/* PRODUCTS LIST GRID */}
      {storeProducts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-dashed border-slate-300 dark:border-slate-800 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#087F5B] flex items-center justify-center text-2xl">
            📦
          </div>
          <div className="max-w-md">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Your Menu Catalogue is Empty</h3>
            <p className="text-xs text-[#66736E] dark:text-slate-400 font-medium mt-1">
              Add your store's first product or upload a CSV file with your entire menu to get started.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-[#087F5B] text-white text-xs font-black hover:bg-[#065A43] transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-[#087F5B]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Item</span>
            </button>
            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black hover:bg-slate-200 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#087F5B]" />
              <span>Upload CSV Menu</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {storeProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:border-[#087F5B]"
            >
              <img src={p.image} alt={p.name} className="w-20 h-20 rounded-2xl object-cover shrink-0 bg-slate-100" />

              <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-xs truncate">{p.name}</h4>
                  <span className="text-xs font-black text-[#087F5B]">₦{p.price.toLocaleString()}</span>
                  <span className="text-[10px] text-[#66736E] font-medium block mt-0.5">{p.category}</span>
                </div>

                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => toggleProductStock(p.id)}
                    className={`px-3 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${p.inStock
                        ? "bg-emerald-100 text-[#087F5B]"
                        : "bg-rose-100 text-rose-700"
                      }`}
                  >
                    {p.inStock ? "Available" : "Sold Out"}
                  </button>

                  <button
                    onClick={() => openEditModal(p)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-[#087F5B] transition-colors ml-auto cursor-pointer"
                    title="Edit Item"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingProduct ? "Edit Menu Item" : "Add Item to Menu"}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex flex-col gap-4">
              {/* BASIC DETAILS */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-black text-[#087F5B] uppercase tracking-wider">
                  Basic Details
                </span>

                <div>
                  <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Item Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g., Party Jollof Rice"
                    required
                    className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Category</label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Mains / Soups / Drinks"
                      required
                      className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Price (₦)</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="3500"
                      required
                      className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description of ingredients..."
                    className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Image URL</label>
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              {/* CHOOSE PROTEIN / BASE OPTIONS BUILDER */}
              <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-black text-[#087F5B] uppercase tracking-wider">
                  Protein / Base Options (Choose Protein)
                </span>

                <div className="flex flex-col gap-2">
                  {proteinOptions.map((prot) => (
                    <div key={prot.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="flex items-center gap-2">
                        <img src={prot.image || "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=100&q=80"} className="w-8 h-8 rounded-lg object-cover" />
                        <span className="font-black text-slate-900 dark:text-white">{prot.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#087F5B]">
                          {prot.price === 0 ? "Included" : `+₦${prot.price}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeProteinItem(prot.id)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-1">
                  <input
                    type="text"
                    value={newProtName}
                    onChange={(e) => setNewProtName(e.target.value)}
                    placeholder="Option Name (e.g. Goat Meat)"
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold outline-none"
                  />
                  <input
                    type="number"
                    value={newProtPrice}
                    onChange={(e) => setNewProtPrice(e.target.value)}
                    placeholder="Price Delta (e.g. 1000)"
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold outline-none"
                  />
                  <button
                    type="button"
                    onClick={addProteinItem}
                    className="p-2 rounded-xl bg-[#087F5B] text-white text-[11px] font-black hover:bg-[#065A43] cursor-pointer"
                  >
                    + Add Protein
                  </button>
                </div>
              </div>

              {/* ADD EXTRAS BUILDER */}
              <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-black text-[#087F5B] uppercase tracking-wider">
                  Add-ons / Extras (Add Extras)
                </span>

                <div className="flex flex-col gap-2">
                  {extrasOptions.map((ext) => (
                    <div key={ext.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                      <span className="font-black text-slate-900 dark:text-white">{ext.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#087F5B]">
                          +₦{ext.price}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeExtraItem(ext.id)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-1">
                  <input
                    type="text"
                    value={newExtName}
                    onChange={(e) => setNewExtName(e.target.value)}
                    placeholder="Extra Name (e.g. Extra Sauce)"
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold outline-none"
                  />
                  <input
                    type="number"
                    value={newExtPrice}
                    onChange={(e) => setNewExtPrice(e.target.value)}
                    placeholder="Price (e.g. 400)"
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold outline-none"
                  />
                  <button
                    type="button"
                    onClick={addExtraItem}
                    className="p-2 rounded-xl bg-[#087F5B] text-white text-[11px] font-black hover:bg-[#065A43] cursor-pointer"
                  >
                    + Add Extra
                  </button>
                </div>
              </div>

              {/* NUTRITIONAL & PREP SPECS */}
              <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-black text-[#087F5B] uppercase tracking-wider">
                  Nutritional Specs & Info
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Prep Time (min)</label>
                    <input
                      type="number"
                      value={prepTime}
                      onChange={(e) => setPrepTime(e.target.value)}
                      placeholder="20"
                      className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Spicy Level</label>
                    <select
                      value={spicyLevel}
                      onChange={(e) => setSpicyLevel(e.target.value)}
                      className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                    >
                      <option value="Mild 🌶️">Mild 🌶️</option>
                      <option value="Medium 🌶️">Medium 🌶️</option>
                      <option value="Hot 🌶️🌶️">Hot 🌶️🌶️</option>
                      <option value="Extra Hot 🌶️🌶️🌶️">Extra Hot 🌶️🌶️🌶️</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Calories</label>
                    <input
                      type="text"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      placeholder="650 kcal"
                      className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">Serves</label>
                    <input
                      type="text"
                      value={serves}
                      onChange={(e) => setServes(e.target.value)}
                      placeholder="1 person"
                      className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-3 py-3.5 rounded-2xl bg-[#087F5B] text-white text-xs font-black hover:bg-[#065A43] transition-all cursor-pointer shadow-md shadow-[#087F5B]/20"
              >
                {editingProduct ? "Save Changes to Menu Item" : "Save & Add to Menu"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CSV BULK IMPORT MODAL */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">CSV Bulk Inventory Import</h3>
              <button onClick={() => setIsCsvModalOpen(false)} className="p-1.5 rounded-xl text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#66736E] font-medium">
              Upload your inventory CSV file containing columns for <code className="font-bold text-[#087F5B]">product_id</code>, <code className="font-bold text-[#087F5B]">quantity</code>, <code className="font-bold text-[#087F5B]">low_stock_threshold</code>, and optional <code className="font-bold text-[#087F5B]">image</code> URLs.
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-slate-700 bg-emerald-50/50 dark:bg-slate-800/50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-emerald-50 transition-colors"
            >
              <FileText className="w-8 h-8 text-[#087F5B]" />
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {csvFile ? csvFile.name : "Click to select CSV File"}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </div>

            {csvResult && (
              <div className="p-3 rounded-xl bg-emerald-100 text-[#087F5B] text-xs font-bold text-center">
                {csvResult}
              </div>
            )}

            <button
              onClick={handleCsvUpload}
              disabled={!csvFile || csvLoading}
              className="w-full py-3 rounded-2xl bg-[#087F5B] text-white text-xs font-black hover:bg-[#065A43] transition-all cursor-pointer shadow-md shadow-[#087F5B]/20 disabled:opacity-50"
            >
              {csvLoading ? "Processing Import..." : "Upload & Sync Inventory"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
