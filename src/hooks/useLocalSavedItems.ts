// Local storage management for saved items when user is not logged in
const LOCAL_SAVED_ITEMS_KEY = 'local_saved_items';

export interface LocalSavedItem {
  item_id: string;
  item_type: string;
  saved_at: string;
}

export const getLocalSavedItems = (): LocalSavedItem[] => {
  try {
    const stored = localStorage.getItem(LOCAL_SAVED_ITEMS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveItemLocally = (itemId: string, itemType: string): void => {
  const items = getLocalSavedItems();
  const exists = items.some(item => item.item_id === itemId);
  
  if (!exists) {
    items.push({
      item_id: itemId,
      item_type: itemType.toLowerCase(),
      saved_at: new Date().toISOString()
    });
    localStorage.setItem(LOCAL_SAVED_ITEMS_KEY, JSON.stringify(items));
  }
};

export const removeItemLocally = (itemId: string): void => {
  const items = getLocalSavedItems();
  const filtered = items.filter(item => item.item_id !== itemId);
  localStorage.setItem(LOCAL_SAVED_ITEMS_KEY, JSON.stringify(filtered));
};

export const isItemSavedLocally = (itemId: string): boolean => {
  const items = getLocalSavedItems();
  return items.some(item => item.item_id === itemId);
};

export const clearLocalSavedItems = (): void => {
  localStorage.removeItem(LOCAL_SAVED_ITEMS_KEY);
};

export const getLocalSavedItemIds = (): Set<string> => {
  const items = getLocalSavedItems();
  return new Set(items.map(item => item.item_id));
};
