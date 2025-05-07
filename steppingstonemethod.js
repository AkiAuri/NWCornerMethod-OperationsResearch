/**
 * Stepping Stone Method implementation for transportation problems.
 * This script assumes that you have:
 *   - costMatrix: 2D array of costs
 *   - allocationMatrix: 2D array of current allocations ('' or number)
 *   - supplyCount, demandCount: number of rows/columns
 *
 * Functions:
 *   - findSteppingStoneLoops
 *   - calculateOpportunityCosts
 *   - adjustAllocations
 *   - isOptimalSolution
 *   - solveSteppingStoneMethod
 *
 * This file is designed to be imported after your main HTML file,
 * and expects the relevant global variables to be available.
 */

/**
 * Helper to deep copy a 2D array
 */
function deepCopy2DArray(arr) {
    return arr.map(row => row.slice());
}

/**
 * Finds all stepping stone loops for all empty cells.
 * Each loop is an array of {row, col, sign} objects, sign alternates +, -.
 * Returns: {cell: {row, col}, loop: [{row, col, sign}], opportunityCost: number}
 */
function calculateOpportunityCosts(costMatrix, allocationMatrix, supplyCount, demandCount) {
    const emptyCells = [];
    for (let i = 0; i < supplyCount; i++) {
        for (let j = 0; j < demandCount; j++) {
            if (!allocationMatrix[i][j] || allocationMatrix[i][j] === 0) {
                emptyCells.push({ row: i, col: j });
            }
        }
    }

    const opportunityCosts = [];

    for (const emptyCell of emptyCells) {
        const loop = findSteppingStoneLoop(allocationMatrix, emptyCell.row, emptyCell.col, supplyCount, demandCount);
        if (loop.length > 0) {
            // Alternately add/subtract costs along the loop
            let opportunityCost = 0;
            for (let k = 0; k < loop.length; k++) {
                const { row, col } = loop[k];
                const sign = k % 2 === 0 ? 1 : -1; // +, -, +, -, ...
                opportunityCost += sign * costMatrix[row][col];
            }
            opportunityCosts.push({
                cell: { ...emptyCell },
                loop: loop.map((pos, idx) => ({ ...pos, sign: idx % 2 === 0 ? '+' : '-' })),
                opportunityCost
            });
        }
    }

    return opportunityCosts;
}

/**
 * Finds a closed loop starting and ending at (startRow, startCol).
 * The loop alternates between horizontal and vertical moves through allocated cells,
 * except for the first cell, which is unallocated.
 * Returns an array of {row, col}.
 */
function findSteppingStoneLoop(allocationMatrix, startRow, startCol, supplyCount, demandCount) {
    // The loop must start and end at (startRow, startCol)
    // The sequence alternates between horizontal and vertical moves
    // Only moves through allocated cells (except the start cell)
    function dfs(path, visited, isRowMove) {
        const last = path[path.length - 1];
        if (path.length > 3 && last.row === startRow && last.col === startCol) {
            // Closed loop found, must have at least 4 cells
            return path;
        }
        // Generate possible moves
        if (isRowMove) {
            // Move through the row: find all allocated in this row (col ≠ current col)
            for (let j = 0; j < demandCount; j++) {
                if (j === last.col) continue;
                if ((last.row !== startRow || j !== startCol) && (!allocationMatrix[last.row][j] || allocationMatrix[last.row][j] === 0)) continue;
                // Prevent cycles except closing to start
                const key = `${last.row},${j}`;
                if (!visited.has(key) || (last.row === startRow && j === startCol)) {
                    visited.add(key);
                    const result = dfs([...path, { row: last.row, col: j }], visited, !isRowMove);
                    if (result) return result;
                    visited.delete(key);
                }
            }
        } else {
            // Move through the column: find all allocated in this column (row ≠ current row)
            for (let i = 0; i < supplyCount; i++) {
                if (i === last.row) continue;
                if ((i !== startRow || last.col !== startCol) && (!allocationMatrix[i][last.col] || allocationMatrix[i][last.col] === 0)) continue;
                // Prevent cycles except closing to start
                const key = `${i},${last.col}`;
                if (!visited.has(key) || (i === startRow && last.col === startCol)) {
                    visited.add(key);
                    const result = dfs([...path, { row: i, col: last.col }], visited, !isRowMove);
                    if (result) return result;
                    visited.delete(key);
                }
            }
        }
        return null;
    }

    // Start with a horizontal move first
    const visited = new Set();
    visited.add(`${startRow},${startCol}`);
    const loop = dfs([{ row: startRow, col: startCol }], visited, true);
    return loop || [];
}

/**
 * Adjusts allocations along the loop for the cell with the minimum allocation on negative positions.
 * Returns the new allocationMatrix.
 */
function adjustAllocations(allocationMatrix, loop) {
    // Find theta: the minimum allocation on the negative positions in the loop (odd indexed positions)
    let theta = Infinity;
    for (let k = 1; k < loop.length; k += 2) {
        const { row, col } = loop[k];
        if (allocationMatrix[row][col] < theta) {
            theta = allocationMatrix[row][col];
        }
    }
    // Apply theta
    const newAllocationMatrix = deepCopy2DArray(allocationMatrix);
    for (let k = 0; k < loop.length; k++) {
        const { row, col } = loop[k];
        if (k % 2 === 0) {
            // +
            newAllocationMatrix[row][col] = (newAllocationMatrix[row][col] || 0) + theta;
        } else {
            // -
            newAllocationMatrix[row][col] = newAllocationMatrix[row][col] - theta;
        }
    }
    return newAllocationMatrix;
}

/**
 * Checks if all opportunity costs are >= 0 (i.e., optimal solution).
 */
function isOptimalSolution(opportunityCosts) {
    return opportunityCosts.every(o => o.opportunityCost >= 0);
}

/**
 * Runs the Stepping Stone Method.
 * Mutates allocationMatrix to the optimal solution.
 * Returns an array of step objects: {message, allocationMatrix, opportunityCosts}
 */
function solveSteppingStoneMethod(costMatrix, allocationMatrix, supplyCount, demandCount) {
    let steps = [];
    let currentAlloc = deepCopy2DArray(allocationMatrix);

    while (true) {
        const opportunityCosts = calculateOpportunityCosts(costMatrix, currentAlloc, supplyCount, demandCount);
        steps.push({
            message: isOptimalSolution(opportunityCosts)
                ? "Optimal solution found: all opportunity costs are non-negative."
                : "Calculating opportunity costs. Improving cell if possible.",
            allocationMatrix: deepCopy2DArray(currentAlloc),
            opportunityCosts: opportunityCosts.map(o => ({
                cell: o.cell,
                opportunityCost: o.opportunityCost
            }))
        });

        if (isOptimalSolution(opportunityCosts)) {
            break;
        }
        // Find the most negative opportunity cost
        let best = opportunityCosts.reduce((min, o) => (o.opportunityCost < min.opportunityCost ? o : min), opportunityCosts[0]);
        // Adjust allocations along best.loop
        currentAlloc = adjustAllocations(currentAlloc, best.loop);
    }

    // Return all steps
    return steps;
}

// Export functions if using module system
// export { calculateOpportunityCosts, solveSteppingStoneMethod, findSteppingStoneLoop, adjustAllocations, isOptimalSolution };