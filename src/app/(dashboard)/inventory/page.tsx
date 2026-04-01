"use client";

import { useEffect, useState, useCallback } from "react";
import { salonRpc } from "@/lib/rpc-client";
import TopNav from "@/components/TopNav";
import Modal from "@/components/Modal";
import type { InventoryProduct } from "@/lib/types";

export default function InventoryPage() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    sku: "",
    category: "Geral",
    stock_quantity: "",
    min_stock: "5",
    unit_price: "",
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const { data } = await salonRpc("inventoryList");
    setProducts((data as InventoryProduct[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditingProduct(null);
    setForm({ name: "", description: "", sku: "", category: "Geral", stock_quantity: "", min_stock: "5", unit_price: "" });
    setModalOpen(true);
  };

  const openEdit = (p: InventoryProduct) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      description: p.description || "",
      sku: p.sku || "",
      category: p.category,
      stock_quantity: String(p.stock_quantity),
      min_stock: String(p.min_stock),
      unit_price: String(p.unit_price),
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description || null,
      sku: form.sku || null,
      category: form.category,
      stock_quantity: parseInt(form.stock_quantity),
      min_stock: parseInt(form.min_stock),
      unit_price: parseFloat(form.unit_price),
    };

    if (editingProduct) {
      await salonRpc("inventoryUpdate", { id: editingProduct.id, ...payload });
    } else {
      await salonRpc("inventoryInsert", payload);
    }

    setModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    await salonRpc("inventoryDelete", { id });
    fetchData();
  };

  const categories = [...new Set(products.map((p) => p.category))];
  const filtered = activeFilter === "all" ? products : products.filter((p) => p.category === activeFilter);
  const lowStockProducts = products.filter((p) => p.stock_quantity <= p.min_stock);
  const totalValue = products.reduce((sum, p) => sum + p.stock_quantity * Number(p.unit_price), 0);

  const getStatus = (p: InventoryProduct) => {
    if (p.stock_quantity === 0) return { label: "Sem Estoque", class: "bg-red-100 text-red-700", dot: "bg-red-500" };
    if (p.stock_quantity <= p.min_stock) return { label: "Estoque Baixo", class: "bg-amber-100 text-amber-700", dot: "bg-amber-500" };
    return { label: "Em Estoque", class: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" };
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <>
      <TopNav title="Estoque" />
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 min-w-0">
        {lowStockProducts.length > 0 && (
          <div className="bg-error-container/30 border-l-4 border-error p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-10 h-10 bg-error/10 text-error rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              </div>
              <div>
                <h3 className="font-bold text-on-error-container">Alerta de Estoque</h3>
                <p className="text-sm text-on-error-container/80">{lowStockProducts.length} produto(s) abaixo do nível mínimo.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Total de Produtos", value: String(products.length), sub: "SKUs cadastrados" },
            { label: "Valor do Estoque", value: formatCurrency(totalValue), sub: "Valor total" },
            { label: "Estoque Baixo", value: String(lowStockProducts.length), sub: "Requer atenção", isError: lowStockProducts.length > 0 },
            { label: "Sem Estoque", value: String(products.filter((p) => p.stock_quantity === 0).length), sub: "Itens zerados" },
          ].map((card) => (
            <div key={card.label} className="bg-white p-6 rounded-xl shadow-[0_8px_32px_rgba(11,28,48,0.02)]">
              <p className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold mb-1">{card.label}</p>
              <p className={`text-4xl font-headline font-extrabold ${card.isError ? "text-error" : "text-on-surface"}`}>{card.value}</p>
              <p className="mt-4 text-xs font-medium text-on-surface-variant">{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
            <button type="button" onClick={() => setActiveFilter("all")} className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeFilter === "all" ? "bg-primary-container text-white" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"}`}>
              Todos
            </button>
            {categories.map((cat) => (
              <button type="button" key={cat} onClick={() => setActiveFilter(cat)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${activeFilter === cat ? "bg-primary-container text-white" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"}`}>
                {cat}
              </button>
            ))}
          </div>
          <button type="button" onClick={openCreate} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all w-full sm:w-auto shrink-0">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Novo Produto
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-on-surface-variant">Carregando...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-4 block">inventory_2</span>
            <h3 className="font-headline text-xl font-bold mb-2">Nenhum produto encontrado</h3>
            <p className="text-on-surface-variant">Cadastre produtos para controlar seu estoque.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-[0_8px_32px_rgba(11,28,48,0.04)] overflow-hidden">
            <div className="overflow-x-auto overscroll-x-contain -mx-1" style={{ WebkitOverflowScrolling: "touch" }}>
            <table className="w-full text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/10">
                  {["Produto", "SKU", "Categoria", "Estoque", "Preço Unit.", "Status", "Ações"].map((h) => (
                    <th key={h} className="px-3 sm:px-6 py-3 sm:py-4 text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-black whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((product) => {
                  const status = getStatus(product);
                  const stockPercentage = Math.min(100, (product.stock_quantity / Math.max(product.min_stock * 3, 1)) * 100);
                  return (
                    <tr key={product.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-3 sm:px-6 py-4 sm:py-5">
                        <div className="min-w-[120px]">
                          <p className="font-bold text-on-surface">{product.name}</p>
                          {product.description && <p className="text-xs text-on-surface-variant">{product.description}</p>}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 sm:py-5 font-mono text-xs text-on-surface-variant whitespace-nowrap">{product.sku || "-"}</td>
                      <td className="px-3 sm:px-6 py-4 sm:py-5">
                        <span className="px-2 py-1 bg-surface-container-high rounded text-[10px] font-bold text-on-secondary-container uppercase">{product.category}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 sm:py-5">
                        <div className="w-full max-w-[100px]">
                          <span className={`text-xs font-bold ${product.stock_quantity <= product.min_stock ? "text-error" : "text-on-surface"}`}>
                            {product.stock_quantity} un.
                          </span>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
                            <div className={`h-full rounded-full ${product.stock_quantity <= product.min_stock ? "bg-error" : "bg-primary-container"}`} style={{ width: `${stockPercentage}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 sm:py-5 font-bold text-on-surface whitespace-nowrap">{formatCurrency(Number(product.unit_price))}</td>
                      <td className="px-3 sm:px-6 py-4 sm:py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${status.class}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 sm:py-5">
                        <div className="flex gap-1">
                          <button type="button" onClick={() => openEdit(product)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-all">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button type="button" onClick={() => handleDelete(product.id)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-error-container rounded-lg text-on-surface-variant hover:text-error transition-all">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? "Editar Produto" : "Novo Produto"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Nome do Produto</label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary" required />
          </div>
          <div>
            <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Descrição</label>
            <input type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">SKU</label>
              <input type="text" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Categoria</label>
              <input type="text" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary" required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Quantidade</label>
              <input type="number" value={form.stock_quantity} onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary" required min="0" />
            </div>
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Mín. Estoque</label>
              <input type="number" value={form.min_stock} onChange={(e) => setForm((f) => ({ ...f, min_stock: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary" required min="0" />
            </div>
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Preço (R$)</label>
              <input type="number" step="0.01" value={form.unit_price} onChange={(e) => setForm((f) => ({ ...f, unit_price: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary" required min="0" />
            </div>
          </div>
          <button type="submit" className="w-full h-12 bg-linear-to-r from-primary to-primary-container text-white font-semibold rounded-lg shadow-md active:scale-[0.98] transition-all">
            {editingProduct ? "Salvar" : "Adicionar Produto"}
          </button>
        </form>
      </Modal>
    </>
  );
}
