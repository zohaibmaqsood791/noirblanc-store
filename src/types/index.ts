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
  sku?: string;
  stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | "ON_BACKORDER";
  image: { databaseId: number; sourceUrl: string; altText: string } | null;
  galleryImages: { nodes: { databaseId: number; sourceUrl: string; altText: string }[] };
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
  sku?: string;
  attributes: {
    nodes: { name: string; value: string }[];
  };
  image: { databaseId: number; sourceUrl: string; altText: string } | null;
}

export interface CartItem {
  key: string;
  product: {
    node: Pick<Product, "id" | "databaseId" | "name" | "slug" | "price" | "image" | "productCategories"> & {
      regularPrice?: string;
      salePrice?: string;
      sku?: string;
    };
  };
  variation?: {
    node: Pick<ProductVariation, "id" | "databaseId" | "name" | "price" | "attributes"> & {
      image?: { sourceUrl: string; altText: string } | null;
      regularPrice?: string;
      salePrice?: string;
      sku?: string;
    };
  };
  quantity: number;
  total: string;
}

export interface ShippingRate {
  id: string;
  cost: string;
  label: string;
  methodId: string;
}

export interface Cart {
  contents: {
    nodes: CartItem[];
    itemCount: number;
  };
  total: string;
  subtotal: string;
  shippingTotal: string;
  feeTotal: string;
  discountTotal: string;
  appliedCoupons?: { code: string; discountAmount: string }[];
  availableShippingMethods?: { packageDetails: string; rates: ShippingRate[] }[];
  chosenShippingMethods?: string[];
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
