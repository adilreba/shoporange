import { fetchApi } from './api';

export interface Category {
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  attributes?: CategoryAttribute[];
}

export interface CategoryAttribute {
  attributeId: string;
  name: string;
  type: 'select' | 'color' | 'text' | 'number';
  options: string[];
  required: boolean;
  order: number;
}

// Get all categories
export const getCategories = async (): Promise<Category[]> => {
  const response = await fetchApi('/categories');
  return response.data || [];
};

// Get single category with attributes
export const getCategory = async (categoryId: string): Promise<Category> => {
  const response = await fetchApi(`/categories/${categoryId}`);
  return response.data;
};

// Create new category
export const createCategory = async (data: {
  name: string;
  description?: string;
  icon?: string;
  parentId?: string;
  order?: number;
}): Promise<Category> => {
  const response = await fetchApi('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
};

// Update category
export const updateCategory = async (
  categoryId: string,
  data: Partial<Category>
): Promise<void> => {
  await fetchApi(`/categories/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// Delete category
export const deleteCategory = async (categoryId: string): Promise<void> => {
  await fetchApi(`/categories/${categoryId}`, {
    method: 'DELETE',
  });
};

// Add attribute to category
export const addCategoryAttribute = async (
  categoryId: string,
  data: {
    name: string;
    type: 'select' | 'color' | 'text' | 'number';
    options: string[];
    required?: boolean;
    order?: number;
  }
): Promise<CategoryAttribute> => {
  const response = await fetchApi(`/categories/${categoryId}/attributes`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.data;
};

// Update attribute
export const updateCategoryAttribute = async (
  categoryId: string,
  attributeId: string,
  data: Partial<CategoryAttribute>
): Promise<void> => {
  await fetchApi(`/categories/${categoryId}/attributes/${attributeId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// Delete attribute
export const deleteCategoryAttribute = async (
  categoryId: string,
  attributeId: string
): Promise<void> => {
  await fetchApi(`/categories/${categoryId}/attributes/${attributeId}`, {
    method: 'DELETE',
  });
};

// Generate slug from name
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};
