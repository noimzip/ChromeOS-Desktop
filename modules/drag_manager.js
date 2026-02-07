/**
 * Soul Widgets Manager - Drag & Drop Manager
 */

'use strict';

window.DragManager = {
  // グリッド設定（desktop.jsと同期が必要）
  GRID_SIZE_X: 80,
  GRID_SIZE_Y: 90,
  GRID_OFFSET: 20,
  OVERLAP_THRESHOLD: 800,

  /**
   * 値をグリッドにスナップさせる
   */
  snapToGrid(value, axis = 'x') {
    const size = axis === 'y' ? this.GRID_SIZE_Y : this.GRID_SIZE_X;
    return Math.round((value - this.GRID_OFFSET) / size) * size + this.GRID_OFFSET;
  },

  /**
   * 2つの要素の重なり面積を計算
   */
  calculateOverlapArea(rect1, rect2) {
    const overlapX = Math.max(0, Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left));
    const overlapY = Math.max(0, Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top));
    return overlapX * overlapY;
  },

  /**
   * アイコンの矩形情報をキャッシュする
   */
  cacheIconRects(excludeEl) {
    window.cachedIconRects = [];
    document.querySelectorAll('.appicon:not(.folder)').forEach(el => {
      if (el !== excludeEl && el.style.display !== 'none') {
        window.cachedIconRects.push({ element: el, rect: el.getBoundingClientRect() });
      }
    });
    window.cachedFolderRects = [];
    document.querySelectorAll('.appicon.folder').forEach(el => {
      if (el !== excludeEl && el.style.display !== 'none') {
        window.cachedFolderRects.push({ element: el, rect: el.getBoundingClientRect() });
      }
    });
  },

  /**
   * 重なっているアイコンを検出
   */
  getOverlappingIcon(draggedEl) {
    const draggedRect = draggedEl.getBoundingClientRect();
    if (window.cachedIconRects) {
      for (const item of window.cachedIconRects) {
        const overlapArea = this.calculateOverlapArea(draggedRect, item.rect);
        if (overlapArea > this.OVERLAP_THRESHOLD) return item.element;
      }
    }
    return null;
  },

  /**
   * 重なっているフォルダーを検出
   */
  getOverlappingFolder(draggedEl) {
    const draggedRect = draggedEl.getBoundingClientRect();
    if (window.cachedFolderRects) {
      for (const item of window.cachedFolderRects) {
        const overlapArea = this.calculateOverlapArea(draggedRect, item.rect);
        if (overlapArea > this.OVERLAP_THRESHOLD) return item.element;
      }
    }
    return null;
  },

  /**
   * 指定された位置で他の要素と重なるかチェック
   */
  isOverlappingAny(element, x, y) {
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    const margin = 2;
    const rect1 = {
      left: x + margin, top: y + margin,
      right: x + width - margin, bottom: y + height - margin
    };
    
    const allItems = document.querySelectorAll('.appicon, .widget');
    for (const item of allItems) {
      if (item === element || item.style.display === 'none') continue;
      if (item.id === 'appicon-add') continue;
      
      const rect2 = {
        left: item.offsetLeft + margin, top: item.offsetTop + margin,
        right: item.offsetLeft + item.offsetWidth - margin,
        bottom: item.offsetTop + item.offsetHeight - margin
      };
      
      if (rect1.left < rect2.right && rect1.right > rect2.left &&
          rect1.top < rect2.bottom && rect1.bottom > rect2.top) {
        return true;
      }
    }
    return false;
  },

  /**
   * 最も近い空き位置を探す
   */
  findNearestEmptyPosition(element, startX, startY) {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const elWidth = element.offsetWidth;
    const elHeight = element.offsetHeight;

    let x = startX;
    let y = startY;
    
    x = Math.max(0, Math.min(x, screenWidth - elWidth));
    y = Math.max(0, Math.min(y, screenHeight - elHeight));
    
    if (isGridModeEnabled) {
      x = this.snapToGrid(x, 'x');
      y = this.snapToGrid(y, 'y');
      if (x + elWidth > screenWidth) x -= this.GRID_SIZE_X;
      if (y + elHeight > screenHeight) y -= this.GRID_SIZE_Y;
      x = Math.max(0, x); y = Math.max(0, y);
    }
    
    if (!this.isOverlappingAny(element, x, y)) return { x, y };
    
    const stepX = isGridModeEnabled ? this.GRID_SIZE_X : 80;
    const stepY = isGridModeEnabled ? this.GRID_SIZE_Y : 95;
    
    let radius = 1;
    while (radius < 20) {
      const check = (cx, cy) => {
        return cx >= 0 && cy >= 0 && cx + elWidth <= screenWidth && cy + elHeight <= screenHeight && 
               !this.isOverlappingAny(element, cx, cy);
      };

      for (let i = -radius; i <= radius; i++) {
        if (check(x + (i * stepX), y - (radius * stepY))) return { x: x + (i * stepX), y: y - (radius * stepY) };
        if (check(x + (i * stepX), y + (radius * stepY))) return { x: x + (i * stepX), y: y + (radius * stepY) };
      }
      for (let i = -radius + 1; i < radius; i++) {
        if (check(x - (radius * stepX), y + (i * stepY))) return { x: x - (radius * stepX), y: y + (i * stepY) };
        if (check(x + (radius * stepX), y + (i * stepY))) return { x: x + (radius * stepX), y: y + (i * stepY) };
      }
      radius++;
    }
    return { x, y };
  }
};
