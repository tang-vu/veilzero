import { expect, test } from "@playwright/test";
test("encrypts locally without claiming chain success", async ({ page }) => {
  await page.goto("/"); await expect(page.getByText("READ-ONLY DEMO · NO WALLET")).toBeVisible();
  await expect(page.getByText("READ-ONLY MAINNET EVIDENCE")).toBeVisible();
  await expect(page.getByText("6 STRK per pool action at block 14205166")).toBeVisible();
  await expect(page.getByText("Contract not deployed · transactions 0/3")).toBeVisible();
  await expect(page.getByRole("button", { name: "Build non-submitting previews" })).toBeDisabled();
  await expect(page.getByText("A preview is not a fee estimate or transaction.", { exact: false })).toBeVisible();
  await expect(page.getByText("Exact tier locked to this case")).toBeVisible();
  await page.getByRole("button", { name: "Generate program key" }).click();
  await expect(page.getByText("No program key generated.")).toHaveCount(0);
  const plaintext = "Critical report reproduction details that remain encrypted.";
  await page.getByLabel(/Vulnerability report/).fill(plaintext);
  const encrypt = page.getByRole("button", { name: "Encrypt and bind case" }); await expect(encrypt).toBeEnabled(); await encrypt.click();
  await expect(page.getByText("GENERATED")).toBeVisible(); await expect(page.getByText("Not submitted")).toBeVisible();
  await expect(page.getByText(plaintext)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Export encrypted case" })).toBeEnabled();
  await page.getByRole("button", { name: "Decrypt encrypted case" }).click();
  await expect(page.getByText(plaintext)).toBeVisible();
  const downloadStarted = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export public authorship proof" }).click();
  const proof = await downloadStarted;
  await page.getByLabel(/Authorship proof/).setInputFiles(await proof.path() as string);
  await expect(page.getByText("Valid VeilZero authorship proof.", { exact: false })).toBeVisible();
});

test("binds a public vendor manifest without exposing the private key", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Generate program key" }).click();
  await page.getByLabel("Reward token address").fill("0x456");
  await page.getByRole("button", { name: "Bind public program manifest" }).click();
  await expect(page.getByRole("button", { name: "Download public manifest" })).toBeEnabled();
  await expect(page.locator("dt", { hasText: "Program ID" }).locator("xpath=following-sibling::dd")).not.toHaveText("—");
  await expect(page.getByText(/privateKey/i)).toHaveCount(0);
  await expect(page.getByText(/claimSecret/i)).toHaveCount(0);
});

test("verifies a signed reward request before building vendor calls", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Generate program key" }).click();
  await page.getByLabel("Reward token address").fill("0x456");
  await page.getByRole("button", { name: "Bind public program manifest" }).click();
  await page.getByLabel(/Vulnerability report/).fill("Critical authorization request integration report with reproducible impact.");
  await page.getByRole("button", { name: "Encrypt and bind case" }).click();

  const downloadStarted = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export signed reward request" }).click();
  const request = await downloadStarted;
  await page.getByLabel(/Reward authorization request/).setInputFiles(await request.path() as string);
  await expect(page.getByText("Valid case-signed reward request.", { exact: false })).toBeVisible();

  await page.getByLabel("Undeployed VeilZero contract address").fill("0x789");
  await page.getByRole("button", { name: "Build non-submitting vendor calls" }).click();
  const preview = page.getByLabel("Vendor transaction call preview");
  await expect(preview).toContainText('"entrypoint": "approve"');
  await expect(preview).toContainText('"entrypoint": "authorize_reward"');
  await expect(preview).not.toContainText("claimSecret");
});
