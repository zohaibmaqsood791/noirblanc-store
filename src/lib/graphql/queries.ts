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
      sourceUrl
      altText
    }
    galleryImages {
      nodes {
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
    }
    ... on VariableProduct {
      price
      regularPrice
      salePrice
      stockStatus
      variations {
        nodes {
          id
          databaseId
          name
          price
          regularPrice
          salePrice
          stockStatus
          attributes {
            nodes {
              name
              value
            }
          }
          image {
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
              name
              slug
              image {
                sourceUrl
                altText
              }
              ... on SimpleProduct {
                price
              }
              ... on VariableProduct {
                price
              }
            }
          }
          variation {
            node {
              id
              name
              price
              attributes {
                nodes {
                  name
                  value
                }
              }
            }
          }
        }
        itemCount
      }
      total
      subtotal
      shippingTotal
      discountTotal
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
            name
            slug
            image { sourceUrl altText }
            ... on SimpleProduct { price }
            ... on VariableProduct { price }
          }
        }
        variation {
          node {
            id
            name
            price
            attributes { nodes { name value } }
          }
        }
      }
      itemCount
    }
    total
    subtotal
    shippingTotal
    discountTotal
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
