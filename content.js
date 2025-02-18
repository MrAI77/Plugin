let isSyncing = false;

// Функция ожидания элемента
const waitForElement = (selector, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      if (Date.now() - start > timeout) reject('Element not found');
      else setTimeout(check, 100);
    };
    check();
  });
};

// Синхронизация полей
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

// Обработка Equipment Type
const syncEquipment = async () => {
  try {
    const oldSelect = document.getElementById('loadType');
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
    
    // Обратная синхронизация
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

// Основная функция
const init = async () => {
  // Показываем новое меню для теста
  document.querySelectorAll('dat-search-form').forEach(el => {
    el.classList.add('dat-new-menu-test');
  });

  // Вставляем старое меню
  const menuHTML = await fetch(chrome.runtime.getURL('old-menu.html')).then(r => r.text());
  const menuContainer = document.createElement('div');
  menuContainer.id = 'dat-old-menu';
  menuContainer.innerHTML = menuHTML;
  document.body.appendChild(menuContainer);

  // Синхронизация полей
  const fields = [
    ['Origin', '[formcontrolname="origin"] input'],
    ['DH-O', '[formcontrolname="deadhead"]:nth-of-type(1) input'],
    ['Destination', '[formcontrolname="destination"] input'],
    ['DH-D', '[formcontrolname="deadhead"]:nth-of-type(2) input'],
    ['lengthInput', '[formcontrolname="filterLength"] input'],
    ['weightInput', '[formcontrolname="filterWeight"] input'],
    ['ageInput', '[formcontrolname="age"] input']
  ];

  fields.forEach(([oldId, selector]) => syncField(oldId, selector));
  
  // Синхронизация Equipment Type
  await syncEquipment();

  // Обработка кнопки поиска
  document.getElementById('searchBtn').addEventListener('click', () => {
    document.querySelector('[id^="search-automation"]').closest('button').click();
  });
};

// Запуск
if (document.readyState === 'complete') init();
else window.addEventListener('load', init);