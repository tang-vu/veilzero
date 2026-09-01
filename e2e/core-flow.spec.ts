import { expect, test } from "@playwright/test";
test("encrypts locally without claiming chain success", async ({ page }) => {
  await page.goto("/"); await expect(page.getByText("READ-ONLY DEMO · NO WALLET")).toBeVisible();
  await page.getByLabel(/Vulnerability report/).fill("Critical report reproduction details that remain encrypted.");
  const encrypt = page.getByRole("button", { name: "Encrypt and bind case" }); await expect(encrypt).toBeEnabled(); await encrypt.click();
  await expect(page.getByText("GENERATED")).toBeVisible(); await expect(page.getByText("Not submitted")).toBeVisible();
  await expect(page.getByText("Critical report reproduction details that remain encrypted.")).toHaveCount(0);
});
