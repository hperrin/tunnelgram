import { writable } from 'svelte/store';

export * from './userStores';

export const todos = writable([]);
export const sort = writable('name');
export const archived = writable(false);
