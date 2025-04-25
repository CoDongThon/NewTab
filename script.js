
document.addEventListener('DOMContentLoaded', () => {

    const timeElement = document.getElementById('time');
    const dateElement = document.getElementById('date');
    const searchInput = document.getElementById('search-input');
    const searchForm = document.getElementById('search-form');
    const searchSuggestionsContainer = document.getElementById('search-suggestions');
    const yearElement = document.getElementById('year');
    const quickLinksContainer = document.getElementById('quick-links-container');
    const addBookmarkGridBtn = document.getElementById('add-bookmark-grid-btn');
    const bookmarkFormContainer = document.getElementById('add-bookmark-form-container');
    const bookmarkForm = document.getElementById('bookmark-form');
    const bookmarkNameInput = document.getElementById('bookmark-name');
    const bookmarkUrlInput = document.getElementById('bookmark-url');
    const cancelBookmarkBtn = document.getElementById('cancel-bookmark-btn');
    const overlay = document.getElementById('overlay');
    const voiceSearchBtn = document.querySelector('.voice-search');
    const imageSearchBtn = document.querySelector('.image-search');



    let userBookmarks = [];
    const BOOKMARKS_STORAGE_KEY = 'futureTabUserBookmarks_v1';
    const HIDDEN_DEFAULTS_KEY = 'futureTabHiddenDefaults_v1';
    let suggestionRequestController = null;


    let lastTimeString = ''; let lastDateString = ''; let lastYearString = '';
    function updateTimeAndDate() {
        requestAnimationFrame(() => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0'); const minutes = String(now.getMinutes()).padStart(2, '0'); const seconds = String(now.getSeconds()).padStart(2, '0');
            const currentTimeString = `${hours}:${minutes}:${seconds}`;
            if (lastTimeString !== currentTimeString) { timeElement.textContent = currentTimeString; lastTimeString = currentTimeString; }
            const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
            const dayName = daysOfWeek[now.getDay()]; const day = now.getDate(); const month = now.getMonth() + 1; const year = now.getFullYear();
            const currentDateString = `${dayName}, ${day} tháng ${month}, ${year}`;
            if (lastDateString !== currentDateString) { dateElement.textContent = currentDateString; lastDateString = currentDateString; }
            const currentYearString = year.toString();
             if (yearElement && lastYearString !== currentYearString) { yearElement.textContent = currentYearString; lastYearString = currentYearString; }
        });
    }
    updateTimeAndDate(); setInterval(updateTimeAndDate, 1000);


    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }


    searchForm.addEventListener('submit', (event) => {
        const query = searchInput.value.trim();
        const isUrl = (query.includes('.') && !query.includes(' ') && query.length > 3 && query.indexOf('.') > 0 && query.indexOf('.') < query.length - 1) || query.startsWith('http://') || query.startsWith('https://') || query.startsWith('ftp://') || query.startsWith('//') || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(:[0-9]+)?(\/.*)?$/.test(query);
        const hasSchema = /^[a-z]+:\/\//i.test(query) || query.startsWith('//');
        if (isUrl && query) {
            event.preventDefault(); let url = query; if (!hasSchema) { url = 'https://' + query; }
            try { window.open(url, '_blank', 'noopener,noreferrer'); }
            catch (e) { console.error("Failed to open URL:", e); searchForm.action = `https://www.google.com/search?q=${encodeURIComponent(query)}`; searchForm.submit(); }
            clearSuggestions();
        } else if (query) { searchForm.action = `https://www.google.com/search`; clearSuggestions(); }
        else { event.preventDefault(); searchInput.focus(); }
    });



     function fetchGoogleSuggestions(query) {
        if (suggestionRequestController) {
            suggestionRequestController.abort();
        }
        suggestionRequestController = new AbortController();
        const signal = suggestionRequestController.signal;

        window.handleGoogleSuggests = function(data) {
            if (signal.aborted) return;
            const suggestions = data[1];
            renderSuggestions(suggestions);
            delete window.handleGoogleSuggests;
            const scriptElement = document.getElementById('jsonp-suggest');
            if (scriptElement) {
                scriptElement.remove();
            }
            suggestionRequestController = null;
        };

        const existingScript = document.getElementById('jsonp-suggest');
        if (existingScript) {
            existingScript.remove();
        }

        const script = document.createElement('script');
        script.id = 'jsonp-suggest';
          script.src = `https://clients1.google.com/complete/search?client=firefox&hl=vi&output=toolbar&callback=handleGoogleSuggests&q=${encodeURIComponent(query)}`;

        script.onerror = (error) => {
             if (signal.aborted) return; 
             console.error("JSONP request error:", error);
            clearSuggestions();
            delete window.handleGoogleSuggests;
             const scriptElement = document.getElementById('jsonp-suggest');
            if (scriptElement) {
                scriptElement.remove();
            }
             suggestionRequestController = null;
         };

        signal.addEventListener('abort', () => {
             console.log("Aborting JSONP request for:", query);
             delete window.handleGoogleSuggests;
             const scriptElement = document.getElementById('jsonp-suggest');
             if (scriptElement) {
                 scriptElement.remove();
             }
         });


        document.body.appendChild(script);
    }

    function renderSuggestions(suggestions) {
        if (!searchSuggestionsContainer || !Array.isArray(suggestions)) {
            clearSuggestions();
            return;
        }
        searchSuggestionsContainer.innerHTML = '';

        if (suggestions.length > 0) {
            const list = document.createElement('ul');
            suggestions.slice(0, 8).forEach(suggestion => {
                const listItem = document.createElement('li');
                listItem.tabIndex = -1;
                listItem.setAttribute('role', 'option');

                const icon = document.createElement('i');
                icon.className = 'fas fa-search suggestion-icon';
                icon.setAttribute('aria-hidden', 'true');

                const textSpan = document.createElement('span');
                textSpan.textContent = suggestion;

                listItem.appendChild(icon);
                listItem.appendChild(textSpan);

                listItem.dataset.suggestion = suggestion;

                listItem.addEventListener('click', () => {
                    searchInput.value = listItem.dataset.suggestion;
                    searchForm.requestSubmit();
                    clearSuggestions();
                });
                listItem.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        searchInput.value = listItem.dataset.suggestion;
                        searchForm.requestSubmit();
                        clearSuggestions();
                    }
                });
                list.appendChild(listItem);
            });
            searchSuggestionsContainer.appendChild(list);
            searchSuggestionsContainer.style.display = 'block';
        } else {
            searchSuggestionsContainer.style.display = 'none';
        }
    }


    function showSuggestions(query) {
        if (!query) {
            clearSuggestions();
            return;
        }
        fetchGoogleSuggestions(query);
    }

    function clearSuggestions() {
        if (suggestionRequestController) {
            suggestionRequestController.abort();
            suggestionRequestController = null;
        }
        if (searchSuggestionsContainer) {
            searchSuggestionsContainer.innerHTML = '';
            searchSuggestionsContainer.style.display = 'none';
        }
        delete window.handleGoogleSuggests;
        const scriptElement = document.getElementById('jsonp-suggest');
        if (scriptElement) {
            scriptElement.remove();
        }
    }


    const debouncedShowSuggestions = debounce(showSuggestions, 300);

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        if (query) {
            debouncedShowSuggestions(query);
        } else {
            clearSuggestions();
        }
    });

    document.addEventListener('click', (event) => {
        const searchWrapper = document.querySelector('.search-wrapper');
        if (searchWrapper && !searchWrapper.contains(event.target)) {
            clearSuggestions();
        }
    });
    searchInput.addEventListener('blur', (event) => {
        setTimeout(() => {
            if (!searchSuggestionsContainer.contains(document.activeElement)) {
                clearSuggestions();
            }
        }, 150);
    });
    searchInput.addEventListener('keydown', (e) => {
        const suggestionsList = searchSuggestionsContainer.querySelector('ul');
        if (suggestionsList && suggestionsList.children.length > 0) {
             if (e.key === 'ArrowDown') {
                 e.preventDefault();
                 suggestionsList.children[0].focus();
             }
        }
        if (e.key === 'Escape') {
            clearSuggestions();
        }
    });
    searchSuggestionsContainer.addEventListener('keydown', (e) => {
         const currentFocused = document.activeElement;
         if (currentFocused && currentFocused.tagName === 'LI') {
             if (e.key === 'ArrowDown') {
                 e.preventDefault();
                 const next = currentFocused.nextElementSibling;
                 if (next) next.focus();
             } else if (e.key === 'ArrowUp') {
                 e.preventDefault();
                 const prev = currentFocused.previousElementSibling;
                 if (prev) prev.focus();
                 else searchInput.focus();
             } else if (e.key === 'Escape') {
                 clearSuggestions();
                 searchInput.focus();
             }
         }
     });


     if (voiceSearchBtn) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition(); recognition.continuous = false; recognition.lang = 'vi-VN'; recognition.interimResults = false; recognition.maxAlternatives = 1;
            let isListening = false;
            voiceSearchBtn.addEventListener('click', () => {
                if (!isListening) {
                    try { recognition.start(); isListening = true; voiceSearchBtn.classList.add('listening'); voiceSearchBtn.title = "Đang nghe..."; }
                    catch (err) { console.error("Error starting voice recognition:", err); alert("Không thể bắt đầu nhận dạng giọng nói. Kiểm tra quyền micro."); }
                } else { recognition.stop(); }
            });
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                searchInput.value = transcript;
                showSuggestions(transcript);
             };
            recognition.onerror = (event) => { console.error('Speech error:', event.error); if(event.error !== 'no-speech' && event.error !== 'aborted') alert(`Lỗi nhận dạng giọng nói: ${event.error}`); };
            recognition.onend = () => { isListening = false; voiceSearchBtn.classList.remove('listening'); voiceSearchBtn.title = "Tìm kiếm bằng giọng nói"; };
        } else { console.warn("Speech Recognition not supported."); voiceSearchBtn.title = "Trình duyệt không hỗ trợ"; voiceSearchBtn.disabled = true; voiceSearchBtn.style.opacity = 0.5; voiceSearchBtn.style.cursor = 'not-allowed'; }
    }


     if (imageSearchBtn) { imageSearchBtn.addEventListener('click', () => { window.open('https://lens.google.com/', '_blank', 'noopener,noreferrer'); }); }


     function getHiddenDefaults() {
        try { const stored = localStorage.getItem(HIDDEN_DEFAULTS_KEY); return stored ? JSON.parse(stored) : []; } catch (e) { console.error("Error loading hidden defaults:", e); return []; }
     }
     function saveHiddenDefaults(hiddenIds) {
        try { localStorage.setItem(HIDDEN_DEFAULTS_KEY, JSON.stringify(hiddenIds)); } catch (e) { console.error("Error saving hidden defaults:", e); }
     }

    function createBookmarkElement(bookmark, index) {
        const linkItem = document.createElement('a'); linkItem.href = bookmark.url; linkItem.target = '_blank'; linkItem.rel = 'noopener noreferrer'; linkItem.classList.add('link-item', 'user-bookmark'); linkItem.title = `${bookmark.name}\n${bookmark.url}`; linkItem.dataset.index = index; // Index for user bookmarks
        const icon = document.createElement('i'); icon.className = 'fas fa-star'; icon.setAttribute('aria-hidden', 'true');
        const span = document.createElement('span'); span.textContent = bookmark.name;
        linkItem.appendChild(icon); linkItem.appendChild(span);
        addDeleteButton(linkItem);
        linkItem.style.setProperty('--item-index', index);
        return linkItem;
    }

    function addDeleteButton(linkItemElement) {
         const deleteBtn = document.createElement('button'); deleteBtn.className = 'delete-bookmark-btn'; deleteBtn.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>'; deleteBtn.title = 'Xóa'; deleteBtn.setAttribute('aria-label', `Xóa ${linkItemElement.querySelector('span')?.textContent || 'liên kết'}`);
         if (linkItemElement.dataset.index !== undefined) { deleteBtn.dataset.index = linkItemElement.dataset.index; }
         else if (linkItemElement.dataset.defaultId) { deleteBtn.dataset.defaultId = linkItemElement.dataset.defaultId; }

         deleteBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); handleDeleteClick(e.currentTarget); });
         linkItemElement.appendChild(deleteBtn);
    }


    function renderBookmarks() {
        const fragment = document.createDocumentFragment();
        const hiddenDefaults = getHiddenDefaults();
        let userBookmarkCount = 0;

        userBookmarks.forEach((bookmark, index) => {
             const elem = createBookmarkElement(bookmark, index);
             elem.style.setProperty('--item-index', userBookmarkCount++);
             fragment.appendChild(elem);
        });
        const existingUserBookmarks = quickLinksContainer.querySelectorAll('.user-bookmark');
        existingUserBookmarks.forEach(bm => bm.remove());


        let defaultLinkCount = 0;
        const defaultLinks = quickLinksContainer.querySelectorAll('.default-link');
        defaultLinks.forEach((link, i) => {
             const defaultId = link.dataset.defaultId;
             const existingDeleteBtn = link.querySelector('.delete-bookmark-btn');
             if(existingDeleteBtn) existingDeleteBtn.remove();

            if (hiddenDefaults.includes(defaultId)) {
                link.style.display = 'none'; 
                link.style.removeProperty('--item-index');
            } else {
                link.style.display = '';
                addDeleteButton(link);
                link.style.setProperty('--item-index', defaultLinkCount++);
            }
        });

         const totalVisibleItems = defaultLinkCount + userBookmarkCount;
         if (addBookmarkGridBtn) {
             addBookmarkGridBtn.style.setProperty('--item-index', totalVisibleItems);
         }


        const addButton = document.getElementById('add-bookmark-grid-btn');
        if(addButton){
             quickLinksContainer.insertBefore(fragment, addButton);
             quickLinksContainer.appendChild(addButton);
        } else { quickLinksContainer.appendChild(fragment); }
    }

    function loadBookmarks() {
        userBookmarks = []; try { const stored = localStorage.getItem(BOOKMARKS_STORAGE_KEY); if (stored) { const parsed = JSON.parse(stored); if (Array.isArray(parsed)) userBookmarks = parsed; } } catch (e) { console.error("Parse error loading user bookmarks:", e); }
        renderBookmarks();
    }
    function saveUserBookmarks() { try { localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(userBookmarks)); } catch (e) { console.error("Save user bookmarks error:", e); alert("Không thể lưu bookmark."); } }

    function addBookmark(name, url) {
        if (!url.trim()) return; if (!name.trim()) name = url; if (!/^[a-z]+:\/\//i.test(url) && !url.startsWith('//')) { url = 'https://' + url; }
        const newBookmark = { name: name.trim(), url: url.trim() };
        userBookmarks.push(newBookmark);
        saveUserBookmarks();
        renderBookmarks();
    }

    function handleDeleteClick(deleteButton) {
        const linkItem = deleteButton.closest('.link-item');
        if (!linkItem) return;

        const bookmarkName = linkItem.querySelector('span')?.textContent || 'liên kết này';
        const isDefault = deleteButton.dataset.defaultId !== undefined;
        const userIndex = deleteButton.dataset.index;

        if (confirm(`Bạn có chắc muốn xóa "${bookmarkName}"?`)) {
            if (isDefault) {
                const defaultId = deleteButton.dataset.defaultId;
                const hiddenDefaults = getHiddenDefaults();
                if (!hiddenDefaults.includes(defaultId)) {
                    hiddenDefaults.push(defaultId);
                    saveHiddenDefaults(hiddenDefaults);
                }
                renderBookmarks();

            } else if (userIndex !== undefined) {
                const index = parseInt(userIndex, 10);
                 if (!isNaN(index) && index >= 0 && index < userBookmarks.length) {
                     userBookmarks.splice(index, 1);
                     saveUserBookmarks();
                     renderBookmarks();
                 } else {
                     console.error("Invalid user bookmark index:", userIndex);
                     linkItem.remove();
                 }
            } else {
                 console.error("Could not determine bookmark type for deletion.");
                 linkItem.remove();
            }
        }
    }


     let previouslyFocusedElement = null;

    function showBookmarkForm() {
        previouslyFocusedElement = document.activeElement;
        bookmarkFormContainer.classList.add('visible');
        overlay.classList.add('visible');
        bookmarkNameInput.focus();
        bookmarkFormContainer.setAttribute('aria-hidden', 'false');
        overlay.setAttribute('aria-hidden', 'false');
    }

    addBookmarkGridBtn.addEventListener('click', showBookmarkForm);

    function hideBookmarkForm() {
        bookmarkFormContainer.classList.remove('visible');
        overlay.classList.remove('visible');
        bookmarkForm.reset();
        bookmarkFormContainer.setAttribute('aria-hidden', 'true');
        overlay.setAttribute('aria-hidden', 'true');
        if (previouslyFocusedElement) {
            previouslyFocusedElement.focus();
            previouslyFocusedElement = null;
        }
    }
    cancelBookmarkBtn.addEventListener('click', hideBookmarkForm);
    overlay.addEventListener('click', hideBookmarkForm);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && bookmarkFormContainer.classList.contains('visible')) {
             hideBookmarkForm();
        }
    });

     bookmarkFormContainer.addEventListener('keydown', (event) => {
         if (event.key !== 'Tab') return;

         const focusableElements = bookmarkFormContainer.querySelectorAll('input, button');
         const firstElement = focusableElements[0];
         const lastElement = focusableElements[focusableElements.length - 1];

         if (event.shiftKey) {
             if (document.activeElement === firstElement) {
                 lastElement.focus();
                 event.preventDefault();
             }
         } else {
             if (document.activeElement === lastElement) {
                 firstElement.focus();
                 event.preventDefault();
             }
         }
     });

    bookmarkForm.addEventListener('submit', (event) => {
        event.preventDefault();
        addBookmark(bookmarkNameInput.value, bookmarkUrlInput.value);
        hideBookmarkForm();
    });


    loadBookmarks();
    console.log("FutureTab Initialized! (Logo Space Added)");
});