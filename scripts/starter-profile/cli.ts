import {
  parseMaterializeCliArgs,
  printCliHelp,
  printMaterializationResult,
  runMaterialization,
} from "./materialize";

function main(): void {
  const argv = process.argv.slice(2).filter((arg) => arg !== "--");

  if (argv.includes("--help") || argv.includes("-h")) {
    printCliHelp();
    process.exit(0);
  }

  try {
    const options = parseMaterializeCliArgs(argv);

    if (!options.dryRun && !options.outputDirectory) {
      printCliHelp();
      process.exit(1);
    }

    const result = runMaterialization(options);
    printMaterializationResult(result, options.json);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  }
}

main();
