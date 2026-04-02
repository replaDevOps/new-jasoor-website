/**
 * apolloClient.ts
 *
 * Apollo Client setup — mirrors OLD frontend src/config/apolloClient.js exactly.
 *
 * - HTTP link with auth header `Bearer <token>` (RFC 6750 standard format — R-08 fix)
 * - WebSocket link for subscriptions
 * - Error link: on 401/auth errors → try refreshAccessToken → retry → logout on failure
 * - Split link: subscriptions → wsLink, all others → authLink + httpLink
 * - InMemoryCache with cache-and-network default
 *
 * Environment variables:
 *   VITE_GRAPHQL_URL  — e.g. https://verify.jusoor-sa.co/graphql
 *   VITE_WS_URL       — e.g. wss://verify.jusoor-sa.co/subscriptions
 */

import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  split,
  gql,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { getAccessToken, clearAuthTokens } from '../utils/tokenManager';
import { refreshAccessToken, registerWSReconnect } from '../utils/tokenRefreshService';

// ─── URLs ─────────────────────────────────────────────────────────────────────

// ── URL Strategy ──────────────────────────────────────────────────────────────
// In production (Vercel), API calls go through /graphql proxy rewrite defined
// in vercel.json — this makes them same-origin, eliminating CORS issues.
// In development, use VITE_GRAPHQL_URL env var to point directly at backend.
const IS_DEV = import.meta.env.DEV;

const GRAPHQL_URL = IS_DEV
  ? (import.meta.env.VITE_GRAPHQL_URL || 'https://verify.jusoor-sa.co/graphql')
  : '/graphql';

const WS_URL = IS_DEV
  ? (import.meta.env.VITE_WS_URL || 'wss://verify.jusoor-sa.co/subscriptions')
  : `wss://${typeof window !== 'undefined' ? window.location.host : ''}/subscriptions`;

// ─── HTTP Link ────────────────────────────────────────────────────────────────

const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
  credentials: 'include',
});

// ─── Auth Link ────────────────────────────────────────────────────────────────
// R-08 FIX: Changed `Bearer${token}` → `Bearer ${token}` (space added).
// RFC 6750 §2.1 requires: Authorization: Bearer <token>
// The no-space format was copied from the old frontend as a placeholder pending
// backend verification. Standard format is now used — if the backend was already
// accepting no-space, it will also accept the standard space format.

const authLink = setContext(async (_, { headers }) => {
  const token = getAccessToken();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// ─── WebSocket Link ───────────────────────────────────────────────────────────
// BUG-31 ⚠️ VERIFY BEFORE GO-LIVE: using `apollo-link-ws` (subscriptions-transport-ws
// protocol). If the backend WebSocket server was built with `graphql-ws` library,
// these two protocols are INCOMPATIBLE — subscriptions will silently never connect.
// HOW TO CHECK: look at the backend server setup. If it uses `graphql-ws` package
// (common in newer Apollo Server 3+), you must switch to:
//   import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
//   import { createClient } from 'graphql-ws';
// If it uses `subscriptions-transport-ws` (older Apollo Server), keep current setup.
// Current setup intentionally mirrors the OLD frontend — but the backend may have
// been upgraded since then.

const createWebSocketLink = () => {
  return new WebSocketLink({
    uri: WS_URL,
    options: {
      reconnect: true,
      connectionParams: () => ({
        authorization: `Bearer ${getAccessToken() || ''}`,
      }),
    },
  });
};

let wsLink = createWebSocketLink();

const reconnectWebSocket = () => {
  try {
    if ((wsLink as any)?.subscriptionManager?.client) {
      (wsLink as any).subscriptionManager.client.close(true);
    }
    wsLink = createWebSocketLink();
  } catch (error) {
    console.error('⚠️ Error reconnecting WebSocket:', error);
  }
};

registerWSReconnect(reconnectWebSocket);

// ─── Split Link ───────────────────────────────────────────────────────────────

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink as any,
  authLink.concat(httpLink)
);

// ─── Error Link ───────────────────────────────────────────────────────────────

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      console.error('[GraphQL Error]:', err.message);

      const isAuthError =
        err.message?.includes('Invalid or expired token') ||
        err.message?.includes('Invalid token or authentication failed') ||
        err.message?.includes('jwt expired') ||
        err.message?.includes('Context creation failed') ||
        err.message?.includes('Authentication required') ||
        err.message?.includes('Please provide a valid token') ||
        err.extensions?.code === 'UNAUTHENTICATED';

      if (isAuthError) {
        return new Promise((resolve) => {
          refreshAccessToken()
            .then((newToken) => {
              if (newToken) {
                const oldHeaders = operation.getContext().headers;
                operation.setContext({
                  headers: {
                    ...oldHeaders,
                    authorization: `Bearer ${newToken}`,
                  },
                });
                resolve(forward(operation));
              } else {
                clearAuthTokens();
                if (window.location.href.indexOf('/signin') === -1) {
                  // Dispatch a custom event so AppContext can react
                  window.dispatchEvent(new CustomEvent('auth:logout'));
                }
                resolve(undefined);
              }
            })
            .catch(() => {
              clearAuthTokens();
              window.dispatchEvent(new CustomEvent('auth:logout'));
              resolve(undefined);
            });
        }) as any;
      }

      if (err.extensions?.code === 'FORBIDDEN') {
        console.error('Access forbidden:', err.message);
      }
    }
  }

  if (networkError) {
    console.error('[Network Error]:', networkError);
    const status = (networkError as any).statusCode;
    if (status === 401 || status === 403) {
      return new Promise((resolve) => {
        refreshAccessToken()
          .then((newToken) => {
            if (newToken) {
              resolve(forward(operation));
            } else {
              clearAuthTokens();
              window.dispatchEvent(new CustomEvent('auth:logout'));
              resolve(undefined);
            }
          })
          .catch(() => {
            clearAuthTokens();
            window.dispatchEvent(new CustomEvent('auth:logout'));
            resolve(undefined);
          });
      }) as any;
    }
  }
});

// ─── Apollo Client ────────────────────────────────────────────────────────────

export const client = new ApolloClient({
  link: from([errorLink, splitLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

// ─── Cache Utilities ──────────────────────────────────────────────────────────

/**
 * Evict a specific query from the Apollo cache and run GC.
 * Mirrors OLD frontend src/config/clearQueryCache.js exactly.
 */
export function clearQueryCache(queryField: string, objectPrefix?: string): void {
  if (!client || !queryField) return;

  try {
    if (objectPrefix) {
      const allCache = client.cache.extract();
      Object.keys(allCache).forEach((key) => {
        if (key.startsWith(`${objectPrefix}:`)) {
          client.cache.evict({ id: key });
        }
      });
    }
    client.cache.evict({ id: 'ROOT_QUERY', fieldName: queryField });
    client.cache.gc();
  } catch (error) {
    console.error(`[Cache] Failed to clear "${queryField}":`, error);
  }
}

// Re-export gql so consumers can import it from here
export { gql };
