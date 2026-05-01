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
  Observable,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from '@apollo/client/utilities';
import { getAccessToken, clearAuthTokens } from '../utils/tokenManager';
import { refreshAccessToken, registerWSReconnect } from '../utils/tokenRefreshService';

const GRAPHQL_URL: string = import.meta.env.VITE_GRAPHQL_URL || 'https://verify.jusoor-sa.co/graphql';
const WS_URL: string     = import.meta.env.VITE_WS_URL     || 'wss://verify.jusoor-sa.co/subscriptions';

// Warn on staging/preview builds where env vars are missing — they will silently
// hit production data. This is intentional for production but not for PR previews.
if (!import.meta.env.VITE_GRAPHQL_URL && !import.meta.env.PROD) {
  console.warn(
    '[apolloClient] VITE_GRAPHQL_URL is not set — falling back to production API.\n' +
    'Set VITE_GRAPHQL_URL in your environment to avoid hitting live data on preview builds.'
  );
}

const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
  credentials: 'include',
});

const authLink = setContext(async (_, { headers }) => {
  const token = getAccessToken();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

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
    console.error('Error reconnecting WebSocket:', error);
  }
};

registerWSReconnect(reconnectWebSocket);

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
        return new Observable((observer) => {
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
                forward(operation).subscribe({
                  next: observer.next.bind(observer),
                  error: observer.error.bind(observer),
                  complete: observer.complete.bind(observer),
                });
              } else {
                clearAuthTokens();
                if (window.location.href.indexOf('/signin') === -1) {
                  window.dispatchEvent(new CustomEvent('auth:logout'));
                }
                observer.complete();
              }
            })
            .catch(() => {
              clearAuthTokens();
              window.dispatchEvent(new CustomEvent('auth:logout'));
              observer.complete();
            });
        });
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
      return new Observable((observer) => {
        refreshAccessToken()
          .then((newToken) => {
            if (newToken) {
              forward(operation).subscribe({
                next: observer.next.bind(observer),
                error: observer.error.bind(observer),
                complete: observer.complete.bind(observer),
              });
            } else {
              clearAuthTokens();
              window.dispatchEvent(new CustomEvent('auth:logout'));
              observer.complete();
            }
          })
          .catch(() => {
            clearAuthTokens();
            window.dispatchEvent(new CustomEvent('auth:logout'));
            observer.complete();
          });
      });
    }
  }
});

export const client = new ApolloClient({
  link: from([errorLink, splitLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network', errorPolicy: 'all' },
    query: { fetchPolicy: 'network-only', errorPolicy: 'all' },
    mutate: { errorPolicy: 'all' },
  },
});

export function clearQueryCache(queryField, objectPrefix) {
  if (!client || !queryField) return;
  try {
    if (objectPrefix) {
      const allCache = client.cache.extract();
      Object.keys(allCache).forEach((key) => {
        if (key.startsWith(`${objectPrefix}:`)) client.cache.evict({ id: key });
      });
    }
    client.cache.evict({ id: 'ROOT_QUERY', fieldName: queryField });
    client.cache.gc();
  } catch (error) {
    console.error(`[Cache] Failed to clear "${queryField}":`, error);
  }
}

export { gql };
