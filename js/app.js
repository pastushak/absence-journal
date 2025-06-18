/**
 * Журнал відлучень з робочого місця
 * JavaScript логіка застосунку
 */

let absences = [];

/**
 * Генерація унікального номера у форматі DDMMYYYYHHMM
 * @param {string} date - Дата у форматі ISO
 * @returns {string} Унікальний номер
 */
function generateUniqueNumber(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${day}${month}${year}${hours}${minutes}`;
}

/**
 * Форматування дати для відображення
 * @param {string} dateTime - Дата у форматі ISO
 * @returns {string} Відформатована дата
 */
function formatDateTime(dateTime) {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Встановлення поточного часу в поля дати
 */
function setCurrentDateTime() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localISOTime = new Date(now.getTime() - (offset * 60 * 1000))
        .toISOString().slice(0, 16);
    
    const departureField = document.getElementById('departureDateTime');
    const returnField = document.getElementById('returnDateTime');
    
    if (departureField && !departureField.value) {
        departureField.value = localISOTime;
    }
    
    if (returnField && !returnField.value) {
        returnField.value = localISOTime;
    }
}

/**
 * Збереження даних в localStorage
 */
function saveToStorage() {
    try {
        localStorage.setItem('absenceJournal', JSON.stringify(absences));
    } catch (error) {
        console.error('Помилка збереження даних:', error);
        alert('Помилка збереження даних. Перевірте налаштування браузера.');
    }
}

/**
 * Завантаження даних з localStorage
 */
function loadFromStorage() {
    try {
        const stored = localStorage.getItem('absenceJournal');
        if (stored) {
            absences = JSON.parse(stored);
        }
    } catch (error) {
        console.error('Помилка завантаження даних:', error);
        absences = [];
    }
}

/**
 * Валідація введених даних
 * @param {Object} data - Дані для валідації
 * @returns {Object} Результат валідації
 */
function validateAbsenceData(data) {
    const errors = [];
    
    if (!data.lastName || data.lastName.trim().length < 2) {
        errors.push('Прізвище повинно містити мінімум 2 символи');
    }
    
    if (!data.firstName || data.firstName.trim().length < 2) {
        errors.push('Ім\'я повинно містити мінімум 2 символи');
    }
    
    if (!data.middleName || data.middleName.trim().length < 2) {
        errors.push('По батькові повинно містити мінімум 2 символи');
    }
    
    if (!data.destination || data.destination.trim().length < 3) {
        errors.push('Місце відлучення повинно містити мінімум 3 символи');
    }
    
    if (!data.departureDateTime) {
        errors.push('Вкажіть дату і час відлучення');
    }
    
    // Перевірка, що дата відлучення не в майбутньому (з допуском 5 хвилин)
    if (data.departureDateTime) {
        const departureTime = new Date(data.departureDateTime);
        const now = new Date();
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
        
        if (departureTime > fiveMinutesFromNow) {
            errors.push('Час відлучення не може бути в майбутньому');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Реєстрація нового відлучення
 * @param {Event} e - Подія форми
 */
function handleAbsenceSubmit(e) {
    e.preventDefault();
    
    const formData = {
        lastName: document.getElementById('lastName').value.trim(),
        firstName: document.getElementById('firstName').value.trim(),
        middleName: document.getElementById('middleName').value.trim(),
        destination: document.getElementById('destination').value.trim(),
        departureDateTime: document.getElementById('departureDateTime').value
    };
    
    // Валідація даних
    const validation = validateAbsenceData(formData);
    if (!validation.isValid) {
        alert('Помилки при заповненні:\n' + validation.errors.join('\n'));
        return;
    }
    
    const uniqueNumber = generateUniqueNumber(formData.departureDateTime);
    const fullName = `${formData.lastName} ${formData.firstName} ${formData.middleName}`;
    
    // Перевірка на дублікат унікального номера
    if (absences.find(abs => abs.id === uniqueNumber)) {
        alert('Запис з таким часом вже існує. Змініть час на хвилину.');
        return;
    }
    
    const newAbsence = {
        id: uniqueNumber,
        fullName: fullName,
        destination: formData.destination,
        departureDateTime: formData.departureDateTime,
        departureSignature: 'Підписано',
        returnDateTime: null,
        returnSignature: null,
        status: 'active',
        createdAt: new Date().toISOString()
    };
    
    absences.push(newAbsence);
    saveToStorage();
    renderTable();
    
    // Очистка форми
    e.target.reset();
    setCurrentDateTime();
    
    alert(`Відлучення зареєстровано!\nУнікальний номер: ${uniqueNumber}\n\nЗбережіть цей номер для реєстрації повернення.`);
}

/**
 * Реєстрація повернення
 */
function registerReturn() {
    const returnId = document.getElementById('returnId').value.trim();
    const returnDateTime = document.getElementById('returnDateTime').value;
    
    if (!returnId) {
        alert('Будь ласка, введіть унікальний номер!');
        document.getElementById('returnId').focus();
        return;
    }
    
    if (!returnDateTime) {
        alert('Будь ласка, вкажіть дату і час повернення!');
        document.getElementById('returnDateTime').focus();
        return;
    }
    
    const absence = absences.find(abs => abs.id === returnId);
    if (!absence) {
        alert('Запис з таким номером не знайдено!\nПеревірте правильність введеного номера.');
        document.getElementById('returnId').focus();
        return;
    }
    
    if (absence.returnDateTime) {
        alert('Повернення для цього запису вже зареєстровано!\nЧас повернення: ' + formatDateTime(absence.returnDateTime));
        return;
    }
    
    // Перевірка, що час повернення не раніше часу відлучення
    if (new Date(returnDateTime) < new Date(absence.departureDateTime)) {
        alert('Час повернення не може бути раніше часу відлучення!\n' +
              'Час відлучення: ' + formatDateTime(absence.departureDateTime));
        document.getElementById('returnDateTime').focus();
        return;
    }
    
    // Перевірка, що час повернення не в майбутньому (з допуском 5 хвилин)
    const returnTime = new Date(returnDateTime);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    if (returnTime > fiveMinutesFromNow) {
        alert('Час повернення не може бути в майбутньому!');
        document.getElementById('returnDateTime').focus();
        return;
    }
    
    absence.returnDateTime = returnDateTime;
    absence.returnSignature = 'Підписано';
    absence.status = 'completed';
    absence.completedAt = new Date().toISOString();
    
    saveToStorage();
    renderTable();
    
    // Очистка полів
    document.getElementById('returnId').value = '';
    document.getElementById('returnDateTime').value = '';
    setCurrentDateTime();
    
    const duration = calculateDuration(absence.departureDateTime, returnDateTime);
    alert(`Повернення успішно зареєстровано!\n\nТривалість відлучення: ${duration}`);
}

/**
 * Розрахунок тривалості відлучення
 * @param {string} departure - Час відлучення
 * @param {string} return_time - Час повернення
 * @returns {string} Тривалість у читабельному форматі
 */
function calculateDuration(departure, return_time) {
    const start = new Date(departure);
    const end = new Date(return_time);
    const diffMs = end - start;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) {
        return `${minutes} хв`;
    } else if (minutes === 0) {
        return `${hours} год`;
    } else {
        return `${hours} год ${minutes} хв`;
    }
}

/**
 * Відображення таблиці записів
 */
function renderTable() {
    const tbody = document.getElementById('journalBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (absences.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #6c757d; font-style: italic;">
                    📝 Записів немає<br>
                    <small>Додайте перший запис про відлучення</small>
                </td>
            </tr>
        `;
        return;
    }
    
    // Сортування за датою відлучення (найновіші зверху)
    const sortedAbsences = [...absences].sort((a, b) => 
        new Date(b.departureDateTime) - new Date(a.departureDateTime)
    );
    
    sortedAbsences.forEach(absence => {
        const row = document.createElement('tr');
        row.className = absence.status === 'completed' ? 'completed' : 'active';
        
        row.innerHTML = `
            <td><span class="unique-id">${absence.id}</span></td>
            <td>${absence.fullName}</td>
            <td>${absence.destination}</td>
            <td>${formatDateTime(absence.departureDateTime)}</td>
            <td class="signature-cell">${absence.departureSignature}</td>
            <td>${absence.returnDateTime ? formatDateTime(absence.returnDateTime) : ''}</td>
            <td class="${absence.returnSignature ? 'signature-cell' : 'empty-signature'}">
                ${absence.returnSignature || 'Очікується'}
            </td>
            <td>
                <span class="status-badge ${absence.status === 'completed' ? 'status-completed' : 'status-active'}">
                    ${absence.status === 'completed' ? 'Завершено' : 'Активне'}
                </span>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * Ініціалізація застосунку
 */
function initializeApp() {
    console.log('🚀 Ініціалізація журналу відлучень...');
    
    // Завантаження даних
    loadFromStorage();
    
    // Встановлення поточного часу
    setCurrentDateTime();
    
    // Відображення таблиці
    renderTable();
    
    // Додавання обробників подій
    const absenceForm = document.getElementById('absenceForm');
    if (absenceForm) {
        absenceForm.addEventListener('submit', handleAbsenceSubmit);
    }
    
    // Оновлення поточного часу кожну хвилину
    setInterval(() => {
        const returnField = document.getElementById('returnDateTime');
        if (returnField && !returnField.value) {
            setCurrentDateTime();
        }
    }, 60000);
    
    console.log('✅ Журнал відлучень ініціалізовано успішно');
}

/**
 * Експорт даних в CSV формат
 */
function exportToCSV() {
    if (absences.length === 0) {
        alert('Немає даних для експорту');
        return;
    }
    
    const headers = [
        'Унікальний номер',
        'ПІБ',
        'Місце відлучення',
        'Дата відлучення',
        'Час відлучення',
        'Підпис відлучення',
        'Дата повернення',
        'Час повернення',
        'Підпис повернення',
        'Статус',
        'Тривалість'
    ];
    
    const csvContent = [
        headers.join(','),
        ...absences.map(absence => {
            const departureDate = absence.departureDateTime ? new Date(absence.departureDateTime) : null;
            const returnDate = absence.returnDateTime ? new Date(absence.returnDateTime) : null;
            
            const duration = (departureDate && returnDate) ? 
                calculateDuration(absence.departureDateTime, absence.returnDateTime) : '';
            
            return [
                absence.id,
                `"${absence.fullName}"`,
                `"${absence.destination}"`,
                departureDate ? departureDate.toLocaleDateString('uk-UA') : '',
                departureDate ? departureDate.toLocaleTimeString('uk-UA') : '',
                absence.departureSignature || '',
                returnDate ? returnDate.toLocaleDateString('uk-UA') : '',
                returnDate ? returnDate.toLocaleTimeString('uk-UA') : '',
                absence.returnSignature || '',
                absence.status === 'completed' ? 'Завершено' : 'Активне',
                duration
            ].join(',');
        })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `journal_vidluchen_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Пошук записів
 */
function searchRecords() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase().trim();
    if (!searchTerm) {
        renderTable();
        return;
    }
    
    const filteredAbsences = absences.filter(absence => 
        absence.fullName.toLowerCase().includes(searchTerm) ||
        absence.destination.toLowerCase().includes(searchTerm) ||
        absence.id.includes(searchTerm)
    );
    
    renderFilteredTable(filteredAbsences);
}

/**
 * Відображення відфільтрованої таблиці
 */
function renderFilteredTable(filteredAbsences) {
    const tbody = document.getElementById('journalBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (filteredAbsences.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #6c757d; font-style: italic;">
                    🔍 Нічого не знайдено<br>
                    <small>Спробуйте інший пошуковий запит</small>
                </td>
            </tr>
        `;
        return;
    }
    
    // Сортування за датою відлучення (найновіші зверху)
    const sortedAbsences = [...filteredAbsences].sort((a, b) => 
        new Date(b.departureDateTime) - new Date(a.departureDateTime)
    );
    
    sortedAbsences.forEach(absence => {
        const row = document.createElement('tr');
        row.className = absence.status === 'completed' ? 'completed' : 'active';
        
        row.innerHTML = `
            <td><span class="unique-id">${absence.id}</span></td>
            <td>${absence.fullName}</td>
            <td>${absence.destination}</td>
            <td>${formatDateTime(absence.departureDateTime)}</td>
            <td class="signature-cell">${absence.departureSignature}</td>
            <td>${absence.returnDateTime ? formatDateTime(absence.returnDateTime) : ''}</td>
            <td class="${absence.returnSignature ? 'signature-cell' : 'empty-signature'}">
                ${absence.returnSignature || 'Очікується'}
            </td>
            <td>
                <span class="status-badge ${absence.status === 'completed' ? 'status-completed' : 'status-active'}">
                    ${absence.status === 'completed' ? 'Завершено' : 'Активне'}
                </span>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

/**
 * Очищення всіх даних (з підтвердженням)
 */
function clearAllData() {
    if (absences.length === 0) {
        alert('Немає даних для очищення');
        return;
    }
    
    const confirmation = confirm(
        `Ви впевнені, що хочете видалити всі записи?\n\n` +
        `Усього записів: ${absences.length}\n` +
        `Активних: ${absences.filter(a => a.status === 'active').length}\n` +
        `Завершених: ${absences.filter(a => a.status === 'completed').length}\n\n` +
        `Ця дія незворотна!`
    );
    
    if (confirmation) {
        const doubleConfirmation = confirm('Остаточне підтвердження. Видалити ВСІ дані?');
        if (doubleConfirmation) {
            absences = [];
            saveToStorage();
            renderTable();
            alert('Всі дані успішно видалено');
        }
    }
}

// Ініціалізація при завантаженні DOM
document.addEventListener('DOMContentLoaded', initializeApp);

// Глобальні функції для використання в HTML
window.registerReturn = registerReturn;
window.exportToCSV = exportToCSV;
window.searchRecords = searchRecords;
window.clearAllData = clearAllData;