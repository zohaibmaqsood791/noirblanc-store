const GQL = "/api/graphql";

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  authToken: string;
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(GQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `mutation Login($username: String!, $password: String!) {
        login(input: {
          provider: PASSWORD
          credentials: { username: $username, password: $password }
        }) {
          authToken
          user {
            id
            email
            firstName
            lastName
          }
        }
      }`,
      variables: { username: email, password },
    }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || "Login failed");

  const { authToken, user } = json.data.login;
  return { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, authToken };
}

export async function registerUser(input: {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<AuthUser> {
  const res = await fetch(GQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `mutation Register($input: RegisterCustomerInput!) {
        registerCustomer(input: $input) {
          customer {
            id
            email
            firstName
            lastName
          }
        }
      }`,
      variables: {
        input: {
          username: input.username,
          email: input.email,
          password: input.password,
          firstName: input.firstName,
          lastName: input.lastName,
        },
      },
    }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || "Registration failed");

  // Auto-login after register to get authToken
  return loginUser(input.email, input.password);
}

export async function getCustomerOrders(authToken: string) {
  const res = await fetch(GQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      query: `query GetCustomerOrders {
        customer {
          orders(first: 20) {
            nodes {
              id
              orderNumber
              date
              status
              total
              lineItems {
                nodes {
                  product { node { name } }
                  quantity
                }
              }
            }
          }
        }
      }`,
    }),
  });
  const json = await res.json();
  if (json.errors) return [];
  return json.data?.customer?.orders?.nodes || [];
}

export async function getCustomerProfile(authToken: string) {
  const res = await fetch(GQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      query: `query GetCustomer {
        customer {
          id
          email
          firstName
          lastName
          billing { phone address1 address2 city state postcode country }
          shipping { address1 address2 city state postcode country }
        }
      }`,
    }),
  });
  const json = await res.json();
  if (json.errors) return null;
  return json.data?.customer || null;
}
