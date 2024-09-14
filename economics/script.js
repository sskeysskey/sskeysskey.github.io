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

    resultsContainer.innerHTML = '';
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

        displayResults('Stock_tag', matchedStocks.tag);
        displayResults('ETF_tag', matchedETFs.tag);
        displayResults('Stock_name', matchedStocks.name);
        displayResults('ETF_name', matchedETFs.name);
        displayResults('Stock_symbol', matchedStocks.symbol);
        displayResults('ETF_symbol', matchedETFs.symbol);
        displayResults('Stock_Description', matchedStocks.description);
        displayResults('ETFs_Description', matchedETFs.description);

    } catch (error) {
        console.error("搜索出错:", error);
        resultsContainer.innerHTML = `<div class="error">搜索时发生错误: ${error.message}</div>`;
    } finally {
        loadingIndicator.style.display = 'none';
    }
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

        // 使用模糊匹配进行symbol匹配
        const symbolExactMatch = keywordsArray.some(k => item.symbol.toLowerCase() === k);
        const symbolPartialMatch = keywordsArray.some(k => item.symbol.toLowerCase().includes(k));
        const symbolFuzzyMatch = keywordsArray.some(k => levenshteinDistance(item.symbol.toLowerCase(), k) <= 1);

        const nameExactMatch = keywordsArray.some(k => item.name && item.name.toLowerCase() === k);
        const namePartialMatch = keywordsArray.some(k => item.name && item.name.toLowerCase().includes(k));
        const nameFuzzyMatch = keywordsArray.some(k => item.name && levenshteinDistance(item.name.toLowerCase(), k) <= 1);

        const tagExactMatch = keywordsArray.some(k => item.tag.some(tag => tag.toLowerCase() === k));
        const tagPartialMatch = keywordsArray.some(k => item.tag.some(tag => tag.toLowerCase().includes(k)));
        const tagFuzzyMatch = keywordsArray.some(k => item.tag.some(tag => levenshteinDistance(tag.toLowerCase(), k) <= 1));

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
            resultsContainer.appendChild(resultElement);
        });
    }
}