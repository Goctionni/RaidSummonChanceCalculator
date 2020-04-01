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

function padFactory(nMax) {
    return function(n) {
        return `${n}`.padStart(`${nMax}`.length, ' ');
    }
}

const rarityTypes = ['rare', 'epic', 'lego'];
function simulationSummaryToText(numIterations, simulationSummary) {
    const padNum = padFactory(numIterations);
    const summaryTexts = [];
    console.log(Object.keys(simulationSummary));
    for (const rarityType of rarityTypes) {
        summaryTexts.push(`# ${rarityType}:`);
        if (!simulationSummary[rarityType]) {
            summaryTexts.push(`100% results with 0 ${rarityType} pulls`);
        } else {
            const totalResultsOfRarity =  simulationSummary[rarityType].reduce((sum, n) => (sum + n), 0);
            const numWithNoPulls = numIterations - totalResultsOfRarity;
            summaryTexts.push(`${toPct(numWithNoPulls / numIterations)} results with 0 ${rarityType} pulls`);
            for (let numOfRarity = 0; numOfRarity < simulationSummary[rarityType].length; numOfRarity++) {
                const numOfResults = simulationSummary[rarityType][numOfRarity];
                if (numOfResults > 0) {
                    summaryTexts.push(`${toPct(numOfResults / numIterations)} results with ${numOfRarity} ${rarityType} pulls`);
                }
            }
        }
        summaryTexts.push('');
    }
    return summaryTexts.join('\n');
}

const _event = document.querySelector('#event');
const _shardType = document.querySelector('#shardType');
const _numIterations = document.querySelector('#numIterations');
const _numShards = document.querySelector('#numShards');
const _submit = document.querySelector('#submit');
const _results = document.querySelector('#results');

_submit.addEventListener('click', () => {
    const event = _event.value;
    const shardType = _shardType.value;
    const numIterations = _numIterations.valueAsNumber;
    const numShards = _numShards.valueAsNumber;

    _results.innerText = 'Simulating';
    const before = Date.now();
    const simulationSummary = simulate(numIterations, numShards, shardType, event);
    const runtime = Date.now() - before;
    _results.innerText = `Simulation Runtime: ${runtime}ms\n\n` + simulationSummaryToText(numIterations, simulationSummary);
});