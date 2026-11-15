/**
 * Main Application Logic for Digital Menu Website
 * Handles dynamic UI rendering, category filtering, item detail view,
 * and wishlist view transitions without page reloads.
 */

document.addEventListener("DOMContentLoaded", () => {
  // Application State
  const state = {
    activeCategory: "All Items",
    activeView: "menu", // 'menu' | 'wishlist'
    selectedItem: null
  };

  // DOM References
  const elements = {
    cafeLogo: document.getElementById("cafe-logo"),
    categoryPillsContainer: document.getElementById("category-pills"),
    menuGrid: document.getElementById("menu-grid"),
    menuSection: document.getElementById("menu-section"),
    wishlistSection: document.getElementById("wishlist-section"),
    wishlistGrid: document.getElementById("wishlist-grid"),
    wishlistBadge: document.getElementById("wishlist-badge"),
    wishlistTotalCount: document.getElementById("wishlist-total-count"),
    wishlistTotalPrice: document.getElementById("wishlist-total-price"),
    openWishlistBtn: document.getElementById("open-wishlist-btn"),
    backToMenuBtn: document.getElementById("back-to-menu-btn"),
    clearWishlistBtn: document.getElementById("clear-wishlist-btn"),
    sectionTitle: document.getElementById("active-section-title"),
    itemCountLabel: document.getElementById("item-count-label"),
    // Detail Modal Elements
    detailModal: document.getElementById("item-detail-modal"),
    modalCloseBtn: document.getElementById("modal-close-btn"),
    modalImage: document.getElementById("modal-item-image"),
    modalVegBadge: document.getElementById("modal-veg-badge"),
    modalPopularBadge: document.getElementById("modal-popular-badge"),
    modalCategory: document.getElementById("modal-item-category"),
    modalTitle: document.getElementById("modal-item-title"),
    modalDesc: document.getElementById("modal-item-desc"),
    modalPrice: document.getElementById("modal-item-price"),
    modalWishlistBtn: document.getElementById("modal-wishlist-btn"),
    toastContainer: document.getElementById("toast-container")
  };

  /**
   * Initialize Cafe Logo from menu-data.js
   */
  function initCafeProfile() {
    if (typeof CAFE_PROFILE === "undefined") return;
    if (CAFE_PROFILE.logo && elements.cafeLogo) {
      elements.cafeLogo.src = CAFE_PROFILE.logo;
      elements.cafeLogo.alt = `${CAFE_PROFILE.name} Logo`;
    }
    document.title = `${CAFE_PROFILE.name} — Digital Menu`;
  }

  /**
   * Render Category Filter Pills dynamically
   */
  function renderCategories() {
    elements.categoryPillsContainer.innerHTML = "";

    MENU_CATEGORIES.forEach((category) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `category-pill ${state.activeCategory === category ? "active" : ""}`;
      btn.textContent = category;
      btn.setAttribute("aria-pressed", state.activeCategory === category);

      btn.addEventListener("click", () => {
        state.activeCategory = category;
        if (state.activeView !== "menu") {
          switchView("menu");
        }
        renderCategories();
        renderMenuGrid();
      });

      elements.categoryPillsContainer.appendChild(btn);
    });
  }

  /**
   * Filter menu items by active category
   * @returns {Array}
   */
  function getFilteredItems() {
    return MENU_ITEMS.filter((item) => {
      return state.activeCategory === "All Items" || item.category === state.activeCategory;
    });
  }

  /**
   * Format price in Indian Rupees
   * @param {number} price
   * @returns {string}
   */
  function formatPrice(price) {
    return `${CAFE_PROFILE.currency}${Number(price).toLocaleString("en-IN")}`;
  }

  /**
   * Create a single Food Card DOM element matching the clean circular plate UI
   * @param {Object} item
   * @param {boolean} isWishlistContext
   * @returns {HTMLElement}
   */
  function createFoodCard(item, isWishlistContext = false) {
    const wishlisted = WishlistManager.isWishlisted(item.id);

    const card = document.createElement("article");
    card.className = "food-card";
    card.dataset.id = item.id;

    // Circular overhanging plate image wrapper
    const imageWrapper = document.createElement("div");
    imageWrapper.className = "food-card-plate";
    imageWrapper.setAttribute("role", "button");
    imageWrapper.setAttribute("tabindex", "0");
    imageWrapper.setAttribute("aria-label", `View details for ${item.name}`);

    const img = document.createElement("img");
    img.src = item.image || "assets/food/default.svg";
    img.alt = item.name;
    img.loading = "lazy";
    img.onerror = function () {
      this.onerror = null;
      this.src = "assets/food/default.svg";
    };
    imageWrapper.appendChild(img);

    // Card content body
    const body = document.createElement("div");
    body.className = "food-card-body";

    // Top row: Veg/Non-veg indicator + Optional Bestseller badge
    const metaRow = document.createElement("div");
    metaRow.className = "food-card-meta";

    const vegIndicator = document.createElement("span");
    vegIndicator.className = `diet-indicator ${item.isVeg ? "veg" : "non-veg"}`;
    vegIndicator.title = item.isVeg ? "Vegetarian" : "Non-Vegetarian";
    vegIndicator.innerHTML = `<span class="diet-dot"></span>`;
    metaRow.appendChild(vegIndicator);

    if (item.isPopular) {
      const popBadge = document.createElement("span");
      popBadge.className = "popular-badge";
      popBadge.textContent = "Bestseller";
      metaRow.appendChild(popBadge);
    }

    const title = document.createElement("h3");
    title.className = "food-card-title";
    title.textContent = item.name;

    const desc = document.createElement("p");
    desc.className = "food-card-desc";
    desc.textContent = item.description || "Freshly prepared at Uttsah By Sachika.";

    // Bottom row: Price + Green pill Wishlist CTA
    const footer = document.createElement("div");
    footer.className = "food-card-footer";

    const priceEl = document.createElement("span");
    priceEl.className = "food-card-price";
    priceEl.textContent = formatPrice(item.price);

    const actionBtn = document.createElement("button");
    actionBtn.type = "button";
    actionBtn.className = `wishlist-pill-btn ${wishlisted ? "saved" : ""}`;
    actionBtn.setAttribute("aria-pressed", wishlisted);
    actionBtn.innerHTML = isWishlistContext
      ? `<span class="btn-icon">✕</span> Remove`
      : wishlisted
      ? `<span class="btn-icon">♥</span> Saved`
      : `<span class="btn-icon">♡</span> Save`;

    actionBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      handleWishlistToggle(item);
    });

    footer.appendChild(priceEl);
    footer.appendChild(actionBtn);

    body.appendChild(metaRow);
    body.appendChild(title);
    body.appendChild(desc);
    body.appendChild(footer);

    card.appendChild(imageWrapper);
    card.appendChild(body);

    // Open item detail modal on card click
    const openDetails = () => openItemModal(item);
    card.addEventListener("click", openDetails);
    imageWrapper.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDetails();
      }
    });

    return card;
  }

  /**
   * Render Main Menu Grid or Empty Category State
   */
  function renderMenuGrid() {
    const items = getFilteredItems();
    elements.sectionTitle.textContent = state.activeCategory;
    elements.itemCountLabel.textContent = `${items.length} ${items.length === 1 ? "item" : "items"}`;
    elements.menuGrid.innerHTML = "";

    if (items.length === 0) {
      const emptyBox = document.createElement("div");
      emptyBox.className = "empty-state-card";
      emptyBox.innerHTML = `
        <div class="empty-state-icon">🍽️</div>
        <h3>No items available in "${state.activeCategory}"</h3>
        <p>This category is currently not listed on the cafe's verified menu.</p>
        <button type="button" class="primary-pill-btn" id="reset-filter-btn">Explore All Items</button>
      `;
      elements.menuGrid.appendChild(emptyBox);

      const resetBtn = document.getElementById("reset-filter-btn");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          state.activeCategory = "All Items";
          renderCategories();
          renderMenuGrid();
        });
      }
      return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      fragment.appendChild(createFoodCard(item, false));
    });
    elements.menuGrid.appendChild(fragment);
  }

  /**
   * Render Dedicated Wishlist View
   */
  function renderWishlistView() {
    const savedItems = WishlistManager.getWishlistedItems(MENU_ITEMS);
    elements.wishlistGrid.innerHTML = "";

    const totalAmount = savedItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
    elements.wishlistTotalCount.textContent = `${savedItems.length} ${savedItems.length === 1 ? "Item" : "Items"}`;
    elements.wishlistTotalPrice.textContent = formatPrice(totalAmount);
    elements.clearWishlistBtn.hidden = savedItems.length === 0;

    if (savedItems.length === 0) {
      const emptyBox = document.createElement("div");
      emptyBox.className = "empty-state-card";
      emptyBox.innerHTML = `
        <div class="empty-state-icon">🛍️</div>
        <h3>Your Wishlist is Empty</h3>
        <p>Tap "Save" on any dish from the menu to shortlist your favourites for this session.</p>
        <button type="button" class="primary-pill-btn" id="empty-wishlist-browse-btn">Browse Menu</button>
      `;
      elements.wishlistGrid.appendChild(emptyBox);

      const browseBtn = document.getElementById("empty-wishlist-browse-btn");
      if (browseBtn) {
        browseBtn.addEventListener("click", () => switchView("menu"));
      }
      return;
    }

    const fragment = document.createDocumentFragment();
    savedItems.forEach((item) => {
      fragment.appendChild(createFoodCard(item, true));
    });
    elements.wishlistGrid.appendChild(fragment);
  }

  /**
   * Update Wishlist Badge counter in header
   */
  function updateWishlistBadge(animatePop = false) {
    const count = WishlistManager.getWishlistIds().length;
    elements.wishlistBadge.textContent = count;
    elements.wishlistBadge.classList.toggle("has-items", count > 0);

    if (animatePop && elements.openWishlistBtn) {
      elements.openWishlistBtn.classList.remove("pop-animate");
      void elements.openWishlistBtn.offsetWidth; // trigger reflow
      elements.openWishlistBtn.classList.add("pop-animate");
    }
  }

  /**
   * Handle adding/removing item from wishlist & syncing all views
   * @param {Object} item
   */
  function handleWishlistToggle(item) {
    const added = WishlistManager.toggleItem(item.id);
    updateWishlistBadge(true);

    if (state.activeView === "menu") {
      renderMenuGrid();
    } else {
      renderWishlistView();
    }

    if (state.selectedItem && state.selectedItem.id === item.id) {
      syncModalWishlistButton(item.id);
    }

    showToast(
      added
        ? `Added "${item.name}" to your wishlist`
        : `Removed "${item.name}" from your wishlist`
    );
  }

  /**
   * Switch between Main Menu View and Wishlist View
   * @param {'menu' | 'wishlist'} viewName
   */
  function switchView(viewName) {
    state.activeView = viewName;
    if (viewName === "wishlist") {
      elements.menuSection.hidden = true;
      elements.wishlistSection.hidden = false;
      renderWishlistView();
    } else {
      elements.wishlistSection.hidden = true;
      elements.menuSection.hidden = false;
      renderMenuGrid();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /**
   * Open Food Detail Sheet / Modal
   * @param {Object} item
   */
  function openItemModal(item) {
    state.selectedItem = item;
    elements.modalImage.src = item.image || "assets/food/default.svg";
    elements.modalImage.alt = item.name;
    elements.modalImage.onerror = function () {
      this.onerror = null;
      this.src = "assets/food/default.svg";
    };

    elements.modalVegBadge.className = `diet-indicator ${item.isVeg ? "veg" : "non-veg"}`;
    elements.modalPopularBadge.hidden = !item.isPopular;
    elements.modalCategory.textContent = item.subCategory
      ? `${item.category} • ${item.subCategory}`
      : item.category;
    elements.modalTitle.textContent = item.name;
    elements.modalDesc.textContent = item.description;
    elements.modalPrice.textContent = formatPrice(item.price);

    syncModalWishlistButton(item.id);
    elements.detailModal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function syncModalWishlistButton(itemId) {
    const saved = WishlistManager.isWishlisted(itemId);
    elements.modalWishlistBtn.className = `primary-pill-btn modal-cta ${saved ? "saved" : ""}`;
    elements.modalWishlistBtn.innerHTML = saved
      ? `✓ Saved in Wishlist`
      : `♡ Save to Wishlist`;
  }

  function closeItemModal() {
    elements.detailModal.hidden = true;
    state.selectedItem = null;
    document.body.style.overflow = "";
  }

  /**
   * Show subtle non-intrusive feedback toast
   * @param {string} message
   */
  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.textContent = message;
    elements.toastContainer.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("visible"));
    setTimeout(() => {
      toast.classList.remove("visible");
      setTimeout(() => toast.remove(), 250);
    }, 2200);
  }

  // Event Listeners
  /**
   * Make Floating Wishlist Button freely draggable anywhere on screen (Mouse & Touch)
   * Starts at middle-right of the screen; opens/closes wishlist on tap/click.
   */
  (function initDraggableWishlistButton() {
    const btn = elements.openWishlistBtn;
    if (!btn) return;

    let isDragging = false;
    let hasMoved = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    btn.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      isDragging = true;
      hasMoved = false;

      const rect = btn.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = rect.left;
      initialTop = rect.top;

      // Switch from initial right/top% anchoring to exact left/top coordinates
      btn.style.left = `${initialLeft}px`;
      btn.style.top = `${initialTop}px`;
      btn.style.right = "auto";
      btn.style.transform = "none";

      btn.setPointerCapture(e.pointerId);
    });

    btn.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasMoved = true;
        btn.classList.add("dragging");
      }

      if (hasMoved) {
        const maxLeft = window.innerWidth - btn.offsetWidth - 8;
        const maxTop = window.innerHeight - btn.offsetHeight - 8;
        const nextLeft = Math.min(Math.max(8, initialLeft + dx), maxLeft);
        const nextTop = Math.min(Math.max(8, initialTop + dy), maxTop);

        btn.style.left = `${nextLeft}px`;
        btn.style.top = `${nextTop}px`;
      }
    });

    const endDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      btn.classList.remove("dragging");
      if (btn.hasPointerCapture(e.pointerId)) {
        btn.releasePointerCapture(e.pointerId);
      }
    };

    btn.addEventListener("pointerup", endDrag);
    btn.addEventListener("pointercancel", endDrag);

    btn.addEventListener("click", (e) => {
      if (hasMoved) {
        e.preventDefault();
        e.stopImmediatePropagation();
        hasMoved = false;
        return;
      }
      switchView(state.activeView === "wishlist" ? "menu" : "wishlist");
    });

    // Keep button inside viewport if screen is resized
    window.addEventListener("resize", () => {
      if (btn.style.left) {
        const maxLeft = window.innerWidth - btn.offsetWidth - 8;
        const maxTop = window.innerHeight - btn.offsetHeight - 8;
        btn.style.left = `${Math.min(Math.max(8, parseFloat(btn.style.left)), maxLeft)}px`;
        btn.style.top = `${Math.min(Math.max(8, parseFloat(btn.style.top)), maxTop)}px`;
      }
    });
  })();

  elements.backToMenuBtn.addEventListener("click", () => {
    switchView("menu");
  });

  elements.clearWishlistBtn.addEventListener("click", () => {
    WishlistManager.clearAll();
    updateWishlistBadge();
    renderWishlistView();
    showToast("Wishlist cleared");
  });

  elements.modalCloseBtn.addEventListener("click", closeItemModal);
  elements.detailModal.addEventListener("click", (e) => {
    if (e.target === elements.detailModal) {
      closeItemModal();
    }
  });

  elements.modalWishlistBtn.addEventListener("click", () => {
    if (state.selectedItem) {
      handleWishlistToggle(state.selectedItem);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !elements.detailModal.hidden) {
      closeItemModal();
    }
  });

  // Boot Application
  initCafeProfile();
  renderCategories();
  renderMenuGrid();
  updateWishlistBadge();
});
