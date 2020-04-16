function simulate(numIterations, numShards, shardType, event) {
    const summary = {};
    for (let i = 0; i < numIterations; i++) {
        const iterationSummary = simulateIteration(numShards, shardType, event);
        const resultShardTypes = Object.keys(iterationSummary);
        for (const shardType of resultShardTypes) {
            if (!summary[shardType]) summary[shardType] = new Array(numShards + 1).fill(0);
            const numOfResult = iterationSummary[shardType];
            summary[shardType][numOfResult]++;
        }
    }
    return summary;
}

function simulateIteration(numShards, shardType, event) {
    const iterationSummary = {};
    for (let i = 0; i < numShards; i++) {
        const pullResult = simulatePull(shardType, event);
        if (!iterationSummary[pullResult]) iterationSummary[pullResult] = 0;
        iterationSummary[pullResult]++;
    }
    return iterationSummary;
}

const chances = {
    base: {
        ancient: {
            rare: .915,
            epic: .08,
            lego: .005,
        },
        void: {
            rare: .915,
            epic: .08,
            lego: .005,
        },
        sacred: {
            rare: 0,
            epic: .94,
            lego: .06,
        },
    },
    doubleAncient: {
        ancient: {
            rare: .83,
            epic: .16,
            lego: .01,
        },
        void: {
            rare: .915,
            epic: .08,
            lego: .005,
        },
        sacred: {
            rare: 0,
            epic: .94,
            lego: .06,
        },
    },
    doubleVoid: {
        ancient: {
            rare: .915,
            epic: .08,
            lego: .005,
        },
        void: {
            rare: .83,
            epic: .16,
            lego: .01,
        },
        sacred: {
            rare: 0,
            epic: .94,
            lego: .06,
        },
    },
    doubleSacred: {
        ancient: {
            rare: .915,
            epic: .08,
            lego: .005,
        },
        void: {
            rare: .915,
            epic: .08,
            lego: .005,
        },
        sacred: {
            rare: 0,
            epic: .88,
            lego: .12,
        },
    },
};

function simulatePull(shardType, event) {
    const pullChances = chances[event || 'base'][shardType];
    const resultOptions = Object.keys(pullChances);
    let roll = Math.random();
    for (const resultOption of resultOptions) {
        const resultChance = pullChances[resultOption];
        if (roll < resultChance) {
            return resultOption;
        }
        roll -= resultChance;
    }
    throw new Error('Fuck');
}

function toPct(n) {
    let unpadded = n === 0 ? '0.0' : `${Math.round(n * 100000) / 1000}`;
    if (unpadded.indexOf('.') === -1) unpadded += '.0';
    const [before, after] = unpadded.split('.');
    const beforeStr = `${before}`.padStart(3, ' ');
    const afterStr = `${after}`.padEnd(3, '0');
    return `${beforeStr}.${afterStr}%`;
}

const rarityTypes = ['rare', 'epic', 'lego'];
const colors = {rare: '#00F', epic: '#F0F', lego: '#FF0'};
function processSimulationSummary(numIterations, numShards, simulationSummary) {
    const summaryTexts = [];
    const datasets = []
    for (const rarityType of rarityTypes) {
        const rarityResults = simulationSummary[rarityType];
        // Stuff for chart
        const dataSet = { borderColor: colors[rarityType], backgrounColor: colors[rarityType], label: rarityType, fill: false };
        datasets.push(dataSet);
        // Fill chartdata
        if (!rarityResults) {
            dataSet.data = (new Array(numShards)).fill(0);
        } else {
            const totalResultsOfRarity =  rarityResults.reduce((sum, n) => (sum + n), 0);
            const numWithNoPulls = numIterations - totalResultsOfRarity;
            dataSet.data = [];
            dataSet.data.push(numWithNoPulls);
            for (let numOfRarity = 1; numOfRarity < rarityResults.length; numOfRarity++) {
                const numOfResults = rarityResults[numOfRarity];
                dataSet.data.push(numOfResults);
            }
        }

        // Stuff for text
        summaryTexts.push(`# ${rarityType}:`);
        if (!rarityResults) {
            summaryTexts.push(`100% results with 0 ${rarityType} pulls`);
        } else {
            const totalResultsOfRarity =  rarityResults.reduce((sum, n) => (sum + n), 0);
            const numWithNoPulls = numIterations - totalResultsOfRarity;
            summaryTexts.push(`${toPct(numWithNoPulls / numIterations)} results with 0 ${rarityType} pulls`);
            for (let numOfRarity = 0; numOfRarity < rarityResults.length; numOfRarity++) {
                const numOfResults = rarityResults[numOfRarity];
                if (numOfResults > 0) {
                    summaryTexts.push(`${toPct(numOfResults / numIterations)} results with ${numOfRarity} ${rarityType} pulls`);
                }
            }
        }
        summaryTexts.push('');
    }
    return { summaryText: summaryTexts.join('\n'), chartData: datasets }
}

function resetDom() {
    if (chartInstance) chartInstance.destroy();
    while(_chartContainer.firstChild) _chartContainer.removeChild(_chartContainer.firstChild);
    _canvas = document.createElement('canvas');
    _canvas.setAttribute('id', 'chart');
    _canvas.setAttribute('width', _chartContainer.getBoundingClientRect().width);
    _canvas.setAttribute('height', _chartContainer.getBoundingClientRect().height);
    _chartContainer.appendChild(_canvas);

    _results.classList.remove('champion-list');
    _results.innerHTML = '';
}

const _event = document.querySelector('#event');
const _shardType = document.querySelector('#shardType');
const _numIterations = document.querySelector('#numIterations');
const _numShards = document.querySelector('#numShards');
// 10x
const tenchance = [];
const _10xdialog = document.querySelector('.champion-picker');
const _10xdialogChampionsContainer = document.querySelector('.champion-picker .champions');
const _10xinput = document.querySelector('#tenchance');
const _10xgroupBy = document.querySelector('#group-by');
const _10xopenButton = document.querySelector('#show-champion-picker');
const _10xCloseButton = document.querySelector('.champion-picker .close');
const _pickerColumnTemplate = document.querySelector('#picker-column');
const _pickerRowTemplate = document.querySelector('#picker-row');
// Simulate
const _submit = document.querySelector('#submit');
// Champions
const _simulate1 = document.querySelector('#simulate1');
const _sort = document.querySelector('#sort');
// Results
const _results = document.querySelector('#results');
const _chartContainer = document.querySelector('.chart-container');

let chartInstance;
let _canvas;

_submit.addEventListener('click', () => {
    const event = _event.value;
    const shardType = _shardType.value;
    const numIterations = _numIterations.valueAsNumber;
    const numShards = _numShards.valueAsNumber;

    _chartContainer.style.display = 'block';
    resetDom();

    _results.innerText = 'Simulating';
    const before = Date.now();
    const simulationSummary = simulate(numIterations, numShards, shardType, event);
    const runtime = Date.now() - before;
    const { summaryText, chartData } = processSimulationSummary(numIterations, numShards, simulationSummary);
    _results.innerText = `Simulation Runtime: ${runtime}ms\n\n` + summaryText;

    const ctx = _canvas.getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: (new Array(numShards)).fill(0).map((x, i) => `${i}`),
            datasets: chartData,
        },
        options: {
            tooltips: {
                callbacks: {
                    label(tooltipItem, data) {
                        const dataset = data.datasets[tooltipItem.datasetIndex];
                        return `${tooltipItem.yLabel} results (${Math.floor(tooltipItem.yLabel / numIterations * 10000) / 100}%) with ${tooltipItem.index} ${dataset.label} pulls (of ${numShards} ${shardType} shards)`;
                    },
                },
            },
        },
    });
});

const allChampions = [];
const getAllChampions = async () => {
    if (allChampions.length > 0) return;
    const response = await fetch('https://goctionni.github.io/raid-data/champions-base-info.json');
    const champions = await response.json();
    const names = Object.keys(champions);
    for (const name of names) {
        allChampions.push({
            name,
            ...champions[name],
        });
    }
}
_simulate1.addEventListener('click', async () => {
    resetDom();
    _chartContainer.style.display = 'none';
    _results.classList.add('champion-list');

    const event = _event.value;
    const shardType = _shardType.value;
    const numShards = _numShards.valueAsNumber;

    await getAllChampions();

    const pulls = [];
    for (let i = 0; i < numShards; i++) {
        const result = simulatePull(shardType, event);
        const rarity = result === 'lego' ? 'legendary' : result;
        const poolChampions = allChampions.reduce((all, curr) => {
            if (tenchance.indexOf(curr.name) === -1) return [...all, curr];
            return [...all, ...new Array(10).fill(curr)];
        }, []).filter((champion) => champion.rarity === rarity).filter((champion) => {
            if (shardType === 'void') return champion.affinity === 'void';
            return champion.affinity !== 'void';
        });
        const rand = Math.floor(Math.random() * poolChampions.length);
        const randomChampion = poolChampions[rand];
        pulls.push(randomChampion);
        if (!randomChampion) {
            debugger;
        }
    }

    const rarityTiers = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
    if (_sort.checked) {
        pulls.sort((a, b) => a.name.localeCompare(b.name)).sort((a, b) => rarityTiers.indexOf(a.rarity) - rarityTiers.indexOf(b.rarity));
    }

    for (const pull of pulls) {
        try {
            const _championDiv = document.createElement('div');
            _championDiv.classList.add('champion');
            _championDiv.classList.add(`rarity-${pull.rarity}`);
            const _championImg = document.createElement('img');
            _championImg.setAttribute('src', pull.avatarUrl);
            const _championSpan = document.createElement('span');
            _championSpan.appendChild(document.createTextNode(pull.name));
            _championDiv.appendChild(_championImg);
            _championDiv.appendChild(_championSpan);
            _results.appendChild(_championDiv);
        }
        catch(e) {
            debugger;
        }
    }
})

{
    // Function to update text in ten-chance input
    const updateTenChanceValue = () => {
        _10xinput.value = tenchance.join(', ');
    }
    // function to create a champion and add it to a group
    const addChampionToGroup = (champion, target) => {
        const _fragment = _pickerRowTemplate.content.cloneNode(true);
        const _text = _fragment.querySelector('span');
        const _checkbox = _fragment.querySelector('input');
        _text.innerText = champion.name;
        if (tenchance.indexOf(champion.name) >= 0) {
            _checkbox.checked = true;
        }
        _checkbox.addEventListener('change', () => {
            if (_checkbox.checked && tenchance.indexOf(champion.name) === -1) {
                tenchance.push(champion.name);
            } else if (!_checkbox.checked && tenchance.indexOf(champion.name) !== -1) {
                tenchance.splice(tenchance.indexOf(champion.name), 1);
            }
            updateTenChanceValue();
        });
        target.appendChild(_fragment);
    };
    // function to create a group of champions
    const addGroup = (groupTitle, champions) => {
        const _fragment = _pickerColumnTemplate.content.cloneNode(true);
        const _title = _fragment.querySelector('strong');
        _title.innerText = groupTitle;
        const _list = _fragment.querySelector('ul');
        for (const champion of champions) {
            addChampionToGroup(champion, _list);
        }
        _10xdialogChampionsContainer.appendChild(_fragment);
    };
    // Empty champions list
    const groupSorting = {
        rarity: (v1, v2) => ['legendary', 'epic', 'rare', 'uncommon', 'common'].indexOf(v1) - ['legendary', 'epic', 'rare', 'uncommon', 'common'].indexOf(v2),
        affinity: (v1, v2) => ['magic', 'spirit', 'force', 'void'].indexOf(v1) - ['magic', 'spirit', 'force', 'void'].indexOf(v2),
        faction: (v1, v2) => (v1 === v2) ? 0 : (v1 < v2) ? -1 : 1,
    }
    const emptyChampList = () => {
        while(_10xdialogChampionsContainer.firstChild) _10xdialogChampionsContainer.removeChild(_10xdialogChampionsContainer.firstChild);
    };
    const fillChampionList = async () => {
        await getAllChampions();
        emptyChampList();
        const groupBy = _10xgroupBy.value;
        const groups = allChampions.reduce((all, curr) => [...new Set([...all, curr[groupBy]])], []).sort(groupSorting[groupBy]);
        for (const group of groups) {
            const groupChampions = allChampions.filter((champion) => champion[groupBy] === group);
            addGroup(group, groupChampions);
        }
    };

    const open10ChanceDialog = async () => {
        // Load champions, the empty list
        await fillChampionList();
        _10xdialog.style.display = 'block';
    };
    
    _10xgroupBy.addEventListener('change', fillChampionList);
    
    _10xinput.addEventListener('click', open10ChanceDialog);
    _10xopenButton.addEventListener('click', open10ChanceDialog);
    
    _10xCloseButton.addEventListener('click', () => {
        _10xdialog.style.display = 'none';
    })
}
