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

const _event = document.querySelector('#event');
const _shardType = document.querySelector('#shardType');
const _numIterations = document.querySelector('#numIterations');
const _numShards = document.querySelector('#numShards');
const _submit = document.querySelector('#submit');
const _results = document.querySelector('#results');
const _chartContainer = document.querySelector('.chart-container');
let chartInstance;
let _canvas;

_submit.addEventListener('click', () => {
    const event = _event.value;
    const shardType = _shardType.value;
    const numIterations = _numIterations.valueAsNumber;
    const numShards = _numShards.valueAsNumber;

    _results.innerText = 'Simulating';
    const before = Date.now();
    const simulationSummary = simulate(numIterations, numShards, shardType, event);
    const runtime = Date.now() - before;
    const { summaryText, chartData } = processSimulationSummary(numIterations, numShards, simulationSummary);
    _results.innerText = `Simulation Runtime: ${runtime}ms\n\n` + summaryText;

    if (chartInstance) chartInstance.destroy();
    while(_chartContainer.firstChild) _chartContainer.removeChild(_chartContainer.firstChild);
    _canvas = document.createElement('canvas');
    _canvas.setAttribute('id', 'chart');
    _canvas.setAttribute('width', _chartContainer.getBoundingClientRect().width);
    _canvas.setAttribute('height', _chartContainer.getBoundingClientRect().height);
    _chartContainer.appendChild(_canvas);

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
                        console.log({ tooltipItem, data, dataset })
                        return `${tooltipItem.yLabel} results (${Math.floor(tooltipItem.yLabel / numIterations * 10000) / 100}%) with ${tooltipItem.index} ${dataset.label} pulls (of ${numShards} ${shardType} shards)`;
                    },
                },
            },
        },
    });
});