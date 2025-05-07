let supplyCount, demandCount;
let supply = [],
    demand = [],
    costMatrix = [],
    steps = [],
    allocationMatrix = [];
let stepIndex = 0;
let screenHistory = ["startScreen"]; // Initialize with the first screen
let steppingStoneSteps = [];
let steppingStoneIndex = 0;
let dummyAdded = false; // Flag to track if dummy row/column has been added
let totalSupply = 0,
    totalDemand = 0;
// Store input values to preserve them when navigating back
let savedInputValues = {};

function nextScreen(screenId) {
    screenHistory.push(screenId); // Add the current screen to history
    document
        .querySelectorAll(".screen")
        .forEach((s) => s.classList.remove("active"));
    document.getElementById(screenId).classList.add("active");
}

function previousScreen() {
    if (screenHistory.length > 1) {
        screenHistory.pop(); // Remove the current screen
        const previousScreenId = screenHistory[screenHistory.length - 1]; // Get the previous screen
        document
            .querySelectorAll(".screen")
            .forEach((s) => s.classList.remove("active"));
        document.getElementById(previousScreenId).classList.add("active");
    }
}

// Function to go back to dimension screen
function goBackToDimensionScreen() {
    screenHistory = ["dimensionScreen"];
    document
        .querySelectorAll(".screen")
        .forEach((s) => s.classList.remove("active"));
    document.getElementById("dimensionScreen").classList.add("active");
}

// Special function to go back to input matrix from result or stepping stone screens
function goBackToInputMatrix() {
    // First, save the current dimensions if they're not already saved
    if (!savedInputValues.supplyCount || !savedInputValues.demandCount) {
        savedInputValues.supplyCount = supplyCount;
        savedInputValues.demandCount = demandCount;
    }

    // Reset the screen history to show only the input matrix screen
    screenHistory = ["inputMatrixScreen"];
    document
        .querySelectorAll(".screen")
        .forEach((s) => s.classList.remove("active"));
    document.getElementById("inputMatrixScreen").classList.add("active");

    // Regenerate the input matrix with saved dimensions
    regenerateInputMatrix();

    // Reset the state
    resetState();
}

function regenerateInputMatrix() {
    // Get the saved dimensions
    const savedSupplyCount = parseInt(savedInputValues.supplyCount);
    const savedDemandCount = parseInt(savedInputValues.demandCount);

    if (
        !savedSupplyCount ||
        !savedDemandCount ||
        savedSupplyCount < 1 ||
        savedDemandCount < 1
    ) {
        // If no saved dimensions, go back to dimension screen
        nextScreen("dimensionScreen");
        return;
    }

    // Update the current dimensions
    supplyCount = savedSupplyCount;
    demandCount = savedDemandCount;

    // Update the dimension inputs
    document.getElementById("supplyCount").value = supplyCount;
    document.getElementById("demandCount").value = demandCount;

    const table = document.getElementById("inputMatrix");
    table.innerHTML = ""; // Clear any existing table content

    // Create table header
    const header = document.createElement("tr");
    header.innerHTML =
        "<th></th>" +
        Array.from(
            { length: demandCount },
            (_, j) => `<th>D${j + 1}</th>`
        ).join("") +
        "<th>SUPPLY</th>";
    table.appendChild(header);

    // Create rows for supply and cost inputs
    for (let i = 0; i < supplyCount; i++) {
        const row = document.createElement("tr");
        row.innerHTML =
            `<th>S${i + 1}</th>` +
            Array.from(
                { length: demandCount },
                (_, j) =>
                    `<td><input type="number" id="cost${i}_${j}" min="0" /></td>`
            ).join("") +
            `<td><input type="number" id="supply${i}" min="0" /></td>`;
        table.appendChild(row);
    }

    // Create row for demand inputs
    const demandRow = document.createElement("tr");
    demandRow.innerHTML =
        "<th>DEMAND</th>" +
        Array.from(
            { length: demandCount },
            (_, j) => `<td><input type="number" id="demand${j}" min="0" /></td>`
        ).join("") +
        '<td class="diagonal-cell"><div class="top-value" id="totalSupply"></div><div class="bottom-value" id="totalDemand"></div></td>';
    table.appendChild(demandRow);

    // Restore any previously saved values
    restoreInputValues();

    // Update totals
    updateTotals();
}

function updateTotals() {
    let supplyTotal = 0;
    let demandTotal = 0;

    // Calculate total supply
    for (let i = 0; i < supplyCount; i++) {
        const supplyInput = document.getElementById(`supply${i}`);
        if (supplyInput && !isNaN(parseInt(supplyInput.value))) {
            supplyTotal += parseInt(supplyInput.value);
        }
    }

    // Calculate total demand
    for (let j = 0; j < demandCount; j++) {
        const demandInput = document.getElementById(`demand${j}`);
        if (demandInput && !isNaN(parseInt(demandInput.value))) {
            demandTotal += parseInt(demandInput.value);
        }
    }

    // Update the total display
    const totalSupplyElement = document.getElementById("totalSupply");
    const totalDemandElement = document.getElementById("totalDemand");

    if (totalSupplyElement && totalDemandElement) {
        totalSupplyElement.textContent = supplyTotal;
        totalDemandElement.textContent = demandTotal;

        // Set color based on equality
        if (supplyTotal === demandTotal) {
            totalSupplyElement.className = "top-value equal";
            totalDemandElement.className = "bottom-value equal";
        } else {
            totalSupplyElement.className = "top-value not-equal";
            totalDemandElement.className = "bottom-value not-equal";
        }
    }

    // Save the totals
    totalSupply = supplyTotal;
    totalDemand = demandTotal;
}

function resetState() {
    // Reset the nextStepButton to its initial state
    const nextStepButton = document.getElementById("nextStepButton");
    if (nextStepButton) {
        nextStepButton.textContent = "Next Step";
        nextStepButton.onclick = showNextStep;
    }

    // Clear steps and reset stepIndex
    steps = [];
    stepIndex = 0;
    dummyAdded = false;

    // Clear the allocation table and step output
    const allocationTable = document.getElementById("allocationTable");
    if (allocationTable) {
        allocationTable.innerHTML = "";
    }

    const stepOutput = document.getElementById("stepOutput");
    if (stepOutput) {
        stepOutput.innerHTML = "";
    }

    // Remove the cost computation table if it exists
    const existingCostComputationDiv =
        document.getElementById("costComputationDiv");
    if (existingCostComputationDiv) {
        existingCostComputationDiv.remove();
    }
}

function saveInputValues() {
    // Save supply and demand counts
    savedInputValues.supplyCount =
        document.getElementById("supplyCount").value;
    savedInputValues.demandCount =
        document.getElementById("demandCount").value;

    // Save cost matrix values
    for (let i = 0; i < supplyCount; i++) {
        for (let j = 0; j < demandCount; j++) {
            const costInput = document.getElementById(`cost${i}_${j}`);
            if (costInput) {
                savedInputValues[`cost${i}_${j}`] = costInput.value;
            }
        }
    }

    // Save supply values
    for (let i = 0; i < supplyCount; i++) {
        const supplyInput = document.getElementById(`supply${i}`);
        if (supplyInput) {
            savedInputValues[`supply${i}`] = supplyInput.value;
        }
    }

    // Save demand values
    for (let j = 0; j < demandCount; j++) {
        const demandInput = document.getElementById(`demand${j}`);
        if (demandInput) {
            savedInputValues[`demand${j}`] = demandInput.value;
        }
    }
}

function restoreInputValues() {
    // Restore cost matrix values
    for (let i = 0; i < supplyCount; i++) {
        for (let j = 0; j < demandCount; j++) {
            const costInput = document.getElementById(`cost${i}_${j}`);
            if (costInput && savedInputValues[`cost${i}_${j}`]) {
                costInput.value = savedInputValues[`cost${i}_${j}`];
            }
        }
    }

    // Restore supply values
    for (let i = 0; i < supplyCount; i++) {
        const supplyInput = document.getElementById(`supply${i}`);
        if (supplyInput && savedInputValues[`supply${i}`]) {
            supplyInput.value = savedInputValues[`supply${i}`];
        }
    }

    // Restore demand values
    for (let j = 0; j < demandCount; j++) {
        const demandInput = document.getElementById(`demand${j}`);
        if (demandInput && savedInputValues[`demand${j}`]) {
            demandInput.value = savedInputValues[`demand${j}`];
        }
    }
}

function generateCombinedMatrix() {
    supplyCount = parseInt(document.getElementById("supplyCount").value);
    demandCount = parseInt(document.getElementById("demandCount").value);

    if (
        !supplyCount ||
        !demandCount ||
        supplyCount < 1 ||
        demandCount < 1
    ) {
        alert("Please enter valid dimensions.");
        return;
    }

    // Save the dimensions
    savedInputValues.supplyCount = supplyCount;
    savedInputValues.demandCount = demandCount;

    const table = document.getElementById("inputMatrix");
    table.innerHTML = ""; // Clear any existing table content

    // Create table header
    const header = document.createElement("tr");
    header.innerHTML =
        "<th></th>" +
        Array.from(
            { length: demandCount },
            (_, j) => `<th>D${j + 1}</th>`
        ).join("") +
        "<th>SUPPLY</th>";
    table.appendChild(header);

    // Create rows for supply and cost inputs
    for (let i = 0; i < supplyCount; i++) {
        const row = document.createElement("tr");
        row.innerHTML =
            `<th>S${i + 1}</th>` +
            Array.from(
                { length: demandCount },
                (_, j) =>
                    `<td><input type="number" id="cost${i}_${j}" min="0" /></td>`
            ).join("") +
            `<td><input type="number" id="supply${i}" min="0" onchange="updateTotals()" /></td>`;
        table.appendChild(row);
    }

    // Create row for demand inputs
    const demandRow = document.createElement("tr");
    demandRow.innerHTML =
        "<th>DEMAND</th>" +
        Array.from(
            { length: demandCount },
            (_, j) =>
                `<td><input type="number" id="demand${j}" min="0" onchange="updateTotals()" /></td>`
        ).join("") +
        '<td class="diagonal-cell"><div class="top-value" id="totalSupply">0</div><div class="bottom-value" id="totalDemand">0</div></td>';
    table.appendChild(demandRow);

    // Restore any previously saved values
    restoreInputValues();

    // Update totals
    updateTotals();

    // Switch to the input matrix screen
    nextScreen("inputMatrixScreen");
}

function solveWithNorthwestCorner() {
    // Save input values before processing
    saveInputValues();

    // Check if all inputs exist before trying to read them
    const allInputsExist = checkAllInputsExist();
    if (!allInputsExist) {
        alert(
            "Some input fields are missing. Please regenerate the input table."
        );
        return;
    }

    supply = [];
    demand = [];

    // Read supply values
    for (let i = 0; i < supplyCount; i++) {
        const supplyInput = document.getElementById(`supply${i}`);
        if (supplyInput) {
            supply.push(parseInt(supplyInput.value));
        } else {
            alert(`Supply input for S${i + 1} is missing.`);
            return;
        }
    }

    // Read demand values
    for (let j = 0; j < demandCount; j++) {
        const demandInput = document.getElementById(`demand${j}`);
        if (demandInput) {
            demand.push(parseInt(demandInput.value));
        } else {
            alert(`Demand input for D${j + 1} is missing.`);
            return;
        }
    }

    if (supply.includes(NaN) || demand.includes(NaN)) {
        alert("Please fill in all supply and demand values.");
        return;
    }

    costMatrix = [];
    // Read cost matrix values
    for (let i = 0; i < supplyCount; i++) {
        const row = [];
        for (let j = 0; j < demandCount; j++) {
            const costInput = document.getElementById(`cost${i}_${j}`);
            if (costInput) {
                row.push(parseInt(costInput.value));
            } else {
                alert(`Cost input for S${i + 1}-D${j + 1} is missing.`);
                return;
            }
        }
        costMatrix.push(row);
    }

    if (costMatrix.flat().includes(NaN)) {
        alert("Please fill in all cost values.");
        return;
    }

    // Calculate totals
    totalSupply = supply.reduce((a, b) => a + b, 0);
    totalDemand = demand.reduce((a, b) => a + b, 0);

    // Initialize allocation matrix without adding dummy row/column yet
    allocationMatrix = Array.from({ length: supplyCount }, () =>
        Array(demandCount).fill("")
    );
    steps = [];
    stepIndex = 0;
    dummyAdded = false;

    // First step: Show the initial state
    steps.push({
        message: "Initial state. Click 'Next Step' to begin allocation.",
        snapshot: allocationMatrix.map((row) => [...row]),
        supplyLeft: [...supply],
        demandLeft: [...demand],
        needsDummy: totalSupply !== totalDemand,
    });

    nextScreen("resultScreen");
    showNextStep();
}

function checkAllInputsExist() {
    // Check if all required inputs exist
    for (let i = 0; i < supplyCount; i++) {
        if (!document.getElementById(`supply${i}`)) {
            return false;
        }
        for (let j = 0; j < demandCount; j++) {
            if (!document.getElementById(`cost${i}_${j}`)) {
                return false;
            }
        }
    }

    for (let j = 0; j < demandCount; j++) {
        if (!document.getElementById(`demand${j}`)) {
            return false;
        }
    }

    return true;
}

function showNextStep() {
    const stepOutput = document.getElementById("stepOutput");
    const allocationTable = document.getElementById("allocationTable");
    const nextStepButton = document.getElementById("nextStepButton");

    if (stepIndex === 0) {
        // First step: Show initial state and add dummy if needed
        const { message, snapshot, supplyLeft, demandLeft, needsDummy } = steps[0];

        // Clear the allocation table
        allocationTable.innerHTML = "";

        // Create the table header
        const header = document.createElement("tr");
        header.innerHTML =
            "<th></th>" +
            demand.map((_, j) => `<th>D${j + 1}</th>`).join("") +
            "<th>SUPPLY</th>";
        allocationTable.appendChild(header);

        // Populate the table rows with the current snapshot
        snapshot.forEach((row, i) => {
            const tr = document.createElement("tr");
            tr.innerHTML =
                `<th>S${i + 1}</th>` +
                row
                    .map((val, j) => {
                        const cost = costMatrix[i][j];
                        return `<td><span style="color: gray;">${cost}</span></td>`;
                    })
                    .join("") +
                `<td>${supplyLeft[i]}</td>`;
            allocationTable.appendChild(tr);
        });

        // Add the demand row
        const demandRow = document.createElement("tr");
        demandRow.innerHTML =
            "<th>DEMAND</th>" +
            demandLeft.map((val) => `<td>${val}</td>`).join("") +
            `<td class="diagonal-cell">
        <div class="top-value ${needsDummy ? "not-equal" : "equal"}">${totalSupply}</div>
        <div class="bottom-value ${needsDummy ? "not-equal" : "equal"}">${totalDemand}</div>
      </td>`;
        allocationTable.appendChild(demandRow);

        // Update the step output
        if (needsDummy) {
            stepOutput.innerHTML = `<p class="step">Total supply (${totalSupply}) and demand (${totalDemand}) are not equal. Click 'Next Step' to add a dummy row/column.</p>`;
        } else {
            stepOutput.innerHTML = `<p class="step">${message}</p>`;
        }

        stepIndex++;
    } else if (
        stepIndex === 1 &&
        totalSupply !== totalDemand &&
        !dummyAdded
    ) {
        // Add dummy row/column if needed
        if (totalSupply > totalDemand) {
            // Add dummy demand column
            demand.push(totalSupply - totalDemand);
            for (let i = 0; i < costMatrix.length; i++) {
                costMatrix[i].push(0); // Cost to dummy demand
            }
            demandCount++;

            // Update allocation matrix
            allocationMatrix = Array.from({ length: supplyCount }, () =>
                Array(demandCount).fill("")
            );

            // Push a step for adding dummy demand column
            steps.push({
                message: `Added dummy demand column DD${demandCount} with demand ${totalSupply - totalDemand}.`,
                snapshot: allocationMatrix.map((row) => [...row]),
                supplyLeft: [...supply],
                demandLeft: [...demand],
            });

            stepOutput.innerHTML = `<p class="step">Added dummy demand column DD${demandCount} with demand ${totalSupply - totalDemand}.</p>`;
        } else if (totalDemand > totalSupply) {
            // Add dummy supply row
            supply.push(totalDemand - totalSupply);
            const dummyRow = Array(demandCount).fill(0); // Cost from dummy supply
            costMatrix.push(dummyRow);
            supplyCount++;

            // Update allocation matrix
            allocationMatrix = Array.from({ length: supplyCount }, () =>
                Array(demandCount).fill("")
            );

            // Push a step for adding dummy supply row
            steps.push({
                message: `Added dummy supply row DS${supplyCount} with supply ${totalDemand - totalSupply}.`,
                snapshot: allocationMatrix.map((row) => [...row]),
                supplyLeft: [...supply],
                demandLeft: [...demand],
            });

            stepOutput.innerHTML = `<p class="step">Added dummy supply row DS${supplyCount} with supply ${totalDemand - totalSupply}.</p>`;
        }

        dummyAdded = true;

        // Show the updated table with dummy row/column
        allocationTable.innerHTML = "";

        // Create the table header
        const header = document.createElement("tr");
        header.innerHTML =
            "<th></th>" +
            demand
                .map((_, j) => {
                    if (j === demandCount - 1 && totalSupply > totalDemand) {
                        return `<th>DD${j + 1}</th>`;
                    }
                    return `<th>D${j + 1}</th>`;
                })
                .join("") +
            "<th>SUPPLY</th>";
        allocationTable.appendChild(header);

        // Populate the table rows with the current snapshot
        for (let i = 0; i < supplyCount; i++) {
            const tr = document.createElement("tr");
            let rowHeader = `<th>${
                i === supplyCount - 1 && totalDemand > totalSupply
                    ? "DS"
                    : "S" + (i + 1)
            }</th>`;

            let rowContent = "";
            for (let j = 0; j < demandCount; j++) {
                const cost = costMatrix[i][j];
                rowContent += `<td><span style="color: gray;">${cost}</span></td>`;
            }

            tr.innerHTML = rowHeader + rowContent + `<td>${supply[i]}</td>`;
            allocationTable.appendChild(tr);
        }

        // Add the demand row
        const demandRow = document.createElement("tr");
        demandRow.innerHTML =
            "<th>DEMAND</th>" +
            demand.map((val) => `<td>${val}</td>`).join("") +
            `<td class="diagonal-cell">
        <div class="top-value equal">${supply.reduce((a, b) => a + b, 0)}</div>
        <div class="bottom-value equal">${demand.reduce((a, b) => a + b, 0)}</div>
      </td>`;
        allocationTable.appendChild(demandRow);

        // Prepare for allocation steps
        let supplyLeft = [...supply], demandLeft = [...demand];
        let i = 0, j = 0;

        while (i < supplyCount && j < demandCount) {
            let alloc = Math.min(supplyLeft[i], demandLeft[j]);
            allocationMatrix[i][j] = alloc;

            steps.push({
                message: `Allocating ${alloc} units from ${
                    i === supplyCount - 1 && totalDemand > totalSupply ? "DS" : "S"
                }${i + 1} to ${
                    j === demandCount - 1 && totalSupply > totalDemand ? "DD" : "D"
                }${j + 1}`,
                snapshot: allocationMatrix.map((row) => [...row]),
                supplyLeft: [...supplyLeft],
                demandLeft: [...demandLeft],
            });

            supplyLeft[i] -= alloc;
            demandLeft[j] -= alloc;

            if (supplyLeft[i] === 0) i++;
            if (demandLeft[j] === 0) j++;
        }

        stepIndex++;
    } else if (
        (stepIndex > 1 || (stepIndex === 1 && totalSupply === totalDemand)) &&
        stepIndex <= steps.length
    ) {
        // Regular allocation steps
        let currentStep;

        if (totalSupply === totalDemand && stepIndex === 1) {
            // If supply equals demand, we need to prepare the allocation steps
            let supplyLeft = [...supply], demandLeft = [...demand];
            let i = 0, j = 0;

            while (i < supplyCount && j < demandCount) {
                let alloc = Math.min(supplyLeft[i], demandLeft[j]);
                allocationMatrix[i][j] = alloc;

                steps.push({
                    message: `Allocating ${alloc} units from S${i + 1} to D${j + 1}`,
                    snapshot: allocationMatrix.map((row) => [...row]),
                    supplyLeft: [...supplyLeft],
                    demandLeft: [...demandLeft],
                });

                supplyLeft[i] -= alloc;
                demandLeft[j] -= alloc;

                if (supplyLeft[i] === 0) i++;
                if (demandLeft[j] === 0) j++;
            }

            currentStep = steps[1]; // Get the first allocation step
        } else {
            // Get the current step (adjusted for dummy step)
            const stepAdjustment = totalSupply !== totalDemand ? 1 : 0;
            currentStep = steps[stepIndex - stepAdjustment];
        }

        const { message, snapshot, supplyLeft, demandLeft } = currentStep;

        // Clear the allocation table
        allocationTable.innerHTML = "";

        // Create the table header
        const header = document.createElement("tr");
        header.innerHTML =
            "<th></th>" +
            demand
                .map((_, j) => {
                    if (j === demandCount - 1 && totalSupply > totalDemand) {
                        return `<th>DD${j + 1}</th>`;
                    }
                    return `<th>D${j + 1}</th>`;
                })
                .join("") +
            "<th>SUPPLY</th>";
        allocationTable.appendChild(header);

        // Populate the table rows with the current snapshot
        snapshot.forEach((row, i) => {
            const tr = document.createElement("tr");
            let rowHeader = `<th>${
                i === supplyCount - 1 && totalDemand > totalSupply
                    ? "DS" + (i + 1)
                    : "S" + (i + 1)
            }</th>`;

            let rowContent = "";
            for (let j = 0; j < demandCount; j++) {
                const cost = costMatrix[i][j];
                const val = row[j];
                if (val === "" || val === 0 || val === undefined) {
                    if (supplyLeft[i] === 0 || demandLeft[j] === 0) {
                        rowContent += `<td style="color: red;">X</td>`;
                    } else {
                        rowContent += `<td><span style="color: gray;">${cost}</span></td>`;
                    }
                } else {
                    rowContent += `<td><span style="color: black; font-weight: bold;">${val} | <span style="color: gray;">${cost}</span></span></td>`;
                }
            }

            tr.innerHTML = rowHeader + rowContent + `<td>${supplyLeft[i]}</td>`;
            allocationTable.appendChild(tr);
        });

        // Add the demand row
        const demandRow = document.createElement("tr");
        demandRow.innerHTML =
            "<th>DEMAND</th>" +
            demandLeft.map((val) => `<td>${val}</td>`).join("") +
            `<td class="diagonal-cell">
        <div class="top-value equal">${supply.reduce((a, b) => a + b, 0)}</div>
        <div class="bottom-value equal">${demand.reduce((a, b) => a + b, 0)}</div>
      </td>`;
        allocationTable.appendChild(demandRow);

        // Update the step output
        stepOutput.innerHTML = `<p class="step">${message}</p>`;
        stepIndex++;
    } else {
        // Final step: Set supply and demand to zero
        allocationTable.innerHTML = "";
        const header = document.createElement("tr");
        header.innerHTML =
            "<th></th>" +
            demand
                .map((_, j) => {
                    if (j === demandCount - 1 && totalSupply > totalDemand) {
                        return `<th>DD${j + 1}</th>`;
                    }
                    return `<th>D${j + 1}</th>`;
                })
                .join("") +
            "<th>SUPPLY</th>";
        allocationTable.appendChild(header);

        allocationMatrix.forEach((row, i) => {
            const tr = document.createElement("tr");
            let rowHeader = `<th>${
                i === supplyCount - 1 && totalDemand > totalSupply
                    ? "DS" + (i + 1)
                    : "S" + (i + 1)
            }</th>`;

            let rowContent = "";
            for (let j = 0; j < demandCount; j++) {
                const val = row[j];
                rowContent += `<td>${val}</td>`;
            }

            tr.innerHTML = rowHeader + rowContent + `<td>0</td>`; // Set supply to zero
            allocationTable.appendChild(tr);
        });

        const demandRow = document.createElement("tr");
        demandRow.innerHTML =
            "<th>DEMAND</th>" +
            demand.map(() => `<td>0</td>`).join("") +
            `<td class="diagonal-cell">
        <div class="top-value equal">0</div>
        <div class="bottom-value equal">0</div>
      </td>`;
        allocationTable.appendChild(demandRow);

        stepOutput.innerHTML = `<p class="step">All allocations done. This is the final solution. You may now proceed to the Stepping Stone Method if desired.</p>`;
        if (nextStepButton) {
            nextStepButton.textContent = "Show Stepping Stone Method";
            nextStepButton.onclick = function () {
                nextScreen("steppingStoneScreen");
                // You can implement the Stepping Stone Method call here
            };
        }
    }
}

// Add your additional logic for Step History, Stepping Stone, etc.
// Example: Add event listeners for step history and stepping stone buttons if needed

document.addEventListener("DOMContentLoaded", function () {
    // Update totals when supply/demand inputs change
    document.body.addEventListener("input", function (event) {
        if (
            event.target.matches('input[id^="supply"]') ||
            event.target.matches('input[id^="demand"]')
        ) {
            updateTotals();
        }
    });

    // Add more event listeners if you implement history, stepping stone, etc.
});