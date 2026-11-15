/**
 * Wishlist Management Module
 * Handles temporary sessionStorage persistence, duplicate prevention,
 * and UI synchronization across menu cards, detail modal, and wishlist view.
 */

const WishlistManager = (() => {
  const STORAGE_KEY = "uttsah_cafe_wishlist_v1";

  function getWishlistIds() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? [...new Set(parsed)] : [];
    } catch (error) {
      console.error("Failed to read wishlist from sessionStorage:", error);
      return [];
    }
  }

  function saveWishlistIds(ids) {
    try {
      const uniqueIds = [...new Set(ids)];
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueIds));
    } catch (error) {
      console.error("Failed to save wishlist to sessionStorage:", error);
    }
  }

  function isWishlisted(itemId) {
    return getWishlistIds().includes(itemId);
  }

  function addItem(itemId) {
    const ids = getWishlistIds();
    if (ids.includes(itemId)) {
      return false;
    }
    ids.push(itemId);
    saveWishlistIds(ids);
    return true;
  }

  function removeItem(itemId) {
    const ids = getWishlistIds();
    const updated = ids.filter((id) => id !== itemId);
    if (updated.length === ids.length) {
      return false;
    }
    saveWishlistIds(updated);
    return true;
  }

  function toggleItem(itemId) {
    if (isWishlisted(itemId)) {
      removeItem(itemId);
      return false;
    } else {
      addItem(itemId);
      return true;
    }
  }

  function clearAll() {
    saveWishlistIds([]);
  }

  function getWishlistedItems(allMenuItems) {
    const ids = getWishlistIds();
    return ids
      .map((id) => allMenuItems.find((item) => item.id === id))
      .filter(Boolean);
  }

  return {
    getWishlistIds,
    isWishlisted,
    addItem,
    removeItem,
    toggleItem,
    clearAll,
    getWishlistedItems
  };
})();
