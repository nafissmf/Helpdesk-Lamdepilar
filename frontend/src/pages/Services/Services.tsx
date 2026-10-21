import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { ConfirmModal } from "../../components/ui/modal/ConfirmModal";
import { useLanguage } from "../../context/LanguageContext";
import { useToast } from "../../context/ToastContext";
import { helpdeskAPI, ServiceCategoryItem, ServiceManageItem } from "../../utils/api";

type DraftCategory = {
  key: string;
  id?: number;
  name: string;
  color: string;
};

export default function Services() {
  const { t } = useLanguage();
  const { success, error: toastError } = useToast();
  const [items, setItems] = useState<ServiceManageItem[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ServiceManageItem | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [categories, setCategories] = useState<DraftCategory[]>([]);
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState("#8b1538");
  const [editingCatKey, setEditingCatKey] = useState<string | null>(null);

  const load = async (q = query) => {
    const res = await helpdeskAPI.getServicesManage(q);
    if (res.success && res.data) setItems(res.data.items);
  };

  useEffect(() => {
    load("");
  }, []);

  const toDrafts = (rows: ServiceCategoryItem[]): DraftCategory[] =>
    rows.map((row) => ({
      key: `id-${row.id}`,
      id: row.id,
      name: row.name,
      color: row.color || "#8b1538",
    }));

  const resetCategoryForm = () => {
    setCatName("");
    setCatColor("#8b1538");
    setEditingCatKey(null);
  };

  const openCreate = () => {
    setEditing(null);
    setName("");
    setIsActive(true);
    setCategories([]);
    resetCategoryForm();
    setOpen(true);
  };

  const openEdit = (item: ServiceManageItem) => {
    setEditing(item);
    setName(item.name);
    setIsActive(item.is_active);
    setCategories(toDrafts(item.categories));
    resetCategoryForm();
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    setCategories([]);
    resetCategoryForm();
  };

  const addOrUpdateCategoryDraft = () => {
    if (!catName.trim()) {
      toastError(t("fieldRequired"));
      return;
    }
    const clean = catName.trim();
    const duplicate = categories.some(
      (item) => item.name.toLowerCase() === clean.toLowerCase() && item.key !== editingCatKey
    );
    if (duplicate) {
      toastError(t("loadError"));
      return;
    }

    if (editingCatKey) {
      setCategories((prev) =>
        prev.map((item) =>
          item.key === editingCatKey ? { ...item, name: clean, color: catColor } : item
        )
      );
    } else {
      setCategories((prev) => [
        ...prev,
        { key: `draft-${Date.now()}-${prev.length}`, name: clean, color: catColor },
      ]);
    }
    resetCategoryForm();
  };

  const removeCategoryDraft = async (item: DraftCategory) => {
    if (item.id) {
      setSaving(true);
      const res = await helpdeskAPI.deleteCategory(item.id);
      setSaving(false);
      if (!res.success) {
        toastError(res.message || t("loadError"));
        return;
      }
      await load();
    }
    setCategories((prev) => prev.filter((row) => row.key !== item.key));
    if (editingCatKey === item.key) resetCategoryForm();
  };

  const saveService = async () => {
    if (!name.trim()) {
      toastError(t("fieldRequired"));
      return;
    }
    setSaving(true);
    const form = new FormData();
    form.set("name", name.trim());
    form.set("is_active", isActive ? "true" : "false");

    const isCreate = !editing;
    const res = editing
      ? await helpdeskAPI.updateService(editing.id, form)
      : await helpdeskAPI.createService(form);

    if (!res.success || !res.data) {
      setSaving(false);
      toastError(res.message || t("loadError"));
      return;
    }

    let service = res.data;

    if (isCreate) {
      for (const cat of categories) {
        const catForm = new FormData();
        catForm.set("name", cat.name);
        catForm.set("color", cat.color || "#8b1538");
        const catRes = await helpdeskAPI.createCategory(service.id, catForm);
        if (!catRes.success) {
          setSaving(false);
          toastError(catRes.message || t("loadError"));
          setEditing(service);
          await load();
          return;
        }
      }
    } else {
      for (const cat of categories) {
        const catForm = new FormData();
        catForm.set("name", cat.name);
        catForm.set("color", cat.color || "#8b1538");
        if (cat.id) {
          const catRes = await helpdeskAPI.updateCategory(cat.id, catForm);
          if (!catRes.success) {
            setSaving(false);
            toastError(catRes.message || t("loadError"));
            return;
          }
        } else {
          const catRes = await helpdeskAPI.createCategory(service.id, catForm);
          if (!catRes.success) {
            setSaving(false);
            toastError(catRes.message || t("loadError"));
            return;
          }
        }
      }
    }

    setSaving(false);
    success(t("serviceSaved"));
    await load();
    closeModal();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    const res = await helpdeskAPI.deleteService(deleteId);
    setSaving(false);
    setDeleteId(null);
    if (!res.success) {
      toastError(res.message || t("loadError"));
      return;
    }
    success(t("serviceDeleted"));
    if (editing?.id === deleteId) closeModal();
    await load();
  };

  return (
    <>
      <PageMeta title={t("servicesTitle")} description={t("servicesSubtitle")} />
      <div className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t("servicesTitle")}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{t("servicesSubtitle")}</p>
            <p className="mt-2 text-xs text-gray-400">
              {items.length} {t("servicesNav").toLowerCase()}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
                  />
                </svg>
              </span>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  load(e.target.value);
                }}
                placeholder={t("servicePlaceholder")}
                className="h-11 w-56 rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
            <button
              type="button"
              onClick={openCreate}
              className="h-11 rounded-xl bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
            >
              + {t("newService")}
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl bg-white px-5 py-14 text-center shadow-sm dark:bg-gray-900">
            <p className="text-sm text-gray-500">{t("noServices")}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openEdit(item)}
                className="rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:border-brand-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">{item.name}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      item.is_active ? "bg-brand-50 text-brand-600" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {item.is_active ? t("serviceActive").split(" ")[0] : t("serviceInactive")}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {item.categories.length} {t("categoriesForService").toLowerCase()}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.categories.slice(0, 4).map((cat) => (
                    <span
                      key={cat.id}
                      className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </span>
                  ))}
                  {item.categories.length > 4 && (
                    <span className="text-[11px] text-gray-400">+{item.categories.length - 4}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-gray-900/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-900">
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editing ? t("editService") : t("newService")}
                </h2>
                <p className="text-sm text-gray-500">{t("servicesSubtitle")}</p>
              </div>
              <button type="button" onClick={closeModal} className="text-gray-400" aria-label={t("cancel")}>
                ×
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto px-6 py-4">
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-200">{t("serviceName")}</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("serviceNamePlaceholder")}
                  className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-950"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <span>{t("serviceActive")}</span>
              </label>

              <div className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                <p className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  {t("categoriesForService")}
                </p>
                {categories.length === 0 ? (
                  <p className="mb-3 text-xs text-gray-400">{t("categoryPlaceholder")}</p>
                ) : (
                  <ul className="mb-3 space-y-2">
                    {categories.map((cat) => (
                      <li
                        key={cat.key}
                        className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800"
                      >
                        <span className="inline-flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="truncate text-gray-800 dark:text-gray-100">{cat.name}</span>
                        </span>
                        <span className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            className="text-xs font-medium text-brand-600"
                            onClick={() => {
                              setEditingCatKey(cat.key);
                              setCatName(cat.name);
                              setCatColor(cat.color || "#8b1538");
                            }}
                          >
                            {t("editCategory")}
                          </button>
                          <button
                            type="button"
                            className="text-xs font-medium text-red-500"
                            onClick={() => removeCategoryDraft(cat)}
                          >
                            {t("deleteArticle")}
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap items-end gap-2">
                  <label className="min-w-[140px] flex-1 space-y-1 text-xs">
                    <span className="text-gray-500">{t("categoryName")}</span>
                    <input
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-950"
                    />
                  </label>
                  <label className="space-y-1 text-xs">
                    <span className="text-gray-500">{t("categoryColor")}</span>
                    <input
                      type="color"
                      value={catColor}
                      onChange={(e) => setCatColor(e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={addOrUpdateCategoryDraft}
                    className="h-10 rounded-lg bg-brand-500 px-3 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {editingCatKey ? t("saveService") : t("addCategory")}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-2 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
              {editing ? (
                <button
                  type="button"
                  onClick={() => setDeleteId(editing.id)}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600"
                >
                  {t("deleteService")}
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-700"
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveService}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {t("saveService")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteId != null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title={t("deleteServiceTitle")}
        message={t("deleteServiceBody")}
        confirmText={t("deleteArticleConfirm")}
        cancelText={t("cancel")}
        confirmButtonColor="danger"
        isLoading={saving}
      />
    </>
  );
}
