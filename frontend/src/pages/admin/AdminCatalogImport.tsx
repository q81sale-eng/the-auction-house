import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { createCatalogWatch, uploadCatalogImage } from '../../api/admin';
import { supabase } from '../../lib/supabase';

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Maps any column header variant to our internal key
const COL_MAP: Record<string, string> = {
  brand: 'brand', 'الماركة': 'brand', marca: 'brand',
  model: 'model', 'الموديل': 'model',
  reference: 'reference_number', reference_number: 'reference_number',
  'الرقم المرجعي': 'reference_number', ref: 'reference_number',
  case_diameter: 'case_diameter', 'قطر العلبة': 'case_diameter',
  'قطر العلبة (مم)': 'case_diameter', diameter: 'case_diameter',
  bracelet: 'bracelet_material', bracelet_material: 'bracelet_material',
  'نوع السوار': 'bracelet_material', 'مادة السوار': 'bracelet_material',
  price: 'retail_price', retail_price: 'retail_price',
  'السعر': 'retail_price', 'السعر (د.ك)': 'retail_price',
};

interface WatchRow {
  brand: string;
  model: string;
  reference_number: string;
  case_diameter: string;
  bracelet_material: string;
  retail_price: string;
  imageFile?: File;
  status: 'pending' | 'importing' | 'done' | 'error';
  error?: string;
}

export const AdminCatalogImport: React.FC = () => {
  const navigate = useNavigate();
  const xlsxRef = useRef<HTMLInputElement>(null);
  const imgRef  = useRef<HTMLInputElement>(null);

  const [rows,    setRows]    = useState<WatchRow[]>([]);
  const [imgMap,  setImgMap]  = useState<Record<string, File>>({});
  const [running, setRunning] = useState(false);
  const [done,    setDone]    = useState(0);

  // ── Parse Excel ────────────────────────────────────────────────────────────
  const handleExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb   = XLSX.read(ev.target?.result, { type: 'binary' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const raw  = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });
      if (!raw.length) return;

      // Normalise column names
      const parsed: WatchRow[] = raw.map(r => {
        const norm: Record<string, string> = {};
        for (const [k, v] of Object.entries(r)) {
          const key = COL_MAP[k.trim()] ?? COL_MAP[k.trim().toLowerCase()];
          if (key) norm[key] = String(v).trim();
        }
        return {
          brand:             norm.brand             ?? '',
          model:             norm.model             ?? '',
          reference_number:  norm.reference_number  ?? '',
          case_diameter:     norm.case_diameter     ?? '',
          bracelet_material: norm.bracelet_material ?? '',
          retail_price:      norm.retail_price      ?? '',
          status: 'pending' as const,
        };
      }).filter(r => r.brand && r.model);

      setRows(parsed);
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // ── Load images (matched by reference number or sequential name) ──────────
  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const map: Record<string, File> = {};
    for (const f of files) {
      // key = filename without extension, lowercased
      const key = f.name.replace(/\.[^.]+$/, '').toLowerCase().trim();
      map[key] = f;
    }
    setImgMap(map);
    e.target.value = '';
  };

  // Match image to a row by reference_number or index
  const findImage = (row: WatchRow, idx: number): File | undefined => {
    const ref = row.reference_number.toLowerCase().trim();
    if (ref && imgMap[ref]) return imgMap[ref];
    // Try index-based names: 1.jpg, 2.jpg, row1.jpg …
    for (const key of [`${idx + 1}`, `row${idx + 1}`, `${idx}`]) {
      if (imgMap[key]) return imgMap[key];
    }
    return undefined;
  };

  // ── Run import ──────────────────────────────────────────────────────────────
  const runImport = async () => {
    setRunning(true);
    setDone(0);
    const updated = [...rows];

    for (let i = 0; i < updated.length; i++) {
      const row = updated[i];
      if (row.status === 'done') { setDone(i + 1); continue; }
      updated[i] = { ...row, status: 'importing' };
      setRows([...updated]);

      try {
        let image_url: string | null = null;
        const imgFile = findImage(row, i);
        if (imgFile) {
          // Upload image to Supabase storage
          const ext  = imgFile.name.split('.').pop() ?? 'jpg';
          const path = `catalog/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from('auction-images')
            .upload(path, imgFile, { upsert: true, contentType: imgFile.type });
          if (!upErr) {
            const { data: { publicUrl } } = supabase.storage.from('auction-images').getPublicUrl(path);
            image_url = publicUrl;
          }
        }

        const payload: Record<string, any> = {
          brand:             row.brand,
          model:             row.model,
          reference_number:  row.reference_number  || null,
          case_diameter:     row.case_diameter      ? parseFloat(row.case_diameter)  : null,
          bracelet_material: row.bracelet_material  || null,
          retail_price:      row.retail_price       ? parseFloat(row.retail_price)   : 0,
          active:            true,
          image_url,
          slug:    `${slugify(row.brand)}-${slugify(row.model)}-${Date.now().toString(36)}`,
          sort_order: i,
        };

        await createCatalogWatch(payload);
        updated[i] = { ...updated[i], status: 'done' };
      } catch (err: any) {
        updated[i] = { ...updated[i], status: 'error', error: err.message };
      }

      setRows([...updated]);
      setDone(i + 1);
    }

    setRunning(false);
  };

  const total   = rows.length;
  const doneOk  = rows.filter(r => r.status === 'done').length;
  const errors  = rows.filter(r => r.status === 'error').length;
  const matched = rows.filter((r, i) => !!findImage(r, i)).length;

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif text-3xl text-white">استيراد جملة — الكاتالوج</h1>
        </div>

        {/* Step 1 — Excel */}
        <div className="bg-obsidian-900 border border-obsidian-800 p-6 mb-6">
          <h2 className="font-serif text-white text-lg mb-1">١. ملف Excel</h2>
          <p className="text-obsidian-500 text-xs mb-4">
            أعمدة مطلوبة: <span className="text-obsidian-300">الماركة · الموديل</span> | اختيارية: الرقم المرجعي · قطر العلبة · نوع السوار · السعر
          </p>
          <button onClick={() => xlsxRef.current?.click()} className="btn-outline text-sm px-5 py-2">
            {total ? `✓ تم تحميل ${total} ساعة` : 'رفع ملف Excel'}
          </button>
          <input ref={xlsxRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleExcel} className="hidden" />
        </div>

        {/* Step 2 — Images */}
        {total > 0 && (
          <div className="bg-obsidian-900 border border-obsidian-800 p-6 mb-6">
            <h2 className="font-serif text-white text-lg mb-1">٢. صور الساعات (اختياري)</h2>
            <p className="text-obsidian-500 text-xs mb-4">
              سمّ كل صورة بالرقم المرجعي للساعة (مثلاً <span className="text-obsidian-300">126610LN.jpg</span>)، أو بالترتيب (1.jpg، 2.jpg…)
            </p>
            <button onClick={() => imgRef.current?.click()} className="btn-outline text-sm px-5 py-2">
              {Object.keys(imgMap).length
                ? `✓ ${Object.keys(imgMap).length} صورة — ${matched} مطابقة`
                : 'رفع الصور (متعدد)'}
            </button>
            <input ref={imgRef} type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
          </div>
        )}

        {/* Preview table */}
        {total > 0 && (
          <div className="bg-obsidian-900 border border-obsidian-800 mb-6 overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="border-b border-obsidian-800 text-obsidian-400 text-xs">
                  <th className="p-3">#</th>
                  <th className="p-3">الماركة</th>
                  <th className="p-3">الموديل</th>
                  <th className="p-3">المرجعي</th>
                  <th className="p-3">السعر</th>
                  <th className="p-3">صورة</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-obsidian-800/50">
                    <td className="p-3 text-obsidian-500">{i + 1}</td>
                    <td className="p-3 text-white">{r.brand}</td>
                    <td className="p-3 text-obsidian-300">{r.model}</td>
                    <td className="p-3 text-obsidian-400 text-xs">{r.reference_number || '—'}</td>
                    <td className="p-3 text-gold-500">{r.retail_price ? `${r.retail_price} د.ك` : '—'}</td>
                    <td className="p-3">
                      {findImage(r, i)
                        ? <span className="text-green-400 text-xs">✓</span>
                        : <span className="text-obsidian-600 text-xs">—</span>}
                    </td>
                    <td className="p-3 text-xs">
                      {r.status === 'pending'   && <span className="text-obsidian-500">انتظار</span>}
                      {r.status === 'importing' && <span className="text-blue-400 animate-pulse">جارٍ…</span>}
                      {r.status === 'done'      && <span className="text-green-400">✓</span>}
                      {r.status === 'error'     && <span className="text-red-400" title={r.error}>✗ خطأ</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Progress */}
        {running && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-obsidian-400 mb-1">
              <span>جارٍ الاستيراد…</span>
              <span>{done} / {total}</span>
            </div>
            <div className="h-1.5 bg-obsidian-800 rounded-full overflow-hidden">
              <div className="h-full bg-gold-500 transition-all duration-300" style={{ width: `${(done / total) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Summary after done */}
        {!running && doneOk > 0 && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm p-4 mb-4">
            تم استيراد {doneOk} ساعة بنجاح{errors > 0 ? ` · ${errors} أخطاء` : ''}
          </div>
        )}

        {/* Actions */}
        {total > 0 && (
          <div className="flex gap-3">
            <button
              onClick={runImport}
              disabled={running || doneOk === total}
              className="btn-gold px-8"
            >
              {running ? 'جارٍ الاستيراد…' : doneOk === total ? 'تم الاستيراد ✓' : `استيراد ${total} ساعة`}
            </button>
            <button onClick={() => navigate('/admin/catalog')} className="btn-outline px-6">
              {doneOk > 0 ? 'عرض الكاتالوج' : 'إلغاء'}
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
