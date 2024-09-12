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

// 监听回车按键进行搜索
document.getElementById('searchInput').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        startSearch();
    }
});

// 执行搜索
async function startSearch() {
    const keywords = document.getElementById('searchInput').value.toLowerCase().trim();
    const resultsContainer = document.getElementById('results');
    const loadingIndicator = document.getElementById('loading');

    if (!keywords) return;

    resultsContainer.innerHTML = '';
    loadingIndicator.style.display = 'block';

    // 读取JSON文件
    const response = await fetch(jsonPath);
    const data = await response.json();

    const keywordsArray = keywords.split(/\s+/).map(k => k.toLowerCase());

    // 搜索股票和ETF
    const matchedStocks = searchCategory(data.stocks, keywordsArray, 'stocks');
    const matchedETFs = searchCategory(data.etfs, keywordsArray, 'etfs');

    displayResults('Stock_tag', matchedStocks.tag);
    displayResults('ETF_tag', matchedETFs.tag);
    displayResults('Stock_symbol', matchedStocks.symbol);
    displayResults('ETF_symbol', matchedETFs.symbol);
    displayResults('Stock_name', matchedStocks.name);
    displayResults('ETF_name', matchedETFs.name);
    displayResults('Stock_Description', matchedStocks.description);
    displayResults('ETFs_Description', matchedETFs.description);

    loadingIndicator.style.display = 'none';
}

// 搜索特定类别
function searchCategory(items, keywordsArray, category) {
    const results = {
        tag: [],
        name: [],
        symbol: [],
        description: []
    };

    items.forEach(item => {
        const descriptionText = (item.description1 + ' ' + item.description2).toLowerCase();

        // 使用模糊匹配进行symbol匹配
        const symbolMatch = keywordsArray.some(k => levenshteinDistance(item.symbol.toLowerCase(), k) <= 1);
        const nameMatch = keywordsArray.some(k => item.name && item.name.toLowerCase().includes(k));
        const tagMatch = keywordsArray.some(k => item.tag.some(tag => tag.toLowerCase().includes(k)));

        // 如果symbol匹配，将name和tag一起显示
        if (symbolMatch) {
            results.symbol.push(`${item.symbol} - ${item.name} - ${item.tag.join(', ')}`);
        }

        // 如果description匹配
        if (keywordsArray.every(k => descriptionText.includes(k))) {
            results.description.push(`${item.symbol} - ${item.name || ''} - ${item.tag.join(', ')}`);
        }

        // 如果name匹配，将symbol和tag一起显示
        if (nameMatch) {
            results.name.push(`${item.symbol} - ${item.name} - ${item.tag.join(', ')}`);
        }

        // 如果tag匹配，将symbol和name一起显示
        if (tagMatch) {
            results.tag.push(`${item.symbol} - ${item.name} - ${item.tag.join(', ')}`);
        }
    });

    return results;
}

// 显示搜索结果
function displayResults(category, results) {
    const resultsContainer = document.getElementById('results');
    if (results.length > 0) {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'result-category';
        categoryElement.textContent = category;
        resultsContainer.appendChild(categoryElement);

        results.forEach(result => {
            const resultElement = document.createElement('div');
            resultElement.className = 'result-item';
            resultElement.textContent = result;
            resultsContainer.appendChild(resultElement);
        });
    }
}