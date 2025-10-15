const { Project, SyntaxKind } = require("ts-morph");
const fs = require("fs");
const path = require("path");
const { fdir } = require("fdir");

// Function to extract event handler names from mod types
function extractEventHandlers(project) {
    const eventHandlers = new Set();

    try {
        // Read tsconfig to get the path to mod types
        const tsconfigPath = path.join(process.cwd(), "tsconfig.json");
        if (!fs.existsSync(tsconfigPath)) {
            console.warn("tsconfig.json not found, using default event handlers");
            return getDefaultEventHandlers();
        }

        // Read and parse tsconfig (remove trailing commas (", and ],) for JSON compatibility)
        const tsconfigContent = fs.readFileSync(tsconfigPath, "utf8")
            .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
        const tsconfig = JSON.parse(tsconfigContent);
        const modTypesPath = tsconfig.compilerOptions?.types?.[0];

        if (!modTypesPath) {
            console.warn("mod types path not found in tsconfig, using default event handlers");
            return getDefaultEventHandlers();
        }

        // Resolve the full path to the mod types file
        const modTypesFullPath = path.resolve(process.cwd(), modTypesPath, "index.d.ts");

        if (!fs.existsSync(modTypesFullPath)) {
            console.warn(`mod types file not found at ${modTypesFullPath}, using default event handlers`);
            return getDefaultEventHandlers();
        }

        console.log(`Reading event handlers from: ${modTypesFullPath}`);

        // Add the mod types file to the project
        const modTypesFile = project.addSourceFileAtPath(modTypesFullPath);

        // Find the EventHandlerSignatures namespace
        const namespaces = modTypesFile.getDescendantsOfKind(SyntaxKind.ModuleDeclaration);

        for (const ns of namespaces) {
            const nsName = ns.getName();

            // Look for EventHandlerSignatures namespace (could be nested in mod namespace)
            if (nsName === "EventHandlerSignatures" || nsName.endsWith(".EventHandlerSignatures")) {
                // Get all function declarations in this namespace
                const functions = ns.getDescendantsOfKind(SyntaxKind.FunctionDeclaration);

                functions.forEach(func => {
                    const funcName = func.getName();
                    if (funcName) {
                        eventHandlers.add(funcName);
                        console.log(`Found event handler: ${funcName}`);
                    }
                });

                break;
            }
        }

        // Also check for nested namespace (mod.EventHandlerSignatures)
        if (eventHandlers.size === 0) {
            const modNamespace = namespaces.find(ns => ns.getName() === "mod");
            if (modNamespace) {
                const nestedNamespaces = modNamespace.getDescendantsOfKind(SyntaxKind.ModuleDeclaration);
                const eventHandlerNs = nestedNamespaces.find(ns => ns.getName() === "EventHandlerSignatures");

                if (eventHandlerNs) {
                    const functions = eventHandlerNs.getDescendantsOfKind(SyntaxKind.FunctionDeclaration);

                    functions.forEach(func => {
                        const funcName = func.getName();
                        if (funcName) {
                            eventHandlers.add(funcName);
                            console.log(`Found event handler: ${funcName}`);
                        }
                    });
                }
            }
        }

    } catch (error) {
        console.warn(`Error reading event handlers: ${error.message}`);
        console.warn("Using default event handlers");
        return getDefaultEventHandlers();
    }

    if (eventHandlers.size === 0) {
        console.warn("No event handlers found, using default event handlers");
        return getDefaultEventHandlers();
    }

    console.log(`Found ${eventHandlers.size} event handlers`);
    return eventHandlers;
}

// Fallback to hardcoded event handlers if auto-detection fails
function getDefaultEventHandlers() {
    return new Set([
        "OngoingGlobal",
        "OngoingAreaTrigger",
        "OngoingCapturePoint",
        "OngoingEmplacementSpawner",
        "OngoingHQ",
        "OngoingInteractPoint",
        "OngoingMCOM",
        "OngoingPlayer",
        "OngoingScreenEffect",
        "OngoingSector",
        "OngoingSpawner",
        "OngoingSpawnPoint",
        "OngoingTeam",
        "OngoingVehicle",
        "OngoingVehicleSpawner",
        "OngoingWaypointPath",
        "OngoingWorldIcon",
        "OnAIMoveToFailed",
        "OnAIMoveToRunning",
        "OnAIMoveToSucceeded",
        "OnAIParachuteRunning",
        "OnAIParachuteSucceeded",
        "OnAIWaypointIdleFailed",
        "OnAIWaypointIdleRunning",
        "OnAIWaypointIdleSucceeded",
        "OnCapturePointCaptured",
        "OnCapturePointCapturing",
        "OnCapturePointLost",
        "OnGameModeEnding",
        "OnGameModeStarted",
        "OnMandown",
        "OnMCOMArmed",
        "OnMCOMDefused",
        "OnMCOMDestroyed",
        "OnPlayerDamaged",
        "OnPlayerDeployed",
        "OnPlayerDied",
        "OnPlayerEarnedKill",
        "OnPlayerEarnedKillAssist",
        "OnPlayerEnterAreaTrigger",
        "OnPlayerEnterCapturePoint",
        "OnPlayerEnterVehicle",
        "OnPlayerEnterVehicleSeat",
        "OnPlayerExitAreaTrigger",
        "OnPlayerExitCapturePoint",
        "OnPlayerExitVehicle",
        "OnPlayerExitVehicleSeat",
        "OnPlayerInteract",
        "OnPlayerJoinGame",
        "OnPlayerLeaveGame",
        "OnPlayerSwitchTeam",
        "OnPlayerUIButtonEvent",
        "OnPlayerUndeploy",
        "OnRayCastHit",
        "OnRayCastMissed",
        "OnRevived",
        "OnSpawnerSpawned",
        "OnTimeLimitReached",
        "OnVehicleDestroyed",
        "OnVehicleSpawned"
    ]);
}

// Initialize the project
const project = new Project({
    skipAddingFilesFromTsConfig: true,
});

// Extract event handlers from mod types
const EVENT_HANDLERS = extractEventHandlers(project);

// Automatically find all .ts files
function findAllTsFiles(rootDir = ".") {
    const api = new fdir()
        .withFullPaths()
        .filter((filePath) => {
            // Filter for .ts files, exclude .d.ts and node_modules
            return filePath.endsWith(".ts") &&
                !filePath.endsWith(".d.ts") &&
                !filePath.includes("combined.ts") &&
                !filePath.includes("node_modules") &&
                !filePath.includes("sdk");
        })
        .crawl(rootDir);

    return api.sync();
}

// Find all TypeScript files
const tsFiles = findAllTsFiles(".");
console.log(`Found ${tsFiles.length} TypeScript files`);

// Add source files to project
const sourceFiles = [];
tsFiles.forEach(file => {
    try {
        sourceFiles.push(project.addSourceFileAtPath(file));
        console.log(`Added: ${file}`);
    } catch (error) {
        console.warn(`Warning: Could not add ${file}:`, error.message);
    }
});

// Build dependency graph
function buildDependencyGraph(files) {
    const graph = new Map();

    // Initialize nodes
    files.forEach(file => {
        const filePath = file.getFilePath();
        const fileName = path.basename(filePath);
        graph.set(fileName, {
            name: fileName,
            relativePath: path.relative(process.cwd(), filePath),
            file: file,
            dependencies: new Set()
        });
    });

    // Build dependencies by analyzing function calls
    files.forEach(file => {
        const fileName = path.basename(file.getFilePath());
        const node = graph.get(fileName);

        // Get all function declarations in this file
        const declaredFunctions = file.getFunctions().map(f => f.getName());

        // Find all identifiers (potential function calls)
        file.getDescendantsOfKind(SyntaxKind.Identifier).forEach(identifier => {
            const name = identifier.getText();

            // Check if this identifier is a function call
            const parent = identifier.getParent();
            if (parent && parent.getKind() === SyntaxKind.CallExpression) {
                // Check if this function is declared in another file
                files.forEach(otherFile => {
                    if (otherFile === file) return;

                    const otherFileName = path.basename(otherFile.getFilePath());
                    const otherFunctions = otherFile.getFunctions().map(f => f.getName());

                    if (otherFunctions.includes(name)) {
                        node.dependencies.add(otherFileName);
                    }
                });
            }
        });
    });

    return graph;
}

// Topological sort to determine correct order
function topologicalSort(graph) {
    const sorted = [];
    const visited = new Set();
    const visiting = new Set();

    function visit(nodeName) {
        if (visited.has(nodeName)) return;
        if (visiting.has(nodeName)) {
            throw new Error(`Circular dependency detected involving ${nodeName}`);
        }

        visiting.add(nodeName);
        const node = graph.get(nodeName);

        // Visit dependencies first
        node.dependencies.forEach(depName => {
            visit(depName);
        });

        visiting.delete(nodeName);
        visited.add(nodeName);
        sorted.push(node);
    }

    // Visit all nodes
    graph.forEach((_, nodeName) => {
        visit(nodeName);
    });

    return sorted;
}

// Check if a function is an event handler
function isEventHandler(functionName) {
    return EVENT_HANDLERS.has(functionName);
}

// Combine files
function combineFiles(files) {
    const graph = buildDependencyGraph(files);
    const sortedNodes = topologicalSort(graph);

    let modlibString = "import * as modlib from 'modlib';\n\n"

    let combined = "";
    combined += modlibString;

    sortedNodes.forEach((node, index) => {
        const file = node.file;

        // Get the full text of the file
        let fileContent = file.getFullText();

        // Remove import statements (if any)
        file.getImportDeclarations().forEach(imp => {
            const importText = imp.getFullText();
            fileContent = fileContent.replace(importText, "");
        });

        // Get list of event handler functions in this file
        const eventHandlerFuncs = new Set();
        file.getFunctions().forEach(func => {
            const funcName = func.getName();
            if (funcName && isEventHandler(funcName)) {
                eventHandlerFuncs.add(funcName);
            }
        });

        // Remove export keywords, but preserve for event handlers
        // Handle: export async function
        fileContent = fileContent.replace(/export\s+(async\s+)?function\s+(\w+)/g, (match, asyncPart, funcName) => {
            if (isEventHandler(funcName)) {
                return match; // Keep export for event handlers
            }
            return `${asyncPart || ""}function ${funcName}`;
        });

        // Handle other exports that are NOT event handler functions
        fileContent = fileContent.replace(/export\s+class/g, "class");
        fileContent = fileContent.replace(/export\s+interface/g, "interface");
        fileContent = fileContent.replace(/export\s+type/g, "type");
        fileContent = fileContent.replace(/export\s+const/g, "const");

        // Add a comment header
        combined += `// ===== ${node.relativePath} =====\n`;
        combined += fileContent.trim();

        if (index < sortedNodes.length - 1) {
            combined += "\n\n";
        }
    });

    return combined;
}

// Execute
try {
    if (sourceFiles.length === 0) {
        console.error("No TypeScript files found!");
        process.exit(1);
    }

    const combinedCode = combineFiles(sourceFiles);

    // Write to output file
    fs.writeFileSync("combined.ts", combinedCode);

    console.log("\n✓ Files combined successfully!");
    console.log(`✓ Output written to: combined.ts`);
    console.log("\nDependency order:");

    const graph = buildDependencyGraph(sourceFiles);
    const sorted = topologicalSort(graph);
    sorted.forEach((node, i) => {
        const deps = Array.from(node.dependencies);
        console.log(`${i + 1}. ${node.relativePath}${deps.length > 0 ? ` (depends on: ${deps.join(", ")})` : ""}`);
    });

} catch (error) {
    console.error("Error combining files:", error);
    process.exit(1);
}