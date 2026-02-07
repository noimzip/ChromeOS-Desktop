/**
 * Soul Widgets Manager - Drag & Drop Manager
 */

'use strict';

window.DragManager = {
  /**
   * 値をグリッドにスナップさせる
   */
  snapToGrid(value, axis = 'x') {
    const size = axis === 'y' ? GRID_SIZE_Y : GRID_SIZE_X;
    return Math.round((value - GRID_OFFSET) / size) * size + GRID_OFFSET;
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
        const overlapArea = window.DragManager.calculateOverlapArea(draggedRect, item.rect);
        if (overlapArea > OVERLAP_THRESHOLD) return item.element;
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
        const overlapArea = window.DragManager.calculateOverlapArea(draggedRect, item.rect);
        if (overlapArea > OVERLAP_THRESHOLD) return item.element;
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

    let x = startX, y = startY;
    x = Math.max(0, Math.min(x, screenWidth - elWidth));
    y = Math.max(0, Math.min(y, screenHeight - elHeight));
    
    if (window.isGridModeEnabled) {
      x = window.DragManager.snapToGrid(x, 'x');
      y = window.DragManager.snapToGrid(y, 'y');
      if (x + elWidth > screenWidth) x -= GRID_SIZE_X;
      if (y + elHeight > screenHeight) y -= GRID_SIZE_Y;
      x = Math.max(0, x); y = Math.max(0, y);
    }
    
    if (!window.DragManager.isOverlappingAny(element, x, y)) return { x, y };
    
    const stepX = window.isGridModeEnabled ? GRID_SIZE_X : 80;
    const stepY = window.isGridModeEnabled ? GRID_SIZE_Y : 95;
    
    let radius = 1;
    while (radius < 20) {
      const check = (cx, cy) => cx >= 0 && cy >= 0 && cx + elWidth <= screenWidth && cy + elHeight <= screenHeight && !window.DragManager.isOverlappingAny(element, cx, cy);
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
  },

  /**
   * アイテムにドラッグイベントを設定する（位置変更モード用）
   */
  setupDraggableItem(item) {
    item._savedOnclick = item.onclick;
    item.onclick = (e) => { e.preventDefault(); e.stopPropagation(); };
    item._savedOncontextmenu = item.oncontextmenu;
    
    item.querySelectorAll('a').forEach(link => {
      link.onclick = (e) => { e.preventDefault(); e.stopPropagation(); };
    });

    item.querySelectorAll('img').forEach(img => {
      img.draggable = false;
      img.style.pointerEvents = 'none';
    });

    item.onpointerdown = function(event) {
      if (event.button !== 0) return;
      this.setPointerCapture(event.pointerId);
      this._isDragging = false;
      this._startX = event.clientX; this._startY = event.clientY;
      this._startLeft = this.offsetLeft; this._startTop = this.offsetTop;
      window.DragManager.cacheIconRects(this);
    };
    
    item.onpointermove = function(event){
      if (this._isResizing || !this.hasPointerCapture(event.pointerId)) return;
      if(event.buttons){
        const dx = event.clientX - this._startX, dy = event.clientY - this._startY;
        if (!this._isDragging && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) this._isDragging = true;
        if (!this._isDragging) return;
        
        this.style.left = (this._startLeft + dx) + 'px';
        this.style.top = (this._startTop + dy) + 'px';
        this.style.position = 'absolute';
        
        if (!this.classList.contains('widget') && this.id !== 'appicon-add') {
          document.querySelectorAll('.appicon.drag-over').forEach(el => el.classList.remove('drag-over'));
          const overlapping = window.DragManager.getOverlappingIcon(this);
          if (overlapping) overlapping.classList.add('drag-over');
          const overlappingFolder = window.DragManager.getOverlappingFolder(this);
          if (overlappingFolder) overlappingFolder.classList.add('drag-over');
        }
      }
    };
    
    item.onpointerup = function(event) {
      if (event && event.pointerId !== undefined) this.releasePointerCapture(event.pointerId);
      if (!this._isDragging) return;
      this._isDragging = false;
      document.querySelectorAll('.appicon.drag-over').forEach(el => el.classList.remove('drag-over'));
      
      if (!this.classList.contains('widget') && this.id !== 'appicon-add' && !this.classList.contains('folder')) {
        const overlappingFolder = window.DragManager.getOverlappingFolder(this);
        if (overlappingFolder) {
          window.FolderManager.addToFolder(overlappingFolder.dataset.folderId, this);
          return;
        }
        const overlapping = window.DragManager.getOverlappingIcon(this);
        if (overlapping && !overlapping.classList.contains('folder')) {
          window.FolderManager.createFolder(overlapping, this);
          return;
        }
      }
      
      if (this.style.position === 'absolute') {
        const newPos = window.DragManager.findNearestEmptyPosition(this, this.offsetLeft, this.offsetTop);
        this.style.left = newPos.x + 'px'; this.style.top = newPos.y + 'px';
      }
    };
  },

  /**
   * 通常モードでのドラッグを設定する
   */
  setupNormalModeDrag(item) {
    const img = item.querySelector('img');
    if (img) img.ondragstart = (e) => e.preventDefault();

    if (!item._clickListenerAttached) {
      item.addEventListener('click', function(e) {
        if (this._ignoreClick) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); }
      }, true);
      item._clickListenerAttached = true;
    }

    item.onpointerdown = function(event) {
      if (event.button !== 0) return;
      this.setPointerCapture(event.pointerId);
      this._isDragging = false;
      this._startX = event.clientX; this._startY = event.clientY;
      this._startLeft = this.offsetLeft; this._startTop = this.offsetTop;
      this._ignoreClick = false;
      window.DragManager.cacheIconRects(this);
    };
    
    item.onpointermove = function(event) {
      if (this._isResizing || !event.buttons || !this.hasPointerCapture(event.pointerId)) return;
      const dx = event.clientX - this._startX, dy = event.clientY - this._startY;
      
      if (!this._isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        this._isDragging = true; this._ignoreClick = true;
        this.querySelectorAll('img').forEach(img => { img.draggable = false; img.style.pointerEvents = 'none'; });
      }
      if (!this._isDragging) return;
      
      this.style.left = (this._startLeft + dx) + 'px';
      this.style.top = (this._startTop + dy) + 'px';
      this.style.position = 'absolute';
      
      if (!this.classList.contains('widget') && !this.classList.contains('folder')) {
        document.querySelectorAll('.appicon.drag-over').forEach(el => el.classList.remove('drag-over'));
        const overlapping = window.DragManager.getOverlappingIcon(this);
        if (overlapping) overlapping.classList.add('drag-over');
        const overlappingFolder = window.DragManager.getOverlappingFolder(this);
        if (overlappingFolder) overlappingFolder.classList.add('drag-over');
      }
    };
    
    item.onpointerup = function(event) {
      if (event && event.pointerId !== undefined) this.releasePointerCapture(event.pointerId);
      if (!this._isDragging) return;
      this._isDragging = false;
      document.querySelectorAll('.appicon.drag-over').forEach(el => el.classList.remove('drag-over'));
      
      if (!this.classList.contains('widget') && !this.classList.contains('folder')) {
        const overlappingFolder = window.DragManager.getOverlappingFolder(this);
        if (overlappingFolder) {
          window.FolderManager.addToFolder(overlappingFolder.dataset.folderId, this);
          setTimeout(() => { this._ignoreClick = false; }, 50);
          return;
        }
        const overlapping = window.DragManager.getOverlappingIcon(this);
        if (overlapping && !overlapping.classList.contains('folder')) {
          window.FolderManager.createFolder(overlapping, this);
          setTimeout(() => { this._ignoreClick = false; }, 50);
          return;
        }
      }
      
      if (this.style.position === 'absolute') {
        const newPos = window.DragManager.findNearestEmptyPosition(this, this.offsetLeft, this.offsetTop);
        this.style.left = newPos.x + 'px'; this.style.top = newPos.y + 'px';
      }
      
      // 保存
      const key = this.id || this.dataset.saveKey;
      if (key) {
        try {
          const positions = JSON.parse(localStorage.getItem(LS_KEYS.WIDGET_POSITIONS) || '{}');
          positions[key] = { left: this.style.left, top: this.style.top, position: 'absolute' };
          localStorage.setItem(LS_KEYS.WIDGET_POSITIONS, JSON.stringify(positions));
        } catch (e) {}
      }
      
      this.querySelectorAll('img').forEach(img => { img.draggable = true; img.style.pointerEvents = ''; });
      setTimeout(() => { this._ignoreClick = false; }, 50);
    };
  }
};