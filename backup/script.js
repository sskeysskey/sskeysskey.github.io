console.log("Script loaded. Version: 1.0");

// 页面加载完成后的初始化函数
function initializePage() {
    const searchInput = document.getElementById('searchInput');
    const clearButton = document.getElementById('clearButton');

    // 自动聚焦输入框
    searchInput.focus();

    function toggleClearButton() {
        clearButton.style.display = searchInput.value ? 'block' : 'none';
    }

    searchInput.addEventListener('input', toggleClearButton);

    clearButton.addEventListener('click', function () {
        searchInput.value = '';
        toggleClearButton();
        searchInput.focus();
    });

    // 初始化时检查一次
    toggleClearButton();

    // 监听回车按键进行搜索
    searchInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            startSearch();
        }
    });
}

// 页面加载完成后执行初始化
window.addEventListener('load', initializePage);

// JSON文件路径
const jsonPath = "description.json";
const sectorsPath = "sectors_all.json";
const financePath = "finance.json";

// 全局变量缓存 sectors 和 finance 数据
let sectorsData = null;
let financeData = null;

// 加载 sectors_all.json
async function loadSectors() {
    if (sectorsData) return sectorsData;
    try {
        const response = await fetch(sectorsPath, { mode: 'cors' });
        if (!response.ok) throw new Error(`无法加载 sectors 数据: ${response.status}`);
        sectorsData = await response.json();
        return sectorsData;
    } catch (error) {
        console.error(error);
        alert("加载 sectors 数据时出错。");
    }
}

// 加载 finance.json
async function loadFinance() {
    if (financeData) return financeData;
    try {
        const response = await fetch(financePath, { mode: 'cors' });
        if (!response.ok) throw new Error(`无法加载 finance 数据: ${response.status}`);
        financeData = await response.json();
        return financeData;
    } catch (error) {
        console.error(error);
        alert("加载 finance 数据时出错。");
    }
}

// Levenshtein距离计算函数
function levenshteinDistance(a, b) {
    const an = a ? a.length : 0;
    const bn = b ? b.length : 0;
    if (an === 0) return bn;
    if (bn === 0) return an;

    let matrix = Array(an + 1);
    for (let i = 0; i <= an; i++) {
        matrix[i] = Array(bn + 1).fill(0);
        matrix[i][0] = i;
    }
    for (let j = 0; j <= bn; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= an; i++) {
        for (let j = 1; j <= bn; j++) {
            let cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[an][bn];
}

// 执行搜索
async function startSearch() {
    const keywords = document.getElementById('searchInput').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('results');
    const loadingIndicator = document.getElementById('loading');

    if (!keywords) return;

    loadingIndicator.style.display = 'block';

    try {
        // 读取JSON文件
        const response = await fetch(jsonPath, { mode: 'cors' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const keywordsArray = keywords.split(/\s+/).map(k => k.toLowerCase());

        // 搜索股票和ETF
        const matchedStocks = searchCategory(data.stocks, keywordsArray, 'stocks');
        const matchedETFs = searchCategory(data.etfs, keywordsArray, 'etfs');

        resultsContainer.innerHTML = ''; // 清空搜索中的提示

        let hasResults = false;

        hasResults |= displayResults('Stock_tag', matchedStocks.tag);
        hasResults |= displayResults('ETF_tag', matchedETFs.tag);
        hasResults |= displayResults('Stock_name', matchedStocks.name);
        hasResults |= displayResults('ETF_name', matchedETFs.name);
        hasResults |= displayResults('Stock_symbol', matchedStocks.symbol);
        hasResults |= displayResults('ETF_symbol', matchedETFs.symbol);
        hasResults |= displayResults('Stock_Description', matchedStocks.description);
        hasResults |= displayResults('ETFs_Description', matchedETFs.description);

        if (!hasResults) {
            resultsContainer.innerHTML = '<div class="no-results">没有搜索到任何结果</div>';
        } else {
            // 为所有结果项添加点击事件
            addResultClickListeners();
        }

    } catch (error) {
        console.error("搜索出错:", error);
        resultsContainer.innerHTML = `<div class="error">搜索时发生错误: ${error.message}</div>`;
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// 辅助函数：根据关键字长度决定是否进行模糊匹配
function shouldFuzzyMatch(keyword) {
    return keyword.length > 1;
}

// 搜索特定类别
function searchCategory(items, keywordsArray, category) {
    const results = {
        tag: { exact: [], partial: [], fuzzy: [] },
        name: { exact: [], partial: [], fuzzy: [] },
        symbol: { exact: [], partial: [], fuzzy: [] },
        description: { exact: [], partial: [], fuzzy: [] }
    };

    items.forEach(item => {
        const descriptionText = (item.description1 + ' ' + item.description2).toLowerCase();

        // Symbol匹配
        const symbolExactMatch = keywordsArray.some(k => item.symbol.toLowerCase() === k);
        const symbolPartialMatch = keywordsArray.some(k => item.symbol.toLowerCase().includes(k));
        const symbolFuzzyMatch = keywordsArray.some(k => shouldFuzzyMatch(k) && levenshteinDistance(item.symbol.toLowerCase(), k) <= 1);

        // Name匹配
        const nameExactMatch = keywordsArray.some(k => item.name && item.name.toLowerCase() === k);
        const namePartialMatch = keywordsArray.some(k => item.name && item.name.toLowerCase().includes(k));
        const nameFuzzyMatch = keywordsArray.some(k => shouldFuzzyMatch(k) && item.name && levenshteinDistance(item.name.toLowerCase(), k) <= 1);

        // Tag匹配
        const tagExactMatch = keywordsArray.some(k => item.tag.some(tag => tag.toLowerCase() === k));
        const tagPartialMatch = keywordsArray.some(k => item.tag.some(tag => tag.toLowerCase().includes(k)));
        const tagFuzzyMatch = keywordsArray.some(k => shouldFuzzyMatch(k) && item.tag.some(tag => levenshteinDistance(tag.toLowerCase(), k) <= 1));

        // Symbol结果分类
        if (symbolExactMatch) {
            results.symbol.exact.push(`${item.symbol} - ${item.name} - ${item.tag.join(', ')}`);
        } else if (symbolPartialMatch) {
            results.symbol.partial.push(`${item.symbol} - ${item.name} - ${item.tag.join(', ')}`);
        } else if (symbolFuzzyMatch) {
            results.symbol.fuzzy.push(`${item.symbol} - ${item.name} - ${item.tag.join(', ')}`);
        }

        // Name结果分类
        if (nameExactMatch) {
            results.name.exact.push(`${item.symbol} - ${item.name} - ${item.tag.join(', ')}`);
        } else if (namePartialMatch) {
            results.name.partial.push(`${item.symbol} - ${item.name} - ${item.tag.join(', ')}`);
        } else if (nameFuzzyMatch) {
            results.name.fuzzy.push(`${item.symbol} - ${item.name} - ${item.tag.join(', ')}`);
        }

        // Tag结果分类
        if (tagExactMatch) {
            results.tag.exact.push(`${item.symbol} - ${item.name} - ${item.tag.join(', ')}`);
        } else if (tagPartialMatch) {
            results.tag.partial.push(`${item.symbol} - ${item.name} - ${item.tag.join(', ')}`);
        } else if (tagFuzzyMatch) {
            results.tag.fuzzy.push(`${item.symbol} - ${item.name} - ${item.tag.join(', ')}`);
        }

        // Description匹配
        if (keywordsArray.every(k => descriptionText.includes(k))) {
            results.description.exact.push(`${item.symbol} - ${item.name || ''} - ${item.tag.join(', ')}`);
        }
    });

    return results;
}

// 显示搜索结果
function displayResults(category, results) {
    const resultsContainer = document.getElementById('results');
    if (
        results.exact.length > 0 ||
        results.partial.length > 0 ||
        results.fuzzy.length > 0
    ) {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'result-category';
        categoryElement.textContent = category;
        resultsContainer.appendChild(categoryElement);

        // 按顺序合并结果
        const combinedResults = [...results.exact, ...results.partial, ...results.fuzzy];

        combinedResults.forEach(result => {
            const resultElement = document.createElement('div');
            resultElement.className = 'result-item';
            resultElement.textContent = result;
            // 设置 data-symbol 属性以存储 symbol
            const symbol = result.split(' - ')[0];
            resultElement.setAttribute('data-symbol', symbol.toUpperCase());
            resultElement.style.cursor = 'pointer'; // 显示为可点击
            resultsContainer.appendChild(resultElement);
        });

        return true; // 表示有结果
    }
    return false; // 表示没有结果
}

// 为搜索结果项添加点击事件监听器
function addResultClickListeners() {
    const resultItems = document.querySelectorAll('.result-item');
    resultItems.forEach(item => {
        item.addEventListener('click', handleItemClick);
    });
}

async function handleItemClick(event) {
    event.preventDefault(); // 防止默认行为
    // 添加这个检查
    if (document.body.classList.contains('modal-open')) {
        return; // 如果模态框已经打开，不执行任何操作
    }

    const symbol = this.getAttribute('data-symbol');
    if (!symbol) {
        alert("无效的股票代码。");
        return;
    }

    // 显示加载提示
    const chartLoading = document.getElementById('chartLoading');
    chartLoading.style.display = 'block';

    try {
        // 加载 sectors 和 finance 数据
        const sectors = await loadSectors();
        const finance = await loadFinance();

        if (!sectors || !finance) {
            throw new Error("无法加载必要的数据。");

        }

        // 查找 symbol 对应的 sector
        let sectorFound = null;
        for (const [sector, symbols] of Object.entries(sectors)) {
            // 注意：确保 symbol 与 sectors 的符号类型一致（可能大小写或格式不同）
            if (symbols.map(s => s.toUpperCase()).includes(symbol.toUpperCase())) {
                sectorFound = sector;
                break;
            }
        }

        if (!sectorFound) {
            alert(`未找到 symbol "${symbol}" 对应的 sector。`);
            return;
        }

        // 从 finance 数据中获取该 sector 和 symbol 的数据
        if (!finance[sectorFound]) {
            alert(`Finance 数据中未包含 sector "${sectorFound}"。`);
            return;
        }

        const symbolData = finance[sectorFound].filter(item => item.name.toUpperCase() === symbol.toUpperCase());
        if (symbolData.length === 0) {
            alert(`Finance 数据中未找到 symbol "${symbol}" 的数据。`);
            return;
        }

        // 假设 finance.json 中每个 symbol 只有一条记录，如果有多条，可根据需要调整
        // 如果有多条记录，例如不同日期，可以累积成多个数据点
        // 这里假设有多条记录，根据日期排序后绘制价格走势图

        // 准备数据
        const sortedData = symbolData.sort((a, b) => new Date(a.date) - new Date(b.date));
        const labels = sortedData.map(item => item.date);
        const prices = sortedData.map(item => item.price);

        // 绘制图表
        drawChart(`${symbol} 价格走势图`, labels, prices);
    } catch (error) {
        alert(error.message);
    } finally {
        // 隐藏加载提示
        chartLoading.style.display = 'none';
    }
}

// 绘制Chart.js图表
function drawChart(title, labels, data) {
    const ctx = document.getElementById('priceChart').getContext('2d');

    // 释放之前的图表实例（如果有）
    if (window.priceChartInstance) {
        window.priceChartInstance.destroy();
    }

    // 检测是否为移动设备
    const isMobile = window.innerWidth <= 768;

    window.priceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '价格趋势',
                data: data,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                fill: true,
                tension: 0.1,
                borderWidth: isMobile ? 1 : 2, // 在移动设备上使用更细的线条
                pointRadius: 0, // 移除数据点
                pointHitRadius: 5 // 增加点击/触摸区域，但不显示点
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function (context) {
                            return '价格: $' + context.parsed.y.toFixed(2);
                        }
                    }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        display: false // 隐藏 X 轴刻度
                    }
                },
                y: {
                    display: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        display: false // 隐藏 Y 轴刻度
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                intersect: false,
                axis: 'x'
            },
            elements: {
                line: {
                    borderWidth: isMobile ? 1 : 2 // 在移动设备上使用更细的线条
                }
            }
        }
    });

    // 设置模态框标题
    document.getElementById('chartModalLabel').textContent = title;

    // 显示模态框
    const chartModal = new bootstrap.Modal(document.getElementById('chartModal'));
    chartModal.show();

    // 添加这段新代码
    document.getElementById('chartModal').addEventListener('hidden.bs.modal', function () {
        document.body.classList.remove('modal-open');
        const modalBackdrop = document.querySelector('.modal-backdrop');
        if (modalBackdrop) {
            modalBackdrop.remove();
        }
    });
}