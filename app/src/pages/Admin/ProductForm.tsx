import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Save,
  ArrowLeft,
  Upload,
  X,
  Plus,
  Trash2,
  Package,
  Settings2,
  Layers,
  AlertCircle,
  Check,
  Wand2,
  ImageIcon,
  GripVertical,
  Star,
  Eye,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo,
  Redo,
  Truck,
  Tag,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { adminProductsApi, type AdminProduct } from '@/services/adminProductsApi';
import { productsApi, categoriesApi } from '@/services/api';
import {
  getCategoryAttributes,
  type CategoryAttribute,
} from '@/services/categoryAttributesApi';
import {
  bulkCreateVariations,
  getProductVariations,
  updateVariation as apiUpdateVariation,
  deleteVariation as apiDeleteVariation,
  type ProductVariation,
} from '@/services/productVariationsApi';

// ==================== TYPES & SCHEMA ====================

const productSchema = z.object({
  name: z.string().min(3, 'Ürün adı en az 3 karakter olmalı').max(200, 'Ürün adı en fazla 200 karakter olabilir'),
  description: z.string().optional(),
  price: z.number().min(0.01, 'Fiyat 0\'dan büyük olmalı'),
  originalPrice: z.number().min(0).optional().or(z.literal('')),
  discount: z.number().min(0).max(100, 'İndirim 0-100 arası olmalı').optional().or(z.literal('')),
  category: z.string().min(1, 'Kategori seçilmeli'),
  brand: z.string().optional(),
  stock: z.number().min(0, 'Stok 0 veya daha büyük olmalı').int('Stok tam sayı olmalı'),
  sku: z.string().min(1, 'SKU gereklidir'),
  barcode: z.string().length(13, 'Barkod 13 haneli olmalı').optional().or(z.literal('')),
  stockCode: z.string().optional(),
  supplierCode: z.string().optional(),
  tags: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  seoTitle: z.string().max(60, '60 karakteri geçmemeli').optional(),
  seoDescription: z.string().max(160, '160 karakteri geçmemeli').optional(),
  seoSlug: z.string().optional(),
  canonicalUrl: z.string().url('Geçerli URL girin').optional().or(z.literal('')),
  weight: z.number().min(0).optional().or(z.literal('')),
  materials: z.array(z.string()).optional(),
  warranty: z.number().min(0).int().optional().or(z.literal('')),
  countryOfOrigin: z.string().optional(),
  taxRate: z.number().optional().or(z.literal('')),
});

type ProductFormData = z.infer<typeof productSchema>;

type TabType = 'general' | 'price' | 'images' | 'variations' | 'seo' | 'shipping';

// ==================== COLOR MAP ====================

const COLOR_MAP: Record<string, string> = {
  'Siyah': '#000000',
  'Beyaz': '#FFFFFF',
  'Kırmızı': '#FF0000',
  'Mavi': '#0000FF',
  'Yeşil': '#008000',
  'Sarı': '#FFFF00',
  'Pembe': '#FFC0CB',
  'Mor': '#800080',
  'Gri': '#808080',
  'Kahverengi': '#8B4513',
  'Bej': '#F5F5DC',
  'Gümüş': '#C0C0C0',
  'Altın': '#FFD700',
  'Turuncu': '#FFA500',
  'Lacivert': '#000080',
  'Şeffaf': 'transparent',
  'Uzay Grisi': '#4A4A4A',
  'Krem': '#FFFDD0',
  'Meşe': '#C19A6B',
  'Ceviz': '#5D4E37',
};

// ==================== HELPER FUNCTIONS ====================

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/İ/g, 'i')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const calculateEANCheckDigit = (digits: string): string => {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const digit = parseInt(digits[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return String(checkDigit);
};

const getCategoryCode = (categoryId: string): string => {
  const categoryMap: Record<string, string> = {
    'elektronik': 'ELK', 'moda': 'MOD', 'ev-yasam': 'EVY', 'evya': 'EVY',
    'kozmetik': 'KOZ', 'spor': 'SPO', 'kitap': 'KIT', 'oyuncak': 'OYN',
    'supermarket': 'SUP', 'gida': 'GID', 'temizlik': 'TMZ', 'kisisel-bakim': 'KSB',
    'living-room': 'SAL', 'bedroom': 'YAT', 'dining-room': 'YEM', 'kitchen': 'MUT',
    'office': 'OFS', 'outdoor': 'BAH', 'lighting': 'AYD', 'decor': 'DEK',
    'mobilya': 'MOB', 'mutfak': 'MUT', 'giyim': 'GIY', 'ayakkabi': 'AYK',
  };
  return categoryMap[categoryId] || 'GEN';
};

const getBrandCode = (brand: string | undefined): string => {
  if (!brand) return 'GEN';
  const normalized = brand.toUpperCase()
    .replace(/[Ç]/g, 'C')
    .replace(/[Ğ]/g, 'G')
    .replace(/[İ]/g, 'I')
    .replace(/[Ö]/g, 'O')
    .replace(/[Ş]/g, 'S')
    .replace(/[Ü]/g, 'U');
  return normalized.substring(0, 3);
};

// ==================== RICH TEXT EDITOR COMPONENT ====================

function RichTextEditor({ value, onChange, placeholder }: { value: string; onChange: (val: string) => void; placeholder?: string }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({ openOnClick: false }),
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '<p></p>');
    }
  }, [value, editor]);

  if (!editor) return null;

  const ToolbarButton = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title: string }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${active ? 'bg-orange-100 text-orange-600' : 'text-gray-500 hover:bg-gray-100'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border-b">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Kalın">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="İtalik">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Sırasız Liste">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Sıralı Liste">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <div className="w-px h-5 bg-gray-300 mx-1" />
        <ToolbarButton onClick={() => {
          const url = window.prompt('Link URL:');
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }} active={editor.isActive('link')} title="Link Ekle">
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        <div className="flex-1" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Geri Al">
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="İleri Al">
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-3 min-h-[180px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[180px]"
        placeholder={placeholder}
      />
    </div>
  );
}

// ==================== SORTABLE IMAGE ITEM ====================

function SortableImageItem({
  image,
  index,
  isMain,
  onRemove,
  onSetMain,
}: {
  image: string;
  index: number;
  isMain: boolean;
  onRemove: (index: number) => void;
  onSetMain: (index: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image + index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative aspect-square rounded-lg overflow-hidden border-2 group cursor-move ${
        isMain ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200'
      }`}
      {...attributes}
      {...listeners}
    >
      <img src={image} alt={`Ürün ${index + 1}`} className="w-full h-full object-cover" />
      {isMain && (
        <div className="absolute top-1 left-1 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
          Ana Görsel
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
        {!isMain && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSetMain(index); }}
            className="p-1.5 bg-white rounded-full hover:bg-orange-50"
            title="Ana Görsel Yap"
          >
            <Star className="w-4 h-4 text-orange-500" />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(index); }}
          className="p-1.5 bg-white rounded-full hover:bg-red-50"
          title="Sil"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>
      <div className="absolute bottom-1 left-1 p-1 bg-white/80 rounded cursor-grab active:cursor-grabbing">
        <GripVertical className="w-3 h-3 text-gray-500" />
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [allProducts, setAllProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [tagInput, setTagInput] = useState('');
  const [materialInput, setMaterialInput] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [dimensions, setDimensions] = useState<{ width: number | ''; height: number | ''; depth: number | '' }>({ width: '', height: '', depth: '' });
  const [specifications, setSpecifications] = useState<Record<string, string>>({});

  // Variations state
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>([]);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string[]>>({});
  const [generatingVariations, setGeneratingVariations] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: undefined as any,
      originalPrice: '',
      discount: '',
      category: '',
      brand: '',
      stock: undefined as any,
      sku: '',
      barcode: '',
      stockCode: '',
      supplierCode: '',
      tags: [],
      active: true,
      isFeatured: false,
      seoTitle: '',
      seoDescription: '',
      seoSlug: '',
      canonicalUrl: '',
      weight: '',
      materials: [],
      warranty: '',
      countryOfOrigin: 'Türkiye',
      taxRate: 20,
    } as any,
  });

  const watchedName = watch('name');
  const watchedCategory = watch('category');
  const watchedBrand = watch('brand');
  const watchedPrice = watch('price');
  const watchedOriginalPrice = watch('originalPrice');
  const watchedDiscount = watch('discount');
  const watchedTags = watch('tags');
  const watchedMaterials = watch('materials');
  const watchedSeoSlug = watch('seoSlug');

  // Sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load categories
  useEffect(() => {
    categoriesApi.getTree()
      .then((res: any) => {
        const tree = Array.isArray(res) ? res : res.data || [];
        const flat: Array<{ id: string; name: string }> = [];
        const walk = (nodes: any[], depth = 0) => {
          for (const node of nodes) {
            flat.push({ id: node.categoryId, name: '  '.repeat(depth) + node.name });
            if (node.children?.length) walk(node.children, depth + 1);
          }
        };
        walk(tree);
        setCategories(flat);
      })
      .catch(() => setCategories([]));
  }, []);

  // Load all products for SKU/barcode generation
  useEffect(() => {
    adminProductsApi.getAll()
      .then((res: any) => setAllProducts(Array.isArray(res) ? res : res.data || []))
      .catch(() => setAllProducts([]));
  }, []);

  // Load product in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      loadProduct(id);
    }
  }, [isEditMode, id]);

  // Load category attributes
  useEffect(() => {
    if (watchedCategory) {
      loadCategoryAttributes(watchedCategory);
    } else {
      setCategoryAttributes([]);
      setSelectedAttributes({});
    }
  }, [watchedCategory]);

  // Auto-generate SEO slug from name
  useEffect(() => {
    if (watchedName && !isEditMode && !watchedSeoSlug) {
      setValue('seoSlug', generateSlug(watchedName));
    }
  }, [watchedName, isEditMode, watchedSeoSlug, setValue]);

  const loadProduct = async (productId: string) => {
    setLoading(true);
    try {
      const product = await productsApi.getById(productId);
      reset({
        name: product.name || '',
        description: product.description || '',
        price: product.price,
        originalPrice: product.originalPrice || '',
        discount: product.discount || '',
        category: product.category || '',
        brand: product.brand || '',
        stock: product.stock ?? 0,
        sku: product.sku || '',
        barcode: product.barcode || '',
        stockCode: product.stockCode || '',
        supplierCode: product.supplierCode || '',
        tags: product.tags || [],
        active: product.active !== false,
        isFeatured: product.isFeatured || false,
        seoTitle: product.seoTitle || '',
        seoDescription: product.seoDescription || '',
        seoSlug: product.seoSlug || '',
        canonicalUrl: product.canonicalUrl || '',
        weight: product.weight || '',
        materials: product.materials || [],
        warranty: product.warranty || '',
        countryOfOrigin: product.countryOfOrigin || 'Türkiye',
        taxRate: product.taxRate || 20,
      });
      setImages(product.images || []);
      setMainImageIndex(0);
      if (productId) loadExistingVariations(productId);
    } catch (error) {
      toast.error('Ürün yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryAttributes = async (categoryId: string) => {
    try {
      const schema = await getCategoryAttributes(categoryId);
      setCategoryAttributes(schema.attributes);
    } catch (error) {
      setCategoryAttributes([]);
    }
  };

  const loadExistingVariations = async (productId: string) => {
    try {
      const data = await getProductVariations(productId);
      setVariations(data.variations);
    } catch (error) {
      setVariations([]);
    }
  };

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      const payload: AdminProduct = {
        ...data,
        images,
        status: data.active ? 'active' : 'inactive',
        // Convert empty strings to undefined for optional fields
        originalPrice: data.originalPrice || undefined,
        discount: data.discount || undefined,
        barcode: data.barcode || undefined,
        stockCode: data.stockCode || undefined,
        supplierCode: data.supplierCode || undefined,
        weight: data.weight || undefined,
        warranty: data.warranty || undefined,
        taxRate: data.taxRate || undefined,
        canonicalUrl: data.canonicalUrl || undefined,
        dimensions: dimensions.width || dimensions.height || dimensions.depth ? {
          width: dimensions.width || undefined,
          height: dimensions.height || undefined,
          depth: dimensions.depth || undefined,
        } : undefined,
        specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
      };

      if (isEditMode && id) {
        await adminProductsApi.update(id, payload);
        toast.success('Ürün güncellendi');
      } else {
        const result = await adminProductsApi.create(payload);
        toast.success('Ürün eklendi');
        // Navigate to edit mode for the new product so variations can be added
        if (result?.product?.id) {
          navigate(`/admin/products/${result.product.id}/edit`);
          return;
        }
      }
      navigate('/admin/products');
    } catch (error: any) {
      toast.error(error.message || 'Ürün kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  // ==================== IMAGE HANDLERS ====================

  const handleImageUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const uploadedUrls: string[] = [];
    for (const file of files) {
      try {
        const imageUrl = await adminProductsApi.uploadImage(file);
        uploadedUrls.push(imageUrl);
      } catch (error: any) {
        toast.error(`${file.name} yüklenirken hata oluştu`);
      }
    }

    if (uploadedUrls.length > 0) {
      setImages((prev) => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} resim yüklendi`);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (mainImageIndex >= next.length) setMainImageIndex(0);
      if (mainImageIndex === index && next.length > 0) setMainImageIndex(0);
      return next;
    });
  };

  const handleSetMainImage = (index: number) => setMainImageIndex(index);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((_, i) => active.id === items[i] + i);
        const newIndex = items.findIndex((_, i) => over.id === items[i] + i);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // ==================== TAG HANDLERS ====================

  const handleAddTag = () => {
    if (tagInput.trim() && !watchedTags?.includes(tagInput.trim())) {
      setValue('tags', [...(watchedTags || []), tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setValue('tags', (watchedTags || []).filter((t) => t !== tag));
  };

  // ==================== MATERIAL HANDLERS ====================

  const handleAddMaterial = () => {
    if (materialInput.trim() && !watchedMaterials?.includes(materialInput.trim())) {
      setValue('materials', [...(watchedMaterials || []), materialInput.trim()]);
      setMaterialInput('');
    }
  };

  const handleRemoveMaterial = (material: string) => {
    setValue('materials', (watchedMaterials || []).filter((m) => m !== material));
  };

  // ==================== SPECIFICATION HANDLERS ====================

  const handleAddSpec = () => {
    if (specKey.trim() && specValue.trim()) {
      setSpecifications({ ...specifications, [specKey.trim()]: specValue.trim() });
      setSpecKey('');
      setSpecValue('');
    }
  };

  const handleRemoveSpec = (key: string) => {
    const next = { ...specifications };
    delete next[key];
    setSpecifications(next);
  };

  // ==================== SKU / BARCODE GENERATORS ====================

  const generateSKU = () => {
    const categoryCode = getCategoryCode(watchedCategory);
    const brandCode = getBrandCode(watchedBrand);
    const existingSKUs = allProducts
      .filter((p) => p.sku?.startsWith(`${categoryCode}-${brandCode}`))
      .map((p) => {
        const match = p.sku?.match(/-(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      });
    const maxNum = existingSKUs.length > 0 ? Math.max(...existingSKUs) : 0;
    const nextNum = String(maxNum + 1).padStart(3, '0');
    setValue('sku', `${categoryCode}-${brandCode}-${nextNum}`);
    toast.success('SKU otomatik oluşturuldu');
  };

  const generateBarcode = () => {
    const countryCode = '868';
    const existingBarcodes = allProducts
      .filter((p) => p.barcode?.startsWith(countryCode))
      .map((p) => parseInt(p.barcode?.slice(3, 12) || '0'));
    const maxNum = existingBarcodes.length > 0 ? Math.max(...existingBarcodes) : 10000000;
    const nextNum = String(maxNum + 1).padStart(9, '0');
    const barcodeWithoutCheck = countryCode + nextNum;
    const checkDigit = calculateEANCheckDigit(barcodeWithoutCheck);
    setValue('barcode', barcodeWithoutCheck + checkDigit);
    toast.success('EAN-13 barkod otomatik oluşturuldu');
  };

  // ==================== VARIATION HANDLERS ====================

  const toggleAttributeOption = (attributeId: string, option: string) => {
    setSelectedAttributes((prev) => {
      const current = prev[attributeId] || [];
      if (current.includes(option)) {
        return { ...prev, [attributeId]: current.filter((o) => o !== option) };
      }
      return { ...prev, [attributeId]: [...current, option] };
    });
  };

  const generateVariations = async () => {
    if (!id) {
      toast.error('Önce ürünü kaydetmelisiniz');
      return;
    }
    const hasSelections = Object.values(selectedAttributes).some((arr) => arr.length > 0);
    if (!hasSelections) {
      toast.error('En az bir özellik seçmelisiniz');
      return;
    }
    setGeneratingVariations(true);
    try {
      const result = await bulkCreateVariations(id, {
        attributes: selectedAttributes,
        basePrice: watchedPrice || 0,
        stock: 10,
      });
      setVariations(result.variations);
      toast.success(`${result.created} varyasyon oluşturuldu`);
    } catch (error) {
      toast.error('Varyasyonlar oluşturulamadı');
    } finally {
      setGeneratingVariations(false);
    }
  };

  const updateVariation = async (variationId: string, field: 'price' | 'stock', value: string) => {
    const numValue = parseFloat(value) || 0;
    setVariations((prev) =>
      prev.map((v) => (v.variationId === variationId ? { ...v, [field]: numValue } : v))
    );
    // Auto-save to API
    if (id) {
      try {
        await apiUpdateVariation(id, variationId, { [field]: numValue });
      } catch {
        // silent fail
      }
    }
  };

  const deleteVariation = async (variationId: string) => {
    if (!id) return;
    try {
      await apiDeleteVariation(id, variationId);
      setVariations((prev) => prev.filter((v) => v.variationId !== variationId));
      toast.success('Varyasyon silindi');
    } catch {
      toast.error('Varyasyon silinemedi');
    }
  };

  // ==================== RENDER HELPERS ====================

  const renderColorOption = (attribute: CategoryAttribute, option: string) => {
    const isSelected = (selectedAttributes[attribute.attributeId] || []).includes(option);
    const colorCode = COLOR_MAP[option] || '#ccc';
    return (
      <button
        key={option}
        type="button"
        onClick={() => toggleAttributeOption(attribute.attributeId, option)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
          isSelected
            ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
            : 'border-gray-200 hover:border-orange-300'
        }`}
      >
        <span
          className="w-5 h-5 rounded-full border border-gray-200"
          style={{
            backgroundColor: colorCode,
            backgroundImage:
              colorCode === 'transparent'
                ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                : undefined,
            backgroundSize: colorCode === 'transparent' ? '10px 10px' : undefined,
          }}
        />
        <span className="text-sm">{option}</span>
        {isSelected && <Check className="w-4 h-4 text-orange-500" />}
      </button>
    );
  };

  const renderSelectOption = (attribute: CategoryAttribute, option: string) => {
    const isSelected = (selectedAttributes[attribute.attributeId] || []).includes(option);
    return (
      <button
        key={option}
        type="button"
        onClick={() => toggleAttributeOption(attribute.attributeId, option)}
        className={`px-3 py-2 rounded-lg border text-sm transition-all ${
          isSelected
            ? 'border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-200'
            : 'border-gray-200 hover:border-orange-300'
        }`}
      >
        {option}
      </button>
    );
  };

  const getDiscountDisplay = () => {
    const price = Number(watchedPrice) || 0;
    const original = Number(watchedOriginalPrice) || 0;
    const disc = Number(watchedDiscount) || 0;
    if (original > price && price > 0) {
      const pct = Math.round((1 - price / original) * 100);
      return `%${pct} indirim (Liste fiyatından)`;
    }
    if (disc > 0 && price > 0) {
      const finalPrice = price * (1 - disc / 100);
      return `%${disc} indirim → ₺${finalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    }
    return '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <input type="file" accept="image/*" multiple ref={fileInputRef} className="hidden" onChange={handleFileChange} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditMode ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
            </h1>
            <p className="text-sm text-gray-500">
              {isEditMode ? 'Ürün bilgilerini güncelleyin' : 'Yeni bir ürün ekleyin'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/admin/products')}>
            İptal
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {([
          { key: 'general', label: 'Genel', icon: Package },
          { key: 'price', label: 'Fiyat & Stok', icon: Tag },
          { key: 'images', label: `Görseller ${images.length > 0 ? `(${images.length})` : ''}`, icon: ImageIcon },
          { key: 'variations', label: `Varyasyonlar ${variations.length > 0 ? `(${variations.length})` : ''}`, icon: Layers },
          { key: 'seo', label: 'SEO', icon: Search },
          { key: 'shipping', label: 'Kargo & Diğer', icon: Truck },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ==================== GENERAL TAB ==================== */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Temel Bilgiler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ürün Adı *</label>
                    <Input {...register('name')} placeholder="Ürün adı girin" />
                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                  </div>

                  {/* Description with Rich Text Editor */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Açıklama</label>
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <RichTextEditor value={field.value || ''} onChange={field.onChange} placeholder="Ürün açıklaması girin..." />
                      )}
                    />
                  </div>

                  {/* Category & Brand */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Kategori *</label>
                      <select {...register('category')} className="w-full px-3 py-2 border rounded-md">
                        <option value="">Kategori seçin</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Marka</label>
                      <Input {...register('brand')} placeholder="Marka adı" />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Etiketler</label>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Etiket ekleyin ve Enter'a basın"
                      />
                      <Button type="button" onClick={handleAddTag} variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {watchedTags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Materials */}
              <Card>
                <CardHeader>
                  <CardTitle>Malzemeler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={materialInput}
                      onChange={(e) => setMaterialInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddMaterial();
                        }
                      }}
                      placeholder="Malzeme ekleyin (örn: Ahşap, Deri, Metal...)"
                    />
                    <Button type="button" onClick={handleAddMaterial} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {watchedMaterials?.map((material) => (
                      <Badge key={material} variant="outline" className="gap-1">
                        {material}
                        <button type="button" onClick={() => handleRemoveMaterial(material)} className="ml-1 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Specifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Teknik Özellikler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={specKey} onChange={(e) => setSpecKey(e.target.value)} placeholder="Özellik adı (örn: Malzeme)" />
                    <Input
                      value={specValue}
                      onChange={(e) => setSpecValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSpec();
                        }
                      }}
                      placeholder="Değer (örn: Masif Ahşap)"
                    />
                  </div>
                  <Button type="button" onClick={handleAddSpec} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Ekle
                  </Button>
                  <div className="space-y-2">
                    {Object.keys(specifications).length > 0 &&
                      Object.entries(specifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">
                            <span className="font-medium">{key}:</span> {value as string}
                          </span>
                          <button type="button" onClick={() => handleRemoveSpec(key)} className="text-red-500 hover:text-red-700">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Durum</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Aktif</span>
                      <p className="text-xs text-gray-500">Müşterilere görünür</p>
                    </div>
                    <Controller name="active" control={control} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Öne Çıkan</span>
                      <p className="text-xs text-gray-500">Ana sayfada göster</p>
                    </div>
                    <Controller name="isFeatured" control={control} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ==================== PRICE & STOCK TAB ==================== */}
        {activeTab === 'price' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fiyat Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Satış Fiyatı (₺) *</label>
                      <Input type="number" step="0.01" min="0" {...register('price', { valueAsNumber: true })} placeholder="0.00" />
                      {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Liste Fiyatı (₺)</label>
                      <Input type="number" step="0.01" min="0" {...register('originalPrice', { valueAsNumber: true })} placeholder="İndirimsiz fiyat" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">İndirim (%)</label>
                      <Input type="number" min="0" max="100" {...register('discount', { valueAsNumber: true })} placeholder="0" />
                      {errors.discount && <p className="text-xs text-red-500">{errors.discount.message}</p>}
                    </div>
                  </div>
                  {getDiscountDisplay() && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      {getDiscountDisplay()}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stok & Kod Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Stok Adedi *</label>
                      <Input type="number" min="0" {...register('stock', { valueAsNumber: true })} placeholder="0" />
                      {errors.stock && <p className="text-xs text-red-500">{errors.stock.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">SKU (Stok Kodu) *</label>
                      <div className="flex gap-2">
                        <Input {...register('sku')} placeholder="KATEGORI-MARKA-001" className="flex-1" />
                        <Button type="button" variant="outline" size="icon" onClick={generateSKU} title="Otomatik SKU Oluştur">
                          <Wand2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {errors.sku && <p className="text-xs text-red-500">{errors.sku.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Barkod (EAN-13)</label>
                      <div className="flex gap-2">
                        <Input {...register('barcode')} placeholder="8680000000000" maxLength={13} className="flex-1 font-mono" />
                        <Button type="button" variant="outline" size="icon" onClick={generateBarcode} title="Otomatik Barkod Oluştur">
                          <Wand2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {errors.barcode && <p className="text-xs text-red-500">{errors.barcode.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Depo Kodu</label>
                      <Input {...register('stockCode')} placeholder="DEPO-A-123" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tedarikçi Kodu</label>
                      <Input {...register('supplierCode')} placeholder="TED-456" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ==================== IMAGES TAB ==================== */}
        {activeTab === 'images' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Ürün Görselleri</span>
                <Button type="button" onClick={handleImageUploadClick} variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Resim Yükle
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {images.length === 0 ? (
                <button
                  type="button"
                  onClick={handleImageUploadClick}
                  className="w-full py-16 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 flex flex-col items-center justify-center gap-3 transition-colors"
                >
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                  <span className="text-gray-500">Resim yüklemek için tıklayın veya sürükleyin</span>
                  <span className="text-xs text-gray-400">PNG, JPG, WEBP desteklenir</span>
                </button>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-3">
                    <GripVertical className="w-4 h-4 inline mr-1" />
                    Sıralamak için sürükleyin, ana görsel yapmak için yıldıza tıklayın
                  </p>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={images.map((img, i) => img + i)} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {images.map((image, index) => (
                          <SortableImageItem
                            key={image + index}
                            image={image}
                            index={index}
                            isMain={index === mainImageIndex}
                            onRemove={handleRemoveImage}
                            onSetMain={handleSetMainImage}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={handleImageUploadClick}
                          className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-orange-500 flex flex-col items-center justify-center gap-2 transition-colors"
                        >
                          <Upload className="w-8 h-8 text-gray-400" />
                          <span className="text-sm text-gray-500">Ekle</span>
                        </button>
                      </div>
                    </SortableContext>
                  </DndContext>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* ==================== VARIATIONS TAB ==================== */}
        {activeTab === 'variations' && (
          <div className="space-y-6">
            {!isEditMode ? (
              <Card className="p-8 text-center">
                <Settings2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Varyasyonları yönetmek için önce ürünü kaydedin.</p>
                <p className="text-sm text-gray-400 mt-1">Kaydettikten sonra bu sekmeye geri dönün.</p>
              </Card>
            ) : !watchedCategory ? (
              <Card className="p-8 text-center">
                <Settings2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Varyasyon oluşturmak için önce "Genel" sekmesinden kategori seçin.</p>
                <Button variant="outline" className="mt-4" onClick={() => setActiveTab('general')}>
                  Genel Bilgiler'e Git
                </Button>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings2 className="w-5 h-5" />
                      Kategori Özellikleri
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {categoryAttributes.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Bu kategori için önceden tanımlanmış özellik bulunmuyor.</p>
                    ) : (
                      categoryAttributes.map((attr) => (
                        <div key={attr.attributeId} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="font-medium">
                              {attr.name}
                              {attr.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            <span className="text-xs text-gray-500">{(selectedAttributes[attr.attributeId] || []).length} seçili</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {attr.type === 'color'
                              ? attr.options.map((option) => renderColorOption(attr, option))
                              : attr.options.map((option) => renderSelectOption(attr, option))}
                          </div>
                        </div>
                      ))
                    )}
                    <div className="pt-4 border-t">
                      <Button
                        type="button"
                        onClick={generateVariations}
                        disabled={generatingVariations || !id}
                        className="w-full bg-orange-500 hover:bg-orange-600"
                      >
                        {generatingVariations ? 'Oluşturuluyor...' : <><Layers className="w-4 h-4 mr-2" />Varyasyonları Oluştur</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {variations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Varyasyonlar ({variations.length})</span>
                        <Badge variant="secondary">Toplam Stok: {variations.reduce((sum, v) => sum + (v.stock || 0), 0)}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {variations.map((variation) => (
                          <div key={variation.variationId} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                            <div className="flex-1">
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(variation.attributes).map(([key, value]) => (
                                  <Badge key={key} variant="outline" className="text-xs">
                                    {key}: {value}
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">SKU: {variation.sku}</p>
                            </div>
                            <div className="w-32">
                              <label className="text-xs text-gray-500">Fiyat</label>
                              <Input
                                type="number"
                                value={variation.price}
                                onChange={(e) => updateVariation(variation.variationId, 'price', e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div className="w-32">
                              <label className="text-xs text-gray-500">Stok</label>
                              <Input
                                type="number"
                                value={variation.stock}
                                onChange={(e) => updateVariation(variation.variationId, 'stock', e.target.value)}
                                className={`mt-1 ${variation.stock < 5 ? 'border-red-300' : ''}`}
                              />
                              {variation.stock < 5 && <p className="text-xs text-red-500 mt-1">Düşük stok!</p>}
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => deleteVariation(variation.variationId)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* ==================== SEO TAB ==================== */}
        {activeTab === 'seo' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>SEO Ayarları</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">SEO Başlığı (Meta Title)</label>
                      <span className={`text-xs ${(watch('seoTitle')?.length || 0) > 60 ? 'text-red-500' : 'text-gray-500'}`}>
                        {watch('seoTitle')?.length || 0} / 60
                      </span>
                    </div>
                    <Input {...register('seoTitle')} placeholder="Boş bırakılırsa ürün adı kullanılır" />
                    {errors.seoTitle && <p className="text-xs text-red-500">{errors.seoTitle.message}</p>}
                    <p className="text-xs text-gray-500">Google sonuçlarında görünen başlık. İdeal: 50-60 karakter.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">SEO Açıklaması (Meta Description)</label>
                      <span className={`text-xs ${(watch('seoDescription')?.length || 0) > 160 ? 'text-red-500' : 'text-gray-500'}`}>
                        {watch('seoDescription')?.length || 0} / 160
                      </span>
                    </div>
                    <textarea
                      {...register('seoDescription')}
                      placeholder="Boş bırakılırsa açıklama kullanılır"
                      className="w-full px-3 py-2 border rounded-md min-h-[80px] resize-none"
                    />
                    {errors.seoDescription && <p className="text-xs text-red-500">{errors.seoDescription.message}</p>}
                    <p className="text-xs text-gray-500">Google sonuçlarında görünen açıklama. İdeal: 150-160 karakter.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">URL Slug</label>
                    <div className="flex gap-2">
                      <Input {...register('seoSlug')} placeholder="urun-adi-url-slug" className="flex-1" />
                      <Button type="button" variant="outline" onClick={() => setValue('seoSlug', generateSlug(watchedName))}>
                        <Wand2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">Ürün sayfasının URL'sinde kullanılacak. Örn: modern-koltuk-takimi</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Canonical URL</label>
                    <Input {...register('canonicalUrl')} placeholder="https://www.atushome.com/urun/modern-koltuk-takimi" />
                    {errors.canonicalUrl && <p className="text-xs text-red-500">{errors.canonicalUrl.message}</p>}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* SEO Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Google Önizleme
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-white border rounded-lg">
                    <p className="text-xs text-gray-500 truncate">
                      www.atushome.com › ürün › {watch('seoSlug') || generateSlug(watchedName)}
                    </p>
                    <p className="text-lg text-blue-700 hover:underline cursor-pointer truncate mt-1">
                      {watch('seoTitle') || watchedName || 'Ürün Başlığı'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {watch('seoDescription') || watch('description')?.replace(/<[^>]*>/g, '').substring(0, 160) || 'Ürün açıklaması burada görünecek...'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ==================== SHIPPING TAB ==================== */}
        {activeTab === 'shipping' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Kargo Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ağırlık (kg)</label>
                  <Input type="number" step="0.01" min="0" {...register('weight', { valueAsNumber: true })} placeholder="0.00" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">En (cm)</label>
                    <Input type="number" step="0.1" min="0" value={dimensions.width} onChange={(e) => setDimensions({ ...dimensions, width: e.target.value === '' ? '' : parseFloat(e.target.value) })} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Boy (cm)</label>
                    <Input type="number" step="0.1" min="0" value={dimensions.height} onChange={(e) => setDimensions({ ...dimensions, height: e.target.value === '' ? '' : parseFloat(e.target.value) })} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Derinlik (cm)</label>
                    <Input type="number" step="0.1" min="0" value={dimensions.depth} onChange={(e) => setDimensions({ ...dimensions, depth: e.target.value === '' ? '' : parseFloat(e.target.value) })} placeholder="0" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Diğer Bilgiler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Garanti Süresi (ay)</label>
                  <Input type="number" min="0" {...register('warranty', { valueAsNumber: true })} placeholder="24" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Menşe Ülke</label>
                  <select {...register('countryOfOrigin')} className="w-full px-3 py-2 border rounded-md">
                    <option value="Türkiye">Türkiye</option>
                    <option value="Çin">Çin</option>
                    <option value="Almanya">Almanya</option>
                    <option value="İtalya">İtalya</option>
                    <option value="Fransa">Fransa</option>
                    <option value="İspanya">İspanya</option>
                    <option value="Polonya">Polonya</option>
                    <option value="Hindistan">Hindistan</option>
                    <option value="Vietnam">Vietnam</option>
                    <option value="Bangladeş">Bangladeş</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">KDV Oranı (%)</label>
                  <select {...register('taxRate', { valueAsNumber: true })} className="w-full px-3 py-2 border rounded-md">
                    <option value={1}>%1</option>
                    <option value={10}>%10</option>
                    <option value={20}>%20</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer save button */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => navigate('/admin/products')} type="button">
            İptal
          </Button>
          <Button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-600">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  );
}
