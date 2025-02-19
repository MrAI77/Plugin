let isSyncing = false;

// Функция ожидания элемента
const waitForElement = (selector, timeout = 5000) => {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const check = () => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);
            if (Date.now() - start > timeout) reject('Element not found: ' + selector);
            else setTimeout(check, 100);
        };
        check();
    });
};

// Синхронизация значений между "старым" и "новым" полем
const syncField = async (oldId, newSelector) => {
    try {
        const oldField = document.getElementById(oldId);
        const newField = await waitForElement(newSelector);

        const sync = (source, target) => {
            if (isSyncing) return;
            isSyncing = true;
            target.value = source.value;
            target.dispatchEvent(new Event('input', { bubbles: true }));
            console.log(`Synced: ${source.id} → ${target.value}`);
            isSyncing = false;
        };

        oldField.addEventListener('input', () => sync(oldField, newField));
        newField.addEventListener('input', () => sync(newField, oldField));

        // Первоначальная синхронизация
        sync(oldField, newField);
    } catch (error) {
        console.error(`Sync error for ${oldId}:`, error);
    }
};

// Синхронизация Full/Partial (селектор)
const syncEquipment = async () => {
    try {
        const oldSelect = document.getElementById('loadType');
        if (!oldSelect) return;

        const newSelect = await waitForElement('mat-select[formcontrolname="fullPartial"]');

        const sync = () => {
            newSelect.click();
            setTimeout(() => {
                const options = document.querySelectorAll('mat-option');
                options.forEach(opt => {
                    if (opt.textContent.trim() === oldSelect.value) {
                        opt.click();
                    }
                });
            }, 100);
        };

        oldSelect.addEventListener('change', sync);

        newSelect.addEventListener('click', () => {
            setTimeout(() => {
                const selected = document.querySelector('.mat-select-value-text');
                if (selected) oldSelect.value = selected.textContent.trim();
            }, 200);
        });
    } catch (error) {
        console.error('Equipment sync error:', error);
    }
};

// Основная функция инициализации
const init = async () => {
    // Создаём кнопку открытия/закрытия меню
    const toggleBtn = document.createElement("button");
    toggleBtn.id = "toggle-menu";
    toggleBtn.textContent = ">";
    document.body.appendChild(toggleBtn);

    // Создаём контейнер для старого меню
    const menuContainer = document.createElement("div");
    menuContainer.id = "dat-old-menu";
    document.body.appendChild(menuContainer);

    // Загружаем HTML старого меню
    try {
        const menuHTML = await fetch(chrome.runtime.getURL('old-menu.html')).then(res => res.text());
        menuContainer.innerHTML = menuHTML;
    } catch (error) {
        console.error("Ошибка загрузки меню:", error);
    }

    // Обработчик клика по кнопке
    toggleBtn.addEventListener("click", () => {
        menuContainer.classList.toggle("open");
        toggleBtn.classList.toggle("open");

        // Меняем символ кнопки
        toggleBtn.textContent = menuContainer.classList.contains("open") ? "<" : ">";
    });

    // Скрываем новое меню
    const newMenu = document.querySelector(".search-form.search-form-updated");
    if (newMenu) {
        newMenu.style.display = "none";
    }

    // Указываем поля, которые нужно синхронизировать
    const fields = [
        ['Origin', '[formcontrolname="origin"] input'],
        ['DH-O', '#origin-automation input[formcontrolname="deadhead"]'],
        ['Destination', '#destination-automation input'],
        ['DH-D', '#destination-automation input[formcontrolname="deadhead"]'],
        ['lengthInput', '[formcontrolname="filterLength"]'],
        ['weightInput', '[formcontrolname="filterWeight"]'],
        ['EquipmentType', '#mat-chip-list-input-0'],  // Обновленный селектор Equipment Type
    ];

    // Запускаем синхронизацию полей
    for (const [oldId, selector] of fields) {
        await syncField(oldId, selector);
    }

    // Синхронизация Full/Partial (select)
    await syncEquipment();

    // Обработка кнопки поиска
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const btn = document.querySelector('[id^="search-automation"]');
            if (btn) {
                const realBtn = btn.closest('button');
                if (realBtn) realBtn.click();
            }
        });
    }
};

// Запуск, когда документ готов
if (document.readyState === 'complete') {
    init();
} else {
    window.addEventListener('load', init);
}
