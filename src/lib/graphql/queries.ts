import { gql } from "graphql-request";

export const PRODUCT_FRAGMENT = gql`
  fragment ProductFields on Product {
    id
    databaseId
    name
    slug
    description
    shortDescription
    onSale
    image {
      databaseId
      sourceUrl
      altText
    }
    galleryImages(first: 100) {
      nodes {
        databaseId
        sourceUrl
        altText
      }
    }
    productCategories {
      nodes {
        name
        slug
      }
    }
    ... on SimpleProduct {
      price
      regularPrice
      salePrice
      stockStatus
      sku
    }
    ... on VariableProduct {
      price
      regularPrice
      salePrice
      stockStatus
      sku
      variations {
        nodes {
          id
          databaseId
          name
          price
          regularPrice
          salePrice
          stockStatus
          sku
          attributes {
            nodes {
              name
              value
            }
          }
          image {
            databaseId
            sourceUrl
            altText
          }
        }
      }
    }
  }
`;

export const GET_PRODUCTS = gql`
  ${PRODUCT_FRAGMENT}
  query GetProducts($first: Int, $after: String, $category: String) {
    products(
      first: $first
      after: $after
      where: { category: $category, status: "publish" }
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ...ProductFields
      }
    }
  }
`;

export const GET_PRODUCT_BY_SLUG = gql`
  ${PRODUCT_FRAGMENT}
  query GetProductBySlug($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      ...ProductFields
    }
  }
`;

export const GET_PRODUCTS_BY_SEARCH = gql`
  ${PRODUCT_FRAGMENT}
  query GetProductsBySearch($search: String!, $first: Int) {
    products(first: $first, where: { search: $search, status: "publish" }) {
      nodes {
        ...ProductFields
      }
    }
  }
`;

export const GET_CATEGORIES = gql`
  query GetCategories {
    productCategories(where: { hideEmpty: true }) {
      nodes {
        id
        name
        slug
        count
        image {
          sourceUrl
          altText
        }
      }
    }
  }
`;

export const GET_CART = gql`
  query GetCart {
    cart {
      contents {
        nodes {
          key
          quantity
          total
          product {
            node {
              id
              databaseId
              name
              slug
              image { sourceUrl altText }
              ... on SimpleProduct { price regularPrice salePrice }
              ... on VariableProduct { price regularPrice salePrice }
              productCategories { nodes { slug } }
            }
          }
          variation {
            node {
              id
              databaseId
              name
              price
              regularPrice
              salePrice
              image { sourceUrl altText }
              attributes { nodes { name value } }
            }
          }
        }
        itemCount
      }
      total
      subtotal
      shippingTotal
      feeTotal
      discountTotal
      appliedCoupons { code discountAmount }
      availableShippingMethods {
        packageDetails
        rates { id cost label methodId }
      }
      chosenShippingMethods
    }
  }
`;

export const CART_FIELDS = gql`
  fragment CartFields on Cart {
    contents {
      nodes {
        key
        quantity
        total
        product {
          node {
            id
            databaseId
            name
            slug
            image { sourceUrl altText }
            ... on SimpleProduct { price regularPrice salePrice }
            ... on VariableProduct { price regularPrice salePrice }
            productCategories { nodes { slug } }
          }
        }
        variation {
          node {
            id
            databaseId
            name
            price
            attributes { nodes { name value } }
            image { sourceUrl altText }
            regularPrice
            salePrice
          }
        }
      }
      itemCount
    }
    total
    subtotal
    shippingTotal
    feeTotal
    discountTotal
    appliedCoupons {
      code
      discountAmount
    }
    availableShippingMethods {
      packageDetails
      rates {
        id
        cost
        label
        methodId
      }
    }
    chosenShippingMethods
  }
`;

export const APPLY_COUPON = gql`
  ${CART_FIELDS}
  mutation ApplyCoupon($code: String!) {
    applyCoupon(input: { code: $code }) {
      cart { ...CartFields }
    }
  }
`;

export const REMOVE_COUPON = gql`
  ${CART_FIELDS}
  mutation RemoveCoupon($code: String!) {
    removeCoupons(input: { codes: [$code] }) {
      cart { ...CartFields }
    }
  }
`;

export const UPDATE_SHIPPING_METHOD = gql`
  ${CART_FIELDS}
  mutation UpdateShippingMethod($shippingMethods: [String]) {
    updateShippingMethod(input: { shippingMethods: $shippingMethods }) {
      cart { ...CartFields }
    }
  }
`;

export const UPDATE_CUSTOMER_SHIPPING = gql`
  ${CART_FIELDS}
  mutation UpdateCustomerShipping($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      customer {
        shipping {
          address1
          city
          state
          postcode
          country
        }
      }
    }
  }
  query GetCartAfterAddressUpdate {
    cart { ...CartFields }
  }
`;

export const ADD_TO_CART = gql`
  ${CART_FIELDS}
  mutation AddToCart($productId: Int!, $quantity: Int!, $variationId: Int) {
    addToCart(
      input: {
        productId: $productId
        quantity: $quantity
        variationId: $variationId
      }
    ) {
      cart { ...CartFields }
    }
  }
`;

export const UPDATE_CART_ITEM = gql`
  ${CART_FIELDS}
  mutation UpdateCartItem($key: ID!, $quantity: Int!) {
    updateItemQuantities(input: { items: [{ key: $key, quantity: $quantity }] }) {
      cart { ...CartFields }
    }
  }
`;

export const REMOVE_FROM_CART = gql`
  ${CART_FIELDS}
  mutation RemoveFromCart($keys: [ID]!) {
    removeItemsFromCart(input: { keys: $keys }) {
      cart { ...CartFields }
    }
  }
`;

export const CHECKOUT = gql`
  mutation Checkout($input: CheckoutInput!) {
    checkout(input: $input) {
      order {
        id
        databaseId
        orderNumber
        status
        total
      }
      result
      redirect
    }
  }
`;
