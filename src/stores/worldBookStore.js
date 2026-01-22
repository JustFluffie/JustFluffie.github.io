import { defineStore } from 'pinia';

export const useWorldBookStore = defineStore('worldBook', {
  state: () => ({
    worldBooks: JSON.parse(localStorage.getItem('worldBooks') || '[]').map((book, index) => {
      if (book.priority === 'front') book.priority = 1;
      if (book.priority === 'middle') book.priority = 2;
      if (book.priority === 'back') book.priority = 3;
      if (typeof book.priority !== 'number') book.priority = 2;
      // Add order if it doesn't exist for migration
      if (typeof book.order !== 'number') {
        book.order = index;
      }
      return book;
    }),
    nextId: parseInt(localStorage.getItem('worldBookNextId') || '1'),
  }),
  getters: {
    sortedWorldBooks: (state) => {
      return [...state.worldBooks].sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return (a.order || 0) - (b.order || 0);
      });
    },
  },
  actions: {
    _saveToLocalStorage() {
      setTimeout(() => {
        localStorage.setItem('worldBooks', JSON.stringify(this.worldBooks));
        localStorage.setItem('worldBookNextId', this.nextId.toString());
      }, 0);
    },
    // Helper to find the real book from a sorted index
    _findBookBySortedIndex(sortedIndex) {
        const sortedId = this.sortedWorldBooks[sortedIndex]?.id;
        if (sortedId === undefined) return null;
        return this.worldBooks.find(b => b.id === sortedId);
    },
    addNewWorldBook() {
      const newBook = {
        id: this.nextId++,
        title: `新的世界书 ${this.worldBooks.length + 1}`,
        enabled: true,
        collapsed: false,
        priority: 2, // 1: 前, 2: 中, 3: 后
        order: Date.now(),
        entries: [],
      };
      this.worldBooks.push(newBook);
      this._saveToLocalStorage();
    },
    updateBook(sortedIndex, updates) {
      const book = this._findBookBySortedIndex(sortedIndex);
      if (!book) return;

      // Task 4: Handle master switch logic
      if (updates.enabled === false && book.enabled === true) {
        book.entries.forEach(entry => {
          entry._beforeDisableEnabled = entry.enabled;
        });
      } else if (updates.enabled === true && book.enabled === false) {
        book.entries.forEach(entry => {
          if (typeof entry._beforeDisableEnabled === 'boolean') {
            entry.enabled = entry._beforeDisableEnabled;
            delete entry._beforeDisableEnabled;
          }
        });
      }
      
      Object.assign(book, updates);
      this._saveToLocalStorage();
    },
    deleteWorldBook(sortedIndex) {
        const bookId = this.sortedWorldBooks[sortedIndex]?.id;
        if (bookId === undefined) return;
        const index = this.worldBooks.findIndex(b => b.id === bookId);
        if (index > -1) {
            this.worldBooks.splice(index, 1);
            this._saveToLocalStorage();
        }
    },
    setPriority(sortedIndex, priority) {
      const book = this._findBookBySortedIndex(sortedIndex);
      if (book) {
        book.priority = Number(priority);
        this._saveToLocalStorage();
      }
    },
    addNewEntry(sortedIndex) {
      const book = this._findBookBySortedIndex(sortedIndex);
      if (!book) return;

      book.entries.push({
        id: this.nextId++,
        title: `新条目 ${book.entries.length + 1}`,
        notes: '',
        content: '',
        enabled: true,
        collapsed: false,
      });
      this._saveToLocalStorage();
    },
    updateEntry(sortedIndex, entryIndex, updatedEntry) {
        const book = this._findBookBySortedIndex(sortedIndex);
        if (book && book.entries[entryIndex]) {
            book.entries[entryIndex] = { ...book.entries[entryIndex], ...updatedEntry };
            this._saveToLocalStorage();
        }
    },
    deleteEntry(sortedIndex, entryIndex) {
      const book = this._findBookBySortedIndex(sortedIndex);
      if (book) {
        book.entries.splice(entryIndex, 1);
        this._saveToLocalStorage();
      }
    },
    reorderEntries(sortedIndex, { oldIndex, newIndex }) {
        // v-model in the component already updates the array order.
        // We just need to save the new state.
        this._saveToLocalStorage();
    },
    onBookDragEnd({ oldIndex, newIndex }) {
      if (oldIndex === newIndex) return;

      const sortedList = this.sortedWorldBooks;
      const movedItem = sortedList[oldIndex];
      const bookToMove = this.worldBooks.find(b => b.id === movedItem.id);
      if (!bookToMove) return;

      const reorderedSortedList = [...sortedList];
      const [itemToMove] = reorderedSortedList.splice(oldIndex, 1);
      reorderedSortedList.splice(newIndex, 0, itemToMove);

      const prevItem = reorderedSortedList[newIndex - 1];
      const nextItem = reorderedSortedList[newIndex + 1];

      let newPriority;
      let newOrder;

      if (prevItem && nextItem) {
        if (prevItem.priority === nextItem.priority) {
          newPriority = prevItem.priority;
          newOrder = (prevItem.order + nextItem.order) / 2;
        } else if (prevItem.priority < nextItem.priority) {
          newPriority = prevItem.priority;
          newOrder = prevItem.order + 10;
        } else {
          newPriority = nextItem.priority;
          newOrder = nextItem.order - 10;
        }
      } else if (prevItem) {
        newPriority = prevItem.priority;
        newOrder = prevItem.order + 10;
      } else if (nextItem) {
        newPriority = nextItem.priority;
        newOrder = nextItem.order - 10;
      } else return;

      bookToMove.priority = newPriority;
      bookToMove.order = newOrder;
      this._saveToLocalStorage();
    },

    getWorldBookContext(selectedIds) {
      if (!selectedIds || selectedIds.length === 0) return '';

      const contextByBook = {};

      // 遍历所有世界书和条目，构建一个快速查找表
      const entryMap = new Map();
      this.worldBooks.forEach(book => {
        book.entries.forEach(entry => {
          entryMap.set(entry.id, { ...entry, bookTitle: book.title, bookPriority: book.priority, bookOrder: book.order });
        });
      });

      selectedIds.forEach(id => {
        // 检查这个 ID 是否是一个条目的 ID
        if (entryMap.has(id)) {
          const entry = entryMap.get(id);
          if (entry.enabled) {
            if (!contextByBook[entry.bookTitle]) {
              contextByBook[entry.bookTitle] = {
                priority: entry.bookPriority,
                order: entry.bookOrder,
                entries: []
              };
            }
            contextByBook[entry.bookTitle].entries.push(`【${entry.title}】: ${entry.content}`);
          }
        } else {
          // 否则，假设它是一个世界书的 ID
          const book = this.worldBooks.find(b => b.id === id && b.enabled);
          if (book) {
            const activeEntries = book.entries.filter(e => e.enabled);
            if (activeEntries.length > 0) {
              if (!contextByBook[book.title]) {
                contextByBook[book.title] = {
                  priority: book.priority,
                  order: book.order,
                  entries: []
                };
              }
              activeEntries.forEach(entry => {
                contextByBook[book.title].entries.push(`【${entry.title}】: ${entry.content}`);
              });
            }
          }
        }
      });

      // 将收集到的内容排序并格式化
      const sortedBookTitles = Object.keys(contextByBook).sort((a, b) => {
        const bookA = contextByBook[a];
        const bookB = contextByBook[b];
        if (bookA.priority !== bookB.priority) return bookA.priority - bookB.priority;
        return (bookA.order || 0) - (bookB.order || 0);
      });

      let finalContext = '';
      sortedBookTitles.forEach(title => {
        const bookData = contextByBook[title];
        if (bookData.entries.length > 0) {
          finalContext += `[世界书: ${title}]\n`;
          finalContext += bookData.entries.join('\n') + '\n\n';
        }
      });

      return finalContext.trim();
    },
  },
});
