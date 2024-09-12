document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultArea = document.getElementById('resultArea');

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    async function performSearch() {
        const keywords = searchInput.value.trim();
        if (keywords === '') return;

        showLoading(true);
        clearResults();

        try {
            const response = await fetch('Description.json');
            const data = await response.json();
            const results = searchJson(data, keywords);
            displayResults(results);
        } catch (error) {
            console.error('Error fetching or parsing data:', error);
            resultArea.innerHTML = '<p>An error occurred while searching. Please try again later.</p>';
        }

        showLoading(false);
    }

    function showLoading(show) {
        loadingIndicator.style.display = show ? 'block' : 'none';
        searchButton.disabled = show;
        searchInput.disabled = show;
    }

    function clearResults() {
        resultArea.innerHTML = '';
    }

    function searchJson(data, keywords) {
        const keywordsLower = keywords.toLowerCase().split(/\s+/);

        function searchCategory(category, isStock) {
            return data[category].filter(item =>
                keywordsLower.every(keyword =>
                    (item.description1 + ' ' + item.description2).toLowerCase().includes(keyword)
                )
            ).map(item => ({
                symbol: item.symbol,
                name: isStock ? item.name : '',
                tags: item.tag.join(', ')
            }));
        }

        return {
            stocks: searchCategory('stocks', true),
            etfs: searchCategory('etfs', false)
        };
    }

    function displayResults(results) {
        const categories = [
            { name: 'Stock_tag', data: results.stocks, isStock: true },
            { name: 'ETF_tag', data: results.etfs, isStock: false },
            { name: 'Stock_symbol', data: results.stocks, isStock: true },
            { name: 'ETF_symbol', data: results.etfs, isStock: false },
            { name: 'Stock_name', data: results.stocks, isStock: true },
            { name: 'ETF_name', data: results.etfs, isStock: false },
            { name: 'Stock_Description', data: results.stocks, isStock: true },
            { name: 'ETFs_Description', data: results.etfs, isStock: false }
        ];

        categories.forEach(category => {
            if (category.data.length > 0) {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'result-category';
                categoryDiv.innerHTML = `<h2>${category.name}</h2>`;

                category.data.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'result-item';
                    const content = category.isStock
                        ? `${item.symbol} - ${item.name} - ${item.tags}`
                        : `${item.symbol} - ${item.tags}`;
                    itemDiv.innerHTML = `<p class="${category.isStock ? 'stock-result' : 'etf-result'}">${content}</p>`;
                    categoryDiv.appendChild(itemDiv);
                });

                resultArea.appendChild(categoryDiv);
            }
        });

        if (resultArea.innerHTML === '') {
            resultArea.innerHTML = '<p>No results found.</p>';
        }
    }
});