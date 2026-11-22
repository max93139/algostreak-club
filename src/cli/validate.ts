import { FsCatalogSource } from "../adapters/fs-catalog-source.ts";
import { validateCatalog } from "../application/validate-catalog.ts";

const issues = await validateCatalog(new FsCatalogSource(process.cwd()));

if (issues.length === 0) {
  console.log("Catalog is valid.");
} else {
  for (const issue of issues) {
    console.error(`${issue.path}: ${issue.message}`);
  }
  console.error(`\n${String(issues.length)} problem(s) found.`);
  process.exitCode = 1;
}
