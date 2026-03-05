import { DB } from './data';
import { navigateTo } from './ui';
import type { PageName } from './types';

interface SearchResult {
    id: string | number;
    title: string;
    subtitle: string;
    category: string;
    page: PageName;
    icon: string;
}

let selectedIndex = -1;
let currentResults: SearchResult[] = [];

export function initSearch(): void {
    const searchInput = document.getElementById('globalSearch') as HTMLInputElement;
    const searchBox = document.querySelector('.search-box') as HTMLElement;

    if (!searchInput || !searchBox) return;

    // Create dropdown if it doesn't exist
    let dropdown = document.getElementById('searchDropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'searchDropdown';
        dropdown.className = 'search-results-dropdown glass-panel';
        searchBox.appendChild(dropdown);
    }

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        if (query.length < 2) {
            hideDropdown();
            return;
        }
        performSearch(query);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (!currentResults.length) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % currentResults.length;
            updateSelection();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = (selectedIndex - 1 + currentResults.length) % currentResults.length;
            updateSelection();
        } else if (e.key === 'Enter') {
            if (selectedIndex >= 0) {
                const result = currentResults[selectedIndex];
                navigateTo(result.page);
                hideDropdown();
                searchInput.blur();
            }
        } else if (e.key === 'Escape') {
            hideDropdown();
            searchInput.blur();
        }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!searchBox.contains(e.target as Node)) {
            hideDropdown();
        }
    });

    searchInput.addEventListener('focus', () => {
        if (searchInput.value.length >= 1) {
            performSearch(searchInput.value);
        }
    });
}

function performSearch(query: string): void {
    const results: SearchResult[] = [];

    // 1. Guests
    DB.guests.filter(g =>
        g.full_name.toLowerCase().includes(query) ||
        g.phone.includes(query) ||
        g.email.toLowerCase().includes(query)
    ).slice(0, 3).forEach(g => results.push({
        id: g.guest_id,
        title: g.full_name,
        subtitle: `Khách hàng • ${g.phone}`,
        category: 'Khách hàng',
        page: 'guests',
        icon: '👤'
    }));

    // 2. Rooms
    DB.rooms.filter(r =>
        r.room_number.includes(query)
    ).slice(0, 3).forEach(r => results.push({
        id: r.room_id,
        title: `Phòng ${r.room_number}`,
        subtitle: `Phòng • ${r.status}`,
        category: 'Phòng',
        page: 'rooms',
        icon: '🏠'
    }));

    // 3. Services
    DB.services.filter(s =>
        s.service_name.toLowerCase().includes(query)
    ).slice(0, 3).forEach(s => results.push({
        id: s.service_id,
        title: s.service_name,
        subtitle: `Dịch vụ • ${s.unit_price.toLocaleString()} ₫`,
        category: 'Dịch vụ',
        page: 'services',
        icon: '🛠️'
    }));

    // 4. Employees
    DB.employees.filter(e =>
        e.full_name.toLowerCase().includes(query) ||
        e.role.toLowerCase().includes(query)
    ).slice(0, 3).forEach(e => results.push({
        id: e.emp_id,
        title: e.full_name,
        subtitle: `Nhân viên • ${e.role}`,
        category: 'Nhân viên',
        page: 'employees',
        icon: '👔'
    }));

    currentResults = results;
    selectedIndex = -1;
    renderResults();
}

function renderResults(): void {
    const dropdown = document.getElementById('searchDropdown');
    if (!dropdown) return;

    if (currentResults.length === 0) {
        dropdown.innerHTML = '<div class="search-no-results">Không tìm thấy kết quả</div>';
    } else {
        let html = '';
        let currentCategory = '';

        currentResults.forEach((result, index) => {
            if (result.category !== currentCategory) {
                currentCategory = result.category;
                html += `<div class="search-category">${currentCategory}</div>`;
            }
            html += `
                <a href="#${result.page}" class="search-item" data-index="${index}">
                    <div class="search-item-icon">${result.icon}</div>
                    <div class="search-item-info">
                        <div class="search-item-title">${result.title}</div>
                        <div class="search-item-subtitle">${result.subtitle}</div>
                    </div>
                </a>
            `;
        });
        dropdown.innerHTML = html;

        // Add click listeners
        dropdown.querySelectorAll('.search-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const index = parseInt((item as HTMLElement).dataset.index!);
                navigateTo(currentResults[index].page);
                hideDropdown();
            });
        });
    }

    dropdown.classList.add('active');
}

function updateSelection(): void {
    const dropdown = document.getElementById('searchDropdown');
    if (!dropdown) return;

    dropdown.querySelectorAll('.search-item').forEach((item, index) => {
        item.classList.toggle('selected', index === selectedIndex);
        if (index === selectedIndex) {
            item.scrollIntoView({ block: 'nearest' });
        }
    });
}

function hideDropdown(): void {
    const dropdown = document.getElementById('searchDropdown');
    dropdown?.classList.remove('active');
    selectedIndex = -1;
}
