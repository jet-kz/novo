"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import { usePlatform } from "@/store/PlatformContext";
import { Plus, Trash2, Upload, FileText, Check, X, Pencil, Search, ImagePlus, Loader2 } from "lucide-react";
import { apiService } from "@/services/api";
import { MenuSection, OptionGroup } from "@/types";
import { MenuSectionsManager } from "@/components/merchant/MenuSectionsManager";
import { OptionGroupsEditor, cleanGroups, groupsProblem } from "@/components/merchant/OptionGroupsEditor";

export default function MerchantMenuPage() {
  const { products, merchantStore, merchantStoreLoading, saveProduct, toggleProductStock, deleteProduct } = usePlatform();

  // The menu always belongs to the store the server says this merchant owns.
  const myStore = merchantStore || ({ id: "", name: merchantStoreLoading ? "Loading…" : "No store" } as any);
  const storeProducts = merchantStore ? products.filter((p) => p.storeId === merchantStore.id) : [];

  // Menu sections (Rice dishes, Soups, Drinks...) in the merchant's chosen order.
  const [sections, setSections] = useState<MenuSection[]>([]);
  const loadSections = useCallback(async () => {
    if (!merchantStore?.id) return;
    try {
      setSections(await apiService.getMenuSections(merchantStore.id));
    } catch {}
  }, [merchantStore?.id]);
  useEffect(() => {
    loadSections();
  }, [loadSections]);
  const sectionKey = (name?: string) => (name || "").trim().toLowerCase();
  const itemCounts = Object.fromEntries(
    sections.map((sec) => [sec.id, storeProducts.filter((p) => sectionKey(p.category) === sectionKey(sec.name)).length])
  );
  const sectionNames = new Set(sections.map((sec) => sectionKey(sec.name)));
  const groupedProducts = [
    ...sections.map((sec) => ({ key: sec.id, title: sec.name, items: storeProducts.filter((p) => sectionKey(p.category) === sectionKey(sec.name)) })),
    { key: "other", title: sections.length ? "Not in a section" : "", items: storeProducts.filter((p) => !sectionNames.has(sectionKey(p.category))) },
  ].filter((g) => g.items.length > 0);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const runItemAction = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    setPageError(null);
    try {
      await fn();
    } catch (e: any) {
      setPageError(e?.message || "That action failed. Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = (p: any) => {
    if (!window.confirm(`Remove "${p.name}" from your menu?`)) return;
    runItemAction(p.id, () => deleteProduct(p.id));
  };

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoPicked = async (file?: File) => {
    if (!file) return;
    setImageError(null);
    setImageUploading(true);
    try {
      setImage(await apiService.uploadImage(file, "product-images", merchantStore?.id || ""));
    } catch (err: any) {
      setImageError(err?.message || "Couldn't upload that photo.");
    } finally {
      setImageUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };
  const [prepTime, setPrepTime] = useState("20");

  // How the item can be customised (protein, swallow, size, drinks...) and optional details.
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [spicyLevel, setSpicyLevel] = useState("");
  const [calories, setCalories] = useState("");
  const [serves, setServes] = useState("");
  const isFoodStore = !/grocer|supermarket|pharma|shop|market|store/i.test(String((merchantStore as any)?.category || ""));

  const openNewModal = () => {
    setEditingProduct(null);
    setName("");
    setDescription("");
    setPrice("");
    setCategory("");
    setImage("");
    setPrepTime("20");
    setOptionGroups([]);
    setSpicyLevel("");
    setCalories("");
    setServes("");
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // "Add item" links elsewhere point here with ?action=add.
  useEffect(() => {
    if (!merchantStore || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("action") !== "add") return;
    url.searchParams.delete("action");
    window.history.replaceState(null, "", url.pathname + url.search);
    openNewModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantStore?.id]);

  // Open modal to edit existing product
  const openEditModal = (p: any) => {
    setEditingProduct(p);
    setName(p.name || "");
    setDescription(p.description || "");
    setPrice(String(p.price || ""));
    setCategory(p.category || "");
    setImage(p.image || "");
    setPrepTime(String(p.preparationTimeMinutes || p.specs?.prepTime || "20"));

    setOptionGroups(JSON.parse(JSON.stringify(p.optionGroups || [])));
    setSpicyLevel(p.specs?.spicyLevel || "");
    setCalories(p.specs?.calories || "");
    setServes(p.specs?.serves || "");
    setFormError(null);
  };

  // CSV Import State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvResult, setCsvResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantStore) {
      setFormError("Your store isn't set up yet.");
      return;
    }
    if (!name.trim()) return setFormError("Item name is required.");
    if (!(Number(price) >= 0) || price === "") return setFormError("Enter a valid price.");
    const optionsProblem = groupsProblem(optionGroups);
    if (optionsProblem) return setFormError(optionsProblem);

    const productPayload = {
      storeId: myStore.id,
      name,
      description: description || `Freshly prepared dish from ${myStore.name}.`,
      price: Number(price),
      category: category.trim() || undefined,
      image: image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
      inStock: editingProduct ? editingProduct.inStock : true,
      preparationTimeMinutes: Number(prepTime) || 20,
      optionGroups: cleanGroups(optionGroups),
      specs: {
        prepTime: `${prepTime} min`,
        ...(spicyLevel ? { spicyLevel } : {}),
        ...(calories.trim() ? { calories: calories.trim() } : {}),
        ...(serves.trim() ? { serves: serves.trim() } : {}),
      },
    };

    setSaving(true);
    setFormError(null);
    try {
      await saveProduct(productPayload as any, editingProduct?.id);
      loadSections(); // a new section name creates the section
    } catch (err: any) {
      setFormError(err?.message || "Could not save this item.");
      return;
    } finally {
      setSaving(false);
    }

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
      let created = 0;
      const failures: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        if (i === 0 && lines[i].toLowerCase().includes("name")) continue; // header
        const parts = lines[i].split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
        const [itemName, itemPrice, itemCat, itemDesc, itemImg] = parts;
        if (!itemName || itemPrice === undefined || Number.isNaN(Number(itemPrice))) {
          failures.push(`Line ${i + 1}: needs a name and a numeric price`);
          continue;
        }
        try {
          await saveProduct({
            storeId: myStore.id,
            name: itemName,
            price: Number(itemPrice),
            category: itemCat || undefined,
            description: itemDesc || "",
            image: itemImg || "",
            inStock: true,
            preparationTimeMinutes: 20,
          });
          created++;
        } catch (e: any) {
          failures.push(`Line ${i + 1} (${itemName}): ${e?.message || "failed"}`);
        }
      }

      setCsvResult(
        `Imported ${created} item${created === 1 ? "" : "s"} into ${myStore.name}.` +
          (failures.length ? ` ${failures.length} line(s) skipped — ${failures.slice(0, 3).join("; ")}` : "")
      );
    } catch (e: any) {
      setCsvResult(`Could not read the CSV file: ${e?.message || "unknown error"}`);
    } finally {
      setCsvLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Menu</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Add items, set what customers can choose, and mark things sold out.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#087F5B]" />
            <span>CSV Bulk Import</span>
          </button>

          <button
            onClick={openNewModal}
            className="px-5 py-2.5 rounded-2xl bg-[#087F5B] text-white text-xs font-bold hover:bg-[#065A43] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Item</span>
          </button>
        </div>
      </div>

      {pageError && (
        <p role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-2xl p-3">
          {pageError}
        </p>
      )}

      {merchantStore && (
        <MenuSectionsManager storeId={merchantStore.id} sections={sections} itemCounts={itemCounts} onChange={loadSections} />
      )}

      {/* PRODUCTS LIST GRID */}
      {storeProducts.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-900/70 rounded-3xl p-10 border border-dashed border-slate-300 dark:border-slate-800 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#087F5B] flex items-center justify-center text-2xl">
            📦
          </div>
          <div className="max-w-md">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Your Menu Catalogue is Empty</h3>
            <p className="text-xs text-[#66736E] dark:text-slate-400 font-medium mt-1">
              Add your store&apos;s first product or upload a CSV file with your entire menu to get started.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={openNewModal}
              disabled={!merchantStore}
              className="disabled:opacity-50 px-5 py-2.5 rounded-2xl bg-[#087F5B] text-white text-xs font-bold hover:bg-[#065A43] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Item</span>
            </button>
            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#087F5B]" />
              <span>Upload CSV Menu</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
        {groupedProducts.map((group) => (
        <section key={group.key} className="flex flex-col gap-3">
          {group.title && <h3 className="text-sm font-bold text-slate-900 dark:text-white">{group.title} <span className="text-xs font-normal text-slate-400">{group.items.length}</span></h3>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {group.items.map((p) => (
            <div
              key={p.id}
              className="bg-slate-50 dark:bg-slate-900/70 rounded-3xl p-4 flex items-center gap-4 transition-all"
            >
              <img src={p.image} alt={p.name} className="w-20 h-20 rounded-2xl object-cover shrink-0 bg-slate-100" />

              <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">{p.name}</h4>
                  <span className="text-xs font-bold text-[#087F5B]">₦{p.price.toLocaleString()}</span>
                  <span className="text-[10px] text-[#66736E] font-medium block mt-0.5">
                    {p.category}
                    {(p.optionGroups || []).length > 0 && ` · ${(p.optionGroups || []).map((g) => g.name).join(", ")}`}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => runItemAction(p.id, () => toggleProductStock(p.id))}
                    disabled={busyId === p.id}
                    className={`disabled:opacity-50 px-3 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${p.inStock
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
                    onClick={() => handleDelete(p)}
                    disabled={busyId === p.id}
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
        </section>
        ))}
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl flex flex-col gap-5 max-h-[92vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
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
                <span className="text-xs font-bold text-[#087F5B]">
                  Basic Details
                </span>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Item Name</label>
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
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Menu section</label>
                    <input
                      type="text"
                      list="menu-sections"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder={sections[0]?.name ? `e.g. ${sections[0].name}` : "e.g. Rice dishes"}
                      className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                    />
                    <datalist id="menu-sections">
                      {sections.map((sec) => (
                        <option key={sec.id} value={sec.name} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Price (₦)</label>
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
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description of ingredients..."
                    className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Photo</label>
                  <div className="mt-1 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={imageUploading}
                      className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer"
                      aria-label={image ? "Replace photo" : "Add photo"}
                    >
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImagePlus className="w-6 h-6 text-slate-400" />
                      )}
                      {imageUploading && (
                        <span className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </span>
                      )}
                    </button>
                    <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={imageUploading}
                        className="self-start px-3 py-2 rounded-xl bg-[#087F5B] text-white text-[11px] font-bold cursor-pointer disabled:opacity-60"
                      >
                        {imageUploading ? "Uploading..." : image ? "Change photo" : "Upload photo"}
                      </button>
                      <span className="text-[10px] text-slate-400">JPG, PNG or WebP. We resize it for you.</span>
                      {imageError && <span className="text-[10px] font-bold text-rose-500">{imageError}</span>}
                    </div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoPicked(e.target.files?.[0])}
                      className="hidden"
                    />
                  </div>
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="…or paste an image link"
                    className="w-full mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] font-medium outline-none"
                  />
                </div>
              </div>

              {/* CUSTOMER CHOICES */}
              <div className="flex flex-col gap-3 pt-2">
                <div>
                  <span className="text-xs font-bold text-[#087F5B]">Customer choices</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Groups like “Choose your protein” (required, pick 1) or “Extras” (optional, up to 3). Prices are added to the item.
                  </p>
                </div>
                <OptionGroupsEditor
                  groups={optionGroups}
                  onChange={setOptionGroups}
                  isFood={isFoodStore}
                  otherProducts={storeProducts.filter((sp) => sp.id !== editingProduct?.id)}
                />
              </div>

              {/* PREP & DETAILS */}
              <div className="flex flex-col gap-3 pt-2">
                <span className="text-xs font-bold text-[#087F5B]">
                  More details <span className="normal-case font-semibold text-slate-400 tracking-normal">(optional)</span>
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Prep Time (min)</label>
                    <input
                      type="number"
                      value={prepTime}
                      onChange={(e) => setPrepTime(e.target.value)}
                      placeholder="20"
                      className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Spicy Level</label>
                    <select
                      value={spicyLevel}
                      onChange={(e) => setSpicyLevel(e.target.value)}
                      className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                    >
                      <option value="">Not shown</option>
                      <option value="Not spicy">Not spicy</option>
                      <option value="Mild 🌶️">Mild 🌶️</option>
                      <option value="Medium 🌶️">Medium 🌶️</option>
                      <option value="Hot 🌶️🌶️">Hot 🌶️🌶️</option>
                      <option value="Extra Hot 🌶️🌶️🌶️">Extra Hot 🌶️🌶️🌶️</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Calories / size</label>
                    <input
                      type="text"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      placeholder="650 kcal"
                      className="w-full mt-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Serves</label>
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

              {formError && (
                <p role="alert" className="text-xs font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/40 rounded-xl p-3">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={saving || imageUploading}
                className="w-full mt-3 py-3.5 rounded-2xl bg-[#087F5B] text-white text-xs font-bold hover:bg-[#065A43] transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? "Saving…" : editingProduct ? "Save Changes to Menu Item" : "Save & Add to Menu"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CSV BULK IMPORT MODAL */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">CSV Bulk Inventory Import</h3>
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
              <span className="text-xs font-bold text-slate-900 dark:text-white">
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
              className="w-full py-3 rounded-2xl bg-[#087F5B] text-white text-xs font-bold hover:bg-[#065A43] transition-all cursor-pointer disabled:opacity-50"
            >
              {csvLoading ? "Processing Import..." : "Upload & Sync Inventory"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
