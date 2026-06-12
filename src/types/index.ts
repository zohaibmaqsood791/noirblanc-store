export interface Product {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  onSale: boolean;
  stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | "ON_BACKORDER";
  image: { sourceUrl: string; altText: string } | null;
  galleryImages: { nodes: { sourceUrl: string; altText: string }[] };
  productCategories: { nodes: { name: string; slug: string }[] };
  variations?: {
    nodes: ProductVariation[];
  };
}

export interface ProductVariation {
  id: string;
  databaseId: number;
  name: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  stockStatus: string;
  attributes: {
    nodes: { name: string; value: string }[];
  };
  image: { sourceUrl: string; altText: string } | null;
}

export interface CartItem {
  key: string;
  product: {
    node: Pick<Product, "id" | "name" | "slug" | "price" | "image">;
  };
  variation?: {
    node: Pick<ProductVariation, "id" | "name" | "price" | "attributes">;
  };
  quantity: number;
  total: string;
}

export interface Cart {
  contents: {
    nodes: CartItem[];
    itemCount: number;
  };
  total: string;
  subtotal: string;
  shippingTotal: string;
  discountTotal: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
  image: { sourceUrl: string; altText: string } | null;
}

export interface CheckoutInput {
  billing: Address;
  shipping: Address;
  shipToDifferentAddress: boolean;
  paymentMethod: string;
  isPaid: boolean;
  transactionId?: string;
}

export interface Address {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}
