// Data for pre-populated fields and calculations
const presetData = {
    'cold-storage': {
        tempDiff: 25,
        energyCost: 0.18,
        costPerSqm: 65
    },
    'industrial': {
        tempDiff: 15,
        energyCost: 0.12,
        costPerSqm: 50
    },
    'hospitality': {
        tempDiff: 10,
        energyCost: 0.15,
        costPerSqm: 45
    }
};

const rValueData = {
    3: 7500,
    6: 15000,
    8: 28333,
    10: 35000,
    12: 55000,
    15: 75000,
    20: 100000
};

// DOM elements
const calculatorForm = document.getElementById('calculator-form');
const presetIndustrySelect = document.getElementById('preset-industry');
const curtainAreaInput = document.getElementById('curtain-area');
const rValueSelect = document.getElementById('r-value');
const tempDiffInput = document.getElementById('temp-diff');
const energyCostInput = document.getElementById('energy-cost');
const curtainCostInput = document.getElementById('curtain-cost-per-sqm');
const resultsSection = document.getElementById('results');
const totalCostSpan = document.getElementById('total-cost');
const energySavingsSpan = document.getElementById('energy-savings');
const costSavingsSpan = document.getElementById('cost-savings');
const paybackPeriodSpan = document.getElementById('payback-period');
const visualBefore = document.getElementById('visual-before');
const visualAfter = document.getElementById('visual-after');
const curtainVisual = document.getElementById('curtain-visual');

// Event listener for preset data
if (presetIndustrySelect) {
    presetIndustrySelect.addEventListener('change', (e) => {
        const selectedPreset = e.target.value;
        if (selectedPreset && presetData[selectedPreset]) {
            const data = presetData[selectedPreset];
            tempDiffInput.value = data.tempDiff;
            energyCostInput.value = data.energyCost;
            curtainCostInput.value = data.costPerSqm;
        }
    });
}

// Event listener for form submission
if (calculatorForm) {
    calculatorForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const curtainArea = parseFloat(curtainAreaInput.value);
        const rValue = parseFloat(rValueSelect.value);
        const tempDiff = parseFloat(tempDiffInput.value);
        const energyCost = parseFloat(energyCostInput.value);
        const costPerSqm = parseFloat(curtainCostInput.value);

        if (!curtainArea || !rValue || !tempDiff || !energyCost || !costPerSqm) {
            alert('Please fill out all required fields.');
            return;
        }

        // Calculate energy savings based on R-value data (linear interpolation for simplicity)
        const knownRValues = Object.keys(rValueData).map(Number).sort((a, b) => a - b);
        let kwhSaved;

        if (rValue <= knownRValues[0]) {
            kwhSaved = (rValue / knownRValues[0]) * rValueData[knownRValues[0]];
        } else if (rValue >= knownRValues[knownRValues.length - 1]) {
            kwhSaved = rValueData[knownRValues[knownRValues.length - 1]]; // Cap at max value
        } else {
            let lowerR = knownRValues.find(r => r <= rValue);
            let upperR = knownRValues.find(r => r > rValue);
            
            const lowerKwh = rValueData[lowerR];
            const upperKwh = rValueData[upperR];

            // Interpolate between the known points
            const ratio = (rValue - lowerR) / (upperR - lowerR);
            kwhSaved = lowerKwh + ratio * (upperKwh - lowerKwh);
        }

        // Adjust savings based on temperature differential
        const baseTempDiff = 20; // A baseline temperature differential for the data points
        const adjustedKwhSaved = (kwhSaved * tempDiff) / baseTempDiff;

        const totalCost = curtainArea * costPerSqm;
        const annualCostSavings = adjustedKwhSaved * energyCost;
        const paybackPeriod = (totalCost / annualCostSavings) * 12;

        totalCostSpan.textContent = totalCost.toFixed(2);
        energySavingsSpan.textContent = adjustedKwhSaved.toFixed(2);
        costSavingsSpan.textContent = annualCostSavings.toFixed(2);
        paybackPeriodSpan.textContent = isFinite(paybackPeriod) ? paybackPeriod.toFixed(1) : 'N/A';
        
        resultsSection.classList.remove('hidden');

        // Dynamic UI animation
        visualBefore.classList.add('hidden');
        visualAfter.classList.remove('hidden');
        curtainVisual.style.width = '0';
        setTimeout(() => {
            curtainVisual.classList.add('active');
        }, 50);
    });
}

function draftOrder() {
    // Collect data from the form
    const data = {
        curtainArea: curtainAreaInput.value,
        rValue: rValueSelect.value,
        tempDiff: tempDiffInput.value,
        energyCost: energyCostInput.value,
        totalCost: totalCostSpan.textContent,
        annualSavings: costSavingsSpan.textContent,
        paybackPeriod: paybackPeriodSpan.textContent
    };
    
    // Convert the data object to a URL query string
    const queryString = new URLSearchParams(data).toString();
    
    // Redirect to the contact page with the data
    window.location.href = `contact.html?${queryString}`;
}

window.draftOrder = draftOrder; // Make function globally accessible
