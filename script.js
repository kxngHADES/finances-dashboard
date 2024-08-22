// Data structure
let financialData = {
    income: [],
    expenses: []
};

// Load data from local storage
function loadData() {
    const storedData = localStorage.getItem('financialData');
    if (storedData) {
        financialData = JSON.parse(storedData);
    }
}

// Save data to local storage
function saveData() {
    localStorage.setItem('financialData', JSON.stringify(financialData));
}

// Add these variables at the top of your script
let currentCurrency = '$';
let startDate = null;
let endDate = null;

// Modify the addTransaction function
function addTransaction(type, amount, category, date) {
    financialData[type].push({ amount: parseFloat(amount), category, date, currency: currentCurrency });
    saveData();
    location.reload();
}

// Add this function to format the date
function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

// Modify the updateDashboard function
function updateDashboard() {
    const { totalIncome, totalExpenses, incomeCategories, expenseCategories, months } = processData();
    updateBalanceChart(totalIncome, totalExpenses);
    updateCategoryCharts(incomeCategories, expenseCategories);
    updateMonthlyChart(months);
    updateBudgetSummary(totalIncome, totalExpenses);
    updateCurrencyDisplay();
}

// Add this function to update the currency display
function updateCurrencyDisplay() {
    document.querySelectorAll('.currency-display').forEach(el => {
        el.textContent = currentCurrency;
    });
}

// Modify the processData function
function processData() {
    const incomeCategories = {};
    const expenseCategories = {};
    const months = {};
    let totalIncome = 0;
    let totalExpenses = 0;

    financialData.income.concat(financialData.expenses).forEach(item => {
        const itemDate = new Date(item.date);
        if ((startDate === null || itemDate >= startDate) && (endDate === null || itemDate <= endDate)) {
            const isIncome = financialData.income.includes(item);
            const amount = item.amount;

            if (isIncome) {
                totalIncome += amount;
                incomeCategories[item.category] = (incomeCategories[item.category] || 0) + amount;
            } else {
                totalExpenses += amount;
                expenseCategories[item.category] = (expenseCategories[item.category] || 0) + amount;
            }

            const month = itemDate.toLocaleString('default', { month: 'long' });
            if (!months[month]) {
                months[month] = { income: 0, expenses: 0 };
            }
            months[month][isIncome ? 'income' : 'expenses'] += amount;
        }
    });

    return { totalIncome, totalExpenses, incomeCategories, expenseCategories, months };
}

// Update balance chart
function updateBalanceChart(totalIncome, totalExpenses) {
    const ctx = document.getElementById('balance-chart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                data: [totalIncome, totalExpenses],
                backgroundColor: ['#28a745', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            title: {
                display: true,
                text: 'Income vs Expenses'
            }
        }
    });
}

// Update category charts
function updateCategoryCharts(incomeCategories, expenseCategories) {
    updateCategoryChart('income-category-chart', incomeCategories, 'Income by Category', ['#28a745', '#34ce57', '#40d869', '#4ce07b', '#58e88d']);
    updateCategoryChart('expense-category-chart', expenseCategories, 'Expenses by Category', ['#dc3545', '#e04c5a', '#e4636f', '#e87a84', '#ec9199']);
}

// Update single category chart
function updateCategoryChart(chartId, categories, title, colorPalette) {
    const ctx = document.getElementById(chartId).getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: colorPalette
            }]
        },
        options: {
            responsive: true,
            title: {
                display: true,
                text: title
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        const dataset = data.datasets[tooltipItem.datasetIndex];
                        const value = dataset.data[tooltipItem.index];
                        return `${data.labels[tooltipItem.index]}: ${currentCurrency}${value.toFixed(2)}`;
                    }
                }
            }
        }
    });
}

// Update monthly chart
function updateMonthlyChart(months) {
    const ctx = document.getElementById('monthly-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(months),
            datasets: [
                {
                    label: 'Income',
                    data: Object.values(months).map(m => m.income),
                    backgroundColor: '#28a745'
                },
                {
                    label: 'Expenses',
                    data: Object.values(months).map(m => m.expenses),
                    backgroundColor: '#dc3545'
                }
            ]
        },
        options: {
            responsive: true,
            title: {
                display: true,
                text: 'Monthly Income and Expenses'
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        callback: function(value, index, values) {
                            return currentCurrency + value;
                        }
                    }
                }]
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        let label = data.datasets[tooltipItem.datasetIndex].label || '';
                        if (label) {
                            label += ': ';
                        }
                        label += currentCurrency + tooltipItem.yLabel.toFixed(2);
                        return label;
                    }
                }
            }
        }
    });
}

// Update budget summary
function updateBudgetSummary(totalIncome, totalExpenses) {
    const balance = totalIncome - totalExpenses;
    document.getElementById('budget-summary').innerHTML = `
        <h3>Budget Summary</h3>
        <p>Total Income: <span class="currency-display">${currentCurrency}</span>${totalIncome.toFixed(2)}</p>
        <p>Total Expenses: <span class="currency-display">${currentCurrency}</span>${totalExpenses.toFixed(2)}</p>
        <p>Balance: <span class="currency-display">${currentCurrency}</span>${balance.toFixed(2)}</p>
    `;
}

// Download budget summary
function downloadBudgetSummary() {
    const { totalIncome, totalExpenses } = processData();
    const balance = totalIncome - totalExpenses;

    // Create a temporary div to hold our summary
    const summaryDiv = document.createElement('div');
    summaryDiv.innerHTML = `
        <h2>Budget Summary</h2>
        <p>Total Income: ${currentCurrency}${totalIncome.toFixed(2)}</p>
        <p>Total Expenses: ${currentCurrency}${totalExpenses.toFixed(2)}</p>
        <p>Balance: ${currentCurrency}${balance.toFixed(2)}</p>
    `;

    // Apply styles to the summary div
    summaryDiv.style.fontFamily = "'Orbitron', sans-serif";
    summaryDiv.style.color = '#0ff';
    summaryDiv.style.backgroundColor = 'rgba(0, 20, 40, 0.8)';
    summaryDiv.style.padding = '20px';
    summaryDiv.style.borderRadius = '10px';
    summaryDiv.style.border = '1px solid #0ff';
    summaryDiv.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.3)';
    summaryDiv.style.width = '300px';
    summaryDiv.style.margin = '0 auto';

    // Append the summary div to the body temporarily
    document.body.appendChild(summaryDiv);

    // Use html2canvas to capture the summary div as an image
    html2canvas(summaryDiv).then(canvas => {
        // Remove the temporary div
        document.body.removeChild(summaryDiv);

        // Create PDF
        const pdf = new jspdf.jsPDF();
        
        // Add the captured image to the PDF
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, 190, 0);

        // Save the PDF
        pdf.save('budget_summary.pdf');
    });
}

// Save data to device
function saveDataToDevice() {
    const dataStr = JSON.stringify(financialData);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.download = 'finance_data.json';
    link.href = url;
    link.click();
}

// Load data from device
function loadDataFromDevice() {
    document.getElementById('file-input').click();
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            financialData = JSON.parse(e.target.result);
            saveData();
            location.reload(); // Reload the page to update all data
        } catch (error) {
            alert('Error loading data. Please make sure the file is valid.');
        }
    };
    reader.readAsText(file);
}

// Modify the updateCurrency function
function updateCurrency() {
    const currencySelect = document.getElementById('currency');
    const selectedCurrency = currencies.find(c => c.symbol === currencySelect.value);
    currentCurrency = selectedCurrency.symbol;
    updateDashboard();
}

// Add this function to update the date range
function updateDateRange() {
    startDate = new Date(document.getElementById('start-date').value);
    endDate = new Date(document.getElementById('end-date').value);
    endDate.setHours(23, 59, 59, 999); // Set to end of day
    updateDashboard();
}

const currencies = [
    { code: 'USD', symbol: '$', name: 'United States Dollar', country: 'United States' },
    { code: 'EUR', symbol: '€', name: 'Euro', country: 'European Union' },
    { code: 'GBP', symbol: '£', name: 'British Pound Sterling', country: 'United Kingdom' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', country: 'Japan' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', country: 'Australia' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', country: 'Canada' },
    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', country: 'Switzerland' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', country: 'China' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', country: 'Sweden' },
    { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', country: 'New Zealand' },
    { code: 'MXN', symbol: '$', name: 'Mexican Peso', country: 'Mexico' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', country: 'Singapore' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', country: 'Hong Kong' },
    { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', country: 'Norway' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won', country: 'South Korea' },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira', country: 'Turkey' },
    { code: 'RUB', symbol: '₽', name: 'Russian Ruble', country: 'Russia' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', country: 'India' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', country: 'Brazil' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand', country: 'South Africa' },
    { code: 'AED', symbol: 'د.إ', name: 'United Arab Emirates Dirham', country: 'United Arab Emirates' },
    { code: 'AFN', symbol: '؋', name: 'Afghan Afghani', country: 'Afghanistan' },
    { code: 'ALL', symbol: 'L', name: 'Albanian Lek', country: 'Albania' },
    { code: 'AMD', symbol: '֏', name: 'Armenian Dram', country: 'Armenia' },
    { code: 'ANG', symbol: 'ƒ', name: 'Netherlands Antillean Guilder', country: 'Netherlands Antilles' },
    { code: 'AOA', symbol: 'Kz', name: 'Angolan Kwanza', country: 'Angola' },
    { code: 'ARS', symbol: '$', name: 'Argentine Peso', country: 'Argentina' },
    { code: 'AWG', symbol: 'ƒ', name: 'Aruban Florin', country: 'Aruba' },
    { code: 'AZN', symbol: '₼', name: 'Azerbaijani Manat', country: 'Azerbaijan' },
    { code: 'BAM', symbol: 'KM', name: 'Bosnia-Herzegovina Convertible Mark', country: 'Bosnia and Herzegovina' },
    { code: 'BBD', symbol: '$', name: 'Barbadian Dollar', country: 'Barbados' },
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', country: 'Bangladesh' },
    { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev', country: 'Bulgaria' },
    { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar', country: 'Bahrain' },
    { code: 'BIF', symbol: 'FBu', name: 'Burundian Franc', country: 'Burundi' },
    { code: 'BMD', symbol: '$', name: 'Bermudan Dollar', country: 'Bermuda' },
    { code: 'BND', symbol: '$', name: 'Brunei Dollar', country: 'Brunei' },
    { code: 'BOB', symbol: 'Bs.', name: 'Bolivian Boliviano', country: 'Bolivia' },
    { code: 'BSD', symbol: '$', name: 'Bahamian Dollar', country: 'Bahamas' },
    { code: 'BTN', symbol: 'Nu.', name: 'Bhutanese Ngultrum', country: 'Bhutan' },
    { code: 'BWP', symbol: 'P', name: 'Botswanan Pula', country: 'Botswana' },
    { code: 'BYN', symbol: 'Br', name: 'Belarusian Ruble', country: 'Belarus' },
    { code: 'BZD', symbol: 'BZ$', name: 'Belize Dollar', country: 'Belize' },
    { code: 'CDF', symbol: 'FC', name: 'Congolese Franc', country: 'Democratic Republic of the Congo' },
    { code: 'CLF', symbol: 'UF', name: 'Chilean Unit of Account (UF)', country: 'Chile' },
    { code: 'CLP', symbol: '$', name: 'Chilean Peso', country: 'Chile' },
    { code: 'COP', symbol: '$', name: 'Colombian Peso', country: 'Colombia' },
    { code: 'CRC', symbol: '₡', name: 'Costa Rican Colón', country: 'Costa Rica' },
    { code: 'CUC', symbol: '$', name: 'Cuban Convertible Peso', country: 'Cuba' },
    { code: 'CUP', symbol: '₱', name: 'Cuban Peso', country: 'Cuba' },
    { code: 'CVE', symbol: '$', name: 'Cape Verdean Escudo', country: 'Cape Verde' },
    { code: 'CZK', symbol: 'Kč', name: 'Czech Republic Koruna', country: 'Czech Republic' },
    { code: 'DJF', symbol: 'Fdj', name: 'Djiboutian Franc', country: 'Djibouti' },
    { code: 'DKK', symbol: 'kr', name: 'Danish Krone', country: 'Denmark' },
    { code: 'DOP', symbol: 'RD$', name: 'Dominican Peso', country: 'Dominican Republic' },
    { code: 'DZD', symbol: 'د.ج', name: 'Algerian Dinar', country: 'Algeria' },
    { code: 'EGP', symbol: '£', name: 'Egyptian Pound', country: 'Egypt' },
    { code: 'ERN', symbol: 'Nfk', name: 'Eritrean Nakfa', country: 'Eritrea' },
    { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr', country: 'Ethiopia' },
    { code: 'FJD', symbol: '$', name: 'Fijian Dollar', country: 'Fiji' },
    { code: 'FKP', symbol: '£', name: 'Falkland Islands Pound', country: 'Falkland Islands' },
    { code: 'GEL', symbol: '₾', name: 'Georgian Lari', country: 'Georgia' },
    { code: 'GGP', symbol: '£', name: 'Guernsey Pound', country: 'Guernsey' },
    { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', country: 'Ghana' },
    { code: 'GIP', symbol: '£', name: 'Gibraltar Pound', country: 'Gibraltar' },
    { code: 'GMD', symbol: 'D', name: 'Gambian Dalasi', country: 'Gambia' },
    { code: 'GNF', symbol: 'FG', name: 'Guinean Franc', country: 'Guinea' },
    { code: 'GTQ', symbol: 'Q', name: 'Guatemalan Quetzal', country: 'Guatemala' },
    { code: 'GYD', symbol: '$', name: 'Guyanaese Dollar', country: 'Guyana' },
    { code: 'HNL', symbol: 'L', name: 'Honduran Lempira', country: 'Honduras' },
    { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna', country: 'Croatia' },
    { code: 'HTG', symbol: 'G', name: 'Haitian Gourde', country: 'Haiti' },
    { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', country: 'Hungary' },
    { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', country: 'Indonesia' },
    { code: 'ILS', symbol: '₪', name: 'Israeli New Sheqel', country: 'Israel' },
    { code: 'IMP', symbol: '£', name: 'Manx pound', country: 'Isle of Man' },
    { code: 'IQD', symbol: 'ع.د', name: 'Iraqi Dinar', country: 'Iraq' },
    { code: 'IRR', symbol: '﷼', name: 'Iranian Rial', country: 'Iran' },
    { code: 'ISK', symbol: 'kr', name: 'Icelandic Króna', country: 'Iceland' },
    { code: 'JEP', symbol: '£', name: 'Jersey Pound', country: 'Jersey' },
    { code: 'JMD', symbol: 'J$', name: 'Jamaican Dollar', country: 'Jamaica' },
    { code: 'JOD', symbol: 'د.ا', name: 'Jordanian Dinar', country: 'Jordan' },
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', country: 'Kenya' },
    { code: 'KGS', symbol: 'лв', name: 'Kyrgystani Som', country: 'Kyrgyzstan' },
    { code: 'KHR', symbol: '៛', name: 'Cambodian Riel', country: 'Cambodia' },
    { code: 'KMF', symbol: 'CF', name: 'Comorian Franc', country: 'Comoros' },
    { code: 'KPW', symbol: '₩', name: 'North Korean Won', country: 'North Korea' },
    { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar', country: 'Kuwait' },
    { code: 'KYD', symbol: '$', name: 'Cayman Islands Dollar', country: 'Cayman Islands' },
    { code: 'KZT', symbol: '₸', name: 'Kazakhstani Tenge', country: 'Kazakhstan' },
    { code: 'LAK', symbol: '₭', name: 'Laotian Kip', country: 'Laos' },
    { code: 'LBP', symbol: 'ل.ل', name: 'Lebanese Pound', country: 'Lebanon' },
    { code: 'LKR', symbol: '₨', name: 'Sri Lankan Rupee', country: 'Sri Lanka' },
    { code: 'LRD', symbol: '$', name: 'Liberian Dollar', country: 'Liberia' },
    { code: 'LSL', symbol: 'L', name: 'Lesotho Loti', country: 'Lesotho' },
    { code: 'LYD', symbol: 'ل.د', name: 'Libyan Dinar', country: 'Libya' },
    { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham', country: 'Morocco' },
    { code: 'MDL', symbol: 'L', name: 'Moldovan Leu', country: 'Moldova' },
    { code: 'MGA', symbol: 'Ar', name: 'Malagasy Ariary', country: 'Madagascar' },
    { code: 'MKD', symbol: 'ден', name: 'Macedonian Denar', country: 'North Macedonia' },
    { code: 'MMK', symbol: 'K', name: 'Myanma Kyat', country: 'Myanmar' },
    { code: 'MNT', symbol: '₮', name: 'Mongolian Tugrik', country: 'Mongolia' },
    { code: 'MOP', symbol: 'P', name: 'Macanese Pataca', country: 'Macau' },
    { code: 'MRU', symbol: 'UM', name: 'Mauritanian Ouguiya', country: 'Mauritania' },
    { code: 'MUR', symbol: '₨', name: 'Mauritian Rupee', country: 'Mauritius' },
    { code: 'MVR', symbol: '.ރ', name: 'Maldivian Rufiyaa', country: 'Maldives' },
    { code: 'MWK', symbol: 'MK', name: 'Malawian Kwacha', country: 'Malawi' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', country: 'Malaysia' },
    { code: 'MZN', symbol: 'MT', name: 'Mozambican Metical', country: 'Mozambique' },
    { code: 'NAD', symbol: '$', name: 'Namibian Dollar', country: 'Namibia' },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', country: 'Nigeria' },
    { code: 'NIO', symbol: 'C$', name: 'Nicaraguan Córdoba', country: 'Nicaragua' },
    { code: 'NPR', symbol: '₨', name: 'Nepalese Rupee', country: 'Nepal' },
    { code: 'OMR', symbol: 'ر.ع.', name: 'Omani Rial', country: 'Oman' },
    { code: 'PAB', symbol: 'B/.', name: 'Panamanian Balboa', country: 'Panama' },
    { code: 'PEN', symbol: 'S/.', name: 'Peruvian Sol', country: 'Peru' },
    { code: 'PGK', symbol: 'K', name: 'Papua New Guinean Kina', country: 'Papua New Guinea' },
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso', country: 'Philippines' },
    { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', country: 'Pakistan' },
    { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', country: 'Poland' },
    { code: 'PYG', symbol: '₲', name: 'Paraguayan Guarani', country: 'Paraguay' },
    { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal', country: 'Qatar' },
    { code: 'RON', symbol: 'lei', name: 'Romanian Leu', country: 'Romania' },
    { code: 'RSD', symbol: 'дин', name: 'Serbian Dinar', country: 'Serbia' },
    { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc', country: 'Rwanda' },
    { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal', country: 'Saudi Arabia' },
    { code: 'SBD', symbol: '$', name: 'Solomon Islands Dollar', country: 'Solomon Islands' },
    { code: 'SCR', symbol: '₨', name: 'Seychellois Rupee', country: 'Seychelles' },
    { code: 'SDG', symbol: 'ج.س.', name: 'Sudanese Pound', country: 'Sudan' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', country: 'Sweden' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', country: 'Singapore' },
    { code: 'SHP', symbol: '£', name: 'Saint Helena Pound', country: 'Saint Helena' },
    { code: 'SLL', symbol: 'Le', name: 'Sierra Leonean Leone', country: 'Sierra Leone' },
    { code: 'SOS', symbol: 'Sh', name: 'Somali Shilling', country: 'Somalia' },
    { code: 'SRD', symbol: '$', name: 'Surinamese Dollar', country: 'Suriname' },
    { code: 'SSP', symbol: '£', name: 'South Sudanese Pound', country: 'South Sudan' },
    { code: 'STD', symbol: 'Db', name: 'São Tomé and Príncipe Dobra', country: 'São Tomé and Príncipe' },
    { code: 'SYP', symbol: 'ل.س', name: 'Syrian Pound', country: 'Syria' },
    { code: 'SZL', symbol: 'L', name: 'Swazi Lilangeni', country: 'Eswatini' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht', country: 'Thailand' },
    { code: 'TJS', symbol: 'SM', name: 'Tajikistani Somoni', country: 'Tajikistan' },
    { code: 'TMT', symbol: 'm', name: 'Turkmenistan Manat', country: 'Turkmenistan' },
    { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar', country: 'Tunisia' },
    { code: 'TOP', symbol: 'T$', name: 'Tongan Paʻanga', country: 'Tonga' },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira', country: 'Turkey' },
    { code: 'TTD', symbol: 'TT$', name: 'Trinidad and Tobago Dollar', country: 'Trinidad and Tobago' },
    { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar', country: 'Taiwan' },
    { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', country: 'Tanzania' },
    { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia', country: 'Ukraine' },
    { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', country: 'Uganda' },
    { code: 'USD', symbol: '$', name: 'United States Dollar', country: 'United States' },
    { code: 'UYU', symbol: '$U', name: 'Uruguayan Peso', country: 'Uruguay' },
    { code: 'UZS', symbol: 'so\'m', name: 'Uzbekistan Som', country: 'Uzbekistan' },
    { code: 'VEF', symbol: 'Bs', name: 'Venezuelan Bolívar', country: 'Venezuela' },
    { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', country: 'Vietnam' },
    { code: 'VUV', symbol: 'Vt', name: 'Vanuatu Vatu', country: 'Vanuatu' },
    { code: 'WST', symbol: 'WS$', name: 'Samoan Tala', country: 'Samoa' },
    { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', country: 'Central African Republic' },
    { code: 'XCD', symbol: 'EC$', name: 'East Caribbean Dollar', country: 'Eastern Caribbean' },
    { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', country: 'Benin, Burkina Faso, Guinea-Bissau, Ivory Coast, Mali, Niger, Senegal, Togo' },
    { code: 'XPF', symbol: '₣', name: 'CFP Franc', country: 'French Polynesia, New Caledonia, Wallis and Futuna' },
    { code: 'YER', symbol: '﷼', name: 'Yemeni Rial', country: 'Yemen' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand', country: 'South Africa' },
    { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha', country: 'Zambia' }
];

// Sort currencies by country name
currencies.sort((a, b) => a.country.localeCompare(b.country));

// Add this function to populate the currency select
function populateCurrencySelect() {
    const select = document.getElementById('currency');
    currencies.forEach(currency => {
        const option = document.createElement('option');
        option.value = currency.symbol;
        option.textContent = `${currency.country} - ${currency.code} (${currency.name})`;
        select.appendChild(option);
    });
}

// Add this function to filter currencies
function filterCurrencies() {
    const input = document.getElementById('currency-search');
    const filter = input.value.toUpperCase();
    const select = document.getElementById('currency');
    const options = select.getElementsByTagName('option');

    for (let i = 0; i < options.length; i++) {
        const txtValue = options[i].textContent;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            options[i].style.display = "";
        } else {
            options[i].style.display = "none";
        }
    }
}

// Modify the init function
function init() {
    loadData();
    populateCurrencySelect();
    updateDashboard();
    
    // Add event listeners
    document.getElementById('transaction-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const type = document.getElementById('type').value;
        const amount = document.getElementById('amount').value;
        const category = document.getElementById('category').value;
        const date = formatDate(document.getElementById('date').value);
        addTransaction(type, amount, category, date);
    });

    document.getElementById('currency').addEventListener('change', updateCurrency);
    document.getElementById('currency-search').addEventListener('input', filterCurrencies);

    document.getElementById('save-btn').addEventListener('click', saveDataToDevice);
    document.getElementById('load-btn').addEventListener('click', loadDataFromDevice);
    document.getElementById('file-input').addEventListener('change', handleFileUpload);
    document.getElementById('download-summary-btn').addEventListener('click', downloadBudgetSummary);

    // Load required libraries
    window.jspdf = window.jspdf || {};
    if (typeof window.jspdf.jsPDF !== 'function') {
        console.error('jsPDF library not loaded');
    }
    if (typeof html2canvas !== 'function') {
        console.error('html2canvas library not loaded');
    }
}

// Call init when the page loads
window.onload = init;